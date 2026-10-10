public class TreeNode
{
    public int Value;
    public TreeNode? Left;
    public TreeNode? Right;

    public TreeNode(int value)
    {
        Value = value;
    }
}

public static TreeNode? LowestCommonAncestor(
    TreeNode? root,
    TreeNode first,
    TreeNode second)
{
    if (root == null || 
          root == first || 
          root == second)
        return root;

    TreeNode? left = LowestCommonAncestor(
                        root.Left, first, second);
    TreeNode? right = LowestCommonAncestor(
                        root.Right, first, second);

    // Targets were found on opposite sides.
    if (left != null && right != null)
        return root;

    // Pass the result from whichever side found a target.
    return left ?? right;
}