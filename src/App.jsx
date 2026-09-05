import { RouterProvider } from "react-router";
import { createRouter } from "./router";

// Built once at module scope, not per render: a router carries history and
// navigation state, so rebuilding it on every render would reset both.
const router = createRouter();

// Root: mounts the data-mode router (see src/router.jsx). Routing was added in
// Phase 3.5 (D-022); the app is now multi-page with a shared layout shell.
export default function App() {
  return <RouterProvider router={router} />;
}
