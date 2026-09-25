"""End-to-end dashcam analysis: video → frames → detections → clusters → stats.

Every number in the result is computed from the actual video. When nothing is
detected, the result honestly reports zero — values are never fabricated.
"""
import time
from typing import Dict, List, Optional

from .clustering import cluster_video_detections
from .config import DASHCAM_CONFIG
from .detectors import build_detectors
from .video_source import VideoSource


def analyze_video(
    path: str,
    frame_interval: Optional[int] = None,
    max_frames: Optional[int] = None,
    write_annotated: bool = False,
    annotated_output: Optional[str] = None,
) -> Dict:
    """Run the full pipeline. When `write_annotated` is set, also writes an
    annotated MP4 (detection boxes burned into the frames) to `annotated_output`.
    """
    started = time.time()
    interval = frame_interval or DASHCAM_CONFIG["frame_interval"]
    limit = max_frames or DASHCAM_CONFIG["max_frames_scanned"]

    detectors, yolo = build_detectors()
    heuristic = detectors[0]

    annotated_writer = None
    annotated_path = None

    with VideoSource(path, max_frames=limit) as source:
        meta = source.meta
        scanned = 0
        analyzed = 0
        all_detections: List = []
        pothole_confidences: List[float] = []
        context_detections = 0
        detections_by_frame: Dict[int, List] = {}

        if write_annotated and annotated_output:
            import cv2 as _cv2
            fps_out = meta.fps if meta.fps > 0 else 30.0
            annotated_writer = _cv2.VideoWriter(
                annotated_output,
                _cv2.VideoWriter_fourcc(*"mp4v"),
                fps_out,
                (meta.width, meta.height),
            )
            if not annotated_writer.isOpened():
                annotated_writer = None

        for frame_index, frame in source.frames(interval=interval):
            scanned += 1
            analyzed += 1
            frame_dets = []
            for det in detectors:
                found = det.detect(frame_index, frame)
                for d in found:
                    if d.defect_type == "POTHOLE" and d.source == heuristic.name:
                        all_detections.append(d)
                        pothole_confidences.append(d.confidence)
                        frame_dets.append(d)
                    else:
                        context_detections += 1
            if frame_dets:
                detections_by_frame[frame_index] = frame_dets

            if annotated_writer is not None:
                import cv2 as _cv2
                out = frame
                for d in frame_dets:
                    x, y, w, h = d.bbox
                    _cv2.rectangle(out, (x, y), (x + w, y + h), (0, 0, 230), 2)
                    _cv2.putText(
                        out, f"POTHOLE {d.confidence:.2f}", (x, max(y - 6, 12)),
                        _cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 230), 2, _cv2.LINE_AA,
                    )
                annotated_writer.write(out)

        total_source_frames = meta.frame_count or scanned * interval

    if annotated_writer is not None:
        annotated_writer.release()
        annotated_path = annotated_output

    clusters = cluster_video_detections(
        all_detections,
        max_distance=DASHCAM_CONFIG["cluster_max_distance"],
        min_hits=DASHCAM_CONFIG["cluster_min_hits"],
    )

    sample: List[Dict] = []
    for d in all_detections[:50]:
        sample.append({
            "frame": d.frame_index,
            "confidence": d.confidence,
            "bbox": list(d.bbox),
            "center": [round(d.center[0], 4), round(d.center[1], 4)],
            "type": d.defect_type,
            "source": d.source,
        })

    avg_conf = (
        round(sum(pothole_confidences) / len(pothole_confidences), 3)
        if pothole_confidences else None
    )

    return {
        "label": "DEMO VIDEO",
        "video": meta.to_dict(),
        "settings": {
            "frameInterval": interval,
            "framesScanned": min(scanned * interval, total_source_frames),
            "framesAnalyzed": analyzed,
            "maxFramesLimit": limit,
            "clusterDistance": DASHCAM_CONFIG["cluster_max_distance"],
            "clusterMinHits": DASHCAM_CONFIG["cluster_min_hits"],
        },
        "framesProcessed": analyzed,
        "potholesDetected": len(all_detections),
        "averageConfidence": avg_conf,
        "confidenceMethod": "heuristic-cv-v1: 0.45*darkness + 0.30*texture + 0.25*shape (measured per blob)",
        "roadDefectClusters": len(clusters),
        "clusters": clusters,
        "contextDetections": context_detections,
        "detector": {
            "active": heuristic.name,
            "potholeTrainedModel": False,
            "yoloAvailable": yolo.available(),
            "yoloModelPath": yolo.model_path,
            "yoloPotholeTrained": yolo.pothole_trained,
            "yoloLoadError": yolo.load_error,
            "note": (
                "Pothole detection uses the classical CV detector ported from "
                "Semantic-Segmentation-AI. Add a dedicated models/pothole-seg.pt "
                "to enable trained pothole segmentation — generic COCO weights "
                "are never presented as a pothole detector."
            ),
        },
        "detections": sample,
        "detectionsTruncated": len(all_detections) > len(sample),
        "annotatedVideo": annotated_path,
        "processingTimeMs": int((time.time() - started) * 1000),
    }
