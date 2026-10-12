import java.util.Collections;
import java.util.PriorityQueue;

public class RunningMedian {
    private final PriorityQueue<Integer> lower =
        new PriorityQueue<>(Collections.reverseOrder());
    private final PriorityQueue<Integer> upper =
        new PriorityQueue<>();

    public void add(int value) {
        if (lower.isEmpty() || value <= lower.peek()) {
            lower.offer(value);
        } else {
            upper.offer(value);
        }

        // Lower holds either the same count or one extra value.
        if (lower.size() > upper.size() + 1) {
            upper.offer(lower.poll());
        } else if (upper.size() > lower.size()) {
            lower.offer(upper.poll());
        }
    }

    public double median() {
        if (lower.isEmpty()) {
            throw new IllegalStateException(
                "No values have been added."
            );
        }

        if (lower.size() == upper.size()) {
            return (lower.peek() + upper.peek()) / 2.0;
        }

        return lower.peek();
    }
}
