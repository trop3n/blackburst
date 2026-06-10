import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initProjectState } from "@/lib/project-storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useApp } from "@/store/useApp";
import App from "./App";
import "./index.css";

// Local mode hydrates synchronously here. When Supabase is configured, project
// state is loaded by useApp.bootstrap() after sign-in instead.
if (!isSupabaseConfigured) {
  initProjectState(useApp.getState().currentProjectId);
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
