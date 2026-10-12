import java.util.Arrays;
import java.util.Comparator;
import java.util.PriorityQueue;

public class TennisCourtBookings {
    public static int[] assignCourts(int[][] bookings) {
        Integer[] bookingOrder = new Integer[bookings.length];
        for (int index = 0; index < bookings.length; index++) {
            bookingOrder[index] = index;
        }

        Arrays.sort(
            bookingOrder,
            Comparator.comparingInt(index -> bookings[index][0])
        );

        // Priority queue of (end time, court number).
        PriorityQueue<int[]> courtEndTimes = new PriorityQueue<>(
            Comparator.<int[]>comparingInt(entry -> entry[0])
                .thenComparingInt(entry -> entry[1])
        );
        int[] assignedCourts = new int[bookings.length];
        int courtCount = 0;

        for (int index : bookingOrder) {
            int start = bookings[index][0];
            int end = bookings[index][1];
            int court;

            if (
                !courtEndTimes.isEmpty()
                    && courtEndTimes.peek()[0] <= start
            ) {
                court = courtEndTimes.poll()[1];
            } else {
                courtCount++;
                court = courtCount;
            }

            assignedCourts[index] = court;
            courtEndTimes.offer(new int[] {end, court});
        }

        return assignedCourts;
    }
}
