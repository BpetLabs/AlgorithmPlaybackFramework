import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PlaybackPageLoader from "./PlaybackPageLoader";
import "algorithm-playback-framework/styles.css";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PlaybackPageLoader />
  </StrictMode>
);
