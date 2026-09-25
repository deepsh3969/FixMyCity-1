"""Video/webcam frame source with metadata probing and strided iteration."""
from dataclasses import dataclass
from typing import Iterator, Optional, Tuple

import cv2


@dataclass
class VideoMeta:
    path: str
    frame_count: int
    fps: float
    width: int
    height: int
    duration_s: float

    def to_dict(self):
        return {
            "frameCount": self.frame_count,
            "fps": round(self.fps, 2),
            "width": self.width,
            "height": self.height,
            "durationS": round(self.duration_s, 1),
        }


class VideoSource:
    def __init__(self, path_or_index, max_frames: Optional[int] = None):
        self.path = path_or_index
        src = int(path_or_index) if isinstance(path_or_index, str) and path_or_index.isdigit() else path_or_index
        self._cap = cv2.VideoCapture(src)
        if not self._cap.isOpened():
            raise ValueError(f"Unable to open video source: {path_or_index}")
        raw_count = int(self._cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = float(self._cap.get(cv2.CAP_PROP_FPS) or 0) or 30.0
        width = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        self.meta = VideoMeta(
            path=str(path_or_index),
            frame_count=max(raw_count, 0),
            fps=fps,
            width=width,
            height=height,
            duration_s=(raw_count / fps) if fps > 0 and raw_count > 0 else 0.0,
        )
        self._max_frames = max_frames

    def frames(self, interval: int = 1) -> Iterator[Tuple[int, "object"]]:
        """Yield (frame_index, frame) for every `interval`-th frame."""
        idx = 0
        scanned = 0
        limit = self._max_frames
        while True:
            ok, frame = self._cap.read()
            if not ok:
                break
            if idx % interval == 0:
                yield idx, frame
                scanned += 1
                if limit is not None and scanned >= limit:
                    break
            idx += 1

    def release(self):
        try:
            self._cap.release()
        except Exception:  # noqa: BLE001
            pass

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.release()
