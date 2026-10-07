# Playback controls

Controls are the visual panels in an AnimatedPlayback. Each control has a unique `id`, a `type`, a base position and size supplied by the React page, and optional state changes in `batches`.

## Contents

- [Standard playback controls](#start-page)
- [Available types](#available-types)
  - [`staticText`](#statictext)
  - [`text`](#text)
  - [`array`](#array)
  - [`stack`](#stack)
  - [`dictionary`](#dictionary)
  - [`nodeGraph`](#nodegraph)
  - [`grid`](#grid)
  - [`jaggedArray`](#jaggedarray)
- [Generic properties](#generic-properties)
- [Basic rich text](#basic-rich-text)
- [Item slots and grid lines](#item-slots-and-grid-lines)
- [Initial state and playback steps](#initial-state-and-playback-steps)
- [Mutation animations](#mutation-animations)
  - [Insert](#insert)
  - [Update](#update)
  - [Delete](#delete)
  - [Take](#take)
  - [Set values](#set-values)
  - [`now`](#now)
  - [`animateNow`](#animatenow)
- [Visibility and render changes](#visibility-and-render-changes)
- [Minimal control](#minimal-control)

## Starter Page

### General Design

Each page consists of a slider, and a set of controls, with Code, Play by Play, and Locals being standard, and the rest representing Arrays, Stacks, Queues, Grids, and Graphs. 

You do not need to use this solution for code playback and can use these controls anyway you choose, but it was designed to plug any code into Code text and produce a step by step playable animation while the Code provides a debugger like experience stopping on specified lines. 

Each control will specify the steps 0, 1, 5... where they will take an action, whether that be an insert, update, delete, set value, or highlighting.

One of the key differences with this Animation framework is that it supports PreStates,  to provide a debugger like experience at the Pause Line,  Values as blocks warp in off to the side to show you what will happen,  or shake to show you that an item will be removed and then animate in place at the next step.

This is what allows you to understand what each line of code is doing,  without these Pre-Steps its very hard to visualize the changes.  

All of the steps are coordinated with a slider, that can instantly go forward or back and the AI Skills and Local Variables provide hopefully useful and relevent information on what happened between the steps,  since you can only pause a key parts of the code,  the summary can help you trace back what happened inbetween steps. 

### AI starter pack controls

The following are a set of controls that have specific meaning to the custom AI skills.

The AI authoring skills use these conventional roles when they are relevant to the animation:

| Role | Type | Conventional ID | Purpose |
| --- | --- | --- | --- |
| Code | `staticText` | `code` | Defaulted: Displays fixed source code and animates line highlights and scrolling. |
| Play by Play | `text` | `playbyplay` | Defaulted: Explains the code actions leading to the current step. |
| Locals | `dictionary` | `locals` | Defaulted: Displays local variable names and their current values. |
| Call Stack | `stack`   | `callstack` | On request: Visual representation of a call stack. | 
| Console Output | `text` | `consoleout` | On request: Displays console output that occured in between the last to current step |

The starter gives these three controls fixed, initially empty regions. It also reserves an empty visualization area for algorithm-specific controls.

## Available types

### `staticText`

Displays fixed text from `staticValue`. It is intended for source code but can display any preformatted text.

- `highlightLines` adds or updates background and border highlights.
- `clearHighlights` removes background highlights, border highlights, or both.
- `scrollBottom` scrolls until the specified one-based line is visible at the bottom of the viewport.

Highlight ranges are one-based and inclusive. A range can contain one line, a span, or several comma-separated parts:

```json
{
  "step": 1,
  "highlightLines": [
    {
      "range": "2,4-6,9",
      "backgroundColor": "Highlight.Pause",
      "borderColor": "Orange"
    }
  ],
  "scrollBottom": 9
}
```

Highlights are stateful. A later highlight only changes the supplied color property for its range. Clear both colors by specifying only a range, or clear one color selectively:

```json
"clearHighlights": [
  { "range": "2" },
  { "range": "4-6", "backgroundColor": true },
  { "range": "9", "borderColor": true }
]
```

Available semantic background-color aliases are:

| Alias | Intended meaning |
| --- | --- |
| `Highlight.Pause` | Current playback pause. |
| `Highlight.Branch` | Active represented child call or branch. |
| `Highlight.ReturnLocation` | Caller location after a represented child returns. |
| `Highlight.Return` | Returning code. |
| `Highlight.False` | Code skipped by a false condition or unselected branch. |
| `Highlight.Unused` | Visible code that did not participate in the transition. |

Customers can override the corresponding `--apf-highlight-*` variables in their application stylesheet.

### `text`

Displays free-form text that changes across steps. Use it for console output, play-by-play narration, commands, or explanations.

- Supports multiline values.
- Uses ordinary item insert, update, and delete batches.
- Console output is optional and should normally show only output produced by the current transition.

### `array`

Displays an indexed, one-dimensional collection.

- Horizontal by default; set `orientation` to `"vertical"` when needed.
- Can represent an array, list, deque, or queue.
- Supports labels, empty-cell text, cell borders, spacing, and content-sized layouts.
- Items are positioned from the start of the selected orientation.

### `stack`

Displays a vertical stack.

- Always vertical.
- Items are positioned from the bottom upward.
- Use it for a call stack or another structure where bottom-up presentation is important.
- Supports split-column content, which is useful for call-frame details.

### `dictionary`

Displays key/value or multi-column rows. It uses the stack layout but renders each item as columns separated by `|` in its `value`.

- Intended for local variables and lookup tables.
- Supports custom percentage-based column widths with `splitColumnWidths`.
- Hides the stack cell borders by default and draws borders around each row's columns.

Example item value:

```json
{ "value": "index | 3" }
```

The `|` separates the displayed columns. Add `splitColumnWidths` to the item to move those column boundaries:

```json
{
  "value": "description | value",
  "splitColumnWidths": [70, 30]
}
```

This gives the first column 70% of the row width and the second column 30%. Provide one percentage for each `|`-separated segment. Every percentage must be greater than `0` and less than `100`, and the values must total `100`. If the configuration is invalid, the columns use equal widths.

For three columns, use three percentages:

```json
{
  "value": "name | type | value",
  "splitColumnWidths": [35, 25, 40]
}
```

### `nodeGraph`

Displays nodes connected by directed or undirected edges.

- Places nodes on a row-and-column track layout.
- Accepts whole or fractional `row` and `column` positions. For example, `column: 2.5` places a node halfway between columns 2 and 3.
- Supports `rowSpan` and `columnSpan` when a node should occupy multiple tracks.
- Supports edge labels, colors, widths, arrow direction, anchors, and direct or looped routes.
- Use it for trees, linked structures, state graphs, and dependency graphs.

The graph control's page-supplied `width` and `height` define the available drawing area. The configured number of rows and columns divides that area into tracks after padding and gaps are removed. Nodes fill their assigned tracks, so increasing the control size makes the nodes larger, while increasing the number of rows or columns makes them smaller.

Configure the graph tracks through the `configureProps` property on `InteractiveControlRenderer` in `AnimatedPlaybackPage.tsx`:

```tsx
configureProps={(id, props) => {
  if (id === "graph") {
    props.graphLayout = {
      columns: 8,
      rows: 4,
      paddingX: 0.04,
      paddingY: 0.08,
      colGap: 0.03,
      rowGap: 0.06,
    };
  }
}}
```

`paddingX` and `paddingY` are fractions of the control's width and height. `colGap` and `rowGap` are fractions of the inner width and height. If `columns` or `rows` is omitted, the renderer infers it from the greatest node coordinate. Specify both when using fractional coordinates so placement and sizing remain stable as nodes are added or removed.

Use `columnSizing.values` and `rowSizing.values` to assign relative track sizes. For example, `[1, 2, 1]` makes the middle track twice as large as the other two. The number of sizing values must match the configured track count; otherwise, all tracks use equal sizes.

Graph layout options:

| Option | Effect |
| --- | --- |
| `columns`, `rows` | Number of layout tracks. |
| `paddingX`, `paddingY` | Outer padding as a fraction of the control size. |
| `offsetX`, `offsetY` | Moves the entire graph by a fraction of the control size; negative values move it left or up. |
| `colGap`, `rowGap` | Space between tracks as a fraction of the inner size. |
| `columnSizing.values` | Relative widths of the column tracks. |
| `rowSizing.values` | Relative heights of the row tracks. |

```json
{
  "step": 1,
  "graphNodes": [
    {
      "id": "root",
      "value": "Root",
      "column": 3.5,
      "row": 0,
      "backgroundColor": "RoyalBlue"
    },
    {
      "id": "child",
      "value": "Child",
      "column": 1.5,
      "row": 1,
      "backgroundColor": "ForestGreen"
    }
  ],
  "graphEdges": [
    {
      "id": "root-child",
      "from": "root",
      "to": "child",
      "arrow": "next"
    }
  ]
}
```

Nodes and edges are stateful and merge by `id`. Later batches only need to provide the properties that change. Remove nodes with `graphNodeDeletes` and edges with `graphEdgeDeletes`; deleting a node also removes edges that no longer have valid endpoints.

Edge properties:

| Property | Effect |
| --- | --- |
| `id` | Stable identifier used by later updates and deletion. |
| `from`, `to` | IDs of the connected nodes. |
| `arrow` | `next`, `prev`, `both`, or `none`. Defaults to `next`. |
| `fromAnchor`, `toAnchor` | `top`, `bottom`, `left`, `right`, `upperLeft`, `upperRight`, `lowerLeft`, or `lowerRight`. |
| `route` | `direct`, `loopTop`, or `loopBottom`. Defaults to `direct`. |
| `loopOffset` | Distance between a loop route and the graph nodes. |
| `label` | Text displayed beside the edge. |
| `color`, `width` | Edge stroke color and width. |

`graphNodeDeletes` uses objects containing the node `id` and optional `now` or `animateNow`. `graphEdgeDeletes` is an array of edge ID strings.

### `grid`

Displays values at fixed row and column coordinates.

- Requires positive `rows` and `cols` values.
- Updates cells through `gridItems` containing `row` and `col`.
- Supports row labels, column labels, axis descriptions, empty-cell text, and optional cell borders.
- Use it for matrices, boards, maps, and dynamic-programming tables.

Grid coordinates are zero-based. Give each cell a stable `id` so later batches update the existing cell instead of creating another item:

```json
{
  "id": "board",
  "type": "grid",
  "rows": 2,
  "cols": 3,
  "rowLabels": ["A", "B"],
  "columnLabels": ["0", "1", "2"],
  "rowDescription": "Row",
  "columnDescription": "Column",
  "emptyItemText": "0",
  "batches": [
    {
      "step": 1,
      "gridItems": [
        {
          "id": "cell-0-1",
          "row": 0,
          "col": 1,
          "value": "5",
          "backgroundColor": "RoyalBlue",
          "borderColor": "Orange"
        }
      ]
    },
    {
      "step": 2,
      "gridItems": [
        { "id": "cell-0-1", "row": 0, "col": 1, "value": "8" }
      ]
    }
  ]
}
```

`gridItems` are stateful and merge by `id`. Grid cells support the generic `value`, background, text, and highlight-border properties. Set `showCellBorders: false` to hide the structural cell borders.

### `jaggedArray`

Displays an outer array whose cells can contain child arrays of different lengths.

- Uses the normal array options for the outer and child arrays.
- Define children as separate `array` controls named `<parent-id>-<index>`.
- Supports shared child defaults through `childDefaults`.
- Use it for jagged arrays, adjacency lists, and nested collections.

Child controls use the parent ID followed by their zero-based parent index. They are attached to the parent automatically and are not rendered as independent top-level controls:

```json
[
  {
    "id": "matrix",
    "type": "jaggedArray",
    "orientation": "vertical",
    "defaultItemOffset": 70,
    "childDefaults": {
      "orientation": "horizontal",
      "defaultItemOffset": 50,
      "fitContent": true,
      "emptyItemText": "0"
    },
    "batches": []
  },
  {
    "id": "matrix-0",
    "type": "array",
    "initialItemCount": 2,
    "batches": []
  },
  {
    "id": "matrix-1",
    "type": "array",
    "initialItemCount": 3,
    "batches": []
  }
]
```

`childDefaults` supplies shared array options and optional render settings. An explicit child setting overrides the corresponding default. Child orientation is shared and cannot vary by row.

## Generic properties

Items in arrays, stacks, dictionaries, text controls, grids, jagged arrays, and node graphs share these appearance properties:

| Property | Effect | Applies to |
| --- | --- | --- |
| `value` | Main displayed text. | All item-based controls |
| `backgroundColor` | Item or node background color. The default is transparent. | All item-based controls |
| `textColor` | Text color. The default is near-white. | All item-based controls |
| `borderColor` | Highlight border color. Omit it or use an empty string to show no highlight border. | All item-based controls |
| `borderWidth` | Highlight border thickness in pixels. It is visible only when `borderColor` is set. | All item-based controls |
| `leftAlignedValue` | Auxiliary text displayed in the left region. | Arrays, jagged arrays, stacks, and graph nodes |
| `rightAlignedValue` | Auxiliary text displayed in the right region. | Arrays, jagged arrays, stacks, and graph nodes |
| `itemOffset` | Overrides the item's slot size along the control's main axis. | Arrays, jagged arrays, stacks, dictionaries, and text controls |
| `shake` | Starts or stops a manual shake effect when set to `true` or `false`. | Arrays, jagged arrays, stacks, dictionaries, and text controls |

Colors accept normal CSS color values, including named colors, hexadecimal values, `rgb()`/`rgba()`, and CSS variables.

```json
{
  "value": "42",
  "backgroundColor": "RoyalBlue",
  "textColor": "#ffffff",
  "borderColor": "Orange",
  "borderWidth": 3
}
```

These properties can be supplied when inserting an item or changed later with a set operation:

```json
{
  "step": 3,
  "setValues": [
    {
      "index": 0,
      "input": {
        "backgroundColor": "ForestGreen",
        "borderColor": "",
        "borderWidth": 2
      }
    }
  ]
}
```

An item's `borderWidth` takes precedence over the control's `render.borderWidth`. If neither is provided, item highlight borders default to 4 pixels. `render.borderWidth` can therefore establish a default thickness for all highlighted items in one control.

Background slot or cell borders are separate from item highlight borders. Use `showCellBorders` to show or hide them and override `--apf-grid-border-color` to change their theme color.

## Basic rich text

Displayed text supports a small Markdown-like subset:

- Wrap text in `**double asterisks**` to make it bold.
- Use `\n` inside a JSON string for a line break in controls that support multiline values.
- Use `|` to separate columns in a `dictionary` item.

```json
{
  "value": "**Return:** 42\n**Status:** complete"
}
```

A dictionary row can combine bold text with columns:

```json
{ "value": "status | **complete**" }
```

Bold text works in code and text controls, array and stack items, dictionary values, grid cells, graph nodes, and graph-edge labels. Formatting can be mixed with ordinary text on the same line.

Other Markdown and HTML formatting—such as italics, headings, links, and lists—is not parsed. An unmatched `**` marker is displayed as ordinary text.

### Item text positions

Some item-based controls can display three text regions. These can provide additional information such as item IDs.

| Property | Array and jagged array | Stack and graph node |
| --- | --- | --- |
| `value` | Center | Center |
| `leftAlignedValue` | Upper-left | Upper-left |
| `rightAlignedValue` | Lower-right | Upper-right |

Each region supports multiline values and `**bold text**`.

```json
{
  "value": "42",
  "leftAlignedValue": "**index:** 3",
  "rightAlignedValue": "result"
}
```

Dictionary, grid, and plain `text` controls render `value` but do not render the two auxiliary aligned-value properties.

## Item slots and grid lines

Array and stack renderers draw background grid lines for their item slots. The framework option is named `defaultItemOffset` rather than `defaultItemSize`.

- `defaultItemOffset` sets the default distance between item positions and the size of each background slot. Its default is `50` pixels.
- A horizontal array divides its width into slots.
- A vertical array or stack divides its height into slots.
- Grid lines continue through unused space in the control, so empty positions remain visible.
- Set `showCellBorders: false` to hide the background grid lines.
- Set `emptyItemText` to the value that should appear in an unoccupied array or grid cell, such as `"0"` for an initialized numeric array. Jagged arrays pass this setting to their array cells. Stack controls do not use it.

`itemWidth` and `itemHeight` control the rendered item box. `defaultItemOffset` controls where consecutive items begin and how the background grid is divided. `itemGap` and `itemCrossAxisGap` add space inside those slots.

Array and stack layout options:

| Option | Effect |
| --- | --- |
| `defaultItemOffset` | Default slot size and distance between consecutive item positions. |
| `itemWidth`, `itemHeight` | Default rendered size of each item box. |
| `itemGap` | Inset on both sides of an item along the main axis. |
| `itemCrossAxisGap` | Inset on both sides of an item across the main axis. |
| `preInsertGap` | Additional distance between an indexed insert/update pre-state and the control. |
| `itemLabels` | Labels displayed beside array slots. |
| `showCellBorders` | Shows or hides structural slot borders. |
| `emptyItemText` | Value displayed in array slots without item text. |
| `fitContent` | Shrinks an array along its main axis to the occupied content size. |

`itemLabels` and `fitContent` apply to arrays and jagged arrays. Stack-based controls ignore them. An individual item's `itemOffset` overrides `defaultItemOffset` for that slot.

```json
{
  "id": "values",
  "type": "array",
  "orientation": "horizontal",
  "defaultItemOffset": 60,
  "emptyItemText": "0",
  "showCellBorders": true
}
```

This creates 60-pixel slots across the array's main axis and displays `0` in slots without an item. The final slot is shortened when the control size is not evenly divisible by 60. A `grid` control works differently: its grid lines come from its explicit `rows` and `cols` values, but `emptyItemText` still supplies the configured value for unoccupied cells.

## Initial state and playback steps

Every control starts with a snapshot at step `0`. If a control has no batch on a later global step, its most recent snapshot remains visible.

- `initialItemCount` creates that many items at step `0`.
- `initialItemDefaults` applies shared starting values to every initial item.
- Omitting `initialItemCount` starts the control with no items.
- Omitting `type` defaults the control to `array`.
- Batch `step` values are non-negative integers shared across all controls.

```json
{
  "id": "values",
  "type": "array",
  "initialItemCount": 4,
  "initialItemDefaults": {
    "value": "0",
    "backgroundColor": "#1f2937"
  },
  "batches": [
    {
      "step": 1,
      "setValues": [
        { "index": 2, "input": { "value": "5" } }
      ]
    }
  ]
}
```

Use step `0` for state that exists before the animated operation begins. Method-created arrays, locals, frames, and derived values normally begin on the first execution step instead.

## Mutation animations

Array-, stack-, dictionary-, and text-based controls use the same stateful mutation model. An indexed operation targets `index`. A head operation targets the first logical item, and a tail operation targets the last logical item.

Unless `now` or `animateNow` is set, an animated mutation has two phases. The first batch displays a pre-state: something that is about to happen but has not happened yet. The next batch for that control, normally on the next playback step, advances and animates the mutation. Add an empty batch when the control has no other change on that next step.

### Insert

Use `inserts`, `headInserts`, or `tailInserts`.

1. The new item warps into its pre-state outside the target position.
   - For a horizontal array, an indexed insert appears above the control.
   - For a vertical array or stack, an indexed insert appears to the left of the control.
   - A head or tail insert appears beyond the corresponding end of the control.
2. On the control's next batch, the item moves into place.
3. The existing items move to make room: toward the right in a horizontal array, toward the bottom in a top-down vertical array, or toward the top in a bottom-up stack.

### Update

Use `updates` when replacing an item with an animated value.

1. The replacement warps into the same pre-state position used by an indexed insert: above a horizontal control or to the left of a vertical control.
2. On the control's next batch, the replacement moves over the existing item at the target index.
3. The existing item fades away while the replacement takes its place. Other items do not move because the collection size does not change.

* You cannot update an item index that doesnt exist.

### Delete

Use `deletes`, `headDeletes`, or `tailDeletes`.

1. The target item shakes in the pre-delete state to show that it is about to be removed.
2. On the control's next batch, it moves out, falls, rotates, and disappears.
3. Remaining items close the gap by default. Horizontal arrays collapse left, top-down vertical arrays collapse up, and bottom-up stacks collapse down.

Set `collapse: false` on the delete operation to leave an empty slot. A later removal with `collapse: true` can remove that empty slot and close the gap.

* You cannot delete an item index that doesnt exist.

### Take

Use `takes`, `headTakes`, or `tailTakes` when the removed value is being consumed or transferred rather than discarded.

1. The target item shakes in the pre-take state.
2. On the control's next batch, a vertical control moves the item to the left and then makes it disappear. A horizontal control currently fades the item in place.
3. Remaining items close the gap by default. Set `collapse: false` to preserve the slot.

* You cannot take an item index that doesnt exist.

### Set values

Use `setValues`, `setHeadValues`, or `setTailValues` to update an existing item's values immediately.

1. The existing item changes in place.
2. No replacement or transition animation runs.
3. You do not need to specify `now`; set-value operations are already immediate.

Set operations accept an optional `target`:

| Target | Effect |
| --- | --- |
| `current` | Updates the item that currently owns the logical position. This is the default. |
| `outgoing` | Updates the old item that remains visible while its removal animation finishes. |
| `all` | Updates both the current item and its linked outgoing item. |

Use `outgoing` only during a replacement or removal transition—for example, to clear a border from the old animated item while assigning it to the replacement:

```json
"setValues": [
  {
    "index": 2,
    "target": "current",
    "input": { "borderColor": "Orange" }
  },
  {
    "index": 2,
    "target": "outgoing",
    "input": { "borderColor": "" }
  }
]
```

### Now and AnimateNow 

| Setting | Pre-state | Transition | Completion |
| --- | --- | --- | --- |
| Default | Current batch | Next control batch | Next control batch |
| `animateNow: true` | Skipped | Current batch | Current batch |
| `now: true` | Skipped | Skipped | Current batch |

## Render Overrides

You can override or say the render layout of properties in Json,  but i would recommend doing it on the page itself.



```json
"renderBatches": [
  { "step": 0, "render": { "visible": false } }
  { "step": 3, "render": { "visible": true } }
]
```

Render settings are stateful. An override remains active until a later override changes it.

Keep normal control sizes and positions in the page's `controlLayouts` map. JSON `render.layout` remains available when an animation intentionally moves or resizes a control at a particular step. A partial JSON layout override merges with the page layout and previous render overrides.

Render overrides can also change `visibility`, `title`, `showTitle`, and `borderWidth`.
