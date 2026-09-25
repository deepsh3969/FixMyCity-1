"""Clustering for road defects.

1. `cluster_video_detections` — video-space clustering: the same physical defect
   seen across consecutive dashcam frames collapses into ONE cluster. All
   thresholds come from config (DASHCAM_CLUSTER_*).

2. `cluster_geo` — haversine geo clustering for the future multi-vehicle phase
   (configurable radius, no hardcoded thresholds). Multiple vehicles reporting
   the same coordinates produce a ROAD_DEFECT_CLUSTER instead of duplicates.
"""
import math
from typing import Dict, List, Sequence, Tuple


def _haversine_m(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    r = 6_371_000.0
    lat1, lon1 = math.radians(a[0]), math.radians(a[1])
    lat2, lon2 = math.radians(b[0]), math.radians(b[1])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def cluster_video_detections(
    detections: Sequence,
    max_distance: float,
    min_hits: int,
) -> List[Dict]:
    """Greedy spatio-temporal clustering in normalized video coordinates."""
    if not detections:
        return []
    ordered = sorted(detections, key=lambda d: (d.frame_index, d.center[0]))
    clusters: List[Dict] = []
    for det in ordered:
        target = None
        for cl in clusters:
            if cl["closed"]:
                continue
            if det.frame_index - cl["last_frame"] > 30:
                cl["closed"] = True
                continue
            dx = det.center[0] - cl["centroid"][0]
            dy = det.center[1] - cl["centroid"][1]
            if math.hypot(dx, dy) <= max_distance:
                target = cl
                break
        if target is None:
            clusters.append({
                "centroid": det.center,
                "hits": 1,
                "first_frame": det.frame_index,
                "last_frame": det.frame_index,
                "max_confidence": det.confidence,
                "frames": {det.frame_index},
                "closed": False,
            })
        else:
            n = target["hits"]
            target["centroid"] = (
                (target["centroid"][0] * n + det.center[0]) / (n + 1),
                (target["centroid"][1] * n + det.center[1]) / (n + 1),
            )
            target["hits"] += 1
            target["last_frame"] = det.frame_index
            target["max_confidence"] = max(target["max_confidence"], det.confidence)
            target["frames"].add(det.frame_index)

    results = []
    for i, cl in enumerate(clusters):
        if cl["hits"] >= min_hits:
            results.append({
                "clusterId": i,
                "hits": cl["hits"],
                "distinctFrames": len(cl["frames"]),
                "centroid": [round(cl["centroid"][0], 4), round(cl["centroid"][1], 4)],
                "maxConfidence": cl["max_confidence"],
                "firstFrame": cl["first_frame"],
                "lastFrame": cl["last_frame"],
            })
    return sorted(results, key=lambda c: -c["hits"])


def cluster_geo(
    points: Sequence[Tuple[float, float]],
    radius_m: int,
    min_points: int,
) -> List[Dict]:
    """Geo clustering (lat/lng) for future multi-vehicle detection merging."""
    if not points:
        return []
    labels = [-1] * len(points)
    cluster_id = 0
    for i, p in enumerate(points):
        if labels[i] != -1:
            continue
        stack = [i]
        labels[i] = cluster_id
        members = [i]
        while stack:
            j = stack.pop()
            for k in range(len(points)):
                if labels[k] == -1 and _haversine_m(points[j], points[k]) <= radius_m:
                    labels[k] = cluster_id
                    stack.append(k)
                    members.append(k)
        cluster_id += 1

    out = []
    for cid in range(cluster_id):
        members = [points[i] for i in range(len(points)) if labels[i] == cid]
        if len(members) < min_points:
            continue
        out.append({
            "clusterId": cid,
            "size": len(members),
            "centroid": [
                round(sum(m[0] for m in members) / len(members), 6),
                round(sum(m[1] for m in members) / len(members), 6),
            ],
            "radiusM": radius_m,
        })
    return out
