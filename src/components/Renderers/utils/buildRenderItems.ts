import { ControlItem, ControlItemState, isRemovingState } from "../../../common/models/controlItem";

export interface RenderItemWithOffset<T extends ControlItem> {
  item: T;
  collapsed: boolean;
  collapsedIndex: number; // here it's the slot index expressed as an offset value
  offset: number;
  itemOffset: number;
  frozen?: boolean;
}

export function getFittedRenderExtent<T extends ControlItem>(
  renderItems: RenderItemWithOffset<T>[],
  minimumSlotCount = 0,
  defaultItemOffset = 0
): number {
  const occupiedOffsets = new Set<number>();
  const contentExtent = renderItems.reduce((extent, renderItem) => {
    const state = renderItem.item.state;
    if (
      state === ControlItemState.PreInsert ||
      state === ControlItemState.PreHead ||
      state === ControlItemState.PreTail ||
      renderItem.itemOffset === 0
    ) {
      return extent;
    }

    occupiedOffsets.add(renderItem.offset);

    return Math.max(
      extent,
      renderItem.offset + renderItem.itemOffset
    );
  }, 0);

  return contentExtent +
    Math.max(minimumSlotCount - occupiedOffsets.size, 0) * defaultItemOffset;
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
  const collapsedLinkIds = new Set(
    snapshot.flatMap((item) =>
      collapsedIds.has(item.id) && item.linkId ? [item.linkId] : []
    )
  );
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
  const getItemOffset = (item: T) =>
    item.state === ControlItemState.Empty
      ? defaultItemOffset
      : item.itemOffset ?? defaultItemOffset;
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

  const linkedSlotSize = new Map<string, number>();
  snapshot.forEach((item) => {
    if (
      !item.linkId ||
      item.state === ControlItemState.Removed ||
      collapsedIds.has(item.id) ||
      collapsedLinkIds.has(item.linkId) ||
      (isRemovingState(item.state) &&
        disableAnimations &&
        item.collapse !== false) ||
      (item.state === ControlItemState.Empty &&
        (activeLinkCounts.get(item.linkId) ?? 0) > 1)
    ) {
      return;
    }

    linkedSlotSize.set(
      item.linkId,
      Math.max(
        linkedSlotSize.get(item.linkId) ?? 0,
        getItemOffset(item)
      )
    );
  });
  const consumedLinkedSlots = new Set<string>();

  const getLinkedOffset = (linkId: string) => {
    const existingOffset = linkOffset.get(linkId);
    if (existingOffset !== undefined) return existingOffset;

    linkOffset.set(linkId, nextOffset);
    return nextOffset;
  };

  for (let index = 0; index < snapshot.length; index++) {
    const item = snapshot[index];
    if (item.state === ControlItemState.Removed) continue;
    if (
      item.state === ControlItemState.Empty &&
      item.linkId &&
      (activeLinkCounts.get(item.linkId) ?? 0) > 1
    ) {
      continue;
    }

    const collapsed =
      collapsedIds.has(item.id) ||
      Boolean(item.linkId && collapsedLinkIds.has(item.linkId));
    const removing = isRemovingState(item.state);

    // collapsed and finished → gone
    if (collapsed && !removing) continue;

    // removing and animations disabled → gone
    if (removing && disableAnimations && item.collapse !== false) continue;

    // collapsed and still removing → render frozen at current offset (do not advance)
    if (collapsed && removing) {
      const offset = item.linkId
        ? getLinkedOffset(item.linkId)
        : nextOffset;
      renderItems.push({
        item,
        collapsed,
        collapsedIndex: offset,
        offset,
        // Keep the completed removal mounted without letting it determine
        // the shared slot or control extent.
        itemOffset: 0,
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
      const itemOffset = getItemOffset(item);
      const offset = item.linkId
        ? getLinkedOffset(item.linkId)
        : nextOffset;
      renderItems.push({
        item,
        collapsed,
        collapsedIndex: offset,
        offset,
        itemOffset,
        frozen: true,
      });
      continue;
    }

    // normal / visible item
    const itemOffset = getItemOffset(item);
    let offset: number;

    if (item.linkId) {
      offset = getLinkedOffset(item.linkId);
      if (!consumedLinkedSlots.has(item.linkId)) {
        // Linked outgoing and incoming nodes occupy one slot. Reserve the
        // largest active size so following items and the control make room.
        nextOffset = Math.max(
          nextOffset,
          offset + (linkedSlotSize.get(item.linkId) ?? itemOffset)
        );
        consumedLinkedSlots.add(item.linkId);
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
