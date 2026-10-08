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

* However; run the code with the input before creating anything to determine that input and commands do not generate over 50 steps, otherwise stop process, and respond with the number of steps that this command, input, and pauses would generate.

* Not all properties or inputs of the code need corresponding playback controls, if there is no corresponding control the output can be ignored and only mentioned in the `Play By Play` or `Locals` as appropriate. 

## Create the controls in Json

* Create the desired controls in the json empty.  

* If any of the controls are input, they are treated as external, populate the input on step 0 following the appropriate `interactive-*` skill. 

* If any of the items are not input and populated in code, hide the controls using 
`{"render": {"visible": false}}` until you that code has been activated. 

* Do not include non runtime rendering in the json, prefer rendering in the page file. 

## Create the controls on the page

* Use the `interactive-*` skills and `CONTROLS.md` to help.

* Create the controls in Page.tsx,  use defaults unless requested or non defaults make sense. Include the `defaultItemOffset` in the page file for clarity.

* If the page contains a `playback-visualization-area` put the controls in this relative area.

* Use the prompt to best guess sizing, for example if given an input prompt [1,2,3,4,5] create an array using default size that fits exactly 5 items.  

* Grids, Graph, and Stack Items should try to match the same defaultItemOffset.

* If there is a growable class such a stack, queue, priority queue etc represented as playable control run the code and determine the max height to determine sizing.

* If a particular nodes text cannot fit in a node you can increase the width and height for multi line.


## Control placement

* Titles can go above the Top of the `playback-visualization-area` by design but within the `playback-visualization-area` dont overlap Titles with other controls. 

* ReadOnly / or set value only items can go at Top: 0 but if there are Pre-state in the Json you need to account for 

Array Controls:
Jagged Array:
Stack Controls:
Grid and NodeGraph:




