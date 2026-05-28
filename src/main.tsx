import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initProjectState } from "@/lib/project-storage";
import { useApp } from "@/store/useApp";
import App from "./App";
import "./index.css";

initProjectState(useApp.getState().currentProjectId);

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
