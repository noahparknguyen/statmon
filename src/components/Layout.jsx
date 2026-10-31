import { useEffect, useRef } from "react";
import {
  Link,
  NavLink,
  Outlet,
  ScrollRestoration,
  useLocation,
  useMatches,
} from "react-router";
import {
  LuExternalLink,
  LuGamepad2,
  LuGithub,
  LuGrid3X3,
  LuRows3,
  LuSwords,
} from "react-icons/lu";
import { toolOf } from "../lib/toolKey";
import { hasChosenGame } from "../lib/games";
import { ALL_POKEMON } from "../lib/pokemon";
import { CURRENT_GEN } from "../lib/eras";

// The shell around every page: a sticky header with the wordmark, the page
// itself in <main>, and a footer with the credits. The four tools are a nav in
// the header from `md` up, and a tab bar along the bottom of a phone, where a
// thumb can reach them from anywhere on a long page. The wordmark links home,
// and both navs mark the current page.
const REPO_URL = "https://github.com/noahparknguyen/statmon";
const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;
const NOTICE_URL = `${REPO_URL}/blob/main/licenses/NOTICE.md`;
const DEX_SIZE = ALL_POKEMON.length;

// Matches index.html's <title>, which routes.test.jsx checks. Routes declare a
// page name in `handle.title` and get "<name> — Statmon". The home page
// declares none and keeps this.
const SITE_TITLE = "Statmon — Pokémon comparison, dex, type chart, and games";

// `h-14` is the header's own height, so each link fills the bar vertically.
// As bare 14px text, the clickable box would be about 17px tall. Filled, every
// nav item clears WCAG 2.5.8's 24px minimum with nothing visible changing,
// since only the text colour changes on hover.
function navClass({ isActive }) {
  return [
    "inline-flex h-14 items-center text-button transition-colors hover:text-primary active:text-primary",
    isActive ? "text-primary" : "text-secondary",
  ].join(" ");
}

// A phone's tab: an icon over its label, filling a quarter of the 56px bar, so
// the whole quarter is the target. The current tool takes the accent, which is
// for selection, and the others stay `secondary` like the header's nav.
//
// The icon is 20px rather than the 1em of its label, because it sits above the
// label rather than beside it, and is the part of a tab the eye finds first.
function tabClass({ isActive }) {
  return [
    "flex h-14 flex-col items-center justify-center gap-1 text-button transition-colors",
    isActive ? "text-accent" : "text-secondary active:text-primary",
  ].join(" ");
}

// Each page's document title. The deepest matching route wins, so a child
// route can override its parent.
function useDocumentTitle() {
  const matches = useMatches();
  const title = matches.findLast((m) => m.handle?.title)?.handle.title;
  useEffect(() => {
    document.title = title ? `${title} — Statmon` : SITE_TITLE;
  }, [title]);
}

