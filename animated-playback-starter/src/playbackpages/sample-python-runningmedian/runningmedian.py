import heapq


class RunningMedian:
    def __init__(self):
        self.lower = []  # Max heap using negative values.
        self.upper = []  # Min heap.

    def add(self, value: int) -> None:
        if not self.lower or value <= -self.lower[0]:
            heapq.heappush(self.lower, -value)
        else:
            heapq.heappush(self.upper, value)

        # Lower holds either the same count or one extra value.
        if len(self.lower) > len(self.upper) + 1:
            heapq.heappush(self.upper, -heapq.heappop(self.lower))
        elif len(self.upper) > len(self.lower):
            heapq.heappush(self.lower, -heapq.heappop(self.upper))

    def median(self) -> float:
        if not self.lower:
            raise ValueError("No values have been added.")

        if len(self.lower) == len(self.upper):
            return (-self.lower[0] + self.upper[0]) / 2

        return float(-self.lower[0])
