import { ControlItem, ControlItemState, isRemovingState } from "../../../common/models/controlItem";

export interface RenderItemWithOffset<T extends ControlItem> {
  item: T;
  collapsed: boolean;
  collapsedIndex: number; // here it's the slot index expressed as an offset value
  offset: number;
  itemOffset: number;
  frozen?: boolean;
}

export function buildRenderItems<T extends ControlItem>(
  snapshot: T[],
  collapsedIds: Set<string>,
  disableAnimations: boolean,
  defaultItemOffset: number
): RenderItemWithOffset<T>[] {
  const renderItems: RenderItemWithOffset<T>[] = [];
  let nextOffset = 0; // pixel offset for the next new slot
  const linkOffset = new Map<string, number>();
  const incomingStates = new Set<ControlItemState>([
    ControlItemState.PreInsert,
    ControlItemState.PreUpdate,
    ControlItemState.PreHead,
    ControlItemState.PreTail,
  ]);
  const isIncomingState = (state: ControlItemState | undefined) =>
    state !== undefined && incomingStates.has(state);
  const isIncomingItem = (item: T) =>
    isIncomingState(item.state) ||
    (
      item.state === ControlItemState.Inserted &&
      isIncomingState(item.previousState)
    );
  const activeLinkCounts = new Map<string, number>();
  const incomingReplacementLinks = new Set<string>();
  snapshot.forEach((item) => {
    if (item.linkId && item.state !== ControlItemState.Removed) {
      activeLinkCounts.set(
        item.linkId,
        (activeLinkCounts.get(item.linkId) ?? 0) + 1
      );
    }
    if (item.linkId && isIncomingItem(item)) {
      incomingReplacementLinks.add(item.linkId);
    }
  });

  const hasIncomingReplacementFor = (outgoingItem: T) =>
    Boolean(
      outgoingItem.linkId &&
      incomingReplacementLinks.has(outgoingItem.linkId)
    );

  // The batch processor inserts a same-index replacement immediately after
  // the removing item. Other incoming items may exist in the same snapshot,
  // but they represent new slots and must wait for collapse.
  const hasSameSlotIncomingReplacement = (index: number) =>
    index + 1 < snapshot.length && isIncomingItem(snapshot[index + 1]);

  for (let index = 0; index < snapshot.length; index++) {
    const item = snapshot[index];
    if (
      item.state === ControlItemState.Empty &&
      item.linkId &&
      (activeLinkCounts.get(item.linkId) ?? 0) > 1
    ) {
      continue;
    }

    const collapsed = collapsedIds.has(item.id);
    const removing = isRemovingState(item.state);

    // collapsed and finished → gone
    if (collapsed && !removing) continue;

    // removing and animations disabled → gone
    if (removing && disableAnimations && item.collapse !== false) continue;

    // collapsed and still removing → render frozen at current offset (do not advance)
    if (collapsed && removing) {
      renderItems.push({
        item,
        collapsed,
        collapsedIndex: nextOffset,
        offset: nextOffset,
        itemOffset: item.itemOffset ?? defaultItemOffset,
        frozen: true,
      });
      continue;
    }

    // Same-slot replacements should render on the same level as the outgoing
    // item. Every other insert should wait for the removing item to finish
    // before the stack collapses.
    if (
      removing &&
      item.collapse !== false &&
      (hasIncomingReplacementFor(item) || hasSameSlotIncomingReplacement(index))
    ) {
      const itemOffset = item.itemOffset ?? defaultItemOffset;
      renderItems.push({
        item,
        collapsed,
        collapsedIndex: nextOffset,
        offset: nextOffset,
        itemOffset,
        frozen: true,
      });
      continue;
    }

    // normal / visible item
    const itemOffset = item.itemOffset ?? defaultItemOffset;
    let offset: number;

    if (item.linkId) {
      if (linkOffset.has(item.linkId)) {
        // reuse existing slot for this linkId
        offset = linkOffset.get(item.linkId)!;
      } else {
        // first time we see this linkId -> assign current nextOffset as its slot
        offset = nextOffset;
        linkOffset.set(item.linkId, offset);
        // advance nextOffset because the *owner* slot consumes space
        nextOffset += itemOffset;
      }
    } else {
      // not linked -> take its own slot
      offset = nextOffset;
      nextOffset += itemOffset;
    }

    const frozen = !disableAnimations && isRemovingState(item.state) ? true : undefined;

    renderItems.push({
      item,
      collapsed,
      collapsedIndex: offset,
      offset,
      itemOffset,
      frozen,
    });
  }

  return renderItems;
}
