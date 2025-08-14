import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TagManager from "react-gtm-module";
import App from "./App.tsx";
import "./index.css";

TagManager.initialize({
  gtmId: "GTM-PRNC3XL4",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
