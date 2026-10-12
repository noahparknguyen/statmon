import { RouterProvider } from "react-router";
import { createRouter } from "./router";

// Built once at module scope, not per render: a router carries history and
// navigation state, so rebuilding it on every render would reset both.
const router = createRouter();

// The root: mounts the data-mode router (see src/router.jsx), which gives every
// page a shared layout shell.
export default function App() {
  return <RouterProvider router={router} />;
}
