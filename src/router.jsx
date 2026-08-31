import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Compare from "./pages/Compare";
import Credits from "./pages/Credits";
import StyleGuide from "./pages/StyleGuide";
import NotFound from "./pages/NotFound";

// Data-mode router (D-022). Client-side only — the app shipped as a static-assets
// SPA on Cloudflare Workers (D-030), with `not_found_handling: single-page-application`
// serving index.html for deep links. Framework/SSR mode remains the optional
// end-state (D-005) and these routes map onto it without restructuring.
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
