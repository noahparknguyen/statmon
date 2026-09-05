import { useEffect, useRef } from "react";
import {
  Link,
  NavLink,
  Outlet,
  ScrollRestoration,
  useLocation,
  useMatches,
} from "react-router";
import { LuGithub } from "react-icons/lu";

// Shared shell across all routes (D-022): a sticky brand/nav header, the routed
// page in the <main> landmark, and a muted footer with attribution. Token-driven
// and keyboard-navigable; the wordmark links home, nav marks the active route.
const REPO_URL = "https://github.com/noahparknguyen/statmon";

// Matches index.html's <title>. Routes declare a page name in `handle.title`
// and get "<name> — Statmon"; the index route declares none and keeps this.
const SITE_TITLE = "Statmon — Pokémon stat tools";

// `h-14` is the header's own height, and it is a target-size fix rather than a
// layout one: these were bare 14px text with no padding, so the clickable box
// was about 17px tall inside a 56px bar. 04_design §9's D-042 correction already
// noted "nav links are 14px" and left it at that. Filling the bar vertically
// puts every nav item far past WCAG 2.5.8's 24px floor and costs nothing
// visually — only text colour changes on hover, so there is no box to see.
function navClass({ isActive }) {
  return [
    "inline-flex h-14 items-center text-button transition-colors hover:text-primary",
    isActive ? "text-primary" : "text-secondary",
  ].join(" ");
}

// Per-route document title. Framework/SSR mode (D-005) would express this as a
// route `meta` export; `handle` is the data-mode equivalent and migrates onto it
// without restructuring. Deepest match wins, so a child route can override.
function useDocumentTitle() {
  const matches = useMatches();
  const title = matches.findLast((m) => m.handle?.title)?.handle.title;
  useEffect(() => {
    document.title = title ? `${title} — Statmon` : SITE_TITLE;
  }, [title]);
}

// Moves focus to <main> after a client-side navigation so keyboard and screen
// reader users are told the page changed — the other half of the D-024 item that
// <ScrollRestoration> closes. Skips the initial render (nothing navigated yet)
// and uses preventScroll so it cannot fight ScrollRestoration's restored
// position on a Back navigation.
function useFocusOnNavigate(ref) {
  const { pathname } = useLocation();
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    ref.current?.focus({ preventScroll: true });
  }, [pathname, ref]);
}

export default function Layout() {
  const mainRef = useRef(null);
  useDocumentTitle();
  useFocusOnNavigate(mainRef);

  return (
    <div className="min-h-screen flex flex-col bg-base text-primary">
      {/* Data mode does not reset scroll on navigation on its own; without this
          a deep link out of a long page lands part-way down the next one. */}
      <ScrollRestoration />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-1300 focus:rounded-md focus:border focus:border-border-strong focus:bg-elevated focus:px-3 focus:py-2 focus:text-button focus:text-primary"
      >
        Skip to content
      </a>
      <header
        className="sticky top-0 border-b border-border-subtle bg-base/85 backdrop-blur"
        style={{ zIndex: "var(--z-sticky)" }}
      >
        {/* Gaps tighten on a phone: a fourth tool (D-051) put the nav 1px over
            a 390px viewport, which scrolled every page on the site sideways.
            The labels all stay visible — it is the space between them that
            gives. */}
        <div className="max-w-content mx-auto flex items-center justify-between gap-2 px-4 h-14 sm:gap-4">
          <Link to="/" className="flex items-center gap-2 text-h3 text-primary">
            <img
              src="/favicon.svg"
              alt=""
              width="24"
              height="24"
              className="shrink-0"
            />
            {/* Below 360px the flame mark carries the brand alone — the four
                nav items and the wordmark cannot both fit, and a header that
                overflows scrolls the whole page sideways (D-054). The mark is
                still the link home, and still the logo (D-026). */}
            <span className="hidden xs:inline">
              Statmon<span className="text-accent">.</span>
            </span>
          </Link>
          <nav
            aria-label="Primary"
            className="flex items-center gap-3 sm:gap-5"
          >
            <NavLink to="/compare" className={navClass}>
              Compare
            </NavLink>
            <NavLink to="/dex" className={navClass}>
              Dex
            </NavLink>
            <NavLink to="/types" className={navClass}>
              Types
            </NavLink>
            <NavLink to="/credits" className={navClass}>
              Credits
            </NavLink>
          </nav>
        </div>
      </header>

      {/* These make <main> a programmatic focus target only: it is not an
          interactive control, so the moved focus is itself the announcement, and
          a focus indicator around the whole page would read as an artifact. */}
      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="flex-1 focus:outline-none"
      >
        <Outlet />
      </main>

      {/* The bottom inset is the footer's alone: it is the only thing that ends
          up under a home indicator, and putting it on the body would add dead
          space to every page on devices that have one. */}
      <footer
        className="border-t border-border-subtle"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-content mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-5">
          <p className="text-caption text-tertiary">
            Data from PokéAPI. Statmon is an unofficial fan project, not
            affiliated with Nintendo, Game Freak, or The Pokémon Company.
          </p>
          {/* Byline + repo read as one authorship group, so they sit together
              on the right rather than leaving the link stranded mid-row. */}
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-caption text-tertiary">
              Built by Noah Park-Nguyen
            </span>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-caption text-tertiary transition-colors hover:text-secondary"
            >
              <LuGithub aria-hidden />
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
