import { useEffect, useRef } from "react";
import {
  Link,
  NavLink,
  Outlet,
  ScrollRestoration,
  useLocation,
  useMatches,
} from "react-router";
import { LuExternalLink, LuGithub } from "react-icons/lu";
import { toolOf } from "../lib/toolKey";
import { hasChosenGame } from "../lib/games";
import { ALL_POKEMON } from "../lib/pokemon";
import { CURRENT_GEN } from "../lib/eras";

// Shared shell across all routes (D-022): a sticky brand/nav header, the routed
// page in the <main> landmark, and a muted footer with attribution. Token-driven
// and keyboard-navigable; the wordmark links home, nav marks the active route.
const REPO_URL = "https://github.com/noahparknguyen/statmon";
const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;
const NOTICE_URL = `${REPO_URL}/blob/main/licenses/NOTICE.md`;
const DEX_SIZE = ALL_POKEMON.length;

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

// The footer's two link groups (D-119). Data rather than markup, so the two
// columns are the same component and cannot drift into two shapes.
//
// **Tools mirrors the nav on purpose.** A footer that repeats the primary nav
// is not redundancy here — the two game boards drop the footer entirely and the
// nav is sticky, so this is the copy that exists for someone who has scrolled
// to the bottom of a 50,000px dex table.
const TOOL_LINKS = [
  { label: "Compare", to: "/compare" },
  { label: "Dex", to: "/dex" },
  { label: "Types", to: "/types" },
  { label: "Games", to: "/games" },
  { label: "About", to: "/about" },
];

// The credits, split into the two kinds of thing they actually are (D-122).
//
// One "Credits" column left a ~480px hole between the brand and the links,
// because two groups cannot span a 1120px footer however they are aligned. The
// gap wanted content rather than decoration, and there was content: **data**
// the site fetched and **type and icons** it draws with are different
// obligations from different places, and a reader looking for one is not
// looking for the other.
//
// **Two of these five are obligations rather than courtesies** (D-120). Font
// Awesome Free is **CC BY 4.0**, which requires attribution — it supplies the
// carets on the comparison board and the dex, and nothing else, and was
// credited nowhere. (D-120 said "the dex table's four sort carets"; the
// comparison's difference carets have been Font Awesome since D-015.) The
// two fonts are **SIL OFL 1.1**, which requires the licence text to travel with
// the redistributed files; ten `.woff2` shipped in this repo with no OFL in it
// at all. The texts live in `licenses/` and `vendor:fonts` now fetches them
// with the fonts.
//
// Lucide (ISC) draws almost every other icon on the site and needs no on-site
// notice; it is in `licenses/NOTICE.md` for completeness rather than here,
// because a credits list that includes everything is one nobody reads.
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

// `py-1` is a target-size number rather than a taste one. These used to be bare
// 12px links that cleared WCAG 2.5.8 only through its spacing exception, which
// needs 24px between neighbouring centres and left a 3px margin. At 14px with
// 4px of padding each row is a ~28px box and passes outright, which is the
// better way to pass. `npm run sweep:widths` measures it either way.
const FOOTER_LINK =
  "inline-flex items-center gap-1.5 py-1 text-body-sm text-tertiary transition-colors hover:text-secondary";

