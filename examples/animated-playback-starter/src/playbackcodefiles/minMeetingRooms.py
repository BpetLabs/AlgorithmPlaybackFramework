def minimum_rooms(meetings: list[list[int]]) -> int:
    starts = sorted(meeting[0] for meeting in meetings)
    ends = sorted(meeting[1] for meeting in meetings)

    end_index = 0
    rooms_in_use = 0
    maximum_rooms = 0

    for start in starts:
        # Release rooms for all meetings that have ended.
        while end_index < len(ends) and ends[end_index] <= start:
            rooms_in_use -= 1
            end_index += 1

        rooms_in_use += 1
        maximum_rooms = max(maximum_rooms, rooms_in_use)

    return maximum_rooms