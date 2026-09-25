"""Detectors for the dashcam pipeline.

HeuristicPotholeDetector is a direct port of the reference project's classical
CV pothole detector (Semantic-Segmentation-AI, MIT). It runs on real pixels and
returns measurements-derived confidences — nothing is fabricated.

YoloDetector is optional: it activates only when `ultralytics` is importable and
a model file exists. If models/pothole-seg.pt is absent, the COCO weights are
loaded strictly for scene context objects and are labeled as such — they are NOT
a pothole detector.
"""
from dataclasses import dataclass, field
from typing import List

import cv2
import numpy as np

from .config import DASHCAM_CONFIG


@dataclass
class Detection:
    frame_index: int
    confidence: float
    bbox: tuple            # x, y, w, h in pixels
    center: tuple          # normalized cx, cy in 0..1
    defect_type: str = "POTHOLE"
    source: str = "heuristic-cv"
    extra: dict = field(default_factory=dict)


# ── Ported from Semantic-Segmentation-AI (heuristic_scene, lines 60-75) ──────
def heuristic_scene(frame):
    H, W = frame.shape[:2]
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    h = hsv[:, :, 0].astype(np.float32)
    s = hsv[:, :, 1].astype(np.float32)
    v = hsv[:, :, 2].astype(np.float32)
    a = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)[:, :, 1].astype(np.float32)
    lbl = np.zeros((H, W), np.uint8)

    veg = (h >= 28) & (h <= 85) & (s >= 28) & (v >= 22) & (a < 124)
    lbl[veg] = 4
    sz = np.zeros((H, W), bool)
    sz[: int(H * .52), :] = True
    sky = sz & (((h >= 86) & (h <= 140) & (s >= 18) & (v >= 85)) | ((s < 40) & (v > 145))) & ~veg
    lbl[sky] = 1
    rz = np.zeros((H, W), bool)
    rz[int(H * .48):, :] = True
    road = rz & (s < 70) & (v >= 28) & (v <= 215) & ~veg
    lbl[road] = 2
    side = rz & (s < 45) & (v > 172) & ~veg & ~road
    lbl[side] = 3
    gz = np.zeros((H, W), bool)
    gz[int(H * .62):, :] = True
    lbl[gz & (h >= 8) & (h <= 40) & (s >= 16) & (s < 88) & (v >= 26) & (v < 158) & ~veg & ~road] = 5
    return lbl


# ── Ported from Semantic-Segmentation-AI (detect_potholes, lines 86-159) ─────
# Returns (mask, measurements) where measurements carry the real per-blob
# darkness / texture / shape values used to derive confidence.
def detect_potholes(frame, scene_lbl):
    H, W = frame.shape[:2]

    road_px = (scene_lbl == 2) | (scene_lbl == 3)
    band = np.zeros((H, W), bool)
    band[int(H * 0.40):int(H * 0.88), int(W * 0.05):int(W * 0.95)] = True
    roi = road_px & band
    if not np.any(roi):
        return np.zeros((H, W), bool), []

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32)

    eq = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(
        gray.astype(np.uint8)).astype(np.float32)

    col_mean = cv2.GaussianBlur(eq, (1, 61), 0)
    nbr_mean = cv2.GaussianBlur(eq, (51, 51), 0)
    ref = np.maximum(col_mean, nbr_mean)

    sq_mean = cv2.GaussianBlur(eq ** 2, (15, 15), 0)
    mean_sq = cv2.GaussianBlur(eq, (15, 15), 0) ** 2
    lstd = np.sqrt(np.clip(sq_mean - mean_sq, 0, None))

    dark_delta = 14
    min_std = 3.5
    cand = roi & ((ref - eq) > dark_delta) & (lstd > min_std)

    bright = roi & ((eq - nbr_mean) > 22) & (lstd > 6)
    dark_dilated = cv2.dilate(cand.astype(np.uint8) * 255,
                              cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))
    bright = bright & (dark_dilated > 0)
    cand = cand | bright

    cand = cand.astype(np.uint8) * 255

    k_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))
    k_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    cand = cv2.morphologyEx(cand, cv2.MORPH_CLOSE, k_close)
    cand = cv2.morphologyEx(cand, cv2.MORPH_OPEN, k_open)

    n, lim, stats, _ = cv2.connectedComponentsWithStats(cand)
    mask = np.zeros((H, W), bool)
    min_area = 500
    max_area = int(H * W * 0.12)
    measurements = []
    for lbl in range(1, n):
        area = stats[lbl, cv2.CC_STAT_AREA]
        if not (min_area < area < max_area):
            continue
        bw = stats[lbl, cv2.CC_STAT_WIDTH]
        bh_ = stats[lbl, cv2.CC_STAT_HEIGHT]
        if bw == 0 or bh_ == 0:
            continue
        aspect = max(bw, bh_) / min(bw, bh_)
        if aspect > 5.0:
            continue
        solidity = area / max(bw * bh_, 1)
        if solidity < 0.12:
            continue
        blob = (lim == lbl)
        mask[blob] = True

        # Real measurements inside this blob → confidence (documented formula)
        darkness = float(np.mean(np.clip(ref[blob] - eq[blob], 0, None)))
        texture = float(np.mean(lstd[blob]))
        x, y = stats[lbl, cv2.CC_STAT_LEFT], stats[lbl, cv2.CC_STAT_TOP]
        measurements.append({
            "bbox": (int(x), int(y), int(bw), int(bh_)),
            "area": int(area),
            "darkness": round(darkness, 2),
            "texture": round(texture, 2),
            "solidity": round(float(solidity), 3),
            "darknessNorm": min(darkness / 32.0, 1.0),
            "textureNorm": min(texture / 10.0, 1.0),
            "shapeNorm": min(max((solidity - 0.12) / 0.88, 0.0), 1.0),
        })

    return mask, measurements


