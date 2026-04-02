import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/serviceWorkerRegistration";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker for offline support
if (import.meta.env.PROD) {
  registerServiceWorker().catch((err) =>
    console.error("Service Worker registration failed:", err)
  );
}
