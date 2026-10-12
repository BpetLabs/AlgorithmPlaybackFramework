import type { ComponentType } from "react";

type PlaybackPageModule = {
  default: ComponentType;
};

type PlaybackPage = {
  name: string;
  Component: ComponentType;
};

const pageModules = import.meta.glob<PlaybackPageModule>(
  "./playbackpages/*/Page.tsx",
  { eager: true }
);

const pages = Object.entries(pageModules)
  .map(([path, pageModule]): PlaybackPage | undefined => {
    const match = path.match(/^\.\/playbackpages\/([^/]+)\/Page\.tsx$/);

    if (!match) {
      return undefined;
    }

    return {
      name: match[1],
      Component: pageModule.default,
    };
  })
  .filter((page): page is PlaybackPage => page !== undefined)
  .sort((left, right) => left.name.localeCompare(right.name));

function formatPageName(name: string) {
  return name
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function PlaybackPageLoader() {
  const requestedPage = new URLSearchParams(window.location.search).get("page");
  const selectedPage = pages.find((page) => page.name === requestedPage);

  if (selectedPage) {
    return <selectedPage.Component />;
  }

  return (
    <main className="playback-index">
      <h1>Animated Playback Pages</h1>

      {requestedPage && (
        <p className="playback-index-error">
          No playback page named &quot;{requestedPage}&quot; was found.
        </p>
      )}

      {pages.length > 0 ? (
        <ul>
          {pages.map((page) => (
            <li key={page.name}>
              <a href={`?page=${encodeURIComponent(page.name)}`}>
                {formatPageName(page.name)}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          Create a page at <code>src/playbackpages/&lt;name&gt;/Page.tsx</code>.
        </p>
      )}
    </main>
  );
}
