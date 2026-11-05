import time
from datetime import date


def get_current_timestamp() -> int:
    return int(time.time() * 1000)


def to_date(timestamp: int) -> date:
    return date.fromtimestamp(timestamp / 1000)
