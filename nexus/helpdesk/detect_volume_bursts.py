from typing import List, Dict, Any


def detect_volume_bursts(
    volumes: List[float],
    threshold_ratio: float = 1.5,
    min_interval: int = 1
) -> List[Dict[str, Any]]:
    """
    Identify indices where volume jumps by threshold_ratio over previous.
    Returns list of dicts: {index, previous, current, ratio}.
    """
    events: List[Dict[str, Any]] = []
    if not volumes or len(volumes) < 2:
        return events

    last_idx = -min_interval
    for i in range(1, len(volumes)):
        prev, curr = volumes[i - 1], volumes[i]
        ratio = (curr / prev) if prev > 0 else float("inf")
        if ratio >= threshold_ratio and (i - last_idx) >= min_interval:
            events.append({
                "index": i,
                "previous": prev,
                "current": curr,
                "ratio": round(ratio, 4)
            })
            last_idx = i
    return events


def summarize_bursts(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Summarize a set of detected bursts.
    Returns count, max ratio, and average ratio.
    """
    if not events:
        return {"count": 0, "max_ratio": 0.0, "avg_ratio": 0.0}
    ratios = [e["ratio"] for e in events]
    return {
        "count": len(events),
        "max_ratio": max(ratios),
        "avg_ratio": round(sum(ratios) / len(ratios), 4)
    }


def merge_bursts(events: List[Dict[str, Any]], max_gap: int = 2) -> List[Dict[str, Any]]:
    """
    Merge bursts that occur within 'max_gap' indices into a single event cluster.
    """
    if not events:
        return []

    merged: List[Dict[str, Any]] = []
    cluster = [events[0]]
    for e in events[1:]:
        if e["index"] - cluster[-1]["index"] <= max_gap:
            cluster.append(e)
        else:
            merged.append(_combine_cluster(cluster))
            cluster = [e]
    if cluster:
        merged.append(_combine_cluster(cluster))
    return merged


def _combine_cluster(cluster: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Helper: combine a cluster of events into one summary.
    """
    return {
        "start_index": cluster[0]["index"],
        "end_index": cluster[-1]["index"],
        "events": len(cluster),
        "max_ratio": max(e["ratio"] for e in cluster),
        "avg_ratio": round(sum(e["ratio"] for e in cluster) / len(cluster), 4)
    }
