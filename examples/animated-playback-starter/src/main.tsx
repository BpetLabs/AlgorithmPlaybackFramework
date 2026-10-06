import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AnimatedPlaybackPage from "./AnimatedPlaybackPage";
import "algorithm-playback-framework/styles.css";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnimatedPlaybackPage />
  </StrictMode>
);
