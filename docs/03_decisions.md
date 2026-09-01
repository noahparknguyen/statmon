# Statmon — Decisions (Step 3)

_A dated log of what's decided and **why**. The highest-value doc for a solo dev: six weeks from now, "why did I pick X over Y?" is answered here instead of re-litigated. Newest entries at the top. Entries marked **Provisional** are current leans pending a build-time gut-check; **Firm** are settled._

---

## 2026-08-31 — Session 6 (the dex table)

<a id="d-044"></a>

### D-044 · The dex preview is my Black & White team — **Firm**

**Decision.** The six rows in Home's dex preview are **Samurott, Krookodile,
Chandelure, Volcarona, Archeops and Mienshao** — my actual team from the
Black & White playthrough that the whole project came out of
([00_brainstorm §1](00_brainstorm.md)). Nothing on screen marks it; it is meant
to be found, not announced.

**Why it works rather than just being self-indulgent.**

- **It is coherent, not random.** All six are Gen 5, so the preview reads as a
  deliberate slice rather than an arbitrary one, and the six between them cover
  nine types — the type colours carry the table's visual signature, so a varied
  team shows the component off better than six Water types would.
- **It closes a loop the site already opened.** Volcarona and Chandelure are the
  site's mascots ([D-023](#d-023)) because they are my two favourites; they are
  also on this team. So they appear in the hero board and again in the preview
  below it, which reads as a running thread rather than a repeat.
- **The origin story is the product's whole premise.** [01_spec](01_spec.md)'s
  success criterion is "a stranger mid-playthrough gets their answer instantly",
  and this is the playthrough that produced the question. Putting that team on
  the front page is the most on-brand content the preview could hold.

