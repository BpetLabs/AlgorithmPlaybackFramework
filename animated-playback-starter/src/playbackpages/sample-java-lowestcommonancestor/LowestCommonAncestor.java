public class LowestCommonAncestor {
    public static class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this(value, null, null);
        }

        TreeNode(int value, TreeNode left, TreeNode right) {
            this.value = value;
            this.left = left;
            this.right = right;
        }
    }

    public static TreeNode lowestCommonAncestor(
        TreeNode root,
        TreeNode first,
        TreeNode second
    ) {
        if (root == null || root == first || root == second) {
            return root;
        }

        TreeNode left = lowestCommonAncestor(
            root.left,
            first,
            second
        );
        TreeNode right = lowestCommonAncestor(
            root.right,
            first,
            second
        );

        // Targets were found in separate branches.
        if (left != null && right != null) {
            return root;
        }

        return left != null ? left : right;
    }
}
