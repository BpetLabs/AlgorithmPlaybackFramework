class TreeNode:
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right


def lowest_common_ancestor(
    root: TreeNode | None,
    first: TreeNode,
    second: TreeNode
) -> TreeNode | None:
    if root is None or root is first or root is second:
        return root

    left = lowest_common_ancestor(root.left, first, second)
    right = lowest_common_ancestor(root.right, first, second)

    # Targets were found in separate branches.
    if left is not None and right is not None:
        return root

    return left if left is not None else right