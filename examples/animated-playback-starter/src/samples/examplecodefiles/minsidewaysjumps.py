def min_sideways_jumps(obstacles: list[int]) -> int:
    # Minimum jumps to reach the current position in each lane.
    jumps = [1, 0, 1]

    for obstacle in obstacles:
        if obstacle != 0:
            jumps[obstacle - 1] = float("inf")

        # Jump sideways from the cheapest available lane.
        minimum = min(jumps)

        for lane in range(3):
            if lane + 1 != obstacle:
                jumps[lane] = min(jumps[lane], minimum + 1)

    return min(jumps)