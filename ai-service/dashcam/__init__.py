"""Modular dashcam / AI road-monitoring pipeline.

Foundation: the Semantic-Segmentation-AI project (OpenCV + YOLOv8 segmentation),
restructured into a service-ready package. Nothing here is fake — every detection,
confidence value, and cluster is computed from the actual video frames.

Future work (explicitly NOT implemented here yet): GPS-linked detections,
multi-vehicle geo clustering callers, face/plate blurring (privacy), and
municipal workflow integration. Identity recognition must never be added.
"""

from .config import DASHCAM_CONFIG
from .pipeline import analyze_video

__all__ = ["DASHCAM_CONFIG", "analyze_video"]
