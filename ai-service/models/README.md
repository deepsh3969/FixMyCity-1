# Dashcam model slots

The dashcam pipeline is model-agnostic. Put weights here:

```
models/
  pothole-seg.pt   # DEDICATED pothole-trained YOLOv8 segmentation model (slot)
  yolov8n-seg.pt   # generic COCO segmentation weights (context objects only)
```

- `pothole-seg.pt` (create with `DASHCAM_POTHOLE_MODEL` env override): when present,
  the YOLO detector runs pothole segmentation and detections are labeled
  `potholeTrainedModel: true`.
- `yolov8n-seg.pt`: generic COCO classes. **Never presented as a pothole detector** â€”
  detections from these weights are labeled `CONTEXT_OBJECT`.
- If neither exists (or `ultralytics` is not installed), the pipeline falls back to
  the classical CV heuristic ported from Semantic-Segmentation-AI and reports
  `active: heuristic-cv` honestly.

No production-accuracy claims are made for any model without validation on a
held-out pothole dataset.
