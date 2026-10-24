from typing import Dict, List, Tuple
import numpy as np


class SportIQAIModel:
    """
    SportIQ AI/ML Talent Evaluation Model.
    Computes multi-factor performance scores, talent projections, strengths/weaknesses identification,
    and automated developmental recommendations.
    """
    MODEL_VERSION = "v1.0"

    RECOMMENDATION_TEMPLATES = {
        "speed": "Implement resisted sprint drills, acceleration mechanics, and explosive plyometric box jumps.",
        "stamina": "Focus on high-intensity interval training (HIIT) and zone-2 aerobic endurance foundation.",
        "strength": "Incorporate progressive resistance training, core stability, and compound functional lifts.",
        "agility": "Dedicate sessions to speed-ladder footwork drills, cone change-of-direction, and reactive deceleration.",
        "accuracy": "Perform high-repetition precision technical drills under match-simulated speed and pressure."
    }

    @classmethod
    def evaluate(
        cls,
        metrics: Dict[str, float],
        weights: Dict[str, float],
        sport: str = "General",
        position: str = "General"
    ) -> Dict[str, any]:
        """
        Evaluate raw athlete metrics and compute performance score, talent score,
        potential classification, strengths, weaknesses, and training suggestions.
        """
        metric_keys = ["speed", "stamina", "strength", "agility", "accuracy"]

        # 1. Calculate Weighted Performance Score
        raw_performance = sum(metrics[k] * weights.get(k, 0.20) for k in metric_keys)
        performance_score = round(float(np.clip(raw_performance, 0.0, 100.0)), 2)

        # 2. Calculate Projected Talent Score with Age Factor
        age_multiplier = metrics.get("age_multiplier", 1.0)
        projected_talent = performance_score * age_multiplier
        talent_score = round(float(np.clip(projected_talent, 0.0, 100.0)), 2)

        # 3. Classify Potential Level
        if talent_score >= 80.0:
            potential_level = "HIGH"
        elif talent_score >= 60.0:
            potential_level = "MEDIUM"
        else:
            potential_level = "DEVELOPING"

        # 4. Identify Strengths (metrics >= 75 or top 2)
        sorted_metrics = sorted([(k.capitalize(), metrics[k]) for k in metric_keys], key=lambda x: x[1], reverse=True)
        high_metrics = [f"{name} ({val:.0f})" for name, val in sorted_metrics if val >= 75.0]
        if not high_metrics:
            high_metrics = [f"{name} ({val:.0f})" for name, val in sorted_metrics[:2]]
        strengths_str = ", ".join(high_metrics)

        # 5. Identify Weaknesses (metrics < 75 or lowest 2)
        low_metrics = [f"{name} ({val:.0f})" for name, val in sorted_metrics if val < 75.0]
        if not low_metrics:
            low_metrics = [f"{sorted_metrics[-1][0]} ({sorted_metrics[-1][1]:.0f})"]
        weaknesses_str = ", ".join(low_metrics)

        # 6. Generate Actionable Training Recommendations
        recommendations_list = []
        lowest_keys = sorted(metric_keys, key=lambda k: metrics[k])[:2]
        for key in lowest_keys:
            if metrics[key] < 85.0:
                recommendations_list.append(cls.RECOMMENDATION_TEMPLATES[key])

        if not recommendations_list:
            recommendations_list.append("Maintain high-performance output with specialized sport tactical drills and recovery optimization.")

        recommendations_str = " ".join(recommendations_list)

        # 7. Confidence Score (based on metric consistency and range)
        metric_values = [metrics[k] for k in metric_keys]
        std_dev = np.std(metric_values)
        confidence = round(float(np.clip(0.95 - (std_dev / 200.0), 0.75, 0.98)), 2)

        return {
            "performance_score": performance_score,
            "talent_score": talent_score,
            "potential_level": potential_level,
            "strengths": strengths_str,
            "weaknesses": weaknesses_str,
            "recommendations": recommendations_str,
            "confidence_score": confidence,
            "model_version": cls.MODEL_VERSION
        }