**What did not change, deliberately.** The rows are still ordered by the tool's
own `sortRows` on Speed descending — not written out in the order I want them.
So the Speed column's highlight and its `aria-sort="descending"` stay truthful,
and the preview keeps demonstrating the thing [D-043](#d-043) says a preview is
for. Archeops (110) to Samurott (70) is a wide enough spread to make the sort
visible. `getBySlug` is filtered rather than trusted, so a dataset rebuild that
renamed a slug drops that row instead of rendering a hole.

**Tested by name.** `routes.test.jsx` asserts all six are present and in real
descending-Speed order, so a future refactor cannot quietly lose the egg. The
ordering assertion is scoped to the preview table: two of the six are the hero's
mascots and appear higher up the page, so an unscoped `indexOf` finds the hero's
copy instead — which is exactly how the first version of that test failed.

<a id="d-043"></a>

### D-043 · Every feature gets a live preview on Home — **Firm**

**Decision.** Home is the site's shop window: **every tool Statmon ships gets a
preview there**, built from that tool's own components and fed real data. The
dex table is the first to follow the rule; the comparison board ([D-023](#d-023))
was already doing it as the hero.

**The rule, precisely.**

- **The hero is the flagship.** The comparison board keeps its unlabelled,
  mascot-flanked treatment and is deliberately _not_ built from the shared
  section shell. It is the first preview, given extra weight.
- **Every later feature gets a `FeaturePreview` section:** heading in the site's
  `Word.` motif, one-line description, the live preview, and a link into the
  tool. Uniform by construction, because it is one component.
- **A preview is the real thing, not a mockup.** It renders the tool's own
  components against the real dataset. Home's dex preview is six `DexRow`s — the
  same rows `/dex` renders — ordered by the real `sortRows`, so the ranking is
  computed rather than written down and stays correct when the dataset is
  rebuilt. This is the [D-032](#d-032) rule applied to a second surface: Home and
  the tool cannot drift, because they are the same code.
- **Preview the tool's point, not its chrome.** The dex preview is sorted by
  Speed descending, because sorting is the thing the table exists to do — the
  section's own promise is "every Pokémon, sorted by any stat". Which six rows it
  shows is [D-044](#d-044).

**Why a component and not a note.** A prose rule decays the moment attention
moves on — the lesson of `check:docs` and `audit:contrast`. `FeaturePreview.jsx`
makes the pattern the path of least resistance: a new tool fills in four props
and is consistent automatically. [05_roadmap Phase 6](05_roadmap.md) now carries
"ships with a Home preview" in each tool's checklist, so it is a task rather than
a good intention.

**Its limit, written down now rather than discovered later.** This does not scale
past about four tools — a stack of full previews becomes a very long page, and
the hero stops being a hero. At that point the pattern should become a grid of
compact previews, or the previews should shrink to cards with the flagship alone
at full size. The rule is "every feature is represented on Home", not "every
feature gets 500px of it".

**One structural consequence.** The preview needs the dex table's column
geometry, which is Tailwind class strings — and those cannot live in `lib/`,
because Tailwind only scans `.jsx` since [D-038](#d-038). They also cannot hang
off `DexTable.jsx`, because `react-refresh` requires a component file to export
only components. Hence `components/dexColumns.jsx`, a constants-only module that
satisfies both. Worth recording: those two rules together mean shared _styling_
constants need their own `.jsx` file, which is not obvious from either rule alone.

**Also.** `DexRow` is reused verbatim, links included, so a name in the preview
navigates to the comparison exactly as it does in the real table — the behaviour
is the same everywhere rather than special-cased for Home. The preview's header
is static (no sort buttons) but carries an accurate `aria-sort="descending"` on
the Speed column, since those rows genuinely are sorted that way.

<a id="d-042"></a>

### D-042 · Pre-release polish: WCAG 2.5.3, a silent Tailwind conflict, and an honest touch-target rule — **Firm**

**Decision.** A deliberate "find everything wrong" pass before shipping the
iteration, driven by scripted audits over the production build rather than by
re-reading the code. Everything found is fixed here except one item, which is
tracked with its reason.

**Fifteen WCAG 2.5.3 (Label in Name) failures — Level A.** Every one in code
written this session. The pattern was replacing a control's accessible name with
a _description_ of what it does: a header showing **"Atk"** was named "Sort by
Attack", a chip showing **"Gen 1"** was named "Filter by Generation 1", **"BST"**
was "Sort by Base stat total". The visible words are then absent from the
accessible name, so speech control ("click BST") cannot act on them.

Two fixes, in opposite directions:

- **Sort headers** keep the expansion but _append_ it as `sr-only` text instead
  of replacing the name — "BST sort by Base stat total" contains "BST".
- **Filter chips** drop `aria-label` entirely. The enclosing `role="group"`
  label and `aria-pressed` already supplied the context, so the visible text is
  simply the better name. Less code, and correct by construction.

**A conflict Tailwind resolves the opposite way to how it reads.** The mobile
sort `<select>` was written `` `${FIELD} h-9` `` where `FIELD` already carried
`h-11`. Appending a class does **not** override an earlier one — Tailwind
resolves the conflict by **stylesheet order**, not by the order in the class
string — so the select rendered **44px** beside its two 36px neighbours. Height
came out of the shared constant; each call site sets its own. Nothing in review
would have caught this: the code says `h-9` and means it.

**The touch-target rule was aspirational fiction, so it has been rewritten.**
Measuring every control on every route: **nothing on the site** met
[04_design §9](04_design.md)'s "interactive hit areas ≥ 44×44px on touch". Nav
links are 14px, Swap 36px, form chips 21px, and the new dex chips shipped at
25px. 44×44 is WCAG **2.5.5**, a **AAA** criterion — Statmon targets **AA**
([D-027](#d-027)), where the binding rule is **2.5.8: 24×24** or adequate
spacing. So §9 now states the real, checkable policy (24px floor, 44px for
primary CTAs, 36px for compact controls) and records the correction rather than
quietly deleting the old claim. The dex chips were raised **25 → 36px** to match
`Button` `sm`.

**The one thing not fixed.** `FormChips` in the comparison card are 21px with
6px gaps — the single place likely to fail 2.5.8's spacing test. Raising them
needs `PokemonCard`'s fixed 40px chip band reworked first: at eight forms
(Minior) the chips already wrap to two rows inside it, and 36px chips would
overflow into the artwork. That is a redesign of a shipped, verified card, not a
polish-pass edit, so it is written down in
[05_roadmap Phase 5](05_roadmap.md) instead of patched blind.

**Smaller things, all fixed.** A windowed range could point past the end of a
list a filter had just shrunk, painting an empty table under a huge spacer for
one frame — the range now falls back to the top when out of bounds. `DexRow`
hand-built `/compare?p1=…` instead of calling `compareUrl`, the helper that
exists to own that shape. The row height lived as `48` in one file and `h-12` in
another; they are now defined together and passed down. The mobile
`Filters (N)` badge counted the name box, which sits _outside_ the panel it
opens, so a name filter alone showed "(1)" over a panel with nothing set —
split into a panel count and a total. Home's tools row advertised two live tools
that were not clickable. `index.html`'s three description tags still described a
single-tool site. And `/style` pushed 6px past the viewport at 390px, because the
longest text-style spec label carried `whitespace-nowrap` and so could not shrink.

**What came back clean.** The final sweep runs nine routes at 390 / 768 / 1280px:
no duplicate ids, exactly one `<h1>` each with sane heading order, no missing
`alt`, no control without an accessible name, no positive `tabindex`, no
horizontal overflow at any width, zero Label-in-Name failures, and **zero console
errors or warnings** anywhere.

**Method note.** Reading the code would not have found the height conflict, the
z-order bleed ([D-041](#d-041)), or the touch-target gap — all three are
properties of the _rendered_ page, and all three looked correct in source. The
audits that found them are scripted against the real build over CDP and are
worth keeping.

<a id="d-041"></a>

### D-041 · Sticky table header was being painted over; a `--z-raised` rung — **Firm**

**Decision.** The dex table's sticky column headers now sit on a new
**`--z-raised: 1`** rung of the z-scale ([06 §10](06_style_guide.md)), above the
rows and far below the site header's `--z-sticky`.

**The bug.** Scrolling the dex, the stat bars and numbers of the row passing
underneath drew **over** the sticky header, while the sprite, name and type
badges of that same row correctly slid **under** it. Reported as "the stat
headers look transparent, and the overlap feels unintentional" — which it was.

**Why only those columns.** Not a background problem: all ten header cells had
the same opaque `bg-base`, the same `position: sticky`, the same `top`, and
`z-index: auto`. The difference is in the _rows_. A stat cell positions its
fill and its number (`relative` wrapper, `absolute` fill) so the number can sit
on top of the bar. **A positioned element paints above a non-positioned one**,
and between two at `auto` the one later in the DOM wins — the rows come after
`<thead>`, so their positioned cells won. The name and type cells contain
nothing positioned, so they stayed in the normal-flow layer and behaved. The
split the user noticed was exactly the split between positioned and
un-positioned cell content.

**Why a new token rather than `z-10`.** [06 §10](06_style_guide.md) had rungs for
normal flow and for floating chrome (dropdown / sticky / overlay / toast) and
nothing in between, so an element that only needed to out-paint its own siblings
had nowhere on the ladder to sit. That doc already argues an incomplete ladder
"is what makes someone reach for `z-9999`" — this is that prediction coming
true, so the fix is to complete the ladder. Applied inline, matching how
`Layout` consumes `--z-sticky` (z tokens are plain `:root` properties, not
theme tokens — [06 §13](06_style_guide.md)).

**Considered and rejected:** painting the bar as a hard-stop `linear-gradient`
on the cell instead, which needs no positioning and would have made the symptom
disappear. It fixes this instance by accident. A sticky header that works only
so long as no row cell is ever positioned is a trap for the next person, so the
stacking order is stated rather than avoided.

**Verified by hit-testing, not by eye.** `document.elementFromPoint` at the
centre of every visible header cell now returns the header itself rather than a
row — all ten columns, where before the six stat columns returned row content.
Confirmed the header still resolves below the site header (1 < 1100). A
server-render test asserts every `<th>` carries the rung, since the fault is
only visible once the page is scrolled and no unit test scrolls.

<a id="d-040"></a>

### D-040 · Multi-select type & generation filters — **Firm**

**Decision.** Types and generations are now **multi-select chips** instead of
single-value `<select>`s. Click a chip to add it, click it again (it carries an
**×** while active) to drop it, or **Clear all filters** to reset them at once.
This supersedes the single-select part of [D-039](#d-039).

**How multiple selections combine: OR within a group, AND across groups.**
Fire + Fighting in Gens 1, 3 and 5 reads as _"(Fire **or** Fighting) **and**
(Gen 1, 3 **or** 5)"_ — 83 rows, including pure Fire (Charmander), pure Fighting
(Mankey) and dual Fire/Fighting (Blaziken). Generations admit no other reading, since a
Pokémon belongs to exactly one and ANDing them would always match nothing; types
follow the same rule so the two groups behave alike rather than each needing to
be learned. The alternative for types — AND, meaning "dual Fire/Fighting only" —
is a genuinely useful but _different_ feature, and mixing the two into one
control is what makes faceted filters confusing. Confirmed with the user before
building rather than guessed at.

**Why this also fixes the odd-looking panel.** The real complaint that started
this was that "Alternate forms" sat alone in something that looked like a filter
area. The fix is not to move the toggle — it is that the panel now has **three
labelled groups**: **Types**, **Generations**, **Options**. A lone toggle under
its own heading is a group; a lone toggle under nothing is an orphan. The
labels are `role="group"` + `aria-label`, so the grouping is real to a screen
reader and not just visual.

**Reversing the chips-vs-dropdown call.** [D-039](#d-039) chose `<select>`s
because 18 colour chips wrap to several rows on a phone. That still happens —
but once selection is multi-value, the current selection has to be on screen
anyway, at which point the dropdown is a strictly extra step in front of the
same information. So: chips, with the whole group collapsed on a phone behind a
**`Filters (5)`** disclosure that counts the chips inside it (the name box sits
outside the panel and is counted only by "Clear all" — [D-042](#d-042)). Sorting deliberately
sits _outside_ that disclosure — the six stat column headers are already hidden
below `md`, so burying sort inside a collapsed panel would leave a phone with no
way to sort at all.

**Chip states reuse audited colours.** Active type chips are the `TypeBadge`
pairing (solid type colour, near-black label); inactive chips are the
`FormChips` neutral pairing with a small type-coloured **dot**, which keeps the
palette visible without inventing a colour pairing that
[D-027](#d-027)'s audit has not already cleared. Generation chips have no
inherent colour, so active uses the accent — chrome, per
[D-023](#d-023)'s rule that accent is never a type colour.

**Two small behaviours worth stating.** The URL is rebuilt from the **canonical
order**, not click order, so clicking Fighting-then-Fire and Fire-then-Fighting
produce the identical link (`?type=fire,fighting`) — the same normalisation
drops duplicates and unknown values, so a hand-edited URL cannot reach a state
the controls could not. And **Clear all clears filters but keeps the sort**:
throwing away the column you were reading is not what "clear the filters" means.
A single value still parses (`?type=fire`), so links shared before this change
keep working.

**Verified.** 17 browser checks over CDP — chips accumulating, canonical
ordering regardless of click order, an × removing exactly one filter, Clear all
keeping the sort, the phone disclosure and its count, no horizontal overflow at
390px, and all 28 chips reporting `aria-pressed`. The 83- and 42-row results
were checked against a direct dataset query rather than against the UI's own
arithmetic, which is the habit [D-039](#d-039) earned the hard way.

**The one real cost.** 28 chips are 28 tab stops, so a keyboard user now passes
roughly 35 focusable controls before reaching the column headers (confirmed
reachable, with the 2px focus ring intact). That is inherent to chips over
dropdowns. Screen-reader users are unaffected — they navigate by group,
landmark and table rather than by tabbing — but if it becomes annoying the fix
is a skip link or a collapse-on-desktop, not a return to dropdowns.

<a id="d-039"></a>

### D-039 · The dex table — Statmon's second tool — **Firm**

**Decision.** Built the full-dex stats table at **`/dex`** — the top near-term
item in [05_roadmap Phase 6](05_roadmap.md), priority #1 in [D-023](#d-023), and
the thing the Home tools row has been promising as "soon" since launch. Four
choices define it:

- **All 1,259 entries, with alternate forms filterable** rather than the 1,025
  default forms. [D-003](#d-003) already treats a Mega as "just another stat
  block", and Megas are a large part of _why_ someone looks a stat up; a toggle
  hides them for anyone who wants the clean National Dex. Forms sort beside their
  species because rows tie-break on **National Dex number**, not on the synthetic
  id > 10000 they carry — so Charizard, Mega X and Mega Y are three consecutive
  #0006 rows.
- **Hand-rolled windowing, no new dependency.** Only the rows near the viewport
  are mounted. Measured in the real build: **26 rows in the DOM** both at the top
  and scrolled 30,000px into a **60,906px** page. It windows against the _page_
  scroll rather than an inner scroll container, so there is one scrollbar and the
  table behaves like an ordinary long page.
- **Numeric cells with a type-tinted proportional fill** rather than plain
  numbers or a full `StatBar` per stat. The fill is scaled to the same fixed 255
  reference as every other bar on the site ([D-011](#d-011)), so a length means
  the same thing here as in a comparison — but the number stays the thing you
  read. Six full `StatBar`s per row would have been 7,554 bars and roughly halved
  the rows on screen.
- **The URL is the entire view state** ([D-022](#d-022)) — `sort`, `dir`, `q`,
  `type`, `gen`, `forms`. The page holds no state at all: it parses the query
  string and every control navigates (`replace`) to the next one. So a sorted,
  filtered dex is a link, back/forward work, and a hand-edited URL cannot desync
  anything. Defaults are omitted, so the common case stays a clean `/dex`.

**Why a real `<table>`.** A grid of divs would have been easier to window, but
the browser then gives a screen reader nothing — every cell would need explicit
`role`/`aria` to recover what `<table>` provides for free. Windowing is done with
one spacer row above and below the rendered slice, which keeps that structure
intact, plus `aria-rowcount` on the table and `aria-rowindex` on each row so a
sliced DOM still reports each row's real position in the full list.

**The bug that took the longest, and what it teaches.** The spacer rows were
first written as a single cell with `colSpan={10}`. That looked harmless and was
fine at desktop — but **a `colSpan` does not span the columns, it creates them**:
a table's column count is the maximum across all its rows. At phone widths seven
of the ten headers are `display:none`, so the table had three real columns and
the spacer's colSpan invented seven phantom ones, which took the width and
crushed the name column down to the width of a sprite. The fix is one cell with
no `colSpan` at all — the spacer only needs height. Worth recording because the
desktop rendering looked completely correct throughout.

**One new text style.** Table cells want a compact 14px tabular numeral, and the
only existing one was `text-diff` — whose role is the comparison delta. Following
[D-035](#d-035), the fix is to **add the style the design needs**:
**`text-stat-sm`** ([06 §5](06_style_guide.md), now 22 styles). It shares
`text-diff`'s values today and is deliberately still its own style — [06
§12](06_style_guide.md) rule 2 is one style per _role_, and a table cell and a
delta are free to diverge later. The `/style` page's self-check ([D-035](#d-035))
caught the omission the moment the style was added, which is exactly what it is
for.

**Mobile keeps the no-horizontal-scroll rule.** Ten columns cannot fit on a
phone, and [D-010](#d-010)/[D-029](#d-029) rejected sideways scrolling for this
site. Below `md` the table condenses to **name + types · the column being sorted
by · BST** — so sorting by Speed on a phone shows Speed. Sorting by name, dex or
BST leaves that column out rather than picking an arbitrary stat. Verified at
390 / 768 / 1280px: zero horizontal overflow at all three.

**Verified in a real browser, not just by eye.** Driving the production preview
over the Chrome DevTools Protocol: the windowed row count at depth, the page
height, no horizontal overflow at three widths, scroll actually resetting across
a navigation (25,000 → 0), per-route titles, header clicks writing the URL and
reordering rows, the real Tab order reaching the column headers with
`:focus-visible` and a 2px outline. Two of my assertions failed and **both were
my expectations, not the app** — the Gen 5 Fire count and the lowest-Defense
Gen 1 Water type — which is the argument for checking counts against a direct
dataset query rather than against memory.

**Not done, deliberately.** No row virtualisation library, no column
show/hide UI, no multi-type filter (the any-vs-all ambiguity buys more confusion
than it is worth), and type/generation are `<select>`s rather than 18 colour
chips — the chips wrap to four rows on a phone, and this panel sits above the
thing people came for.

> **Superseded in part by [D-040](#d-040).** The filters are now multi-select
> chips. The any-vs-all worry was real but resolvable — it just needed deciding
> rather than avoiding — and the phone-height objection was answered by
> collapsing the panel behind a disclosure instead of by dropping the feature.

<a id="d-038"></a>

### D-038 · Foundation before the second tool — **Firm**

**Decision.** A pre-flight audit before building the dex table found the build
healthy — all five checks green, no TODOs — but three foundational gaps that a
long page is exactly the thing to expose. All three were closed first, because
each is strictly harder to retrofit.

- **Scroll and focus reset on navigation** — the outstanding item from
  [D-024](#d-024). React Router data mode does **not** reset scroll on a
  client-side navigation; nothing had exposed it because every page was short.
  `<ScrollRestoration />` (exported by the react-router already installed, and
  used by nothing) plus a focus move to `<main>` on pathname change. The focus
  move uses `preventScroll` so it cannot fight the restored position on a Back
  navigation, and `<main>` takes `outline-none` because it is a programmatic
  target, not a control — the moved focus is the announcement.
- **Per-route `<title>`.** Every route served the one static title from
  `index.html`. This had been deferred pending SSR ([D-026](#d-026),
  [D-030](#d-030)), but only OG unfurls need a server — a title is a client-side
  effect. Routes now declare `handle: { title }` and `Layout` sets the document
  title from `useMatches()`. `handle` is the data-mode equivalent of framework
  mode's route `meta` export, so this migrates rather than being thrown away.
- **Vitest.** The [05_roadmap Phase 5](05_roadmap.md) item that never landed.
  Deliberately the smallest possible slice: `vitest` alone, **no jsdom and no
  component-testing library**, node environment, pure functions only. 70 tests —
  the dataset codec (including the whole-dataset round-trip [D-036](#d-036)
  verified by hand and never again), the stat math, the dex sort/filter/URL
  logic, and a `react-dom/server` smoke test that renders every route. Anything
  needing layout, scroll or input is still checked against the running app.

**A scanner leak worth writing down.** Adding one comment jumped the CSS bundle
by 1.7 kB. Tailwind v4's automatic content detection scans every non-gitignored
file for class-name candidates — **prose included** — so the words "a visible
ring" in a source comment emitted `.visible`, `.ring` and the entire ring/shadow
`@property` block into production CSS. Writing "filter" emitted `.filter`. The
docs were already excluded from the scan for this exact reason, which fixed the
symptom in one directory while every comment in `src/` kept doing it; `.table`,
`.fixed`, `.static` and `.lowercase` were already shipping.

So detection is now **off** (`@import "tailwindcss" source(none)`) with the two
places that actually contain class names declared explicitly — `index.html` and
`src/**/*.jsx`. Everything else is prose or data. The [D-028](#d-028) hazard runs
the other way here — narrowing a scan can silently drop a real class — so this
was checked rather than assumed: the emitted selector list was diffed before and
after, and exactly two selectors disappeared, both junk, with nothing added.
**Honest limit:** comments _inside_ `.jsx` files can still leak, and three tiny
utilities still do. Rewording accurate comments to dodge a scanner is the worse
trade; the structural fix removes the whole class of leak from everywhere else.

**Also.** `TYPES` — the list of 18 — existed as **three** hand-maintained copies
(`typeChart.js`'s chart keys, `contrast-audit.mjs`'s own array, and the dataset
itself) and as an export from none of them. It now lives once in `lib/types.js`;
the contrast audit imports it, and a test asserts it matches the chart's keys,
the types present in the dataset, and the `--color-type-*` tokens in
`index.css` — so all four can no longer drift apart quietly. `getBySlug` became a
`Map` lookup instead of a linear `.find()`, because the table resolves a form
group per row and that was 1.5M comparisons per sort. `dexNumberOf` — the
"read the dex number off the group's default form" rule — moved out of
`PokemonCard` into `lib/dexTable.js` so there is one copy.

---

## 2026-08-31 — Session 5 (review & consistency pass)

<a id="d-037"></a>

### D-037 · Copy pass; ESLint blind spot; combobox keyboard fix — **Firm**

**Decision.** A read of every user-facing string, then a sweep of the files the
review had not yet touched.

**Copy.** Eight changes, all toward "blunt, no filler" ([D-023](#d-023)):

- **`/compare`'s subtitle** was _"Visualizes the difference between two
  Pokémon."_ — it described what the code does rather than what the reader gets,
  and was the only impersonal third-person line on the site. The strongest copy
  in the project was sitting unused in a meta tag, so the page now says **"See
  who's faster, hits harder, and is bulkier."** — matching the `description`
  tag and the [01_spec](01_spec.md) primary goal verbatim. This supersedes the
  line recorded in [D-023](#d-023).
- **404 said "**We** couldn't find…"** — the only first-person-plural on a
  solo project, and the only HTML entity in the codebase. Now _"The link may be
  broken, or the page moved."_
- **Three different fan-project disclaimers** (footer, Credits, README) with two
  different company lists. Unified on the Credits/README wording: _"an unofficial
  fan project, not affiliated with Nintendo, Game Freak, or The Pokémon Company."_
- **"Base Stat Total" vs "Base stat total"** — Title Case in `PokemonCard`,
  sentence case elsewhere. Invisible on screen (`text-overline` uppercases) but
  **screen readers read the DOM text**, so it was audibly inconsistent. Sentence
  case everywhere, matching its sibling "Higher total".
- **"Same Speed" → "Same speed"** — its sibling string is "{name} moves first".
- **"STAB" is unexplained jargon** on a site whose success criterion is a
  stranger mid-playthrough getting an answer instantly. Both instances now carry
  a `title` expanding it to "Same Type Attack Bonus" — no visual change.
- **`og:description` / `twitter:description`** were weaker truncations of
  `description`, dropping the "who's faster" clause. All three now match.
- **Credits' "How the site was made."** promised process the page doesn't
  deliver; it lists sources and the repo. Now _"What Statmon is built on."_

**A real blind spot in the tooling.** `eslint.config.js` matched only
`**/*.{js,jsx}`, so **`scripts/*.mjs` were never linted** — all four Node
scripts, including the two that talk to PokéAPI. Confirmed by appending an
undefined identifier to a script and watching `npm run lint` pass. Added a
Node-globals block for `scripts/**/*.mjs`; the same test now fails correctly.
Also extended `globalIgnores` to `.wrangler` and `src/data`.

**Combobox keyboard fix.** The search results put `role="option"` on a `<button>`
inside an `<li>`, so the accessibility tree read _listbox → listitem → option_ —
options must be immediate children of the listbox. Worse, the buttons were
**tab stops**: Tab from the search field walked through all eight results instead
of leaving the field, which is exactly what `aria-activedescendant` exists to
avoid. Added `role="presentation"` to the `<li>` and `tabIndex={-1}` to the
options. [D-020](#d-020)/[D-024](#d-024) reviewed this ARIA and missed both.

**Also.** Title-casing logic existed in **four** places (I added the fourth in
[D-036](#d-036)); `titleCase` is now exported once from the codec and used by the
decoder, `formLabel`, and `build-data.mjs` — verified to produce byte-identical
form labels across all 1,259 entries and a byte-identical dataset. `TypeBadge`
called `typeTextVar(type)` with an argument the function ignores, implying the
badge colour varies by type when [D-027](#d-027) made it uniform. Home's tools
row was an unlabelled `<ul>` — four bare items with no context for a screen
reader — and now carries `aria-label`. The README gained a **Run it** section;
for a repo whose second audience is "someone judging how I work," not being able
to clone and run it was the one real gap.

<a id="d-036"></a>

### D-036 · Dataset stored without derivable fields (bundle −37%) — **Firm**

**Decision.** `src/data/pokemon.json` now stores only what cannot be rebuilt, via
a shared codec (`src/lib/pokemonCodec.js`) that `src/lib/pokemon.js` decodes once
at import. Six fields came out, each verified across all 1,259 entries first:

| Field         | Rebuilt from         | Held for all entries         |
| ------------- | -------------------- | ---------------------------- |
| `name`        | `titlecase(slug)`    | 1259/1259                    |
| `bst`         | `sum(stats)`         | 1259/1259                    |
| `spriteUrl`   | `/sprites/{id}.png`  | 1256/1259, rest flagged `ns` |
| `artworkUrl`  | `/artwork/{id}.webp` | 1257/1259, rest flagged `na` |
| `forms`       | `[slug]`             | 845/1259, rest stored        |
| `speciesSlug` | `slug`               | 988/1259, rest stored        |

Keys are single letters and stats are a fixed-order array.

```
dataset : 382.8 → 119.1 KB raw   (−69%)   58.0 → 28.2 KB gzip  (−51%)
bundle  : 717.7 → 449.7 KB raw   (−37%)  162.0 → 131.9 KB gzip (−19%)
```

**Why this and not fetching the JSON as a static asset.** Moving it out of the
bundle would save more — the library floor is 325.7 KB raw / 100.9 KB gzip,
measured by building with the dataset stubbed out — but it would break the thing
[D-022](#d-022) is built on: _"slugs resolve synchronously via `getBySlug` (the
dataset is a static import)."_ Every route would gain a loading state, Home
included, since its hero board needs Volcarona and Chandelure to render at all.
Trading instant render for bytes is the wrong trade for a tool whose whole pitch
is being faster than the alternatives. This gets roughly half the saving and
keeps the synchronous, URL-as-source-of-truth design intact.

**No component changed.** The decoder returns the exact objects the app already
used, so every consumer — components, `getBySlug`, `formsOf`, `searchPokemon` —
is untouched.

**Verified four ways.** (1) Encode→decode of the pre-existing file is
**deep-equal** to the original. (2) All 13 rendered surfaces are **byte-identical**
before and after. (3) `npm run build:data` re-run end-to-end from the on-disk
cache (2.8s, zero network) emits a file **byte-identical** to the transform, so
the pipeline and codec agree — same 1,259 entries, 414 alt-forms, per-generation
counts and 3 sprite-less entries as before. (4) `npm run vendor:images` still
resolves exactly the same 2,513 assets with nothing to fetch.

**Also.** `vendor-images.mjs` no longer rewrites the data file — asset paths are
derived from `id` now, and `build-data.mjs` already records the two "no sprite" /
"no artwork" flags, so a whole class of mutable state disappeared from the
pipeline.

<a id="d-035"></a>

### D-035 · Display-numeral styles added; `/style` made self-verifying — **Firm**

**Decision.** Closed the last [06 §12](06_style_guide.md) rule-2 violations by
**adding the four styles the design needed** rather than bending the design to
the existing table: `text-numeral-xl` / `-lg` / `-md` (display, 700,
`leading-none`) and `text-meta` (display, 12px, 600). §5 is now **21 styles**.

**Why new styles rather than snapping to `text-display`.** The big BST figures
differ from `text-display` in exactly one property — `leading-none` instead of
`leading-tight` — and that is the whole reason they were hand-assembled. They are
optically centred inside fixed-height bands (the card's `h-68` top zone, the
featured board's BST row); `leading-tight`'s half-leading would push them off
centre. §5 already prescribes the fix: a style the design needs "gets **added to
this table**, not improvised." The design was right; the table was incomplete.
All four numeral sites render **byte-identical**.

**Two deliberate pixel changes**, both in small chip labels: the STAB multiplier
goes 500 → 600 weight, and the effectiveness-chip label's line-height goes
1.5 → 1.2. The 1.5 was **not a design decision** — `text-xs` emits
`line-height: var(--tw-leading, var(--text-xs--line-height))` and we never define
`--text-xs--line-height`, so the declaration is invalid at computed-value time
and silently **inherits body's 1.5**. Replacing an accident with the intended
value tightens each chip by ~3.6px inside a fixed, centred band.

**One exception is now explicit rather than tacit.** Overriding **family and
weight only**, inheriting size and leading, is permitted for inline emphasis —
the way `<strong>` works. The leader's name in the BST summary is the single
instance. Anything that also sets a size is not emphasis and needs a named style.
Inventing a 22nd style for one inline span would have been worse than naming the
rule.

**`/style` can no longer drift.** It claimed to render "the REAL tokens and
components (not hand-rolled copies)" while carrying a hardcoded hex beside every
swatch and listing **14 of 17** styles. Swatch values are now read from the live
stylesheet with `getComputedStyle`, so the page cannot disagree with
`index.css`; all 21 styles are listed; and the page walks the stylesheet at
render to find any `.text-*` rule that bundles a `font-family` and is missing
from its own list, rendering a visible warning if so. Same principle as
`npm run check:docs` — a consistency claim that isn't machine-checked degrades
the moment attention moves on. Both reads use lazy `useState` initialisers rather
than effects (the stylesheet is static; there is nothing to subscribe to) and are
guarded for the no-DOM case so the page stays server-renderable.

<a id="d-034"></a>

### D-034 · Prettier made real; footer regrouped; social-preview asset explained — **Firm**

**Decision.** Three small loose ends from the review pass.

- **Prettier installed properly.** A `.prettierignore` had been sitting in the
  repo with **no Prettier dependency, no config and no script** — the formatting
  was happening via editor integration only, so it was unenforceable and
  invisible to CI. Added `prettier` as a devDependency plus `npm run format` and
  `npm run format:check`. No config file: the codebase already matches Prettier's
  stock settings exactly, so adding one would only invite drift.
- **Footer regrouped.** Three children under `justify-between` put the GitHub
  link _dead centre_ between the attribution and the byline, which read as an
  accident. Byline and repo link are one authorship group, so they now sit
  together on the right; the fan-project attribution keeps the left.
- **`docs/preview.png` explained.** It was an unreferenced 1280×640 file. It is
  the checked-in copy of the GitHub social preview; `docs/og-image.html`'s export
  instructions now name both destinations and note that GitHub stores that image
  outside the repo, so it must be uploaded by hand.

**Why the Prettier detail matters.** Running `prettier --check` for the first
time flagged exactly six files — **all six were ones this review pass had
touched**. The pre-existing codebase was already clean. That is the argument for
installing it rather than deleting the ignore file: the convention was real and
being followed, it just had no enforcement, so the only code that drifted was the
code written without an editor doing it silently. `format:check` belongs in CI
alongside `lint`, `check:docs` and `audit:contrast`.

<a id="d-033"></a>

### D-033 · Token reconciliation; Tailwind's stock palette cleared — **Firm**

**Decision.** Audited all 100 declared tokens for real consumption and resolved
every unreferenced one — by a rule rather than case by case:

- **Unused _primitives_ are kept.** [06 §1](06_style_guide.md) defines a primitive as "the palette of
  possible choices," so an unreferenced one is headroom, not drift.
  `--color-neutral-100/500/800` and `--color-accent-500/600/muted` stay.
- **Unused _semantic_ tokens are deleted.** A semantic token claims a role; if
  nothing plays that role it is a lie. **`--color-diff-favor` removed** —
  [D-023](#d-023) replaced the flat white winning value with the winner's own
  type colour and left it orphaned.
- **Scales that are ladders stay complete.** Only `--z-dropdown` and
  `--z-sticky` are consumed, but the point of a z-index scale is being a
  complete ladder — an incomplete one is what makes someone reach for `z-9999`.
  Kept in full, deliberately the opposite call from the semantic-colour rule.
- **`--ease-out-soft` removed** — a second easing specified on spec and used by
  nothing. The bar fill uses `--ease-standard`.

**`--dur-fast` is now real.** Every `transition-*` in the app was running
Tailwind's stock **150ms** while [06 §9](06_style_guide.md) documented **120ms**
for hover/focus. Rather than annotate 10 components with
`duration-[var(--dur-fast)]`, the theme now sets
**`--default-transition-duration: var(--dur-fast)`**, so every transition utility
picks it up with no per-component opt-in. **This is the one perceptible change in
this pass** — hover transitions are 30ms quicker — and it moves the build onto
the documented value rather than moving the doc onto the build.

**Tailwind's default colour palette is cleared** — `--color-*: initial` at the top
of the `@theme` block, with `--color-transparent` re-added as the single stock
value actually used (`text-transparent` for the gradient BST delta,
`border-transparent` on active form chips).

**Why that matters more than the dead tokens.** [06 §12](06_style_guide.md) rule 1
("tokens only, no raw values") was unenforceable: `bg-red-500` or a fat-fingered
`bg-neutral-200` rendered a perfectly good off-brand colour with no signal. The
neutral ramp made this worse — it skips steps Tailwind defines (200, 600 in the
stock scale), so those had invisible holes falling through to Tailwind's greys.
With the palette cleared, an off-palette class emits **no CSS at all**: a visible
no-op instead of a quiet violation. Verified by temporarily adding
`bg-red-500 bg-neutral-200` to a component and confirming neither reached `dist`
while `bg-surface` still did.

**Verified.** All 13 rendered surfaces (both comparison boards in four and two
states, both `PokemonCard` states, and all five pages) are **byte-identical**
before and after — these are stylesheet-level changes only. `--color-type-*`,
the semantic aliases and the `transparent` utilities all confirmed present in
`dist`; `--color-diff-favor` and `--ease-out-soft` confirmed absent.

**Census note.** My first two usage scans were both wrong and both
under-reported. The first missed all 18 `--color-type-*` (consumed only through
`typeColorVar()`'s runtime string-building — the [D-028](#d-028) case) and missed
tokens whose `var()` reference the formatter had wrapped across lines. The second
counted matches inside CSS comments, hiding `--color-diff-favor` and
`--ease-out-soft`. Worth recording: a token census has to account for dynamic
references, reflowed declarations, and comments, or it will confidently tell you
to delete something load-bearing.

<a id="d-032"></a>

### D-032 · Shared comparison primitives + a real `Button` — **Firm**

**Decision.** Extracted the duplication between the two comparison boards and
gave the site one button component. Four new/changed shared pieces:

- **`CmpRow.jsx`** — the desktop (≥ md) mirrored stat row _and_ its centre
  `DiffCell`, previously duplicated near-verbatim in `ComparisonCard` (the tool)
  and `FeaturedComparison` (Home). The Home copy was the tool's copy minus one
  null branch, plus animated bars; the shared version takes an **`animate`** prop
  and keeps the null handling, which is a superset of both.
- **`SpeedBanner.jsx`** — the flame speed verdict, previously a component in one
  file and inline markup in the other.
- **`Button.jsx`** — two variants (primary/secondary) × two sizes (`md`/`sm`),
  replacing **five** hand-copied class strings across Home, Compare, NotFound and
  the `/style` playground. Passing `to` renders a router `<Link>` that looks
  identical, since the Home and 404 CTAs are navigations rather than actions.
- **`--shadow-art` + `.drop-shadow-art`** — the artwork lift was the literal
  `drop-shadow(0 8px 22px rgba(0,0,0,0.5))` copied into both `PokemonCard` and
  `Home`. Now one token, one utility, documented in [06 §7](06_style_guide.md).

**Why.** [D-029](#d-029) already established this split for the _mobile_ per-stat
card (`CmpStatCard`) precisely so Home and the tool could not drift — but the
desktop halves were left duplicated, which is the seam
[D-023](#d-023) says must stay consistent. Roughly 60 lines lived in two places
on the most visually load-bearing part of the site. Every planned suite tool (dex
table, type chart, quiz) needs buttons and stat rows, so these belong in the
shared layer _before_ the next feature rather than after.

**Verified pixel-identical, not assumed.** I rendered all ten affected surfaces
to static HTML with `react-dom/server` before and after, and diffed the markup
with class-attribute order normalised (order is meaningless in HTML; Tailwind
resolves conflicts by stylesheet order, not attribute order). Every comparison
surface — `ComparisonCard` in four states, `FeaturedComparison` in two, Home,
404, Compare — came back **byte-identical**. The only differences were the three
intended ones: the Swap button moved `flex` → `inline-flex` (it is a flex item,
which CSS blockifies back to `flex`, so it renders the same), the playground
buttons gained inert `disabled:*` classes, and the playground gained a disabled
sample. Two Home images moved from an inline `style` to the new utility with an
identical filter value.

**A bug this caught in my own work.** The first draft of `CmpRow` built its class
as `` `flex justify-${side}` ``. Tailwind's scanner cannot see template-built
class names, so `justify-start` / `justify-end` would have been dropped from the
build and the mirrored bars would have silently stopped mirroring — the exact
failure mode [D-028](#d-028) documents. Replaced with a literal lookup map;
confirmed both utilities are present in `dist`.

**Side effect.** The CSS bundle fell again (25.71 → 24.62 kB) because five
duplicated class strings collapsed into one.

**Not done here.** The hand-assembled type in `ComparisonCard`'s BST summary and
effectiveness chips (`text-3xl font-display font-bold leading-none`) is still a
[06 §12](06_style_guide.md) rule-2 violation. It is deliberately left alone: no
named style in §5 matches those exact values, so fixing it means either adding
styles to the scale or accepting a visual change — a design decision, not a
refactor. Same for the `/style` page's hardcoded hex swatches and its incomplete
14-of-17 text-style list.

<a id="d-031"></a>

### D-031 · Docs re-synced to the shipped build; link-checking scripted — **Firm**

**Decision.** Opened a review/polish phase by treating the docs as **code that can
break**, and fixing the drift that had accumulated between the writing and the
build. Concretely:

- **Anchors completed and ordered.** `D-001`–`D-012` had no `<a id>` targets, so
  eight in-doc links silently landed at the top of the file; every decision now
  carries one. Session 0's entries were reordered to strict descending number
  (they ran `12, 10, 11, 1, 2, …`), matching the log's "newest at the top" rule.
- **86 cross-doc links anchored.** Every `[D-0XX](03_decisions.md)` across the
  other six docs pointed at the _file_, dumping the reader at the top of a
  350-line log. They now deep-link to the entry.
- **Token names corrected to the emitted names.** [06_style_guide](06_style_guide.md)
  and [04_design](04_design.md) still used pre-Tailwind-v4 names (`--fs-*`,
  `--bg-base`, `--text-primary`, `--neutral-900`, `--bp-md`, `--content-max`).
  Tailwind v4 is CSS-first and a token's _prefix decides which utilities it
  generates_, so the real names carry namespaces (`--text-*` is the font-size
  ramp; colors are `--color-*`). All names in the docs are now the real ones,
  with a namespace note explaining why, and §13 was rewritten to describe the
  actual `@theme static` setup instead of a Tailwind v3 JS config that never existed.
- **Stale specs marked as built or as drift.** `--text-tertiary` still showed the
  pre-[D-027](#d-027) hex; the ⚠ contrast markers survived the completed audit;
  §2 named a `--diff-muted` token that ships as `--diff-tie`; the difference cell
  was still described as sitting in the winner's column rather than centered and
  type-tinted ([D-023](#d-023)). The [01_spec](01_spec.md) schema listed
  `sprite`/`artwork` and omitted `speciesSlug`; it now matches the emitted JSON.
- **Unimplemented specs stated honestly rather than quietly dropped.** The
  `type → { fill, badgeText }` map is closed as **won't-do** (the CSS tokens make
  it a redundant second source of truth). The `--dur-*` motion tokens, the 24px
  desktop gutter, and `--ease-out-soft` are flagged **⚠ drift** where they're
  documented — defined but unreferenced by any component.
- **`npm run check:docs`** (`scripts/check-docs.mjs`) now validates every relative
  link and fragment, kept as a regression tool exactly like `audit:contrast`
  ([D-027](#d-027)). It reproduces GitHub's slug algorithm precisely — including
  that runs of spaces become runs of hyphens, so `A — B` is `a--b`. My first
  hand-rolled version collapsed whitespace and produced a false positive on a
  link that was correct; scripting the rule is what caught my own error.

**Also fixed (code).** `scripts/build-data.mjs` sent `github.com/noahpn/statmon`
— a dead URL — as the identifying User-Agent handed to PokéAPI under its fair-use
policy ([D-016](#d-016)); corrected to the real repo and bumped both scripts to
`/1.0`. The roman-numeral generation map stopped at `ix`, so a Gen 10 release
would have silently written `generation: null` for every new species; added `x`.
Four source comments promising Phase 3.5/Phase 4 futures that resolved
differently were rewritten to describe what shipped.

**Why.** The docs are the project's main portfolio artifact — the README sends
readers straight to this log — so drift there is more visible than drift in code,
and it compounds: each stale value is a small lie a future decision gets built
on. Fixing names and values without also recording what _wasn't_ built (the color
map, the duration tokens, the responsive gutter) would just move the drift
somewhere quieter, so those are marked rather than deleted. Scripting the link
check follows the precedent set by the contrast audit: a consistency rule that
isn't machine-checked degrades the moment attention moves on.

**Deliberately unchanged.** No visual or behavioural change to the site — this
pass only touched documentation, comments, two build-script constants, and the
new checker. Component-level duplication (`DiffCell`/`Row`/`ROW_COLS`/the speed
banner living in two files), the missing `Button` primitive, the hand-assembled
type call sites, and the dead tokens are all **identified but not yet fixed**;
they need code changes and are sequenced as follow-up work. The
[05_roadmap](05_roadmap.md) status block and Phase 5 checkboxes were corrected in
the same pass. Historical entries were **not** rewritten — [D-024](#d-024)'s
description of a README that has since been replaced stands as a dated record.

---

## 2026-07-29 — Session 4 (deployment · docs polish)

<a id="d-030"></a>

### D-030 · Deployed to Cloudflare Workers as a static-assets SPA — **Firm**

**Decision.** Shipped the MVP to **Cloudflare Workers as a static-assets single-page app** — no Worker script. `wrangler.jsonc` sets `assets.directory: "./dist"` and `assets.not_found_handling: "single-page-application"`, so deep links (`/compare/<p1>/vs/<p2>`, `/credits`) serve `index.html` and React Router (data mode) renders the right page client-side. `vite build` emits everything — including the vendored `public/sprites/` + `public/artwork/` — into `dist/`, which Wrangler uploads as static assets (edge-cached, free, and not counted against the Worker request limit — [D-002](#d-002)). Live at **https://statmon.noahparknguyen.workers.dev/**. Also set `index.html`'s `og:url` / `og:image` / `twitter:image` to **absolute** production URLs (scrapers require it), closing the old `TODO(deploy)` from [D-026](#d-026).

**Why.** The app is a client-side SPA ([D-022](#d-022)), so an assets-only deploy is the smallest, cleanest way to ship it: no server code, and the images need zero special handling. I chose this over React Router **framework/SSR mode** ([D-005](#d-005)) for launch because SSR's main win is per-route `<title>`/meta, which the MVP doesn't need (the site-level OG/meta is set). Framework mode stays the documented end-state and drops onto the same data-mode routes if per-comparison social unfurls or SEO ever justify it. Researched against the current Cloudflare Workers static-assets docs.

---

## 2026-07-29 — Session 3 (mobile per-stat layout · launch leftovers)

<a id="d-029"></a>

### D-029 · Mobile per-stat cards implemented + launch leftovers closed — **Firm**

**Decision.** Implemented the [D-010](#d-010) mobile collapse: both the center
`ComparisonCard` (the tool) and Home's `FeaturedComparison` swap their mirrored
5-column `ROW_COLS` grid for stacked **per-stat cards** below `md` (768px), each
showing **P1's bar+value above P2's bar+value** for one stat, a header row with
the stat label and a **vertical caret Δ** (bars are stacked, not side-by-side,
so the left/right carets used at desktop width don't apply), and **no
horizontal scroll**. The desktop (≥768px) mirrored grid is untouched — both
components gate the existing row block with `hidden md:block` and add a
sibling `md:hidden` per-stat stack. The shared card/row/diff markup was pulled
into one new file, `CmpStatCard.jsx`, imported by both components rather than
duplicated — the same split already used for `TypeBadge.jsx`. Also closed the
two small launch-pass leftovers: a root **MIT `LICENSE`** (matching
`package.json`'s new `"license": "MIT"`) and a plain-text **"Built by Noah
Park-Nguyen"** credit in the shared footer (`Layout.jsx`), alongside the
existing PokéAPI/fan-project attribution and GitHub link.

**Follow-up fix.** Home's heads row (sprite + name + type badges, flanking the
STAB pills) also stacks below **`md` (768px)** — centered as a group — rather
than staying a cramped 3-column grid down to the smallest widths; single-word
names like "Volcarona"/"Chandelure" can't wrap, so they were truncating with
"…" in the narrow range below the board's `max-w-2xl` cap. Unifying this with
the stats block's existing `md` breakpoint means the whole board now flips
from stacked to grid at one consistent width.

**Why.** A side-by-side five-column layout is unreadable at phone widths — the
two `1fr` bar columns and the 3.25rem diff column get crushed under ~375px.
Stacking P1-over-P2 per stat keeps every comparison glanceable with zero
scroll, reuses the exact same stat data/math (`STAT_ORDER`, `statPct`,
`typeColorVar`), and — per [D-019](#d-019)'s spacing rules and
[06_style_guide §12](06_style_guide.md)'s token discipline — the new cards use
only existing tokens/utilities (`text-overline`, `text-caption`, `text-diff`,
`border-border-subtle`, `bg-elevated`), no new raw values. Keeping Home and the
tool on one shared `CmpStatCard` component preserves the cross-page visual
consistency called out in [D-023](#d-023). Resolves the last open item on
[D-010](#d-010) and the mobile-layout line in
[05_roadmap Phase 4](05_roadmap.md).

---

## 2026-07-28 — Session 2 (Phase 3.5 routing · Home/Credits · vendoring · meta · a11y)

<a id="d-028"></a>

### D-028 · Force-emit tokens with `@theme static` — **Firm**

**Decision.** `src/index.css` uses **`@theme static`** rather than plain `@theme`.

**Why.** Tailwind v4 **tree-shakes theme variables** it doesn't see referenced by a scanned utility class. Statmon consumes many tokens — especially the 18 **`--color-type-*`** — only through **inline `var(--color-…)` in JS** (`typeColorVar`, `typeTextVar`, bar fills), which the class scanner never sees. Under plain `@theme` those vars survived only _incidentally_, because the old StyleGuide contained literal `bg-type-*` classes. Rebuilding StyleGuide to use `<TypeBadge>` (inline `var()`) removed the last class reference, so Tailwind dropped every type-color variable and **type colors vanished app-wide** (Home, Compare, /style). `@theme static` forces every token to emit regardless of class usage — the correct posture for a token system that references tokens via inline styles. Trade-off: a marginally larger `:root` (all tokens emitted), negligible. Surfaced while rebuilding the [/style page](../src/pages/StyleGuide.jsx) to render real components.

<a id="d-027"></a>

### D-027 · Type-color contrast audit → AA — **Firm**

**Decision.** Ran a full WCAG contrast audit and fixed the failures so every text/graphic pairing meets AA. Built a **reproducible checker** — `scripts/contrast-audit.mjs` (`npm run audit:contrast`) parses the real `--color-*` tokens from `index.css` (resolving `var()` chains) and computes ratios for four pairing groups: semantic text on each surface, type color as diff-number text, type badge labels, and stat-bar fill vs. track. Kept as a regression tool.

**Findings + fixes.** Passing already: `primary`/`secondary`/`accent` text (7–18:1) and all 18 type colors as **bar fills** vs. the track (non-text ≥3:1). Three failures, all fixed:

- **`tertiary` (+ `diff-tie`) text** was ~3.4–4.0 (needs 4.5) — used for all small overlines/captions/labels. Bumped `neutral-500 → neutral-400` (now ~5–6:1).
- **Type badges** — the 5 mid-luminance types (fighting, poison, ghost, dragon, dark) used _white_ text at ~3.5–4.0. Those colors score far better with **near-black text** (~4.4–5.2), so `typeTextVar` now returns dark text for **all** badges (uniform; supersedes the split light/dark scheme).
- **`dragon`** was the lone color failing as both badge and diff-number text; nudged lighter **`#8556ff → #9268ff`** to clear both (bars only improve).

**Result.** `npm run audit:contrast` reports **all pairings pass** (text ≥4.5, non-text ≥3.0). Resolves the ⚠ from [04_design §3](04_design.md); refines the diff-color choice in [D-023](#d-023) and the palette in [D-012](#d-012).

<a id="d-026"></a>

### D-026 · Meta/favicons + an HTML-rendered social image — **Firm**

**Decision.** Wired the full **favicon set** (favicon.io: svg/ico/16/32/apple-touch + web manifest + `theme-color` `#0b0c0f`) into `index.html` and branded `site.webmanifest` (name/short_name/description, dark theme + background). Added a blunt `description` plus **Open Graph** and **Twitter** (`summary_large_image`) tags. The **OG image is generated from HTML** rather than Figma: `docs/og-image.html` renders a clean centered lockup — favicon + "Statmon." wordmark + subtitle — using the site's own fonts/tokens, in **two exactly-sized frames** — OG **1200×630** and GitHub social **1280×640** — exported by hand via DevTools "Capture node screenshot" (OG → `public/og-image.png`; GitHub → repo Settings → Social preview).

**Why.** Rendering the social image from the same CSS/fonts as the site guarantees brand consistency and keeps it version-controlled and tweakable — the same HTML→image approach Vercel-OG/satori automate; a manual screenshot is fine for a one-off. 1200×630 is the OG/Twitter/Slack/Discord standard; GitHub prefers 1280×640 (2:1). **TODO(deploy):** `og:url` + `og:image` must become **absolute** production URLs for scrapers (flagged inline in `index.html`); truly per-route titles/meta arrive with framework/SSR mode at deploy.

<a id="d-025"></a>

### D-025 · Images vendored + committed to the repo (CC0) — **Firm**

**Decision.** Executed the image vendoring from [D-002](#d-002). `scripts/vendor-images.mjs` downloaded all **2,513** images from `PokeAPI/sprites` → **`public/sprites/{id}.png`** (1,256 pixel sprites, kept as PNG) + **`public/artwork/{id}.webp`** (1,257 official-artwork, resized ≤475px, WebP q82). `pokemon.json`'s `spriteUrl`/`artworkUrl` were rewritten to local paths and `build-data.mjs` now emits local paths on future runs. The vendored assets are **committed to the repo** (not git-ignored). This closes [D-001](#d-001)'s "no runtime dependency" goal for images too — zero `raw.githubusercontent` hits at runtime.

**Why.** `PokeAPI/sprites` is **CC0 1.0** (public-domain dedication) — redistribution, modification, and commercial use are expressly permitted — and PokéAPI's fair-use policy actively _encourages_ self-hosting over hotlinking. The assets are **static**, so committing them adds no meaningful git-history churn and keeps the Cloudflare deploy fully self-contained (no build-time GitHub dependency; ~34 MB one-time). **Caveat (not legal advice):** the images remain © The Pokémon Company — CC0 covers PokéAPI's contribution, not TPC's underlying copyright/trademark (the license file says as much) — so Statmon relies on the same fan-use tolerance every PokéAPI-based project does, with the unofficial-fan-project disclaimer in the footer + Credits. Licensing details in [02_research §11](02_research.md).

<a id="d-024"></a>

### D-024 · Full polish & accessibility review — **Firm**

**Decision.** A professional pass over the whole app once the core (comparison + routing + Home/Credits) landed, in the spirit of [D-020](#d-020).

**Changed.** Added a **skip-to-content link** + `main#main` landmark to `Layout`; an **sr-only heading** on the Home featured board (`Example comparison: Volcarona vs Chandelure`) so screen readers get context for the stat dump; applied the Home mascot-art polish (explicit token values, `decoding="async"`, consistent `-translate-x` sign); refreshed the stale **`StatBar` comment**; and **brought the README fully current** (routing, Home at `/` and Compare at `/compare`, new files, `D-001…D-024`, React Router v8, updated status/structure).

**Confirmed clean.** Token discipline (components reference tokens, never raw hex/px; shadows use `rgba` literals by existing convention); decorative-image a11y (`alt="" aria-hidden` on the Home illustrations, favicon, and search sprites; descriptive `alt` on card art + in-card sprites); combobox/listbox ARIA on search; visible `:focus-visible` rings; `prefers-reduced-motion` honored (incl. the CSS `animate-grow-w`); one `<h1>` per page + sane heading order; landmarks (`header`/`nav`/`main`/`footer`).

**Outstanding (tracked to Phase 4 / launch).**

- **Full 18-type color-contrast audit** (the ⚠ from [04_design §3](04_design.md)). Watch item: `--color-tertiary` (`#6b7280`) on `--color-base` (`#0b0c0f`) is ≈ 4:1 — under WCAG AA 4.5 for small text (labels/overlines/captions). Resolve system-wide in the audit rather than per-component.
- **Per-route `<title>`/OG meta** and **focus/scroll reset on navigation** — land with the meta pass + framework/SSR mode.
- ~~Delete dead `src/components/ComparisonReferee.jsx`~~ — **done** (was a re-export stub with no importers).

<a id="d-023"></a>

### D-023 · Home = product-as-hero; Volcarona + Chandelure mascots; blunt suite copy; type-colored diffs — **Firm**

**Decision.**

- **Product-as-hero.** The Home hero **is** the product: a live, fixed featured comparison rendered by `FeaturedComparison.jsx` (**Volcarona vs Chandelure**, pulled from the real dataset via `getBySlug`), reusing the comparison tool's exact visual language (mirrored type-colored bars, type-tinted center diffs, the flame "Higher total +N" delta, the flame speed banner, and — in the head center — the attacker's **STAB** effectiveness as compact type-tinted pills). Bars grow in once on mount (pure-CSS `animate-grow-w`, no effect). **Volcarona + Chandelure are adopted as the site's pseudo-mascots**: their **pixel sprites sit inside the comparison cards**, while their **official-art illustrations peek out from behind** the board's left/right edges (soft drop-shadow, `lg`+ only) for a nostalgic feel.
- **Anti-generic direction.** I explicitly rejected the stock dark-SaaS hero — radial purple **glow**, gradient-fill wordmark, centered "one clear answer" pitch + twin pill CTAs — because those are the hallmarks of AI-generated sites (I flagged the glow specifically). The rule going forward: **derive the visuals from the product's own domain** (stat bars, type colors, the comparison mechanic itself), which no template can generically reproduce. Genericness comes from borrowing generic solutions; distinctiveness comes from the subject matter.
- **Blunt, suite-framed copy.** Home header **"Statmon."** + sub **"A simple set of Pokémon tools."** — frames the whole **site** (a small growing suite), not just the comparison tool. Each page H1 follows the same "Word**.**" motif with the accent dot (Compare page: **"Compare."** + "Visualizes the difference between two Pokémon."). No corporate/pitch language anywhere; the Home CTA is **"Try it out."**, and a "tools" row (Comparison live; Dex table / Type chart / Games — soon) backs the promise. The shared header pairs the flame Poké Ball **favicon** with the wordmark.
- **Gradient budget.** The Chandelure flame gradient stays reserved to the **two** spots the tool already uses it (BST delta + speed banner); Home reuses exactly those and adds none. Sparing use is intentional (my call: gradients OK if rare).
- **Type-colored diffs.** The center difference number + caret are now tinted with the **winner's primary type color** in **both** `ComparisonCard` (the tool) and the Home board — a readability + consistency win (supersedes the flat white `text-primary` diff from [D-020](#d-020)/[D-021](#d-021)).
- **Cross-page consistency.** Home, Compare, and Credits share one language: `bg-surface` panels + `border-border-subtle` + `rounded-lg`, type-colored bars, **solid** `TypeBadge` pills, Space Grotesk display, Inter/tabular stats, tertiary uppercase overlines.

**Why.** The comparison tool's own UI is Statmon's strongest, most specific visual asset — showing it beats a generic glowy "tell." Framing Home around the site (not one tool) sets up the suite. Honoring both of my favorite Pokémon (Volcarona mascot + Chandelure palette, [D-012](#d-012)) as mascots makes the brand personal. Process note: mockups were iterated as **standalone HTML** (real tokens/fonts/art) rather than the inline widget tool, which forbids the dark/gradient/glow this design needs.

**Suite roadmap firmed.** Near-term post-launch tools, in priority order: (1) **full-dex stats table** — sortable/searchable/filterable by stat, name, type (reuses the built dataset + the kept `StatBar.jsx`); (2) **type chart** — 18×18, dual-type aware (reuses `lib/typeChart.js`); (3) **type-advantage quiz game** (sits on the same type engine). All were already anticipated in [00_brainstorm §5](00_brainstorm.md); this promotes them to the concrete near-term backlog. See [05_roadmap Phase 6](05_roadmap.md).

<a id="d-022"></a>

### D-022 · Routing: React Router **v8**, data mode, URL as source of truth — **Firm**

**Decision.** Add **React Router v8** (`react-router`; v8 is the current major and a non-breaking "boring" upgrade over the v7 targeted in [D-005](#d-005)) in **data mode** (`createBrowserRouter` + `RouterProvider`), client-side only. Routes: `/` (Home), `/compare` + `/compare/:p1/vs/:p2` (Comparison), `/credits`, `/style` (the design-token playground), and `*` (404) — all under a shared `Layout` shell (sticky brand/nav header, `<main>` landmark, attribution footer). The comparison's **selection is derived from the URL each render (URL = single source of truth)**: the shareable path deep link when both slots are filled, a query param for a partial one-slot state, `/compare` when empty. Every pick / form-toggle / swap just `navigate`s (with `replace`) to the URL for the next state — so back/forward, manual edits, and shared links all work with no local selection state to sync. Slugs resolve synchronously via `getBySlug` (the dataset is a static import).

**Why.** Data mode is client-side today (satisfies [D-013](#d-013)'s "defer Cloudflare/SSR to Phase 4") **and** framework mode is literally "data mode packaged as a full-stack framework," so its loader/data-route patterns are the smoothest migration onto the [D-005](#d-005) Cloudflare/SSR end-state — the eventual server slug-resolution drops into a route loader with no restructure. v8 chosen over v7 because it's the current release, the upgrade is non-breaking, and the project already meets its baselines (React 19.2.7, Vite 8). URL-as-source-of-truth is the idiomatic data-mode pattern and eliminates the state/URL desync bugs that a local-`useState` mirror invites. Research: [02_research §10](02_research.md).

**Also (cleanup):** `App.jsx` now just mounts `<RouterProvider>`; the old page-level `Statmon.` header moved into the shared `Layout` header, and `Compare` gained its own `<h1>` ("Compare Pokémon").

---

## 2026-07-27 — Session 0 (planning & research)

<a id="d-021"></a>

### D-021 · Keep magnitude + caret diffs (not signed); dex for forms — **Firm**

**Decision.** Keep the comparison difference as a **magnitude + a caret pointing to the winner** (all-positive numbers), rather than switching to **signed-from-Pokémon-1** values (+/−). Considered signed because P1 is an explicit subject (attacker), which would give a consistent P1-relative reading — but the caret already provides a consistent, glanceable "who + by how much," a caret is more legible than a small minus sign, all-positive numbers read lighter, and signed would force a wall of negatives for weak attackers and turn the clean **"Higher total: {leader} +N"** headline into an awkward negative. Net: signed didn't add enough to justify the cost. ("Don't break what works.")

**Also (minor polish):** alternate forms now show their **species' National Dex number** (form entries have synthetic ids > 10000, so I read the dex from the group's default form) — e.g. Charizard Mega X → #0006; and the comparison row's stat-label caption was nudged up a few px for breathing room.

<a id="d-020"></a>

### D-020 · Diff cell shows stat label; consistency + a11y + docs review — **Firm**

**Decision.** Each comparison row's center cell shows the **signed difference** (`+N`) **on the row centerline, aligned with the flanking bars** (same data line), with the **stat label as a caption above** it and the caret in a fixed side slot. (Best practice: same-tier data shares a baseline; the label is a caption/header.) To give the caption room, stat rows were bumped 32→**36px** in both cards, so the card total is now **568px** (top 272 + stats 240 + footer 56) — this supersedes the 544/32px figures in [D-019](#d-019). Completed a review pass:

- **Tokens:** tokenized the on-art bar track as `--color-track-glass` (was `bg-white/15`); confirmed every color/size across components references a token (type/effectiveness colors go through `color-mix` on the type vars).
- **Accessibility:** added `<main>` and `role="search"` landmarks; heading semantics (Pokémon names as `<h2>`, an sr-only "Comparison" `<h2>`); proper `combobox`/`listbox`/`option` ARIA + a "No matches" state on search; global pointer cursor for buttons; verified alt text, focus rings, keyboard nav, reduced-motion.
- **Docs:** refreshed [04_design §5](04_design.md) (current three-card layout) and [06_style_guide §3](06_style_guide.md) (new token) to match the built UI.

**Why.** I wanted the label back for at-a-glance row identity, plus a professional consistency/accessibility bar before continuing to the rest of the project.

<a id="d-019"></a>

### D-019 · Spacing & hierarchy pass (proximity rule, 8pt rhythm) — **Firm**

**Decision.** Rework card spacing on an **8pt vertical rhythm** using the **proximity rule (internal ≤ external)**: tight gaps (~4–8px) inside a label→value group, generous gaps (~16px) between groups (summary vs. matchup, stats vs. footer). Content never touches a divider or the card edge — added top/bottom padding around the BST divider and the speed banner. Stat rows bumped to 32px; both card types share one spec (top zone 272 + stats 216 + footer 56 = 544) so they stay equal-height and row-aligned. Hierarchy is carried by size + weight + color **and** reinforced by spacing (labels muted/tracked overlines; values prominent).

**Why.** The UI felt "claustrophobic" because gaps were uniform, so nothing grouped, and stats butted against dividers. Per spacing/typography best practices, hierarchy collapses when everything sits too close; grouping is communicated by _relative_ spacing. See [06_style_guide §6](06_style_guide.md). Refines the card work in [D-017](#d-017)/[D-018](#d-018).

<a id="d-018"></a>

### D-018 · Comparison card v2 + type matchup + swap + art tuning — **Firm**

**Decision.**

- **Type matchup** in the comparison card: P1 is the **attacker**, P2 the **defender**; show each of the attacker's **STAB** types and its damage multiplier vs the defender's full typing (handles dual attacker types = two STAB lines, and dual defender types = up to 4×/¼×/0×). Chart is hardcoded in `src/lib/typeChart.js` (canonical, static Gen-6+ data).
- **Swap button** flips P1 ↔ P2 (and thus attacker/defender).
- Comparison card **difference numbers are centered** (magnitude dead-center, caret in a fixed side slot); the redundant BST-delta row is removed and replaced by a **full-width gradient speed banner** ("X moves first").
- **Artwork tuning:** fixed **square footprint** (full card width, `aspect-square`, `object-contain`), lowered `1.75rem` from the top, with a lighter scrim so the art shows through behind the bars — consistent across the varied 475×475 source canvases.

**Why.** Type advantage is central to actually choosing between two Pokémon, so it belongs in the core (pulls the V2 type-effectiveness idea forward). Centered diffs read cleaner and align down the middle; the speed banner reuses space the redundant total occupied. The square-footprint art is the standard way to normalize inconsistent subject sizes. Extends [D-017](#d-017). See [04_design §5](04_design.md).

<a id="d-017"></a>

### D-017 · Comparison UI: hero-backdrop cards + form chips + comparison card — **Firm**

**Decision.** Each Pokémon renders as a **card with its artwork as a scrim'd backdrop** (the art emerges from behind the name and stat bars, with a gradient fade to the card color for legibility). Alternate forms appear as **toggle chips under the portrait** for instant swapping. The center column is a **full comparison card** (higher-total summary where the art would be + per-stat mirrored bars + speed verdict), not a thin referee.

**Why.** The accidental "art behind the bars" depth looked good, so I made it intentional (scrim keeps text readable). A full-weight center card balances the three columns far better than a sliver; I'm fine with stats appearing more than once. Refines [D-007](#d-007) (bars stay; the middle is now a card, not a referee) and realizes the form-switching from [D-003](#d-003). See [04_design §5](04_design.md).

<a id="d-016"></a>

### D-016 · Build-script fetch politeness — **Firm**

**Decision.** `scripts/build-data.mjs` fetches PokéAPI at a **configurable rate cap (default 5 req/s, `RPS` env override)**, with an **on-disk response cache** (`.cache/pokeapi`, git-ignored) so re-runs hit the network zero times for seen URLs, **retries with exponential backoff**, and an **identifying User-Agent**. The script is run manually, only when adding a data field/feature or when a new generation ships.

**Why.** PokéAPI dropped hard rate limits in 2018 but asks callers to keep frequency low ([02_research §1](02_research.md)); a steady 5 req/s is gentle on their static host while still completing the ~2,600-endpoint first run in one sitting (~9 min), and the cache makes iteration free. Implements the caching requirement of [D-001](#d-001).

<a id="d-015"></a>

### D-015 · Icons via react-icons; no emoji in UI — **Firm**

**Decision.** Use **`react-icons`** for all UI icons (Lucide set by default; other sets as needed). **No emoji** anywhere in the interface. First applications: the speed-verdict icon (`LuGauge`) and the diff-indicator carets (`FaCaretLeft`/`FaCaretRight`), replacing the earlier ⚡ / ▲ text glyphs.

**Why.** Emoji render differently per OS/browser and are a hallmark of unpolished "vibe-coded" apps; the site should read clean and professional. Vector icons are consistent, themeable via `currentColor`, and crisp at any size. Requires `npm install react-icons`. Codified in [06_style_guide §11](06_style_guide.md).

<a id="d-014"></a>

### D-014 · Language: start in JavaScript (reverses D-006) — **Firm**

**Decision.** Build the app in **JavaScript**, not TypeScript. Scaffold with `npm create vite@latest statmon -- --template react`.

**Why.** My preference is to keep the start simple and reduce ceremony while the project finds its shape. Trade-off acknowledged: I lose compile-time safety on the data schema/stat math and a portfolio TS signal; mitigations are JSDoc typedefs on the data model and disciplined token/util usage. Migrating to TS later is possible but is more friction than starting in TS — accepted knowingly. Reverses [D-006](#d-006).

<a id="d-013"></a>

### D-013 · Start plain Vite; defer Cloudflare & React Router — **Firm**

**Decision.** Begin with a **plain Vite + React (JavaScript)** app — no Cloudflare template, no React Router template. Add **React Router** when a second page/route actually exists, and the **Cloudflare Workers/Wrangler** layer when I'm ready to deploy. The end-state target from [D-005](#d-005) (React Router + Cloudflare) is unchanged; only the sequencing moved.

**Why.** Avoids configuring routing/SSR/deploy before anything needs them, keeps the initial repo minimal and easy to reason about, and lets each layer be added deliberately when its need is concrete. Revises the scaffolding approach in [D-005](#d-005); re-sequences [05_roadmap](05_roadmap.md) Phase 0.

<a id="d-012"></a>

### D-012 · Brand accent: Chandelure pastel-purple flame — **Firm**

**Decision.** The brand accent is a **pastel periwinkle purple** (`--accent #9AA0E8`) with a **purple→blue flame gradient** (`#7352E6` → `#9AA0E8` → `#A8C3DD`), derived from Chandelure's official artwork. Replaces the earlier Volcarona-ember orange. Volcarona stays the home mascot.

**Why.** My preference — purple (pastel) over orange — and Chandelure is the #2 favorite, so the palette now honors both favorites (Volcarona mascot + Chandelure colors) while keeping the "flame" thread. Pastel purple also suits the calm-tech minimalist tone better than a hot orange. Colors were lifted slightly from the authentic tones for contrast on the near-black background, and the accent is kept bluer/lighter than the purple-family type colors so it never reads as a type. Sourced hexes and rationale in [04_design §2](04_design.md); research in [02_research §7](02_research.md).

<a id="d-011"></a>

### D-011 · StatBars scaled to a fixed max of 255 — **Firm**

**Decision.** Stat bars fill relative to a fixed reference of **255** (the maximum possible base stat), not relative to the two selected Pokémon.

**Why.** A global scale means a bar's length means the same thing in every comparison, so users build intuition over time; a relative-only scale would make a 60 look "full" in one matchup and tiny in another. See [04_design §6](04_design.md).

<a id="d-010"></a>

### D-010 · Mobile layout: per-stat cards below 768px — **Firm**

**Decision.** Desktop (≥768px) uses the mirrored 5-column comparison grid; below 768px it collapses to **per-stat cards**, each showing both Pokémon's bars stacked with values and the Δ — no horizontal scrolling. Headers stack P1 above P2.

**Why.** A side-by-side five-column layout is unreadable on a phone; stacking per stat keeps every comparison glanceable without scroll and reuses the same data. Resolves the brainstorm's open mobile question. See [04_design §5](04_design.md).

<a id="d-009"></a>

### D-009 · Launch generation scope: all generations (1,025 Pokémon) — **Firm**

**Decision.** Ship covering the **complete National Dex — all 1,025 Pokémon** (as of July 2026), not a subset. The data pipeline stays generation-parameterized so future additions are trivial.

**Why.** A complete dataset makes Statmon a complete tool at launch and avoids a whole class of "why isn't X here?" gaps; the origin playthrough (Gens 1–5) motivated the project but shouldn't cap it. The extra cost is mainly sprite volume, which compression + lazy-loading absorb. Supersedes the earlier Gens-1–5 lean. See [01_spec §5](01_spec.md).

<a id="d-008"></a>

### D-008 · Typography: Inter (body + stats) + Space Grotesk (display) — **Firm**

**Decision.** **Inter** as the workhorse for body text and — with tabular figures (`tnum`) enabled — the stat numbers, so digits align in the difference column. **Space Grotesk** as the display face for the logo/wordmark, headers, and titles. Exact weights and sizes finalized in the design step.

**Why.** Inter is the consensus pick for numeric/data UIs (tabular figures, legibility at small sizes). Space Grotesk brings a modern "calm-tech" character with distinctive letterforms that pair well with Inter's neutrality — enough personality for the brand/mascot without hurting readability, and free on Google Fonts. See [02_research §5](02_research.md).

<a id="d-007"></a>

### D-007 · Core UI: horizontal type-colored bars — **Firm**

**Decision.** The MVP comparison uses horizontal bars color-coded by type, with a three-column layout (P1 · difference · P2). Radar/hex is deferred and optional.

**Why.** Bars are the most instantly readable form for "who's bigger on this stat," match the tool's speed-and-clarity goal, and avoid the complexity/ambiguity of radar for a two-way compare. See [00_brainstorm §2.3](00_brainstorm.md).

<a id="d-006"></a>

### D-006 · ~~TypeScript~~ → JavaScript — **Reversed by [D-014](#d-014)**

**Original decision.** Build in TypeScript. **Reversed** on 2026-07-27 — see [D-014](#d-014). Kept here for the record.

**Why (original).** The data schema and stat math benefit from types and it's a portfolio signal. I've since chosen to start simpler in JavaScript.

<a id="d-005"></a>

### D-005 · Routing & deploy: React Router v7 (SSR) on Cloudflare Workers — **Firm** _(scaffolding approach revised by [D-013](#d-013))_

**Decision.** React Router v7 in framework mode with SSR, deployed on Cloudflare Workers — as the **eventual** architecture. Note: per [D-013](#d-013) I do **not** scaffold from the official combined template up front; I start plain and add Cloudflare + React Router later.

**Why.** Officially supported as of 2026; Cloudflare now recommends Workers over Pages; SSR gives clean meta/OG tags and direct-linked comparisons. The end-state target is unchanged; only the starting point moved (see [D-013](#d-013)). See [02_research §4](02_research.md).

<a id="d-004"></a>

### D-004 · Normalize to modern six-stat schema — **Firm**

**Decision.** Use HP / Attack / Defense / Sp. Atk / Sp. Def / Speed everywhere; do not model Gen-1's single "Special."

**Why.** It's what PokéAPI serves, what players expect today, and it keeps every comparison consistent. The Gen-1 Special quirk is at most a trivia footnote. Resolves the brainstorm open question. See [02_research §3](02_research.md).

<a id="d-003"></a>

### D-003 · Megas & forms as first-class entries — **Firm**

**Decision.** Each Mega/alternate form is its own selectable data entry (own id/slug/stats), carrying a `forms` array of counterpart slugs and an `isDefault` flag.

**Why.** Mirrors how PokéAPI models varieties, keeps comparison logic uniform (every side is just a stat block), and satisfies the brainstorm's "switch between versions" goal without special-casing. See [02_research §2](02_research.md).

<a id="d-002"></a>

### D-002 · Self-host all images (sprites + artwork) — **Firm** _(refined 2026-07-27)_

**Decision.** Vendor **both** image types from the `PokeAPI/sprites` repo into my own assets — no runtime hotlinking:

- **Pixel sprites** — small icons used in the stats-table rows and the search dropdown. Tiny (~1–3 KB each).
- **Official artwork** — the large illustrations used in the comparison cards (one per Pokémon, flanking the comparison panel). Optimized to **WebP at ~475px** during the vendor step.

Both are served as **Cloudflare Workers static assets** and **lazy-loaded** (only the ~2 artworks in a comparison, and only sprites scrolled into view, ever download). Sprite/artwork URL fields in the data get rewritten to local paths; the ~3 pixel-sprite-less entries fall back to artwork (`spriteUrl ?? artworkUrl`).

**Why.** More reliable (no dependency on GitHub raw, which isn't a tuned image CDN), maximally fair-use-friendly, fully self-contained, and — confirmed against Cloudflare's current docs — **free**: static-asset requests are free and unlimited (don't count against the Worker's 100k/day) with unlimited bandwidth on the free plan; the only caps are 20,000 files (I'm at ~2,500) and 25 MiB/file (my images are far smaller). So self-hosting both costs $0; the only real trade-off is ~tens of MB of deploy storage, which WebP + sizing keeps modest. Since lazy-loading means artwork has no runtime-cost advantage when hotlinked, self-hosting is strictly better here. See [02_research §8](02_research.md).

<a id="d-001"></a>

### D-001 · Data strategy: build-time fetch → local JSON — **Firm**

**Decision.** Pull all needed PokéAPI data once via a re-runnable Node script, transform to a slim local schema, and serve that JSON statically. No runtime PokéAPI calls, ever.

**Why.** PokéAPI's fair-use policy explicitly asks for local caching, and the data is effectively static, so runtime fetching buys nothing but latency, fragility, and fair-use risk. Baking data in makes the site fast and fully self-contained. See [02_research §1](02_research.md).

---

## Open / Undecided (to resolve before or during Phase 1)

- **Project template specifics** — confirm the exact official Cloudflare + React Router starter and its current state at scaffold time (D-005 sets direction; pin the concrete template when I init).
- **Styling approach within Tailwind** — how type colors are wired (Tailwind theme extension vs. CSS variables driven by the data map).
- ~~Mobile layout strategy~~ — ✅ resolved in [D-010](#d-010) (per-stat cards under 768px).
- **Testing depth for MVP** — how much of Vitest/Playwright lands in V2 vs. later.

---

_Template for new entries:_

```
### D-0XX · <short title> — <Firm | Provisional>
**Decision.** <what>
**Why.** <reasoning, trade-offs, links to research>
```
