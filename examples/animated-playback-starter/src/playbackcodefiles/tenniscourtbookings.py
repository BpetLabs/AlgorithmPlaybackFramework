import heapq

class TennisCourtBookings:
    @staticmethod
    def assign_courts(bookings: list[list[int]]) -> list[int]:
        booking_order = sorted(
            range(len(bookings)),
            key=lambda index: bookings[index][0]
        )

        # Priority queue of (end_time, court_number).
        court_end_times: list[tuple[int, int]] = []
        assigned_courts = [0] * len(bookings)
        court_count = 0

        for index in booking_order:
            start, end = bookings[index]

            if (
                court_end_times
                and court_end_times[0][0] <= start
            ):
                _, court = heapq.heappop(court_end_times)
            else:
                court_count += 1
                court = court_count

            assigned_courts[index] = court
            heapq.heappush(court_end_times, (end, court))

        return assigned_courts
