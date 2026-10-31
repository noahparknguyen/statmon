import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Safari on iOS shows a control's pressed state (`:active`) only when the page
// listens for touches, and on a phone the pressed state is a control's only
// answer to a tap. So this listener is here to switch that on. It does
// nothing, and it's passive, so it can never hold up a scroll.
document.body.addEventListener("touchstart", () => {}, { passive: true });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
