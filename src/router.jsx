import { createBrowserRouter, redirect } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import HydrateFallback from "./components/HydrateFallback";

// Every route except Home is code-split, so a visitor who only opens the
// comparison tool doesn't download the dex table, the 18×18 type grid, or the
// `/style` playground, a page for the person building the site rather than the
// person using it.
//
// Home stays eager on purpose. It's the entry point for most visits, and making
// it lazy would only move its download behind an extra round trip after the
// main chunk lands. It also anchors the shared chunk: Home previews the tools
// with their own components, so `DexRow`, `MatchupSummary`, and the dataset
// are shared code either way, rather than duplicated per route.
//
// `lazy` is the router's own mechanism, not React.lazy and Suspense: in data
// mode the router awaits the module as part of the navigation, so there's no
// fallback state to design, and no flash of an empty shell between pages.
const lazyPage = (load) => () => load().then((m) => ({ Component: m.default }));

// A data-mode router, client-side only: the app is a static-assets
// single-page app on Cloudflare Workers, with `not_found_handling:
// single-page-application` serving index.html for deep links. These routes
// would map onto React Router's framework mode without restructuring, if the
// site ever server-renders.
//
// Both compare routes render the same <Compare/>. Selection is derived from
// the URL on each render (the URL is the single source of truth), so the
// shared instance needs no special handling. The literal "vs" segment keeps
// the deep link readable: /compare/<p1>/vs/<p2>.
//
// `handle.title` is the page name, which Layout turns into "<name> — Statmon".
// The index route declares none, so Home keeps index.html's site title. This
// is the data-mode stand-in for framework mode's route `meta` export.
//
// The route table is exported separately from the router it feeds, so tests
// can read it without a browser history. routes.test.jsx renders pages from
// its own copy with plain elements, since a one-pass render to a string shows
// only the loading fallback for a lazy route, so its lazy-resolution test is
// what walks this real table.
export const routes = [
  {
    element: <Layout />,
    HydrateFallback,
    children: [
      { index: true, element: <Home /> },
      {
        path: "compare",
        lazy: lazyPage(() => import("./pages/Compare")),
        handle: { title: "Compare" },
      },
      {
        path: "compare/:p1/vs/:p2",
        lazy: lazyPage(() => import("./pages/Compare")),
        handle: { title: "Compare" },
      },
      {
        path: "dex",
        lazy: lazyPage(() => import("./pages/Dex")),
        handle: { title: "Dex" },
      },
      // Three routes for one page, the same shape as the compare deep link: the
      // defending typing is what the page is about, so it lives in the path
      // rather than a query parameter.
      {
        path: "types",
        lazy: lazyPage(() => import("./pages/TypeChart")),
        handle: { title: "Types" },
      },
      {
        path: "types/:t1",
        lazy: lazyPage(() => import("./pages/TypeChart")),
        handle: { title: "Types" },
      },
      {
        path: "types/:t1/:t2",
        lazy: lazyPage(() => import("./pages/TypeChart")),
        handle: { title: "Types" },
      },
      // The games index and one route per game, rather than `/games` rendering
      // a default game: the index is what "Games" in the nav should land on,
      // and it's where any later game would go.
      {
        path: "games",
        lazy: lazyPage(() => import("./pages/Games")),
        handle: { title: "Games" },
      },
      {
        path: "games/higher",
        lazy: lazyPage(() => import("./pages/GameHigher")),
        // `bare` drops the footer: the board is sized to fill the viewport
        // exactly, so anything beneath it makes every game page scroll by that
        // much. Layout reads this the same way it reads `title`.
        handle: { title: "Higher", bare: true },
      },
      {
        path: "games/effective",
        lazy: lazyPage(() => import("./pages/GameEffective")),
        handle: { title: "Effective", bare: true },
      },
      {
        path: "about",
        lazy: lazyPage(() => import("./pages/About")),
        handle: { title: "About" },
      },
      // The credits live in the footer, so there's no section to anchor to,
      // and this points at /about, the nearest page about the project, with
      // the attribution beneath it like everywhere else. The path stays
      // because old links and bookmarks point at it, and they shouldn't hit
      // the 404 for something that still exists and has only moved. A loader
      // redirect rather than a component, so the address bar is corrected
      // before anything renders.
      {
        path: "credits",
        loader: () => redirect("/about"),
      },
      {
        path: "style",
        lazy: lazyPage(() => import("./pages/StyleGuide")),
        handle: { title: "Style guide" },
      },
      {
        path: "*",
        lazy: lazyPage(() => import("./pages/NotFound")),
        // Kept out of search results by Layout: an unknown URL is answered 200
        // with this page, since the site has no server code to send a 404.
        handle: { title: "Page not found", noindex: true },
      },
    ],
  },
];

// A factory rather than a module-level `router`, so importing this file doesn't
// construct a browser history: `createBrowserRouter` touches `document`, so any
// test that read the routes would crash in the node environment. App.jsx calls
// this once at its own module scope.
export const createRouter = () => createBrowserRouter(routes);