def _blob_confidence(m):
    """confidence = 0.45*darkness + 0.30*texture + 0.25*shape (real measurements)."""
    c = 0.45 * m["darknessNorm"] + 0.30 * m["textureNorm"] + 0.25 * m["shapeNorm"]
    return round(min(max(c, 0.05), 0.95), 3)


class HeuristicPotholeDetector:
    name = "heuristic-cv"
    pothole_trained = False

    def available(self):
        return True

    def detect(self, frame_index, frame) -> List[Detection]:
        scene = heuristic_scene(frame)
        _, measurements = detect_potholes(frame, scene)
        H, W = frame.shape[:2]
        out = []
        for m in measurements:
            x, y, w, h = m["bbox"]
            out.append(Detection(
                frame_index=frame_index,
                confidence=_blob_confidence(m),
                bbox=(x, y, w, h),
                center=((x + w / 2) / W, (y + h / 2) / H),
                source=self.name,
                extra={"area": m["area"], "darkness": m["darkness"],
                       "texture": m["texture"], "solidity": m["solidity"]},
            ))
        return out


class YoloDetector:
    """Optional context/segmentation detector (pluggable pothole model slot)."""

    def __init__(self):
        self._model = None
        self._model_path = None
        self._pothole_trained = False
        self._load_error = None

    def _load(self):
        if self._model is not None or self._load_error:
            return
        try:
            from ultralytics import YOLO  # lazy — heavy dependency, optional
        except Exception as exc:  # noqa: BLE001
            self._load_error = f"ultralytics unavailable: {exc}"
            return
        pothole = DASHCAM_CONFIG["pothole_model"]
        context = DASHCAM_CONFIG["context_model"]
        path = None
        pothole_trained = False
        if Path_exists(pothole):
            path, pothole_trained = pothole, True
        elif Path_exists(context):
            path = context
        else:
            self._load_error = "no model weights found (models/pothole-seg.pt or models/yolov8n-seg.pt)"
            return
        try:
            self._model = YOLO(str(path))
            self._model_path = path
            self._pothole_trained = pothole_trained
        except Exception as exc:  # noqa: BLE001
            self._load_error = f"model load failed: {exc}"

    @property
    def name(self):
        return "yolo-seg"

    @property
    def pothole_trained(self):
        self._load()
        return self._pothole_trained

    @property
    def model_path(self):
        self._load()
        return str(self._model_path) if self._model_path else None

    @property
    def load_error(self):
        self._load()
        return self._load_error

    def available(self):
        self._load()
        return self._model is not None

    def detect(self, frame_index, frame) -> List[Detection]:
        if not self.available():
            return []
        kw = {
            "verbose": False,
            "imgsz": 448,
            "conf": DASHCAM_CONFIG["yolo_conf"],
            "iou": DASHCAM_CONFIG["yolo_iou"],
        }
        try:
            import torch
            if torch.cuda.is_available():
                kw["half"] = True
        except Exception:  # noqa: BLE001
            pass
        result = self.model_predict(frame, kw)
        return result

    def model_predict(self, frame, kw):
        out = []
        try:
            yr = self._model(frame, **kw)[0]
        except Exception:  # noqa: BLE001
            return out
        H, W = frame.shape[:2]
        if yr.boxes is None or len(yr.boxes) == 0:
            return out
        names = yr.names
        for i in range(len(yr.boxes)):
            conf = float(yr.boxes.conf[i])
            cls_id = int(yr.boxes.cls[i])
            label = names.get(cls_id, str(cls_id))
            x1, y1, x2, y2 = [float(v) for v in yr.boxes.xyxy[i]]
            x, y, w, h = int(x1), int(y1), int(x2 - x1), int(y2 - y1)
            out.append(Detection(
                frame_index=frame_index,
                confidence=round(conf, 3),
                bbox=(x, y, w, h),
                center=((x + w / 2) / W, (y + h / 2) / H),
                defect_type="CONTEXT_OBJECT" if not self._pothole_trained else "POTHOLE",
                source="yolo-seg",
                extra={"label": label, "potholeTrained": self._pothole_trained},
            ))
        return out


def Path_exists(path) -> bool:
    try:
        from pathlib import Path
        return Path(path).is_file()
    except Exception:  # noqa: BLE001
        return False


def build_detectors() -> List:
    """Heuristic detector (always) + YOLO (optional, if available)."""
    detectors: List = [HeuristicPotholeDetector()]
    yolo = YoloDetector()
    if yolo.available():
        detectors.append(yolo)
    return detectors, yolo
