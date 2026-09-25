"""Environment-driven configuration for the dashcam pipeline.

All thresholds are configurable — no unexplained hardcoded values.
"""
import os
from pathlib import Path

_SERVICE_ROOT = Path(__file__).resolve().parent.parent


def _int(name, default, lo, hi):
    try:
        value = int(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, value))


def _float(name, default, lo, hi):
    try:
        value = float(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, value))


def _model_path(env_name, default_rel):
    raw = os.getenv(env_name, default_rel)
    path = Path(raw)
    if not path.is_absolute():
        path = _SERVICE_ROOT / path
    return path


DASHCAM_CONFIG = {
    # Model slots (models/pothole-seg.pt is the dedicated pothole model slot;
    # yolov8n-seg.pt is generic COCO and must NOT be presented as a pothole detector)
    "pothole_model": _model_path("DASHCAM_POTHOLE_MODEL", "models/pothole-seg.pt"),
    "context_model": _model_path("DASHCAM_CONTEXT_MODEL", "models/yolov8n-seg.pt"),

    # Frame extraction: process every Nth frame (default 4, as in the source project)
    "frame_interval": _int("DASHCAM_FRAME_INTERVAL", 4, 1, 60),

    # YOLO confidence / NMS IoU when the YOLO detector is available
    "yolo_conf": _float("DASHCAM_YOLO_CONF", 0.48, 0.05, 0.95),
    "yolo_iou": _float("DASHCAM_YOLO_IOU", 0.45, 0.1, 0.9),

    # Video-space clustering: detections whose normalized centroids are within
    # this distance on consecutive frames belong to the same road defect
    "cluster_max_distance": _float("DASHCAM_CLUSTER_DISTANCE", 0.06, 0.005, 0.5),
    "cluster_min_hits": _int("DASHCAM_CLUSTER_MIN_HITS", 2, 1, 50),

    # Geo clustering (future multi-vehicle phase): meters
    "geo_cluster_radius_m": _int("DASHCAM_GEO_CLUSTER_RADIUS_M", 30, 1, 10000),
    "geo_cluster_min_points": _int("DASHCAM_GEO_CLUSTER_MIN_POINTS", 2, 1, 100),

    # Hard limits for uploaded demo videos
    "max_upload_mb": _int("DASHCAM_MAX_UPLOAD_MB", 60, 1, 300),
    "max_duration_s": _int("DASHCAM_MAX_DURATION_S", 180, 5, 3600),
    "max_frames_scanned": _int("DASHCAM_MAX_FRAMES_SCANNED", 3000, 30, 100000),
}
