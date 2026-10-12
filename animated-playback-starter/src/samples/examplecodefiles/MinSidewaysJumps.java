import java.util.Arrays;

public class MinSidewaysJumps {
    public static int minSidewaysJumps(int[] obstacles) {
        // Minimum jumps to reach the current position in each lane.
        int[] jumps = {1, 0, 1};
        int infinity = 1_000_000_000;

        for (int obstacle : obstacles) {
            if (obstacle != 0) {
                jumps[obstacle - 1] = infinity;
            }

            // Jump sideways from the cheapest available lane.
            int minimum = Arrays.stream(jumps).min().orElse(0);

            for (int lane = 0; lane < 3; lane++) {
                if (lane + 1 != obstacle) {
                    jumps[lane] = Math.min(
                        jumps[lane],
                        minimum + 1
                    );
                }
            }
        }

        return Arrays.stream(jumps).min().orElse(0);
    }
}
