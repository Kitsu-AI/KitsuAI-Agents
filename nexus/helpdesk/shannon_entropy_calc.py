import math
from typing import List, Dict, Any


def compute_shannon_entropy(addresses: List[str]) -> float:
    """
    Compute Shannon entropy (bits) of an address sequence.
    """
    if not addresses:
        return 0.0
    freq: Dict[str, int] = {}
    for a in addresses:
        freq[a] = freq.get(a, 0) + 1
    total = len(addresses)
    entropy = 0.0
    for count in freq.values():
        p = count / total
        entropy -= p * math.log2(p)
    return round(entropy, 4)


def entropy_breakdown(addresses: List[str]) -> Dict[str, Any]:
    """
    Return detailed distribution contributing to entropy:
    probabilities, counts, and per-symbol contribution.
    """
    if not addresses:
        return {"total": 0, "distribution": {}, "entropy": 0.0}

    freq: Dict[str, int] = {}
    for a in addresses:
        freq[a] = freq.get(a, 0) + 1
    total = len(addresses)

    distribution: Dict[str, Dict[str, Any]] = {}
    entropy = 0.0
    for addr, count in freq.items():
        p = count / total
        contrib = -p * math.log2(p)
        distribution[addr] = {
            "count": count,
            "probability": round(p, 4),
            "contribution": round(contrib, 4),
        }
        entropy += contrib

    return {"total": total, "distribution": distribution, "entropy": round(entropy, 4)}


def normalized_entropy(addresses: List[str]) -> float:
    """
    Compute entropy normalized to [0,1], where 1 = uniform distribution.
    """
    if not addresses:
        return 0.0
    distinct = len(set(addresses))
    raw_entropy = compute_shannon_entropy(addresses)
    max_entropy = math.log2(distinct) if distinct > 0 else 1
    return round(raw_entropy / max_entropy, 4) if max_entropy > 0 else 0.0
