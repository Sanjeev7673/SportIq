import numpy as np
import pandas as pd
from typing import Dict, Tuple, Optional


# Sport and position-specific evaluation weight matrices
POSITION_WEIGHTS: Dict[str, Dict[str, Dict[str, float]]] = {
    "football": {
        "forward": {"speed": 0.30, "agility": 0.25, "accuracy": 0.20, "stamina": 0.15, "strength": 0.10},
        "winger": {"speed": 0.35, "agility": 0.25, "stamina": 0.20, "accuracy": 0.10, "strength": 0.10},
        "midfielder": {"stamina": 0.30, "accuracy": 0.25, "agility": 0.20, "strength": 0.15, "speed": 0.10},
        "defender": {"strength": 0.35, "stamina": 0.25, "agility": 0.15, "speed": 0.15, "accuracy": 0.10},
        "goalkeeper": {"agility": 0.35, "accuracy": 0.25, "strength": 0.20, "speed": 0.10, "stamina": 0.10},
    },
    "basketball": {
        "guard": {"agility": 0.30, "accuracy": 0.25, "speed": 0.20, "stamina": 0.15, "strength": 0.10},
        "forward": {"strength": 0.25, "stamina": 0.25, "agility": 0.20, "accuracy": 0.15, "speed": 0.15},
        "center": {"strength": 0.40, "stamina": 0.20, "accuracy": 0.15, "agility": 0.15, "speed": 0.10},
    },
    "cricket": {
        "batsman": {"accuracy": 0.35, "agility": 0.25, "stamina": 0.20, "strength": 0.10, "speed": 0.10},
        "bowler": {"stamina": 0.30, "strength": 0.25, "speed": 0.20, "agility": 0.15, "accuracy": 0.10},
        "all-rounder": {"stamina": 0.25, "accuracy": 0.25, "strength": 0.20, "agility": 0.15, "speed": 0.15},
        "wicket-keeper": {"agility": 0.40, "accuracy": 0.25, "stamina": 0.15, "speed": 0.10, "strength": 0.10},
    },
    "badminton": {
        "singles": {"agility": 0.35, "stamina": 0.25, "speed": 0.20, "accuracy": 0.10, "strength": 0.10},
        "doubles": {"agility": 0.30, "accuracy": 0.25, "speed": 0.20, "strength": 0.15, "stamina": 0.10},
    },
    "athletics": {
        "sprinter": {"speed": 0.50, "strength": 0.20, "agility": 0.15, "stamina": 0.10, "accuracy": 0.05},
        "long-distance": {"stamina": 0.55, "agility": 0.15, "strength": 0.15, "speed": 0.10, "accuracy": 0.05},
    }
}

DEFAULT_WEIGHTS: Dict[str, float] = {
    "speed": 0.20,
    "stamina": 0.20,
    "strength": 0.20,
    "agility": 0.20,
    "accuracy": 0.20
}


def get_feature_weights(sport: Optional[str] = None, position: Optional[str] = None) -> Dict[str, float]:
    """
    Retrieve feature weights based on sport and position.
    Falls back to balanced default weights if sport/position is unknown.
    """
    if not sport:
        return DEFAULT_WEIGHTS

    sport_clean = sport.lower().strip()
    if sport_clean not in POSITION_WEIGHTS:
        return DEFAULT_WEIGHTS

    if not position:
        # Average weights across positions for this sport
        sport_positions = POSITION_WEIGHTS[sport_clean]
        avg_weights = {metric: 0.0 for metric in DEFAULT_WEIGHTS}
        for pos_weights in sport_positions.values():
            for metric, weight in pos_weights.items():
                avg_weights[metric] += weight
        num_pos = len(sport_positions)
        return {metric: round(w / num_pos, 4) for metric, w in avg_weights.items()}

    position_clean = position.lower().strip()
    # Check for substring match in known positions
    for pos_key, weights in POSITION_WEIGHTS[sport_clean].items():
        if pos_key in position_clean or position_clean in pos_key:
            return weights

    return DEFAULT_WEIGHTS


def preprocess_metrics(
    speed: float,
    stamina: float,
    strength: float,
    agility: float,
    accuracy: float,
    age: Optional[int] = None
) -> Dict[str, float]:
    """
    Cleans, validates, clips metrics to [0, 100], and computes age modifier.
    """
    clipped = {
        "speed": float(np.clip(speed, 0.0, 100.0)),
        "stamina": float(np.clip(stamina, 0.0, 100.0)),
        "strength": float(np.clip(strength, 0.0, 100.0)),
        "agility": float(np.clip(agility, 0.0, 100.0)),
        "accuracy": float(np.clip(accuracy, 0.0, 100.0)),
    }

    # Age potential factor: younger athletes (e.g. 15-21) have higher growth ceiling
    age_val = age if (age is not None and 10 <= age <= 50) else 22
    if age_val <= 18:
        age_multiplier = 1.08
    elif age_val <= 21:
        age_multiplier = 1.04
    elif age_val <= 25:
        age_multiplier = 1.00
    elif age_val <= 30:
        age_multiplier = 0.96
    else:
        age_multiplier = 0.90

    clipped["age_multiplier"] = age_multiplier
    clipped["age"] = float(age_val)
    return clipped
