---
name: authoring
description: "Authoring animated play back from the start kit. Use for creating the initial interactive controls on the page and the initial json framework and the interactive skills for control use."
user-invocable: true
---

# Algorithm Page and json Authoring Rules

Use this skill when you are being prompted to create or modify a playback page.  This skill provides a guideline on how to take the prompt create a new playback page or update an existing page to add or modify the playback controls. 

* Use the `interactive-*` skills and `CONTROLS.md` to help.

## Copy the template first

If not provided a page:
* Copy the \examples\animated-playback-starter\src\template into \examples\animated-playback-starter\src\playbackpages or a provided location. Use a provided name or determine a best effort name from the contents of the page for the folder.

If provided a code file and a Text `code` control exists.
* Copy the code file into the new folder.
* Use \examples\animated-playback-starter\src\tools\ConvertCode.ps1 to convert and paste the code into the `staticText` of the `code` Id in the playback.json file. 

## Verify prompt 

* You should be provided a set of Controls and Types to create, if no playback controls other than default controls (`code`, `locals`, or `playbyplay`) exist. Otherwise, complete the copy template, stop processing, respond with "What playback controls should I create?".

* You should be provided with one or more Commands, inputs, and descriptions.  If not stop processing, respond with "What input should I use?" or if unsure "What does this playback control represent?"

* You should be provided a set of Pause statements on the code pauses dont already exist,  do not add your own Pauses, stop processing, and ask for pause locations in code, you can provide recommendations; recommendations should be lines that return results, or add/remove/update items in the control that would be good candidates for `Pre` states; for example stack.push(x), stack.pop(x), array[1] = 10;

* Pauses can be conditional,  such as Pause on the end for a loop if all pauses in the loop are skipped.

* You do not have to be provided exact inputs, a description of the input works and you should determine appropriate input for the problem.  

* However; run the code with the input before creating anything to determine that input and commands do not generate over 50 steps, otherwise stop process, and respond with the number of steps that this command, input, and pauses would generate. Once approved you can you continue.

* Not all properties or inputs of the code need corresponding playback controls.

## Create the controls in Json

* Create the desired controls in the json empty.  

* If any of the items are not input and populated in code, hide the controls using 
`{"render": {"visible": false}}` until you that code has been activated. 

* Do not include non runtime rendering in the json, prefer rendering in the page file. 

## Create the controls on the page

* Use the `interactive-*` skills and `CONTROLS.md` to help.

* Create the controls in Page.tsx,  use defaults unless requested or non defaults make sense. Include the `defaultItemOffset` in the page file for clarity.

* If the page contains a `playback-visualization-area` put the controls in this relative area otherwise use the full area provided and use your best judgement.

* Match the sizing to the prompt [1,2,3,4,5] create an array using default size that fits exactly 5 items. If the code initializes an array of a particular size use that sizing.  If its a dynamic array like a List, you can treat as an Array where the capacity is the largest array count for that input.

* If there is a growable class such a stack, queue, priority queue etc represented as playable control run the code and determine the max height to determine sizing for positioning.

## Control placement

* Avoid objects overlapping each other - including Titles and Labels including the boundaries.

* This includes items removing on the right or bottom, or animating in from the top or left, a control which take one item size of space.  If an item has action that does this, this additional space can be ignored. 

* Always include DefaultItemOffset for control, prefer controls default size. 

* Make items bigger if you need the space for text
* Make items smaller if you need the space screenspace
* If you go over the boundaries stop processing and make recommendations.
* Controls representing input should be first


Minimum Gap between controls
- 25 + itemsize

Arrays:

Preferred location:  Top Left
Preferred multiple controls:  Above and Below each other. If need more screen space can be single row on top or bottom.
Minimum defaultItemOffset: 25 

JaggedArrays:

Parent:
Preferred location: Top Left
Default Orientation: horizontal
DefaultItemSize: 60 
ItemGap or CrossAxisItemGap: 10 
Array should be sized so that the gap on all sizes of the child is 10.
Minimum defaultItemOffset: 45 
Child:
defaultItemOffset: 40
Default Orientation: vertical
Minimum defaultItemOffset: 25 

Stack:
Preferred location: Right Side - 1 width away, Attached to the play area floor
Preferred multiple controls: Minimum Gap to the left
Default Width: 120 
Minimum defaultItemOffset: 25

Grid:
Preferred location:  Center, Try to center align between controls
Minimum calculated items height or width: 25

GridNode:
Preferred calculated item height and width: 40
Minimum calculated items height or width: 25
Preferred location: Center, Try to center align between controls
* The size of the nodeGraph itself can overlap with other controls, only the nodes and arrows should not overlap.
* Prefer graph row/column counts and sizing that create squares for numbers and rectangles that would fit largest text
* Prefer graph row/column counts and sizing that can create visually appealing arrows.








