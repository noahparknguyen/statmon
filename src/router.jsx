import { createBrowserRouter, redirect } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import HydrateFallback from "./components/HydrateFallback";

// Every route except Home is code-split. The whole site used to ship as one
// 482 kB bundle, which meant a visitor who only ever opened the comparison tool
// still downloaded the dex table, the 18×18 type grid and — the clearest waste
// — the 400-line `/style` playground, a page that exists for the person
// building the site rather than the person using it.
//
// Home stays eager on purpose. It is the entry point for most visits, and
// making it lazy only moves its download behind an extra round trip after the
// main chunk lands. It also anchors the shared chunk: Home previews both other
// tools with their own components (D-043), so `DexRow`, `MatchupSummary` and
// the dataset are shared code either way rather than duplicated per route.
//
// `lazy` is the router's own mechanism, not React.lazy + Suspense: in data mode
// the router awaits the module as part of the navigation, so there is no
// fallback state to design and no flash of an empty shell between pages.
const lazyPage = (load) => () => load().then((m) => ({ Component: m.default }));

// Data-mode router (D-022). Client-side only — the app shipped as a static-assets
// SPA on Cloudflare Workers (D-030), with `not_found_handling: single-page-application`
// serving index.html for deep links. Framework/SSR mode remains the optional
// end-state (D-005) and these routes map onto it without restructuring.
//
// Both compare routes render the same <Compare/>; selection is derived from the
// URL each render (URL is the single source of truth), so the shared instance
// needs no special handling. The literal "vs" segment keeps the deep link
// readable: /compare/<p1>/vs/<p2>.
//
// `handle.title` is the page name; Layout turns it into "<name> — Statmon". The
// index route declares none so Home keeps index.html's site title. This is the
// data-mode stand-in for framework mode's route `meta` export.
// The route table is exported separately from the router it feeds, so tests can
// read it without a browser history — `createBrowserRouter` needs one, which is
// why routes.test.jsx builds its own element-based table for the render smoke
// tests. That copy cannot exercise `lazy`, so the real table is what the
// lazy-resolution test walks.
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
      // rather than a query param (D-051).
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
      // The games index and one route per game (D-091). Two routes rather than
      // `/games` rendering the default game: the index is what "Games" in the
      // nav should land on, and it is where the rest of the backlog's games go
      // as they ship.
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
        // much (D-109). Layout reads this the same way it reads `title`.
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
      // Credits are the footer's now (D-119), so there is no section to anchor
      // to and this points at /about — the nearest page about the project,
      // with the attribution directly beneath it like everywhere else. The path stays because it has been in
      // the footer since launch and in the nav before that (D-094): a bookmark
      // should not hit the 404 for something that still exists and has only
      // moved. A loader redirect rather than a component, so the address bar is
      // corrected before anything renders.
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
        // Kept out of search results by Layout (D-146): an unknown URL is
        // answered 200 with this page, since there is no Worker (D-030).
        handle: { title: "Page not found", noindex: true },
      },
    ],
  },
];

// A factory rather than a module-level `router`, so importing this file does
// not construct a browser history. That construction is what made the route
// table untestable: `createBrowserRouter` touches `document` at import time, so
// any test that wanted to read the routes crashed in the node environment.
// App.jsx calls this once at its own module scope.
export const createRouter = () => createBrowserRouter(routes);
