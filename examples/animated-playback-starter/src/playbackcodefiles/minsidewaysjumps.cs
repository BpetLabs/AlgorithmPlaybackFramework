public static int MinimumSidewayJumps(int[] obstacles)
{
    const int unreachable = int.MaxValue / 2;

    // Minimum jumps to reach each lane at the current position.
    int[] jumps = { 1, 0, 1 };

    foreach (int obstacle in obstacles)
    {
        if (obstacle != 0)
            jumps[obstacle - 1] = unreachable;

        int minimum = Math.Min(jumps[0], Math.Min(jumps[1], jumps[2]));

        for (int lane = 0; lane < 3; lane++)
        {
            if (lane + 1 != obstacle)
                jumps[lane] = Math.Min(jumps[lane], minimum + 1);
        }
    }

    return Math.Min(jumps[0], Math.Min(jumps[1], jumps[2]));
}