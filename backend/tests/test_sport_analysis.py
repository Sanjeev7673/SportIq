import math
import unittest

from app.sport_analysis import _angle


class PoseAnalysisUnitTests(unittest.TestCase):
    def test_right_angle(self):
        self.assertAlmostEqual(_angle((0.0, 0.0), (0.0, 1.0), (1.0, 1.0)), 90.0)

    def test_straight_angle(self):
        self.assertAlmostEqual(_angle((-1.0, 0.0), (0.0, 0.0), (1.0, 0.0)), 180.0)

    def test_degenerate_points_return_nan(self):
        self.assertTrue(math.isnan(_angle((1.0, 1.0), (1.0, 1.0), (2.0, 2.0))))


if __name__ == "__main__":
    unittest.main()
