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
import { toolOf } from "../lib/toolKey";

// Shared shell across all routes (D-022): a sticky brand/nav header, the routed
// page in the <main> landmark, and a muted footer with attribution. Token-driven
// and keyboard-navigable; the wordmark links home, nav marks the active route.
const REPO_URL = "https://github.com/noahparknguyen/statmon";

// Matches index.html's <title>. Routes declare a page name in `handle.title`
// and get "<name> — Statmon"; the index route declares none and keeps this.
//
// It did NOT match, for as long as this comment has claimed it did: the tag
// said "Pokémon comparison, dex and type chart" while this said "Pokémon stat
// tools", so a crawler and a visitor who clicked Home read two different names
// for the same page. Nothing checked it, because no check reads prose (D-086) —
// routes.test.jsx now reads both files and asserts they agree. (D-091)
const SITE_TITLE = "Statmon — Pokémon comparison, dex, type chart and games";

// `h-14` is the header's own height, and it is a target-size fix rather than a
// layout one: these were bare 14px text with no padding, so the clickable box
// was about 17px tall inside a 56px bar. 04_design §9's D-042 correction already
// noted "nav links are 14px" and left it at that. Filling the bar vertically
// puts every nav item far past WCAG 2.5.8's 24px floor and costs nothing
// visually — only text colour changes on hover, so there is no box to see.
// (D-065)
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
//
// Keyed on the tool rather than the pathname, because the pathname changes on
// every selection: firing per-pathname yanked focus out of the very chip you
// had just clicked, so a keyboard user picking a form or hitting Swap lost their
// place and had to tab back in. Announcing a page change on a state change is
// also simply wrong — nothing changed page. (D-087)
function useFocusOnNavigate(ref) {
  const tool = toolOf(useLocation().pathname);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    ref.current?.focus({ preventScroll: true });
  }, [tool, ref]);
}

export default function Layout() {
  const mainRef = useRef(null);
  useDocumentTitle();
  useFocusOnNavigate(mainRef);

  // The two game boards ask for no footer (D-109). They are sized to fill the
  // viewport exactly — `calc(100svh - 7rem)` — so a footer beneath one makes
  // the page scroll by the footer's height on every game, every round.
  //
  // Read from the route's `handle`, the same channel `title` uses, rather than
  // from the pathname: a route already declares what it is, and a second list
  // of paths here would be a second thing to keep in step.
  //
  // **The cost is stated rather than absorbed:** Credits lives in this footer
  // since D-094, so on those two routes it is one navigation away instead of on
  // screen. The attribution and the unofficial-fan-project line stay on every
  // other route, including the `/games` index you arrive through.
  const bare = useMatches().some((m) => m.handle?.bare);

  return (
    <div className="min-h-screen flex flex-col bg-base text-primary">
      {/* Data mode does not reset scroll on navigation on its own; without this
          a deep link out of a long page lands part-way down the next one.

          **Keyed by tool, not by `location.key`** (D-087). The default keys each
          history entry separately, and every control on this site navigates —
          the URL is the single source of truth (D-022), so picking a Pokémon,
          swapping, choosing a generation or toggling a type is a `navigate()`.
          Each one minted a fresh key with no saved position, and the fallback
          for that is scrolling to the top: the board you were reading jumped
          away under you on every single click. Measured before the fix — Swap
          and a form chip both went from 327px to 0.

          Sharing one key across a tool's URLs means an in-tool change restores
          the position it just saved, which is a no-op, while moving between
          tools still has no entry to restore and still lands at the top. Coming
          BACK to a tool returns you to where you were, which is what the browser
          would have done anyway. */}
      <ScrollRestoration getKey={(location) => toolOf(location.pathname)} />
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
          {/* gap-2 below sm, not gap-3. The header needs 385px to show the
              wordmark beside four nav items, which put the `xs` boundary above
              390 — the most common phone width there is — and hiding the
              wordmark on an iPhone 14 to satisfy a boundary is the tail wagging
              the dog. Taking 4px off each of the three nav gaps brings the
              requirement to 373 and lets `xs` sit at 384 with room to spare.
              This is the same lever D-054 pulled the first time: the labels all
              stay visible, the space between them gives. (D-062) */}
          <nav
            aria-label="Primary"
            className="flex items-center gap-2 sm:gap-5"
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
            {/* Games takes the slot Credits held (D-094). The header's width
                budget is four items: D-062 measured it needing 373px for the
                wordmark plus four, which is what let `xs` sit at 384 and keep
                the wordmark on a 390px phone. A fifth label pushes that past
                430 and hides the wordmark on every phone there is — so the
                fourth slot goes to the tool people came for, and Credits moves
                to the footer, next to the attribution it is about. */}
            <NavLink to="/games" className={navClass}>
              Games
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
      {!bare && (
        <footer
          className="border-t border-border-subtle"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="max-w-content mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-5">
            <p className="text-caption text-tertiary">
              Data from PokéAPI. Statmon is an unofficial fan project, not
              affiliated with Nintendo, Game Freak, or The Pokémon Company.
            </p>
            {/* Byline + credits + repo read as one authorship group, so they sit
              together on the right rather than leaving the links stranded
              mid-row.

              Credits landed here when Games took its nav slot (D-094), and it
              is the better home for it: the line to its left is the attribution
              summary and this is the page that expands it, so the link now sits
              beside its own subject instead of beside the tools. */}
            {/* Wraps, and `gap-y-3` is a target-size number rather than a taste
              one: these are 12px links, so they clear WCAG 2.5.8 only by its
              spacing exception, which needs 24px between neighbouring centres.
              A wrapped `gap-y-1` puts two of them ~19px apart and fails; 12px
              of row gap lands at ~27px. `npm run sweep:widths` measures it. */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
              <span className="text-caption text-tertiary">
                Built by Noah Park-Nguyen
              </span>
              <Link
                to="/credits"
                className="text-caption text-tertiary transition-colors hover:text-secondary"
              >
                Credits
              </Link>
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
      )}
    </div>
  );
}
