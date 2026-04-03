from typing import List, Tuple, Dict


def generate_activity_heatmap(
    timestamps: List[int],
    counts: List[int],
    buckets: int = 10,
    normalize: bool = True
) -> List[float]:
    """
    Bucket activity counts into 'buckets' time intervals,
    returning either raw counts or normalized [0.0–1.0].
    - timestamps: list of epoch ms timestamps.
    - counts: list of integer counts per timestamp.
    """
    if not timestamps or not counts or len(timestamps) != len(counts):
        return []

    t_min, t_max = min(timestamps), max(timestamps)
    span = t_max - t_min or 1
    bucket_size = span / buckets

    agg = [0] * buckets
    for t, c in zip(timestamps, counts):
        idx = min(buckets - 1, int((t - t_min) / bucket_size))
        agg[idx] += c

    if normalize:
        m = max(agg) or 1
        return [round(val / m, 4) for val in agg]
    return agg


def generate_heatmap_with_labels(
    timestamps: List[int],
    counts: List[int],
    buckets: int = 10,
    normalize: bool = True
) -> List[Tuple[str, float]]:
    """
    Same as generate_activity_heatmap but also attaches
    human-readable labels for each bucket.
    """
    if not timestamps or not counts or len(timestamps) != len(counts):
        return []

    t_min, t_max = min(timestamps), max(timestamps)
    span = t_max - t_min or 1
    bucket_size = span / buckets

    raw = generate_activity_heatmap(timestamps, counts, buckets, normalize=False)
    if normalize:
        m = max(raw) or 1
        raw = [round(val / m, 4) for val in raw]

    labeled: List[Tuple[str, float]] = []
    for i, v in enumerate(raw):
        start = t_min + i * bucket_size
        end = start + bucket_size
        label = f"{int(start)}–{int(end)}"
        labeled.append((label, v))
    return labeled


def summarize_heatmap(values: List[float]) -> Dict[str, float]:
    """
    Return summary statistics for a heatmap list.
    """
    if not values:
        return {"min": 0.0, "max": 0.0, "avg": 0.0}
    return {
        "min": round(min(values), 4),
        "max": round(max(values), 4),
        "avg": round(sum(values) / len(values), 4),
    }
