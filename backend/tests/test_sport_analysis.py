import math
import tempfile
import unittest
from pathlib import Path

from app.sport_analysis import _angle, analyze_video


class PoseAnalysisUnitTests(unittest.TestCase):
    def test_right_angle(self):
        self.assertAlmostEqual(_angle((0.0, 0.0), (0.0, 1.0), (1.0, 1.0)), 90.0)

    def test_straight_angle(self):
        self.assertAlmostEqual(_angle((-1.0, 0.0), (0.0, 0.0), (1.0, 0.0)), 180.0)

    def test_degenerate_points_return_nan(self):
        self.assertTrue(math.isnan(_angle((1.0, 1.0), (1.0, 1.0), (2.0, 2.0))))

    def test_blank_video_is_decoded_without_fabricating_pose_metrics(self):
        try:
            import cv2
            import numpy as np
            import mediapipe  # noqa: F401
        except ImportError:
            self.skipTest("OpenCV, NumPy and MediaPipe are required for video integration test")

        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "blank.avi"
            writer = cv2.VideoWriter(
                str(path),
                cv2.VideoWriter_fourcc(*"MJPG"),
                10.0,
                (160, 120),
            )
            if not writer.isOpened():
                self.skipTest("This runner has no MJPG video encoder")
            for _ in range(10):
                writer.write(np.zeros((120, 160, 3), dtype=np.uint8))
            writer.release()

            result = analyze_video(path, "track", "100m", max_frames=10)
            self.assertEqual(result["status"], "analysis_unavailable")
            self.assertEqual(result["metrics"]["sampled_frames"], 10)
            self.assertEqual(result["metrics"]["pose_detected_frames"], 0)
            self.assertIn("limitations", result)


if __name__ == "__main__":
    unittest.main()
