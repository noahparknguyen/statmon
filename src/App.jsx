import { RouterProvider } from "react-router";
import { router } from "./router";

// Root: mounts the data-mode router (see src/router.jsx). Routing was added in
// Phase 3.5 (D-022); the app is now multi-page with a shared layout shell.
export default function App() {
  return <RouterProvider router={router} />;
}
