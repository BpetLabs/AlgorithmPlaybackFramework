## Playback Pages

Create each generated playback in its own URL-safe folder:

```text
playbackpages/
  bubble-sort/
    Page.tsx
    playback.json
```

`Page.tsx` must export the playback page as its default export. The starter
discovers matching pages automatically; do not edit `main.tsx`.

Open the page with its folder name in the query string:

```text
http://localhost:5173/?page=bubble-sort
```

Opening the starter without a `page` query displays all discovered pages.
