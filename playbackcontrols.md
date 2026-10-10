## Playback controls

This page is designed for documenting actions and properties that you can take with the playback framework. 

Controls are the visual panels in an AnimatedPlayback. Each control has a unique `id`, a `type`, a base position and size supplied by the React page, and optional state changes in `batches`, controlled by a `steps` slider.

## Contents

- [Starter page](#starter-page)
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
  - [`now` and `animateNow`](#now-and-animatenow)
- [Render overrides](#render-overrides)

## Starter page

### General design

Each page consists of a playback slider and a set of controls. Code, Play by Play, and Locals are included by default. Additional controls can represent arrays, stacks, queues, grids, graphs, and other algorithm-specific data.

The controls can be used for any animation, but the starter is designed for source-code playback. Add source code to the Code control and coordinate its highlights with the other controls to create a step-by-step, debugger-like visualization.

Each control specifies the steps on which it changes. A change can insert, update, delete, or set an item; highlight source code; or update another control-specific state.

The framework supports pre-states that show a pending action at the current pause. A new value can appear beside its destination before moving into place, while an item that is about to be removed can shake before leaving the control on the next step.

These pre-states connect the highlighted line of code to the visual change it is about to cause.

The slider coordinates every control and can move immediately forward or backward. Play by Play narration and Locals can explain what happened between pauses, which is useful when the playback stops only at important lines rather than every executed line.

### AI starter pack controls

The following controls have specific meanings for the custom AI skills.

The AI authoring skills use these conventional roles when they are relevant to the animation:

| Role | Type | Conventional ID | Purpose |
| --- | --- | --- | --- |
| Code | `staticText` | `code` | Included by default. Displays source code and animates line highlights and scrolling. |
| Play by Play | `text` | `text` | Included by default. Explains the code actions leading to the current step. |
| Locals | `dictionary` | `locals` | Included by default. Displays local variable names and their current values. |
| Call Stack | `stack` | `callStack` | Optional. Visualizes the active call stack. |
| Console Output | `text` | `console` | Optional. Displays output produced between the previous and current steps. |

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

This gives the first column 70% of the row width and the second column 30%. Provide one percentage for each `|`-separated segment. Every percentage must be greater than `0` and less than `100`, and the values must total `100`. If the configuration is invalid, the columns use equal widths. This is useful when, for example, keys are short but values are long.

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
      columns: 4,
      rows: 4,
      paddingX: 0.00,
      paddingY: 0.00,
      colGap: 0.04,
      rowGap: 0.04,
      columnSizing: { values: [1, 1, 1, 1] },
      rowSizing: { values: [1, 1, 1, 1] },
    };
    props.gridLines = true;
  }
}}
```

`paddingX` and `paddingY` are fractions of the control's width and height.
`colGap` and `rowGap` are fractions of the inner width and height.

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

Set `gridLines: true` on the graph control in JSON, or on its renderer props through `configureProps`, to outline every layout track cell.

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
      "value": "A child node with significantly more text",
      "column": 1.5,
      "row": 1,
      "backgroundColor": "ForestGreen",
      "itemWidthScale": 1.75,
      "itemHeightScale": 1.25
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

Nodes and edges are stateful and merge by `id`. Later batches only need to provide the properties that change. 
Remove nodes with `graphNodeDeletes` and edges with `graphEdgeDeletes`; deleting a node also removes edges that no longer have valid endpoints.

Set `itemWidthScale` or `itemHeightScale` on an individual node to resize its visible rectangle relative to its calculated track size. Both values default to `1`.

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
- Always fits every jagged level to its child content.
- Use it for jagged arrays, adjacency lists, and nested collections.

Child controls use the parent ID followed by their zero-based parent index. They are attached to the parent automatically and are not rendered as independent top-level controls:

```json
[
  {
    "id": "matrix",
    "type": "jaggedArray",
    "orientation": "vertical",
    "childGap": 5,
    "childWidth": 40,
    "childHeight": 40,
    "childDefaults": {
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

`childDefaults` supplies shared array options and optional render settings. Set `orientation` only on the root jagged array, using `"horizontal"` or `"vertical"`. It determines the starting direction, and every descendant level alternates automatically. Descendant controls and `childDefaults` cannot set `orientation`.

`childWidth` and `childHeight` set the leaf item size. `childGap` adds equal padding on every side between a parent slot and its child. Each parent slot and jagged container is sized recursively from those values and the occupied child content; explicit child layout dimensions and `fitContent` are not used. An empty jagged parent has a minimum size of `childWidth + 2 × childGap` by `childHeight + 2 × childGap`.

Leaf arrays in a jagged tree support the set family normally and support inserts, updates, deletes, and takes when every operation specifies `"now": true`. Jagged-array parents cannot store values directly or update child containers. They may insert only empty child containers and may remove a child container only when it is empty. Animated structural mutations (`now` omitted or `animateNow`) are rejected throughout the jagged-array tree because nested mutation animations are unsupported.

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

Set these layout options at the top level of a control in JSON or assign them in the page through `configureProps`. Array and stack-based controls use them to size items and their background slots.

| Option | Effect |
| --- | --- |
| `orientation` | Uses `"horizontal"` or `"vertical"` layout. Arrays and root jagged arrays support both; jagged descendants alternate automatically and stacks remain vertical. |
| `childGap` | Jagged arrays: padding on every side between a parent slot and its fitted child. |
| `childWidth`, `childHeight` | Jagged arrays: rendered width and height of leaf items used for recursive sizing. |
| `defaultItemOffset` | Default slot size and distance between consecutive item positions. |
| `itemWidth`, `itemHeight` | Default rendered size of each item box. |
| `itemGap` | Inset on both sides of an item along the main axis. |
| `itemCrossAxisGap` | Inset on both sides of an item across the main axis. |
| `preInsertGap` | Additional distance between an indexed insert/update pre-state and the control. |
| `itemLabels` | Labels displayed beside array slots. |
| `showCellBorders` | Shows or hides structural slot borders. |
| `emptyItemText` | Configured value displayed in array slots without item text, such as `"0"`. |
| `fitContent` | Sets an array or stack's main-axis size to its occupied content size while keeping its title at the original layout height. Jagged arrays always fit recursively in both dimensions. |

`defaultItemOffset` controls both the spacing between item positions and the background grid. A horizontal array divides its width into slots; a vertical array or stack divides its height into slots. Grid lines continue through unused space unless `showCellBorders` is `false`.

`itemLabels` applies to arrays and jagged arrays.

An individual item's `itemOffset` overrides `defaultItemOffset` for that slot. `itemWidth` and `itemHeight` change the rendered box; they do not change the distance between consecutive positions unless `defaultItemOffset` or `itemOffset` also changes.

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
      "inserts": [
        {
          "index": 1,
          "input": {
            "value": "3",
            "backgroundColor": "Teal"
          }
        }
      ],
      "setValues": [
        {
          "index": 2,
          "input": {
            "value": "5",
            "backgroundColor": "Teal"
          }
        }
      ]
    },
    {
      "step": 2
    }
  ]
}
```

Use step `0` for state that exists before the animated operation begins. Method-created arrays, locals, frames, and derived values normally begin on the first execution step instead.

You may skip steps, but an empty step next step is necessary to complete a multi state animation step such as `inserts`,`updates`, and `deletes` that do not include `now` or `animateNow`.

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

Indexed insert:

```json
"inserts": [
  {
    "index": 1,
    "input": {
      "value": "7",
      "backgroundColor": "Teal"
    }
  }
]
```

Tail insert:

```json
"tailInserts": [
  {
    "input": {
      "value": "9",
      "backgroundColor": "Teal"
    }
  }
]
```

### Update

Use `updates` when replacing an item with an animated value.

1. The replacement warps into the same pre-state position used by an indexed insert.
2. On the control's next batch, the replacement moves over the existing item at the target index.
3. The existing item fades away while the replacement takes its place. Other items do not move because the collection size does not change.

An indexed update can target a position beyond the current item count. The framework creates any missing slots before staging the replacement.

```json
"updates": [
  {
    "index": 2,
    "input": {
      "value": "42",
      "backgroundColor": "RoyalBlue"
    }
  }
]
```

### Delete

Use `deletes`, `headDeletes`, or `tailDeletes`.

1. The target item shakes in the pre-delete state to show that it is about to be removed.
2. On the control's next batch, it moves out, falls, rotates, and disappears.
3. Remaining items close the gap by default. Horizontal arrays collapse left, top-down vertical arrays collapse up, and bottom-up stacks collapse down.

Set `collapse: false` on the delete operation to leave an empty slot. A later removal with `collapse: true` can remove that empty slot and close the gap.

The target index must exist. An invalid delete index throws an error while loading the playback.

Indexed delete:

```json
"deletes": [
  { "index": 1 }
]
```

Tail delete:

```json
"tailDeletes": {
  "count": 1
}
```

### Take

Use `takes`, `headTakes`, or `tailTakes` when the removed value is being consumed or transferred rather than discarded.

1. The target item shakes in the pre-take state.
2. On the control's next batch, the item fades away in place.
3. Remaining items close the gap by default. Set `collapse: false` to preserve the slot.

The target index must exist. An invalid take index throws an error while loading the playback.

Indexed take:

```json
"takes": [
  { "index": 1 }
]
```

Tail take:

```json
"tailTakes": {
  "count": 1
}
```

### Set values

Use `setValues`, `setHeadValues`, or `setTailValues` to update an existing item's values immediately.

1. The existing item changes in place.
2. No replacement or transition animation runs.
3. You do not need to specify `now`; set-value operations are already immediate.

```json
"setValues": [
  {
    "index": 2,
    "input": {
      "value": "42",
      "backgroundColor": "ForestGreen",
      "borderColor": "Orange"
    }
  }
]
```

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

### `now` and `animateNow`

Set `now: true` on an insert, update, delete, or take to complete the operation immediately in the current batch. It skips both the pre-state and the transition animation.

Set `animateNow: true` to skip the pre-state but run the transition animation in the current batch. Do not set both options on the same operation.

| Setting | Pre-state | Transition | Completion |
| --- | --- | --- | --- |
| Default | Current batch | Next control batch | Next control batch |
| `animateNow: true` | Skipped | Current batch | Current batch |
| `now: true` | Skipped | Skipped | Current batch |

## Render overrides

JSON render overrides can change a control's presentation without changing its items.

Keep each control's normal position and size in the page's `controlLayouts` map. Use JSON layout overrides only when a playback intentionally moves or resizes a control at a particular step. 

Some common uses include hiding a control until it is needed or changing its title to include dynamic information.

| Option | Effect |
| --- | --- |
| `visible` | Shows or completely hides the control. |
| `title` | Replaces the page-supplied control title. |
| `showTitle` | Shows or hides the control title. |
| `borderWidth` | Sets the control's default highlight-border thickness. |
| `layout.top`, `layout.left` | Overrides the control position. |
| `layout.width`, `layout.height` | Overrides the control size. |

```json
{
  "render": {
    "visible": true,
    "title": "Input Array",
    "showTitle": true,
    "borderWidth": 2
  }
}
```

Set step-specific overrides in `renderBatches`:

```json
"renderBatches": [
  { "step": 0, "render": { "visible": false } },
  {
    "step": 3,
    "render": {
      "visible": true,
      "title": "Input Array — Pass 1",
      "layout": { "width": 350 }
    }
  }
]
```
