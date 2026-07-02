import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@learn-loop/core/ui/experiment.css";
import { App } from "./ui/App";
import "./style.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
