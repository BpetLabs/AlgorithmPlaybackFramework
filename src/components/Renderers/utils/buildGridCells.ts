import { ControlItem } from "../../../common/models/controlItem";
import { RenderItemWithOffset } from "./buildRenderItems";

export interface GridCell {
  offset: number;
  size: number;
}

export function buildGridCells(
  renderItems: RenderItemWithOffset<ControlItem>[],
  axisLength: number,
  defaultItemOffset: number
): GridCell[] {
  const occupiedSizeByOffset = new Map<number, number>();

  renderItems.forEach(({ offset, itemOffset }) => {
    occupiedSizeByOffset.set(
      offset,
      Math.max(occupiedSizeByOffset.get(offset) ?? 0, itemOffset)
    );
  });

  const occupiedCells = [...occupiedSizeByOffset.entries()]
    .map(([offset, size]) => ({ offset, size }))
    .sort((a, b) => a.offset - b.offset);
  const gridCells: GridCell[] = [];
  let cursor = 0;

  occupiedCells.forEach((cell) => {
    while (cursor < cell.offset) {
      const size = Math.min(defaultItemOffset, cell.offset - cursor);
      gridCells.push({ offset: cursor, size });
      cursor += size;
    }

    gridCells.push(cell);
    cursor = Math.max(cursor, cell.offset + cell.size);
  });

  while (cursor < axisLength) {
    const size = Math.min(defaultItemOffset, axisLength - cursor);
    gridCells.push({ offset: cursor, size });
    cursor += size;
  }

  return gridCells;
}
