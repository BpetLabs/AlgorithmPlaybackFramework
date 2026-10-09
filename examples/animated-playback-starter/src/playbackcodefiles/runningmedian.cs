public class RunningMedian
{
    private readonly PriorityQueue<int, int> lower = new();
    private readonly PriorityQueue<int, int> upper = new();

    public void Add(int value)
    {
        // lower is a max heap using negative priorities.
        if (lower.Count == 0 ||
            value <= lower.Peek())
            lower.Enqueue(value, -value);
        else
            upper.Enqueue(value, value);

        // Keep the heaps balanced.
        if (lower.Count > upper.Count + 1)
        {
            var moved = lower.Dequeue();
            upper.Enqueue(moved, moved);
        }
        else if (upper.Count > lower.Count)
        {
            var moved = upper.Dequeue();
            lower.Enqueue(moved, -moved);
        }
    }

    public double Get()
    {
        if (lower.Count == 0)
            throw new InvalidOperationException("No values.");

        if (lower.Count == upper.Count)
            return ((long)lower.Peek() + upper.Peek()) / 2.0;

        return lower.Peek();
    }
}
