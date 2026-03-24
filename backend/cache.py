"""
cache.py
========
Simple in-memory LRU cache for analysis results.
No database, no Redis — pure Python OrderedDict.
Stores up to MAX_SIZE video analyses; evicts least-recently-used when full.
"""

from collections import OrderedDict
from threading import Lock
from typing import Any, Optional

MAX_SIZE = 50  # max number of videos cached in memory

_cache: OrderedDict = OrderedDict()
_lock = Lock()


def lru_cache_get(key: str) -> Optional[Any]:
    with _lock:
        if key not in _cache:
            return None
        # Move to end (most recently used)
        _cache.move_to_end(key)
        return _cache[key]


def lru_cache_set(key: str, value: Any) -> None:
    with _lock:
        if key in _cache:
            _cache.move_to_end(key)
        _cache[key] = value
        if len(_cache) > MAX_SIZE:
            _cache.popitem(last=False)  # evict LRU


def lru_cache_delete(key: str) -> None:
    with _lock:
        _cache.pop(key, None)


def lru_cache_clear() -> None:
    with _lock:
        _cache.clear()


def lru_cache_size() -> int:
    with _lock:
        return len(_cache)
