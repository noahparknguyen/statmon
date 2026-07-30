import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Compare from "./pages/Compare";
import Credits from "./pages/Credits";
import StyleGuide from "./pages/StyleGuide";
import NotFound from "./pages/NotFound";

// Data-mode router (D-022). Client-side for now; SSR/Cloudflare + framework
// mode land in Phase 4, and this config maps cleanly onto it.
//
// Both compare routes render the same <Compare/>; selection is derived from the
// URL each render (URL is the single source of truth), so the shared instance
// needs no special handling. The literal "vs" segment keeps the deep link
// readable: /compare/<p1>/vs/<p2>.
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "compare", element: <Compare /> },
      { path: "compare/:p1/vs/:p2", element: <Compare /> },
      { path: "credits", element: <Credits /> },
      { path: "style", element: <StyleGuide /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