function FooterGroup({ title, links }) {
  return (
    <div>
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
                {/* External, and said rather than only shown: the icon is
                    decorative and a link that leaves the site should announce
                    that to a screen reader too. It takes the link's colour, as
                    every icon does (§11); it was painted with a border token. */}
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
  useFocusOnNavigate(mainRef);

  // The two game boards ask for no footer (D-109). They are sized to fill the
  // viewport exactly (D-110), so a footer beneath one makes the page scroll by
  // the footer's height on every game, every round.
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
  // A bare route is a game, but a game is not always a BOARD: `/games/higher`
  // with no query is the difficulty picker (D-108), which is an ordinary page
  // that happens to live on the same route. The footer came off both, which was
  // a slip rather than a decision — the picker is not sized to the viewport and
  // has nothing to be pushed by.
  //
  // Read through `hasChosenGame`, the same predicate the two game pages use to
  // decide what to render (D-116), rather than a second list of paths or a copy
  // of the rule. Before that the answer lived in page state and Layout could
  // not see it at all.
  // `useLocation()` is called unconditionally and the result narrowed after —
  // `bare && hasChosenGame(useLocation().search)` short-circuits, so on a
  // non-game route the hook would not run at all and React's hook order would
  // change between routes. ESLint's rules-of-hooks caught it.
  const { search } = useLocation();
  const playing = bare && hasChosenGame(search);

  return (
    // A bare route is sized to the viewport EXACTLY (D-110). `min-h-screen`
    // plus a board of `calc(100svh - 7rem)` came to 904px in a 900px window —
    // 2px of it the two sticky bars' bottom borders, which the arithmetic did
    // not know about — so every game scrolled by a few pixels. Pinning the
    // height and letting the board take the remaining space with `flex-1`
    // removes the arithmetic rather than correcting it, so a future border
    // cannot reintroduce the same drift.
    //
    // `svh` rather than `vh`, the unit Home's wall already uses: on a phone a
    // collapsing toolbar makes `vh` taller than what you can actually see.
    //
    // Every other route is as tall as its content, and at least as tall as
    // `<main>`'s floor below.
    <div
      className={`flex flex-col bg-base text-primary ${playing ? "h-svh" : ""}`}
    >
      {/* Data mode does not reset scroll on navigation on its own; without
          this a deep link out of a long page lands part-way down the next one.

          **Keyed per history entry, with the in-tool navigations opting out**
          (D-129). It used to be keyed by TOOL, which fixed a real bug the wrong
          way round: every control on this site navigates — the URL is the
          single source of truth (D-022), so picking a Pokémon, swapping,
          choosing a generation or toggling a type is a `navigate()` — and each
          one minted a fresh key with no saved position, whose fallback is
          scrolling to the top. The board you were reading jumped away on every
          click. Measured before that fix: Swap and a form chip both went from
          327px to 0.

          Sharing one key across a tool's URLs stopped the jumping, but it also
          made **returning** to a tool restore where you had been — and a nav
          click is not a return. Clicking "Dex" after reading 5,000px of it put
          you back at 5,000px, which no browser does for a fresh navigation and
          which reads as the page failing to load at the top.

          So the two cases are separated at the source instead. Every in-tool
          navigation is a `replace` and now also carries `preventScrollReset`,
          which is the mechanism for exactly this; everything else — a nav link,
          the wordmark, a link out of a game — is an ordinary navigation and
          lands at the top. Back and Forward still restore, because that is what
          `location.key` keying is for.

          `toolOf` is still used, by the focus announcement below: a state change
          is not a page change, whatever the pathname does. */}
      <ScrollRestoration />
      {/* When it surfaces it is a secondary Button in all but name: the same
          36px pill, border and label. It was a 10px-cornered box of its own,
          and its layer was a bare `z-1300` where every other layer reads the
          ladder's token (D-134). */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-(--z-toast) focus:inline-flex focus:h-9 focus:items-center focus:rounded-full focus:border focus:border-border-subtle focus:bg-elevated focus:px-4 focus:text-button focus:text-primary"
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
          {/* The hover is the game bar's (D-110). Both are a name in the
              `Word.` motif that navigates, and the nav links beside this one
              already answer the pointer — the wordmark was the only control in
              the header that gave nothing back. Consistency here means the
              quieter one moving, not the newer one going quiet: a control that
              does not look like one is the worse half of the pair. */}
          <Link
            to="/"
            className="flex items-center gap-2 text-h3 text-primary transition-colors hover:text-accent"
          >
            <img
              src="/favicon.svg"
              alt=""
              width="24"
              height="24"
              className="shrink-0"
            />
            {/* Below `xs` (384px) the flame mark carries the brand alone — the
                four nav items and the wordmark cannot both fit, and a header
                that overflows scrolls the whole page sideways (D-054, D-062).
                The mark is still the link home, and still the logo (D-026). */}
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
              stay visible, the space between them gives. (D-062) Measured
              again 2026-10-04: 361px, against D-062's arithmetic of 373. */}
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
        // `min-h-0` is what lets the board actually shrink to the space left:
        // a flex child will not go below its content's height without it.
        // Only while a board is up: the difficulty picker shares the route but
        // is an ordinary page in the ordinary page shell (D-137), and a flex
        // column `main` would shrink its wrapper to fit its content.
        //
        // **Otherwise it is at least one screen tall, so the footer is never
        // on screen when a page loads** (D-142). The shell used to pin a short
        // page's footer to the bottom of the window instead, and the footer is
        // 368px on a desktop: on `/games` it was taller than the game cards
        // and the largest thing in view, and the 404 showed all of it at
        // every desktop size. A page taller than the screen is unchanged.
        //
        // A full screen rather than a screen less the header, so the footer
        // starts 57px below the fold rather than on it. Subtracting the header
        // is the arithmetic D-110 took out of the boards, where a 1px border
        // it did not know about made every game scroll.
        className={`focus:outline-none ${
          playing ? "flex min-h-0 flex-1 flex-col" : "min-h-svh"
        }`}
      >
        <Outlet />
      </main>

      {/* The bottom inset is the footer's alone: it is the only thing that ends
          up under a home indicator, and putting it on the body would add dead
          space to every page on devices that have one.

          **No margin of its own** (D-139). The space before the footer is the
          page's bottom padding and nothing else, which is what D-083 said it
          was. This `mt-16` was adding 64px on top, so a tool page ended 144px
          above the footer's rule and a content page 160px. A page shorter
          than the screen also gets `<main>`'s floor (D-142). */}
      {!playing && (
        <footer
          className="border-t border-border-subtle"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <h2 className="sr-only">Site information</h2>
          <div className="max-w-content mx-auto px-4 py-10">
            {/* **Brand left, link groups right — not three even columns.**
                Even columns were the first shape and they read as off-centre,
                because the boxes were even and the CONTENT was not: each `1fr`
                is about 347px while "Font Awesome" is 110px wide, so two thirds
                of the footer was trailing whitespace and all the mass sat in
                the left third. Pinning the groups to the right edge uses the
                width and gives the block a left and a right edge instead of a
                left one and a ragged middle. It is also the shape most footers
                converge on, for the same reason.

                **Side by side only from `lg`** (D-141). Below it the three
                link columns do not fit beside the brand: from `sm` to `lg`
                "Fonts & icons" dropped under "Tools" and left a hole beside
                it. Stacked, the brand sits over the three columns, which fit
                one row from 480px. Narrower than that they wrap. */}
            <div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-8">
              <div className="max-w-sm">
                <p className="text-h3 text-primary">
                  Statmon<span className="text-accent">.</span>
                </p>
                {/* No tagline here. It read "A simple set of Pokémon tools,
                    built for myself." — which is Home's hero line with four
                    words added, and on Home the two appeared on the same page.
                    The two lines below say something the wordmark does not
                    (06_style_guide §14.1 rule 7). */}
                {/* Both numbers are READ off the dataset, never typed. A
                    footer that states a count is a footer that can be wrong
                    about it, and the dataset is already in this chunk because
                    Home is eager (D-060) — so this costs nothing and cannot go
                    stale after a `build:data`. */}
                <p className="mt-4 text-caption text-tertiary">
                  {DEX_SIZE.toLocaleString()} entries, current through
                  Generation {CURRENT_GEN}.
                </p>
                <p className="mt-1 text-caption text-tertiary">
                  No cookies and no analytics. Your game record is saved in your
                  own browser and nowhere else.
                </p>
              </div>

              {/* Three groups, spread. `justify-between` on the row above
                  puts the brand on the left edge and this block on the right;
                  inside it the three sit on a fixed gap, so they read as a set
                  rather than as three things that happened to land apart. */}
              <div className="flex flex-wrap gap-x-12 gap-y-8 lg:gap-x-20">
                <FooterGroup title="Tools" links={TOOL_LINKS} />
                <FooterGroup title="Data" links={DATA_LINKS} />
                <FooterGroup title="Fonts & icons" links={CRAFT_LINKS} />
              </div>
            </div>

            {/* **The same three columns as the block above, not a
                `justify-between` row.** Pushing the legal line and the byline to
                opposite edges made the bar the one part of the footer that
                ignored the grid over it — the byline floated to the far right
                while every heading above it started on a column. Spanning two
                and taking the third puts it on the same ruler as "Credits", so
                the whole footer reads on three verticals instead of two
                arrangements stacked. */}
            {/* Mirrors the block above: one thing on each edge. It was a
                three-column grid while that block was too; both changed
                together, because the fault was never the bar on its own — it
                was two different arrangements stacked. */}
            <div className="mt-10 flex flex-col gap-3 border-t border-border-subtle pt-6 sm:flex-row sm:justify-between sm:gap-8">
              <p className="max-w-xl text-caption text-tertiary">
                Data and images from PokéAPI; sprites are CC0. Fonts are SIL
                OFL, and the carets on the comparison board and the dex are Font
                Awesome Free (CC BY 4.0). Full notices are in the{" "}
                <a
                  href={NOTICE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-border-strong underline-offset-2 transition-colors hover:text-secondary"
                >
                  repository
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                . Pokémon is © Nintendo, Game Freak and The Pokémon Company.
                Statmon is an unofficial fan project.
              </p>
              <p className="shrink-0 text-caption text-tertiary sm:text-right">
                Built by Noah Park-Nguyen · Code{" "}
                <a
                  href={LICENSE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-border-strong underline-offset-2 transition-colors hover:text-secondary"
                >
                  MIT
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