// A route that should stay out of search results says so with
// `handle.noindex`, read the same way as `title`. It's the 404: the site is
// static files with no server code, so an unknown URL is answered 200 with the
// not-found page. Without the tag, a crawler following a bad link could index
// "This page fainted." as a real page. Google renders the app before indexing
// it, so a tag added here is one it reads.
function useNoIndex() {
  const noindex = useMatches().some((m) => m.handle?.noindex);
  useEffect(() => {
    if (!noindex) return;
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [noindex]);
}

// Moves focus to <main> after navigating to another page, so keyboard and
// screen reader users are told the page changed. It skips the first render,
// when nothing has navigated yet, and uses preventScroll so it can't fight the
// position ScrollRestoration restores on Back.
//
// Keyed on the tool rather than the path, because the path changes with every
// selection. Firing on every path change would pull focus out of the chip you'd
// just clicked, so a keyboard user picking a form or pressing Swap would lose
// their place. And a change of state isn't a change of page.
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

// The four tools, once, for the header's nav, the phone's tab bar, and the
// footer, so the three can't list different tools.
const TOOLS = [
  { label: "Compare", to: "/compare", icon: LuSwords },
  { label: "Dex", to: "/dex", icon: LuRows3 },
  { label: "Types", to: "/types", icon: LuGrid3X3 },
  { label: "Games", to: "/games", icon: LuGamepad2 },
];

// The footer's link groups, as data rather than markup, so the columns are one
// component and can't drift into different shapes.
//
// Tools repeats the header's nav, for someone who has scrolled to the bottom
// of the dex table, which runs to about 50,000px. A phone hides it, since its
// tab bar is on screen at every depth, and its About link moves to the header.
const TOOL_LINKS = [
  ...TOOLS.map(({ label, to }) => ({ label, to })),
  { label: "About", to: "/about" },
];

// The credits, in their two kinds: the data the site was built from, and the
// type and icons it draws with. They come from different places, and a reader
// looking for one isn't looking for the other.
//
// Two of them are licence requirements, not courtesies. Font Awesome Free is
// CC BY 4.0, which requires attribution: it supplies the carets on the
// comparison board and the dex, and nothing else. The two fonts are SIL OFL
// 1.1, which requires the licence text to travel with the files, so the texts
// are in `licenses/`, and `vendor:fonts` fetches them with the fonts.
//
// Lucide (ISC) draws almost every other icon and needs no notice on the site.
// It's in `licenses/NOTICE.md` rather than here, because a credits list that
// includes everything is one nobody reads.
const DATA_LINKS = [
  { label: "PokéAPI", href: "https://pokeapi.co/" },
  { label: "PokéAPI/sprites", href: "https://github.com/PokeAPI/sprites" },
];

const CRAFT_LINKS = [
  { label: "Inter", href: "https://github.com/rsms/inter" },
  {
    label: "Space Grotesk",
    href: "https://github.com/floriankarsten/space-grotesk",
  },
  { label: "Font Awesome", href: "https://fontawesome.com/" },
  { label: "Source on GitHub", href: REPO_URL, icon: LuGithub },
];

// `py-1` is for target size. With 4px of padding, each 14px link is a box of
// about 28px, which passes WCAG 2.5.8 outright rather than through its spacing
// exception. `npm run sweep:widths` measures it either way.
const FOOTER_LINK =
  "inline-flex items-center gap-1.5 py-1 text-body-sm text-tertiary transition-colors hover:text-secondary active:text-secondary";

function FooterGroup({ title, links, className = "" }) {
  return (
    <div className={className}>
      <h3 className="text-overline text-tertiary">{title}</h3>
      <ul className="mt-2 flex flex-col items-start">
        {links.map(({ label, to, href, icon: Icon }) => (
          <li key={label}>
            {to ? (
              <Link to={to} className={FOOTER_LINK}>
                {label}
              </Link>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className={FOOTER_LINK}
              >
                {Icon ? <Icon aria-hidden /> : null}
                {label}
                {/* External, and said as well as shown: the icon is
                    decorative, and a link that leaves the site should tell a
                    screen reader too. The icon takes the link's colour, as
                    every icon does. */}
                <LuExternalLink aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Layout() {
  const mainRef = useRef(null);
  useDocumentTitle();
  useNoIndex();
  useFocusOnNavigate(mainRef);

  // The two game boards ask for no footer. They're sized to fill the screen
  // exactly, so a footer beneath one would make every game scroll by the
  // footer's height. Read from the route's `handle`, like `title`, rather than
  // from a list of paths here that would need keeping in step.
  //
  // The cost: on those two routes, the credits are one click away instead of
  // on screen. They stay on every other page, including the `/games` index you
  // arrive through.
  const bare = useMatches().some((m) => m.handle?.bare);
  // A bare route is a game, but not always a board: `/games/higher` with no
  // query is the start screen, an ordinary page on the same route, with
  // nothing to be pushed by a footer. So the board is detected with
  // `hasChosenGame`, the same check the game pages use to decide what to
  // render.
  //
  // `useLocation()` is called unconditionally and narrowed afterwards. Written
  // as `bare && hasChosenGame(useLocation().search)`, the hook would be skipped
  // on non-game routes, changing React's hook order between pages.
  const { search } = useLocation();
  const playing = bare && hasChosenGame(search);

  return (
    // A game board is sized to the screen exactly: the height is pinned, and
    // the board takes the space left with `flex-1`. That leaves no arithmetic
    // to get wrong, such as forgetting a border's pixel, which would make every
    // game scroll slightly.
    //
    // `svh` rather than `vh`, as Home's wall uses: on a phone, a collapsing
    // toolbar makes `vh` taller than what you can see.
    //
    // Every other page is as tall as its content, and at least as tall as
    // `<main>`'s minimum below.
    <div
      className={`flex flex-col bg-base text-primary ${playing ? "h-svh" : ""}`}
    >
      {/* React Router doesn't reset the scroll on navigation by itself, so
          without this a link out of a long page would land part-way down the
          next one.

          Every control on the site changes the URL, since the URL is the only
          source of truth, so picking a Pokémon or a generation is a
          navigation too. Those in-tool navigations are `replace`s that also
          pass `preventScrollReset`, so the board you're reading stays put.
          Everything else (a nav link, the wordmark, a link out of a game) is
          an ordinary navigation and lands at the top, as a browser does for a
          fresh page. Back and Forward still restore the old position.

          `toolOf` is still used by the focus move above: a change of state
          isn't a change of page, whatever the path does. */}
      <ScrollRestoration />
      {/* When it appears, it looks like a secondary Button: the same 36px
          pill, border, and label. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-(--z-toast) focus:inline-flex focus:h-9 focus:items-center focus:rounded-full focus:border focus:border-border-subtle focus:bg-elevated focus:px-4 focus:text-button focus:text-primary"
      >
        Skip to content
      </a>
      {/* Over a game board on a phone, the header steps aside, and the game
          bar takes the top of the screen: the board is the screen there, and
          a bar holding only the wordmark would take 56px of it. The game bar's
          own back control leads out. */}
      <header
        className={`sticky top-0 border-b border-border-subtle bg-base/85 backdrop-blur ${
          playing ? "hidden md:block" : ""
        }`}
        style={{ zIndex: "var(--z-sticky)" }}
      >
        <div className="max-w-content mx-auto flex items-center justify-between gap-4 px-4 h-14">
          {/* The wordmark brightens on hover, like the game bar's name. The nav
              links beside it already respond to the pointer, and a control
              that doesn't look like one is worse than one that does. */}
          <Link
            to="/"
            className="flex items-center gap-2 text-h3 text-primary transition-colors hover:text-accent active:text-accent"
          >
            <img
              src="/favicon.svg"
              alt=""
              width="24"
              height="24"
              className="shrink-0"
            />
            <span>
              Statmon<span className="text-accent">.</span>
            </span>
          </Link>
          {/* On a phone the tools are in the tab bar, which leaves the
              header's far end for About. That's the one page the tab bar
              doesn't hold, and a corner suits it: it's the page tapped least. */}
          <NavLink
            to="/about"
            className={(state) => `${navClass(state)} md:hidden`}
          >
            About
          </NavLink>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-5 md:flex"
          >
            {TOOLS.map(({ label, to }) => (
              <NavLink key={to} to={to} className={navClass}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* These make <main> a focus target for code only: it isn't an
          interactive control, so the moved focus is the announcement in
          itself, and a focus ring around the whole page would look like a
          glitch. */}
      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        // While a board is up, `min-h-0` is what lets it shrink to the space
        // left: a flex child won't go below its content's height without it.
        // Only then: the start screen shares the route but is an ordinary
        // page, and a flex-column `main` would shrink it to its content.
        //
        // Otherwise <main> is at least one screen tall, so the footer is never
        // on screen when a page loads. The footer is 368px on a desktop, so on
        // a short page like `/games` or the 404 it would otherwise be one of
        // the biggest things in view. A full screen, rather than a screen
        // less the header, so the footer starts just below the fold rather
        // than on it.
        className={`focus:outline-none ${
          playing ? "flex min-h-0 flex-1 flex-col" : "min-h-svh"
        }`}
      >
        <Outlet />
      </main>

      {/* The bottom safe-area inset is the footer's alone: it's the only thing
          that ends up under a phone's home indicator, and on the body it would
          add dead space to every page on phones that have one.

          No top margin: the space before the footer is the page's own bottom
          padding, and nothing else. */}
      {!playing && (
        <footer
          className="border-t border-border-subtle"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <h2 className="sr-only">Site information</h2>
          <div className="max-w-content mx-auto px-4 py-8 md:py-10">
            {/* The brand on the left and the link groups on the right, rather
                than three even columns. Even columns would leave most of each
                column empty, since the links are short, so the footer would
                look lopsided. Pinning the groups to the right edge gives the
                block a clean left and right edge, the shape most footers
                settle on.

                Side by side only from `lg`. Below it, the link columns don't
                fit beside the brand, so the brand sits over them. On a phone
                there are two, which fit side by side down to 360px, and the
                gaps tighten so the footer isn't most of a screen. */}
            <div className="flex flex-col gap-8 md:gap-10 lg:flex-row lg:justify-between lg:gap-8">
              <div className="max-w-sm">
                <p className="text-h3 text-primary">
                  Statmon<span className="text-accent">.</span>
                </p>
                {/* Both numbers come from the dataset, never typed. A footer
                    that states a count can be wrong about it, and the dataset
                    is already loaded because Home is, so this costs nothing and
                    can't go stale after a `build:data`. */}
                <p className="mt-4 text-caption text-tertiary">
                  {DEX_SIZE.toLocaleString()} entries, current through
                  Generation {CURRENT_GEN}.
                </p>
                <p className="mt-1 text-caption text-tertiary">
                  No cookies and no analytics. Your game record is saved in your
                  own browser and nowhere else.
                </p>
              </div>

              {/* Three groups on a fixed gap, so they read as a set rather
                  than as three things that happened to land apart. */}
              <div className="flex flex-wrap gap-x-8 gap-y-8 md:gap-x-12 lg:gap-x-20">
                <FooterGroup
                  title="Tools"
                  links={TOOL_LINKS}
                  className="hidden md:block"
                />
                <FooterGroup title="Data" links={DATA_LINKS} />
                <FooterGroup title="Fonts & icons" links={CRAFT_LINKS} />
              </div>
            </div>

            {/* Mirrors the block above, with one thing on each edge, so the
                footer reads as one arrangement rather than two stacked. */}
            <div className="mt-8 flex flex-col gap-3 border-t border-border-subtle pt-6 sm:flex-row sm:justify-between sm:gap-8 md:mt-10">
              <p className="max-w-xl text-caption text-tertiary">
                Data and images from PokéAPI; sprites are CC0. Fonts are SIL
                OFL, and the carets on the comparison board and the dex are Font
                Awesome Free (CC BY 4.0). Full notices are in the{" "}
                <a
                  href={NOTICE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-border-strong underline-offset-2 transition-colors hover:text-secondary active:text-secondary"
                >
                  repository
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                . Pokémon is © Nintendo, Game Freak, and The Pokémon Company.
                Statmon is an unofficial fan project.
              </p>
              <p className="shrink-0 text-caption text-tertiary sm:text-right">
                Built by Noah Park-Nguyen · Code{" "}
                <a
                  href={LICENSE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-border-strong underline-offset-2 transition-colors hover:text-secondary active:text-secondary"
                >
                  MIT
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </p>
            </div>
          </div>
        </footer>
      )}

      {/* The phone's tab bar: fixed to the bottom edge, clear of the home
          indicator, and gone from `md`, where the header's nav takes over.
          Not over a game board, where the board is the whole screen.

          The empty block before it is the bar's footprint in the page, so
          the end of the footer scrolls up clear of the bar instead of ending
          underneath it. The footer already keeps the home indicator's inset,
          so the footprint is only the bar's own 56px. */}
      {!playing && (
        <>
          <div aria-hidden className="h-14 md:hidden" />
          <nav
            aria-label="Primary"
            className="fixed inset-x-0 bottom-0 border-t border-border-subtle bg-base/85 backdrop-blur md:hidden"
            style={{
              zIndex: "var(--z-sticky)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <div className="grid grid-cols-4">
              {TOOLS.map(({ label, to, icon: Icon }) => (
                <NavLink key={to} to={to} className={tabClass}>
                  <Icon aria-hidden size="1.25rem" className="shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
