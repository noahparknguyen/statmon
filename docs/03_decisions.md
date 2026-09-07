# Statmon — Decisions (Step 3)

_A dated log of what's decided and **why**. The highest-value doc for a solo dev: six weeks from now, "why did I pick X over Y?" is answered here instead of re-litigated. Newest entries at the top. Entries marked **Provisional** are current leans pending a build-time gut-check; **Firm** are settled._

---

## 2026-09-07 — Session 29 (a check for the trap, Home's cameos, two things that move, a picker that is a page, and a voice)

<a id="d-131"></a>

### D-131 · The pre-deploy review — what it found in files nobody had opened — **Firm**

A last pass over the whole repository, including the setup files no session had
touched. Four real defects, and the two worst were in the checks themselves.

**`audit:contrast` could not fail.** It printed `── N failure(s)` and then fell
off its last line with an **exit code of 0**. It has been advisory-only since
[D-027](#d-027) — through [D-058](#d-058), where a real pairing failed AA on 17
of 18 types and was caught by a person reading the output rather than by the
build. `npm run check` and CI would have gone green with WCAG failures on
screen. It sets `process.exitCode` now, verified both ways: a clean tree exits
0, and a fill raised to 60% exits 1.

**The audit restated two constants the app owns.** `0.28` and `PANEL_TINT = 10`
were copies of `DexRow`'s `FILL_ALPHA` and `gameChrome`'s `TINT`, so changing
either in the app left the audit validating a colour the site no longer paints —
and passing. Both are read from source now, the way `--hero-scrim` already was,
and a constant it cannot find is a hard failure rather than a default.

**Every lazy route warned in the console.** React Router had no
`HydrateFallback`, so 14 of 15 pages logged a warning to every visitor who
opened devtools. There was no white flash to fix — `body` carries
`--color-base` and `color-scheme: dark` from the stylesheet before any
JavaScript runs — but the state was undeclared. It is a component of its own
now, for the reason `toolKey.js` is: `react-refresh` requires a module defining
a component to export only components.

**`vite.config.js` described a test suite from two years ago**, claiming tests
were pure logic and "anything that needs a browser is verified by hand". Neither
half is true: `routes.test.jsx` server-renders every route, and layout is
measured by `sweep:widths`.

**Security headers, which the site had none of.** `public/_headers` ships a CSP,
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and
`Cache-Control` for the immutable assets. The policy is unusually strict because
the site earned it — nothing is fetched from anyone at runtime — and it contains
**no `'unsafe-inline'`, not even for styles**, which looks wrong and is not:
React assigns style properties through the CSSOM, which `style-src` does not
govern.

That was measured in both directions, and the first measurement was worthless:
the harness listened only to `Runtime.consoleAPICalled`, and browser-emitted
messages — CSP refusals, failed subresources — arrive on `Log.entryAdded`. It
reported "clean" for a policy that should have broken the site. With `Log`
enabled, tightening `img-src` to `'none'` lights up every route, and the shipped
policy still reports zero violations on all fifteen.

_Unverifiable from here, and stated rather than assumed: whether Cloudflare's
static-assets runtime applies `_headers` for a Workers deployment. The file is
inert if not — it costs nothing and breaks nothing — but the headers should be
confirmed on the live origin after the first deploy._

**Also swept and clean:** a nine-point accessibility audit across all 17 routes
(one `h1`, no skipped heading levels, every image with alt or `aria-hidden`,
every control named, every input labelled, no positive `tabindex`, no dangling
`aria-labelledby`, no duplicate ids, title and lang present) — zero findings.
No sourcemaps or stray files in `dist/`. Three exports nothing imported, made
private.

---

<a id="d-130"></a>

### D-130 · The dual-type gradients stop being muddy — **Firm** _(refines [D-107](#d-107), [D-115](#d-115))_

**Reported as** "by themselves the colours look fine, but some gradients look
muddy — an odd greyish middle."

**Correct, and it was about a third of every dual-type surface.** Two type
colours are frequently near-complementary in HUE — bug against dragon is
yellow-green against purple, grass against poison is green against magenta — and
a straight line between opposite hues passes close to neutral. The stops held
each colour to 25% and blended across the **middle half**, so that neutral zone
was enormous.

Measured over the 65 pairs whose midpoint loses more than a quarter of its
chroma, as a fraction of the surface that is visibly desaturated:

| stops         | blend zone | mean muddy width |
| ------------- | ---------- | ---------------- |
| 25 / 75 (was) | 50%        | **29.7%**        |
| 40 / 60       | 20%        | 11.9%            |
| **45 / 55**   | **10%**    | **5.9%**         |
| hard split    | 0%         | 0%               |

**45/55.** The seam stays soft — a hard edge would alias badly on the arena's
135° diagonal — and there is simply far less of it. It is also what
[D-107](#d-107) said it wanted in the first place: "two colours with a seam
rather than a wash that is neither". 25/75 never delivered that.

**Interpolating in oklab was measured and rejected**, which is the part worth
recording because it is the opposite of the standard advice. Perceptual
interpolation fixes gamma-induced darkening; that is not what is happening here.
Opposite hues pass near grey in **any** rectangular space, and across all 153
pairs oklab came out slightly **worse** — 29.9% mean chroma loss against sRGB's
26.4%, with 77 bad pairs against 65. `oklch` would arc around the hue circle and
stay saturated, but it would sweep through hues belonging to neither type, and a
green midpoint on a Pokémon with no Grass in it says something false on a site
about types.

**The contrast audit is unaffected and still correct.** Groups 11 and 12 check
the 50% midpoint, which is the worst colour along the gradient and is unchanged
by moving the stops — only how much of the surface sits near it changed.

_The first version of the measurement was wrong and said so: it compared every
sample against the AVERAGE of the two endpoints, which punished any pair whose
colours differ in saturation and reported a hard split as 18% muddy. A hard
split never blends. Mud is chroma falling below what the endpoints imply at that
point, not below their mean._

---

<a id="d-129"></a>

### D-129 · A nav click is not a Back — **Firm** _(corrects [D-087](#d-087))_

**Reported as** "should clicking the logo or a nav link take you back to the top?
Right now navigating between pages remembers where your scroll bar was."

**It did, and that was [D-087](#d-087) fixing a real bug the wrong way round.**
Every control on this site navigates — the URL is the single source of truth
([D-022](#d-022)), so picking a Pokémon, swapping, choosing a generation or
toggling a type is a `navigate()` — and each minted a fresh history key with no
saved position, whose fallback is scrolling to the top. The board you were
reading jumped away on every click, measured at **327px to 0**. Keying
`ScrollRestoration` by TOOL rather than by history entry stopped that.

**But it made every return to a tool a restore.** Clicking "Dex" after reading
5,000px of it put you back at 5,000px — which no browser does for a fresh
navigation, and which reads as the page having failed to load at the top. Back
should restore; a link click should not, and the tool key could not tell them
apart because `getKey` never sees the navigation type.

**So the two cases are separated at the source instead.** Every in-tool
navigation on this site is a `replace` — all nine of them — and each now carries
`preventScrollReset`, which is the mechanism for exactly this. Keying goes back
to the default per-entry `location.key`. A nav link, the wordmark and a link out
of a game are ordinary navigations and land at the top; Back and Forward restore.

**Measured in a browser rather than reasoned about**, because scroll position is
not something a server render can answer:

|                       | before   | after              |
| --------------------- | -------- | ------------------ |
| Deep in `/dex`        | 5000     | 5000               |
| An in-tool sort click | 5000     | **5000** — no jump |
| Nav to `/compare`     | 0        | 0                  |
| Nav back to `/dex`    | **5000** | **0**              |
| Browser Back          | 4000     | 4000               |

**The invariant is guarded at the source**, since a `navigate()` that forgets
the flag reintroduces D-087's jump on one control and nothing would say so: a
test asserts every `replace: true` is paired with `preventScrollReset: true`,
and that `ScrollRestoration` carries no `getKey`.

_`toolOf` stays, and is now used only by the focus announcement it was also
written for — a state change is not a page change, whatever the pathname does._

_Two false alarms while measuring, both the harness: `focus()` on an input
scrolls it into view, which looked exactly like the jump returning; and a
one-line `sed` mutation silently matched nothing after Prettier split the object
across lines, which looked exactly like a vacuous test._

---

<a id="d-128"></a>

### D-128 · Closing the V2 list — what will not be built, and why — **Firm**

The fast-follow list in [01_spec §2.2](01_spec.md) has sat half-open since
launch. Everything on it is now either shipped or closed, because an item nobody
has decided about reads as an item nobody got to.

**Shipped this session:** the `/compare` bar animation
([D-124](#d-124)), random matchup ([D-123](#d-123)), and the About page
([D-118](#d-118)).

**Closed as won't-do, each for a reason rather than for lack of time:**

- **Attacker-identity read (physical vs. special).** The board already answers
  it without a label — Attack and Sp. Atk sit two rows apart with a tinted
  difference between them, so which one matters is read off the bars. A badge
  saying "physical attacker" would be a second, coarser statement of what six
  rows already show, on a card whose whole design history is about removing
  duplicate statements of the same numbers ([D-057](#d-057)).
- **Biggest-gap highlight.** Every difference cell already carries the winner's
  type colour and a caret. Emphasising one row further means a fifth weight on a
  scale [D-051](#d-051) deliberately keeps at one loud state and three quiet
  ones.
- **Search filters by type and generation.** `/dex` filters by any number of
  types and generations at once and every row links into `/compare`, so this
  exists — one page over, with more power than a dropdown on a search field
  would have had. Building it twice is the duplication
  [06_style_guide §12](06_style_guide.md) rule 8 exists to prevent.
- **Recently-compared list.** The only item here the site genuinely cannot do
  another way, and the one that costs something real: it would be the first
  thing stored about a reader beyond the game record they can already clear
  ([D-098](#d-098)), in exchange for saving a search on a site whose search is
  two keystrokes.
- **Light-mode toggle.** Not a toggle: every token in `index.css` is dark-first
  and `npm run audit:contrast` validates exactly one theme across eleven
  pairing groups. A second palette means a second audit, and 04_design §2's
  type colours were tuned specifically for a near-black background.
- **The 24px desktop gutter** ([04_design §5](04_design.md)). The argument is
  where a gutter actually bites: above 1120px plus gutters the content is capped
  and centred, so the gutter is invisible; below that it is the only thing
  between content and screen edge, and 16px is right there. A responsive gutter
  would add a breakpoint-dependent value to every page wrapper to change nothing
  where it applies and cost 16px of width where space is tightest.
- **The selection cross-fade** ([04_design §7](04_design.md)), superseded rather
  than dropped. A cross-fade masks a change; the bar grow-in performs it — the
  bar travels to its new length, which is what changed ([D-124](#d-124)).

**Still open, and deliberately:** the copy-link button and a full keyboard audit.
Both are real, neither is a judgement call, and they belong to a session with
time to do the audit properly rather than to a checklist being cleared.

---

<a id="d-127"></a>

### D-127 · A selection can be removed — **Firm**

**Reported as** "we don't have the option to remove the selected Pokémon —
I know you can search for another or refresh, but sometimes you just want to
remove it."

**Decision.** Each filled card carries a **Remove** in its head, beside the type
badges.

**It is a navigation, not new state.** `compareUrl` already spells every
combination including the partial one-slot form, so clearing a slot is the URL
without that slug — which means Back undoes it, a half-filled board is still
shareable, and there is nothing to keep in sync ([D-022](#d-022)). The ability
goes with the Pokémon: `?a1=` for something no longer on the board is a dead
parameter, and `resolveAbility` would drop it on the next render anyway.

**Side by side with the badges, not stacked above them.** The head is a fixed
56px ([D-080](#d-080)) and two type badges already use 40px of it, so a third
stacked item overflows the band. A third column changes its height by nothing.

**28px**, which clears WCAG 2.5.8's 24px floor outright rather than through its
spacing exception — the harder way to pass, and the one `npm run sweep:widths`
does not have to argue about. **Always visible**, never hover-only: a control
that appears on hover is undiscoverable and unreachable on touch.

**Named after its Pokémon** — "Remove Volcarona", not "Remove". Two identical
controls on one board tell a screen reader nothing about which side they belong
to, which is why the two search fields and the two ability groups are named too.

_The `onClear` default is `null` and today guards nothing, because `/compare` is
the only caller. It is there so a read-only caller renders no control rather
than a disabled one — the rule [D-078](#d-078) set, and which
[D-111](#d-111) had to apply after a disabled button spent a release eating
clicks on the games index._

---

<a id="d-126"></a>

### D-126 · The copy pass — what came out, and what became a test — **Firm** _(applies [06_style_guide §14](06_style_guide.md))_

**186 user-visible strings** were inventoried — JSX text, `aria-label`, `alt`,
`placeholder`, group labels, and the `sr-only` text nobody had ever read back —
and audited against §14.1. `/style` is excluded: it is documentation for whoever
is building the site rather than copy for whoever is using it, and `robots.txt`
keeps it out of search.

**Cut or rewritten, each against a stated rule.**

- `/games`' closing line — _"Every round ends with a link into the tool that
  would have answered it — the point is to stop needing to look it up."_ True,
  and the argument for a game living on a reference site at all; also the site
  telling the reader why its own idea is good (rule 4). The rounds do it. The
  reasoning stays in [D-091](#d-091), which is where it belongs.
- **"Try it out" → "Open the comparison"**, which reverses a slice of
  [D-023](#d-023). It was the one string on the site written as a pitch rather
  than a description, and the other three sections all say "Open the …". What
  made the flagship distinct was never the verb — it is the mascots, the
  full-width board and its own section, and all of that survives.
- `/games/effective`'s empty state, **18 words to 9**, because its sibling says
  the same thing in eight (rule 7).
- **The footer's tagline**, which was Home's hero line with four words added —
  and on Home the two appeared on the same page.
- `/style` used both **"color" and "colour"** in its own prose.

**One control was saying two different things.** The alternate-forms chip is the
same `includeForms` field on three surfaces, and it read oppositely: the dex was
lit when forms were **hidden**, both game setups when they were **shown**. Same
component, same default, inverted polarity. Every other `FilterChip` on the site
is lit when a narrowing is applied, and hiding 234 entries is a narrowing — so
the games were the odd ones out rather than the dex, and all three now say "Hide
alternate forms" and light the same way.

**And two of the nine dex sort headers stuttered.** The full column name is
appended for screen readers because the visible label is an abbreviation and
WCAG 2.5.3 needs the accessible name to contain it — but `Name` and `HP` are not
abbreviations, so they read **"Name sort by Name"** and **"HP sort by HP"**.
Audible only, never seen, which is how it survived. The name is added only when
it says something the label did not.

**No `check:copy` script, and that is the finding.** Five of the eight things
this pass turned up were mechanically detectable, and the right home for them
was **tests**, not a new command: they read source files the way the existing
`index.html` ↔ `SITE_TITLE` assertions already do, they ride along with
`test:run`, and they give a precise failure instead of a report to read. What is
now asserted: the manifest, the tag and the app shell agree on the site's name
and description; the forms chip has one label and one polarity everywhere; the
sort headers do not repeat themselves; nothing shouts; and no word ships in two
spellings. The other three findings were judgement calls, and a linter for "does
this sentence earn its place" is a linter that cries wolf.

_The extractor's own bug was caught by the test it feeds: `>` in `=>` is not the
`>` of a tag, so it matched from an arrow through to the next `<` and reported a
chunk of `gameThumbs.jsx` as shouty copy. The same flaw was in the scratch
inventory, where it was read past._

---

<a id="d-125"></a>

### D-125 · The controls band reserves a chip, not a line of text — **Firm** _(applies [D-050](#d-050), refines [D-080](#d-080))_

**Reported as** "when a Pokémon has no forms a dash is placed instead, but when
they do have a form the FORM and ABILITY labels shift up a tiny bit."

**Measured: 4px and 3px.** The Form cell was **24px** with the em-dash and
**21px** with chips, and the band is on `items-baseline`, so both labels moved
when the taller cell shrank.

**The cause is that the placeholders are inline text and the chips are not.** A
chip is 21px by construction — `text-badge` is `leading-none`, so its line box
is the 11px font size itself, plus `py-1` and a 1px border each side. The
em-dash is a `<span>` in a block `<div>`, so its box came from the **inherited**
line-height (16px × 1.5 = 24px) and had nothing to do with the glyph in it. The
`text-caption` on it was never the number that mattered.

**[D-080](#d-080) reserved the row and not the box.** Its comment is right that
"what must not collapse is the labelled ROW, not the chips" — the row did hold
its space, it just held a slightly different amount of it, which is the harder
bug to see and the one that had shipped.

**Both placeholders, not just the reported one.** `AbilityChips` renders a
sentence rather than chips for the 14 entries with no abilities **and on every
Gen 1 or Gen 2 board**, where abilities do not exist yet ([D-073](#d-073)) — the
same 24-against-21 and the same shift, on a case nobody had reported. One
`CHIP_CELL` on the cell fixes both and leaves the chips to size themselves.

**The 21 is written down with its arithmetic** rather than left as a number, in
`chipStyles.jsx` beside the chip it is derived from.

**Reserving the cell was only half of it.** The band aligned its two columns on
`items-baseline`, so the label still took its position from whatever the cell
held — and a chip, a bare glyph and a chip row that WRAPS do not share a
baseline. Wrapping is the interesting one: a multi-line flex row takes its
baseline from its first line, which moves as the row grows, so Hydrapple's
three-chip roster nudged its label about a pixel. Small enough to look like a
rendering artifact, consistent enough to notice while browsing.

Both sides carry the reservation now and the grid aligns on `items-start`, so
the label's position is a function of the box alone. Measured across a no-forms
card, a Megas card, a wrapped three-ability roster and a Gen 1 board with no
abilities at all: **435.0 and 462.0 in every case**, where before it ranged over
435.0, 440.0, 440.3 and 444.0.

_The empty card has no band to reserve, and a test says so: `EmptyCard` merges
head, controls and portrait into one zone rather than mirroring the filled
card's three ([D-083](#d-083)). Without that assertion the guard above looks like
it is missing a case._

---

<a id="d-124"></a>

### D-124 · The tool's own bars grow in, and re-grow when they would move — **Firm** _(closes a [D-043](#d-043) leftover)_

**Decision.** `/compare`'s board animates its bars on mount, on both the desktop
rows and the phone's per-stat cards, and re-animates whenever the values change.

**Why it was outstanding.** Home's `FeaturedComparison` has grown its bars in
since [D-023](#d-023), and the tool it advertises rendered instantly — the last
of the roadmap's "partially shipped" items, and a preview that was livelier than
the product.

**A CSS animation runs on mount, so re-running it means a new element.** The
stats block is wrapped in a keyed `<div>`, which remounts the six rows.

**The key is the NUMBERS, not the slugs and not a counter**, and that is the
part worth keeping. It is precisely the condition worth animating on: the bars
re-grow when they would move, and stay still when something that does not touch
them changes. Selecting, swapping and moving the generation lens all change it;
**choosing an ability does not** — that re-renders this card, because it
re-scores the STAB chips above the stats, and it leaves the bars alone.

**Both surfaces.** Below `md` the per-stat cards are the only stats surface
([D-057](#d-057)), so animating the desktop board alone would have made the
phone the odd one out. `CmpStatCard` gained the same two branches `CmpRow` has —
written out rather than composed, because `--target` and `width` are different
mechanisms.

**And all three cards, which the first attempt missed.** The comparison card
animated and the two `PokemonCard`s beside it did not, so the board grew in
down the middle and sat still on either side — reported as "the animation
doesn't play for the left and right cards", which is exactly what it looked
like. Each side card keys on **its own** values rather than the board's: a card
re-animates when its Pokémon or era changes and holds still when the other side
changes under it, while the card between them keys on both, because both are
what it is comparing.

_The test that guards this is a count, not a `toContain`. The comparison card
alone renders 24 animated bars and the two side cards add six apiece, so the
assertion is a floor **above 24** — which is the difference between "something
on this page animates" and "the side cards do". The first version of it was the
former, and passed while the bug was on screen._

**The dex table still does not animate**, and a test now guards that: it windows
its rows, so rows mount continuously while scrolling and every one would animate
on arrival ([D-067](#d-067)).

---

<a id="d-123"></a>

### D-123 · Random matchup — **Firm** _(closes part of the V2 list)_

**Decision.** A `Random` button beside Swap on `/compare`, drawing two different
Pokémon from the pool that existed at the generation being read.

**It keeps the lens rather than ignoring it.** Drawing from the whole dex while
someone reads a Gen 1 board hands back two Pokémon Gen 1 did not have —
`parseAsOf` then validates the era against the new selection and silently drops
it, so the control would quietly undo the one you had set. Drawing from
`filterRows(ALL_POKEMON, { asof })` means "what existed then" is the identical
question here, on `/dex`, and in the games.

**Never disabled**, unlike Swap. An empty board is the state a random matchup is
most useful in — it is the only thing to do there besides type — where Swap
needs a selection to have something to turn around.

**The second pick steps over the first rather than redrawing until they
differ.** That is O(1), has no loop to bound, and cannot hang on an rng that
returns a constant — which a rejection loop would, and which a test asserts
directly.

_The `rng` is injected, like every generator on this site (lib/games.js), which
is what makes "always distinct" and "always in the era" assertable over 2,000
seeded draws rather than over whatever `Math.random` produced once._

---

<a id="d-122"></a>

### D-122 · The credits are two kinds of thing, so they are two columns — **Firm** _(completes [D-121](#d-121))_

**Reported as** "now there's a big empty gap in the middle — maybe move the
disclaimer there, or add the Poké Ball?"

**The gap was real**: a 384px brand block and a ~250px pair of link groups
cannot span 1120px however they are aligned, so about 480px sat empty between
them. Two suggestions were on the table and **neither is what shipped**, for
reasons worth recording.

**Not the disclaimer.** It is tertiary legal text. Moving it to the middle of
the upper block would make it more prominent than the links above it, which is
backwards — the reason it sits under a rule is that it is the least important
thing in the footer, not the most centred.

**Not a mark either.** A large Poké Ball would be the site's **third**
decorative exception, after Home's sprite wall ([D-070](#d-070)) and the arena
([D-096](#d-096)). Both of those have a written argument for why the decoration
does a job. A brand mark filling a hole does not have one; it would be
decoration hired to cover a layout problem, which is how sites acquire the
clutter this one exists to avoid.

**The gap wanted content, and there was content.** The one "Credits" column was
holding two unrelated obligations: **Data** the site fetched (PokéAPI, CC0
sprites) and the **fonts and icons** it draws with (SIL OFL, CC BY 4.0). They
come from different places, carry different terms, and a reader looking for one
is not looking for the other. Split, they fill the width with substance, and the
footer reads as four blocks across instead of two clusters and a hole.

_`Source on GitHub` moved up into "Fonts & icons" with them, which also thins
the bottom bar back to a legal line and a byline._

---

<a id="d-121"></a>

### D-121 · The footer spreads to both edges, and states two things it can prove — **Firm** _(refines [D-119](#d-119))_

**Reported as** "because the right side only has small lines of text, it looks
like the entire thing is off centred."

**The cause was even boxes holding uneven content.** Three `1fr` columns are
about 347px each; "Font Awesome" is 110px wide. So two of the three columns were
mostly trailing whitespace, all the mass sat in the left third, and the footer
had a left edge and a ragged middle rather than two edges.

**So the brand goes left and the link groups are pinned right**, which uses the
width and is the shape most footers converge on for exactly this reason. The
bottom bar mirrors it — one thing on each edge — and both changed together,
because the earlier complaint about that bar was never about the bar on its own:
it was two different arrangements stacked.

**Two facts were added to the left column, and both are read off the dataset.**
The entry count and the current generation come from `ALL_POKEMON.length` and
`CURRENT_GEN`, never typed. A footer that states a count is a footer that can be
wrong about one, and `npm run build:data` is the thing that would make it wrong
— silently, months later. A test asserts both against the dataset and fails if
either is hardcoded. It costs **486 bytes** and no new dependency: the dataset is
already in the eager chunk because Home is ([D-060](#d-060)).

**And one line about storage**, because it is a fact worth having and nobody
else will state it: no cookies, no analytics, and the only thing kept is the
game record ([D-098](#d-098)) in the reader's own browser. It survives
06_style_guide §14 rule 4 — describe decisions, never virtues — because it
describes a mechanism rather than claiming to be private.

_The test for it failed on a clean tree first: React's server renderer separates
adjacent text and expressions with an empty comment, so "Generation 9" arrives
as `Generation <!-- -->9` and never matched. Stripping those is what makes the
assertion about the text a reader sees rather than the markup around it._

---

<a id="d-120"></a>

### D-120 · Two attribution obligations, unmet since launch — **Firm**

**Found while asking what else belonged in the footer**, which is the only
reason either was found at all: nothing checks licences, and neither had ever
been visible on screen or in the repository.

**The fonts.** `public/fonts/` holds ten `.woff2` files vendored from Google
Fonts. Inter and Space Grotesk are both **SIL OFL 1.1**, and the OFL requires
the licence text to be distributed with the font software. The only `LICENSE` in
this repository was the project's own MIT. The two texts are in `licenses/` now,
and — the part that matters more — **`npm run vendor:fonts` fetches them
alongside the fonts**, and throws if what comes back is not an OFL. A licence
added by hand is one the next re-vendor silently drops.

**The icons.** `react-icons` is a wrapper, and each set keeps its original
terms. Almost every icon here is Lucide (ISC, no notice required), but the dex
table's four sort carets are **Font Awesome 6 Free**, which is **CC BY 4.0 —
attribution required**. Four carets were the whole exposure, and they were
credited nowhere. Font Awesome is in the footer's Credits column now; Lucide is
in `licenses/NOTICE.md` for completeness rather than on screen, because a
credits list containing everything is one nobody reads.

**`licenses/NOTICE.md` covers the rest**: the runtime dependencies whose MIT
banners a minifier drops, and Bulbapedia as the source the ability-effect table
was checked against — read rather than copied, so a courtesy rather than a
requirement.

_The footer's bottom bar also stopped being a `justify-between` row. It was the
one part of the footer ignoring the grid above it — the byline floated to the
far edge while every heading started on a column — so it spans two columns and
takes the third, and the whole footer reads on three verticals._

_And every outbound link in the footer now announces itself. The first test for
that allowed a slack of one and passed while the licence and notice links said
nothing; it asserts **every** external link, and that there are at least six._

---

<a id="d-119"></a>

### D-119 · The credits are the footer — **Firm** _(replaces [D-118](#d-118)'s credits section)_

**Reported as** "the footer is getting a bit crowded, everything is on one line
and the spacing feels off" — plus the better idea underneath it: put the credits
_in_ the footer rather than on a page.

**Decision.** A three-column footer — the wordmark and a line, **Tools**, and
**Built with** — over a rule carrying the legal line and the byline. The
attribution lives there on every route instead of on one page, and `/about`
loses its Credits section entirely.

**Why this is better than the page it replaces.** [D-118](#d-118) merged Credits
into `/about` on the argument that a three-card page was too thin to stand
alone. That was right about the page and wrong about the destination: the fix
for "nobody navigates to the attribution" is not a shorter trip to it, it is not
requiring a trip. PokéAPI's fair-use ask and the CC0 sprite credit are now on
every page that has a footer at all, which is what attribution is for.

**The crowding was the symptom of a footer doing two jobs in one row.** Six
items — a paragraph, a byline, three links — wrapped into a line that had to be
held apart by a `gap-y-3` chosen to satisfy WCAG 2.5.8's _spacing exception_,
because the links were bare 12px text with a ~17px hit box and only cleared the
24px rule by 3px. In columns they are 14px with `py-1`, which makes each row a
**~28px box that passes outright**. Passing a target-size rule by having targets
rather than by having gaps is the better way to pass it.

**A screen reader is told the footer links leave the site**, not just shown an
arrow: the icon is `aria-hidden` and each external link carries an `sr-only`
"(opens in a new tab)".

**The footer has an `sr-only` heading**, which is not decoration. Its two groups
are `<h3>`, and without an `<h2>` above them every page skipped a heading level
from its own `<h1>`. The Home test that counts sections is scoped to `<main>`
now rather than counting every `<h2>` in the document.

**`/credits` still redirects**, at `/about` rather than an anchor that no longer
exists.

---

<a id="d-118b"></a>

### D-118b · The About copy is the author's, not mine — **Firm** _(supersedes the draft in [D-118](#d-118))_

**Two drafts failed in the same direction before the obvious fix.** The first
read like release notes. The second corrected the register and was still an
impression of someone rather than the person — and the tell was the last
paragraph, which spent its ending on the Black & White team scattered around the
site. That is a good fact and it was in the wrong place: it made a tangent the
payoff, when the payoff is a sign-off.

**So the page is his own account**, edited only for grammar and repetition — a
duplicated "During", "over time" unglued, subject-verb agreement, "which types
were strong against which". Nothing was rewritten for style.

**One paragraph was added**, and it is the only addition: the generation lens.
Without it the story ends at "I built more tools", and the lens is the single
feature that came directly out of the replay the page opens with — the site was
describing Pokémon as they are now while he was playing them as they were. It
earns its place by belonging to the origin, not by being the cleverest thing
here.

**It is signed.** An About page on a solo site is signed work rather than a
section of a product, and the footer's byline is a credit where this is a person
ending a letter. 289 words.

---

<a id="d-118"></a>

### D-118 · An About page, the credits folded into it, and a written voice — **Firm** _(absorbs [D-023](#d-023)'s credits page)_

**Decision.** `/about` ships, Credits becomes a section on it, `/credits`
redirects to `/about#credits`, and the footer carries **both** links.

**Why merge rather than add.** A dedicated credits page is what a product with
heavy third-party licensing needs. This one was three cards and a disclaimer —
one of the thin pages this pass set out to fix — and the site had no page saying
why it exists at all, which for a project whose selling point is that it was
built for one person's actual problem is the page most worth having.

**Both footer links, one page.** The PokéAPI attribution and the CC0 sprite
credit are nearer obligations than content, and a reader looking for them scans
for the word "Credits". Hiding them behind a label that does not say it makes
them harder to find, which is the opposite of what attribution is for. Two
links pointing at one page costs nothing.

**`/credits` redirects rather than 404s.** It has been in the footer since
launch and in the nav before that ([D-094](#d-094)); a bookmark should not hit
the 404 for something that has only moved. A loader redirect, so the address bar
is corrected before anything renders.

**The voice is written down now, and that is the part with teeth.** 06_style_guide
gained a **§14**, because the copy pass that follows this had nothing to audit
against and would otherwise have been my taste with a checklist stapled to it.
The rules were derived from what the site already sounded like rather than
invented: every user-facing string on it describes a **mechanism rather than a
benefit** — _"See who's faster, hits harder, and is bulkier."_, _"The same data,
asking you the questions."_ — and not one claims the site is fast, clean or
minimal. There is exactly one joke, _"This page fainted."_, delivered flat and
never explained, and that is the calibration for humour.

**About is a stated, bounded exception to the site's terseness**, in the way
Home's sprite wall ([D-070](#d-070)) and the arena ([D-096](#d-096)) are stated
exceptions to 04_design §1. It gets paragraphs and a past tense because there
the prose _is_ the content.

**The first draft was wrong, and how it was wrong is worth keeping.** §14's
rules were derived from the site's UI STRINGS and then applied to a page that is
not UI. Under "say it once", "prefer a number to an adjective" and "describe
decisions", the page came out reading like release notes — a paragraph of
feature list, and a closing paragraph about a build-time verification gap that I
argued was the most credible sentence on it. It is, **to a developer evaluating
the project**. To someone who arrived from the type chart it is noise, and the
README already carries it for the audience that wants it.

So §14 splits into **14.1 the UI voice** and **14.2 the `/about` voice**, and
the second wants what the first forbids: hedges ("I'd say", "which I'd argue
still counts"), sentences that build on each other, conversational openers, and
the loose word over the precise one — "nostalgia trip", "HM mule". A solo
project has an opinion rather than a position, and the hedges are what make it
read as a person instead of a product.

**What a visitor wants from an About page** is three things: who made this, why
it exists, and one detail nobody would include unless it were true. So it ends
on the Black & White team scattered across the site — Volcarona and Chandelure
on Home, Krookodile on the type chart, Archeops and Beartic on the dex, Mienshao
and Samurott mid-round in the games — and on Beartic having been the HM mule,
which does more work than any claim the site could make about its own quality.
**336 words**, deliberately looser than the 250 the first draft aimed at.

---

<a id="d-117"></a>

### D-117 · The difficulty picker shows the games rather than describing them — **Firm** _(applies [D-043](#d-043), extends [D-108](#d-108))_

**Reported as** "the difficulty select page is probably the most boring — no
colours, interesting visuals, nothing."

**Decision.** Each preset card carries a **real round at its own settings**,
drawn with the game's own panels. Easy and Medium deal two contenders, Hard
deals four; the type game's three cards show a single defending type, a dual
type, and a Pokémon. Equal weight, no recommended option.

**Why this and not decoration.** [D-043](#d-043)'s rule is that a preview is the
tool's own components against real data, never a mockup, and the games index
already applies it one level down. The picker was the one surface advertising
something it did not show. Doing it with the real panels means the cards cannot
drift from the presets they start, and it costs **no new colour system** — the
vibrancy is `tintFor`, which these panels already had.

**What a thumbnail has to say is the SHAPE of the round, not its detail.**
Nobody reads a picker; they glance at it on the way to playing. Two panels
against four is the entire difference between Medium and Hard and it survives
being 80px wide, where a legible stat value would not. The type game's ladder
is the same idea: the tier IS the defender, so the right-hand panel changes
shape across the three cards and the difficulty explains itself.

**The thumbnails moved out of the games index rather than being copied.** The
index had two local ones; the picker needed the same thing per preset. Copying
would have produced a second set of pictures of the same three games, which is
the drift [D-043](#d-043) exists to prevent — so they are `gameThumbs.jsx` now,
parameterised by settings, and each round is drawn **once per settings object**
and remembered in a module-level map, so leaving the picker and coming back does
not quietly redeal it.

**Two fixed heights had to stop being fixed.** `ContenderPanel`'s `sm` size
carried `h-32`, which made a four-up thumbnail 256px of panels inside a 128px
band — it overflowed the card and painted over the label beneath it. The grid
owns the height now and the panel fills its cell, which is one number instead of
two that have to agree. `MatchupPanel`'s `sm` band was `h-0`: a reservation that
was never exercised because nothing at that size had ever revealed a typing, so
the hard tier's badges spilled straight out of the thumbnail's bottom edge.

_Caught by a test that was measuring the wrong thing: counting `/artwork/…`
anywhere in the page counts React 19's automatic `<link rel="preload">` as well
as the `<img>`, which made the medium tier appear to contain a Pokémon it does
not have. It counts images now — and `MatchupPanel` gained the `lazy` prop
`ContenderPanel` already had, so a thumbnail stops preloading artwork for a game
nobody has started._

---

<a id="d-116"></a>

### D-116 · A chosen game is a fact about the URL — **Firm** _(fixes [D-108](#d-108), refines [D-109](#d-109))_

**Reported as** "I think I accidentally removed the footer on the difficulty
select screen as well." Correct, and the footer was the visible end of a
structural problem rather than the problem.

**The footer could not be fixed where it broke.** `handle.bare` is declared per
ROUTE, and `/games/higher` is one route serving two things: a board sized to
fill the viewport exactly, and a difficulty picker that is an ordinary page.
Which one you are looking at lived in React state on the page — so `Layout`,
which renders the footer, had no way to ask.

**And the state could not be derived, because of a real bug underneath it.**
[D-108](#d-108)'s rule is _a bare URL asks; a parameterised URL plays_ — but the
Medium preset **is** the defaults, and defaults stay out of the URL, so choosing
it produced `/games/higher` and the page had to remember in state that you had
chosen. That state did not survive a reload: **picking Medium and refreshing put
you back on the picker**, and the link you copied did not carry the game. The
rule the picker's own comment states was false for one of its three presets.

**`?play` makes the invariant true by construction.** It is emitted only when
the settings would otherwise write nothing, so `/games/higher?stats=speed` stays
clean, and it is deliberately **outside `settingsKey`** — that string is what
the saved best streak is filed under ([D-098](#d-098)), and putting a marker in
it would orphan every existing record and make "did you press play" part of a
game's identity. With that, a chosen game always has a non-empty query, so
`started` is read off the URL by both pages and by `Layout`, through one
exported predicate rather than a second list of paths.

**A second bug fell out of the same state, and it was live.** `GameEffective`
set the flag in both `start()` and `play()`; `GameHigher` set it only in
`start()`, and its `play()` refused to navigate when the settings were
unchanged. From the picker the settings usually **are** the defaults — so
**Customise → Play left you exactly where you were**, and if you had changed
something the URL and the screen then disagreed. Both games now navigate when
leaving the picker or when something actually changed, which is one rule instead
of two half-rules.

**The picker gets an ordinary page shell**, not the board's. It is not pinned to
the viewport, so `min-h-screen` and a footer beneath it; the board keeps
`h-[100svh]` and no footer, which is what [D-109](#d-109) sized it for.

**One artifact, found by looking rather than by any check.** The setup panel is
rendered on every game route so the `<dialog>` exists to be opened, and its
class string carried `flex` — which **overrides the UA rule that hides a dialog
without `open`**. The closed panel painted as a 2px-tall bordered box, 576px
wide, under the header: invisible on a board where the game bar covers it, and
sitting in the open on the picker. It is `hidden open:flex` now, which puts the
display back under the browser's control and keeps one class string for both
branches. Nothing failed while it shipped, which is the point.

_ESLint caught the fix's own defect: `bare && hasChosenGame(useLocation().search)`
short-circuits, so the hook would not run on a non-game route and React's hook
order would change between routes._

---

<a id="d-115"></a>

### D-115 · A dex bar carries the whole typing — **Firm** _(applies [D-107](#d-107))_

**Decision.** The dex's stat fill is tinted by a Pokémon's **typing**, not its
primary type. A dual type paints a gradient between both colours, running along
the bar's length.

**Why.** It was the primary alone, so Volcarona's bars said Bug and never Fire —
exactly the omission [D-107](#d-107) corrected for the arena's panels, still
sitting in the tool the arena borrows its data from. 04_design §3's idea is that
a Pokémon's typing colours its representation; half a typing is half the idea.

**The helper is new, and reusing the arena's would have been a bug.**
`tintFor` mixes with `--color-base` because a game panel sits on the page and
nothing shows through it. These bars sit in a table row that changes colour on
hover, so `typeFill` mixes with `transparent` instead — reusing `tintFor` would
have pinned every bar to the page background and silently killed the row hover.

**90°, not the arena's 135°.** A stat bar is a horizontal strip whose width _is_
the value, so a diagonal has almost no vertical run to travel across and
degrades into a hard edge. Along the length, both colours stay visible at every
width, from a 5 HP sliver to a 255 Speed full bar.

**The dangerous part is one word.** A gradient is a background _image_:
`backgroundColor` serialises to `background-color: linear-gradient(…)`, which
every browser silently discards — the bar simply vanishes, and nothing fails.
`typeFill`'s docstring says so, and a test asserts the **property name** rather
than only the value. Both mutations were run: swapping to `backgroundColor`
fails it, and so does reverting to the primary type.

**Audited before shipping, not after.** Group 12 of `npm run audit:contrast`
computes all **153 pairs at their midpoint** — where a blend is furthest from
both endpoints group 5 already checks — against `--color-surface`, which is the
lighter of the two row backgrounds and therefore the harder case for near-white
text. Worst is **electric/ice at 7.83**, against a 4.5 threshold.

---

<a id="d-114"></a>

### D-114 · The clash shakes parts, not blocks — and in two axes — **Firm** _(refines [D-102](#d-102))_

**Reported as** "the shake doesn't feel strong enough, and it doesn't feel
irregular — each component in each card should shake differently."

**Both halves were right, and the second was the real fault.** A single
`animate-clash-shake` sat on the one wrapper holding everything, so the artwork,
the name, the badges and the value band travelled as one rigid object. The
variation [D-102](#d-102) built was real but **per panel**: four contenders
differed from each other and nothing inside any one of them did. The give-away
is that every edge stays parallel for the whole 280ms.

**Every direct child animates on its own now**, on a `4n+k` cycle of
`--part-delay`, `--part-dur` and `--part-amp`. The variation is mostly in
**timing** rather than distance — phase offsets are what read as independent
mass, and spreading amplitude wider just makes one part look broken. The cycle
also means the two boards shake differently, because the same index lands on a
different part in each: `ContenderPanel` has three or four children,
`MatchupPanel` up to five.

**A second axis, deliberately out of phase.** Reusing the horizontal decay for
vertical would only have rotated the motion — every part sliding along a fixed
diagonal, which is one straight line however hard it is thrown. So Y peaks at
**32%** where X is already at its first reversal, `--part-y` is **signed** per
child so adjacent parts pull apart rather than rising together, and Y runs at
roughly half the horizontal throw because the collision is horizontal and the
vertical is the jolt that comes off it.

Measured live at 4% playback, one panel's four parts at a single instant:
**(13.3, 2.5) (6.2, −0.6) (10.7, 2.2) (0, 0)** — different distances, opposite
vertical directions, and one part not yet started.

**Text takes a shorter throw than artwork, and that is a legibility rule rather
than a physical one.** A clipped letterform reads as a bug; a Pokémon whose
shoulder passes behind the panel edge reads as impact, which is what the
collision is for. The panel's `overflow-hidden` is load-bearing
([D-100](#d-100)) — it is what stops a shaking contender spilling into its
neighbour — so the question was never whether to clip but what.

**The measurement is the interesting part, because three of my instruments were
wrong before the numbers were right.** `--window-size=320` does not go below
about 500px in headless, so the first "320px" figures were taken at 500. The
first clipping metric measured the artwork's _element_ box, which is `w-full`
with `object-contain` and mostly empty, reporting clipping nobody could see.
And sampled peaks are unreliable when the round is **random**: one run showed
clipping going _up_ on less throw, which is impossible — it had simply drawn
longer names. Worst case is now computed from geometry and the resolved custom
properties, over repeated rounds.

What that showed: with a long name filling a 160px panel the slack approaches
zero, so **at that width any throw clips a long name — including the 13px the
old block-shake used**. "Text never clips" was never achievable. The target
became _do not make it worse than it was_: below `sm`, text throws **12.2px**
against the old 13, measuring **+0.3px** worst clip across six rounds. Artwork
clips 11.5px at 320px with four contenders, and that is accepted.

**Selected by "does not carry the artwork", not by index**, because the two
panels order their children differently. If `:has()` is unavailable the rule
drops and text keeps the full throw — the previous behaviour rather than a
broken one.

**The selector has a silent failure mode, so it is guarded.** Moving from `.x`
to `.x > *` means flattening a panel's markup would stop the shake with nothing
to notice. A test asserts every shaking wrapper has more than one child, on both
boards. Its first version passed under mutation — it counted tags in a fixed
window that ran past the wrapper into the sibling panels — so it is depth-aware
now, and fails on the mutation it exists for.

---

<a id="d-113"></a>

### D-113 · Home's previews are cameos, and open what they advertise — **Firm** _(applies [D-043](#d-043), [D-044](#d-044))_

**Decision.** Beartic joins the dex preview's team; the games preview's round is
**Mienshao against Samurott** rather than two random draws; and the Compare and
Dex CTAs open the exact view their preview was showing.

**Why the games preview needed it.** Every other section on Home shows a member
of the Black & White team the project came out of. This one drew two random
Pokémon and stood **Mienshao next to the board** as an illustration —
[D-068](#d-068) reserved it for this section and the reservation was spent on
decoration beside the game rather than on the game. It is the round now, and the
section is the only one on Home with no flanking art, because
`ContenderPanel` already renders artwork full-size as its subject: that is
[D-096](#d-096)'s "in a game the Pokémon _are_ the data", one level down.

**Pinning gives up a guarantee, so it is bought back rather than dropped.** A
generated round cannot show a matchup the game would never deal; a hand-picked
pair can. So the pair is held to the generator's own bar: `isPlayableRound` is
the predicate `higherQuestion` uses to decide return-or-redraw, and the round is
built by `roundFor` — the generator's own constructor, extracted rather than
copied — so the preview cannot disagree with the game about who won. Mienshao's
105 Speed against Samurott's 70 is a 35-point margin against a floor of 3.

**Beartic earns its place by the sort, not by sentiment.** At 50 Speed it is the
slowest of the seven, and the dex preview's two flanking figures are the **ends
of its sort**, read off the rows rather than named. Adding it moved the pair
from Archeops-110/Samurott-70 to **Archeops-110/Beartic-50** with no code
change, which is the derivation doing its job.

**The CTAs stop under-delivering.** The type section has always carried
Krookodile's typing into `/types`; the flagship did not — clicking through from a
live Volcarona-vs-Chandelure board landed on two empty slots and "Pick two
Pokémon to compare." It opens that matchup now, and the dex CTA opens Gen 5
sorted by Speed descending, which is what its preview is. **Games deliberately
stays `/games`**: the section advertises two games and deep-linking one would
hide the other.

_Three things this turned up that were not the task. A hardcoded `"Six"` in the
preview's `<caption>` — the count is derived now, and a screen reader is the one
audience that cannot see it has gone stale. `WALL_TILES * 4 + 9` in the hero-wall
test, where the `9` silently meant "six rows and three other sprites". And Home
was **eagerly preloading two 475px artworks below the fold**: React 19 emits a
`<link rel="preload">` for any image without `loading="lazy"`, which
`ContenderPanel` had no reason to set while it only ever ran above the fold in a
game._

---

<a id="d-112"></a>

### D-112 · Conflicting utilities are a check, not a habit — **Firm** _(closes a [D-042](#d-042) gap)_

**Decision.** `npm run audit:classes` is the eighth check. It splits every class
string in `src/` into utilities, maps each to the CSS property it sets, and
fails on two utilities setting the same property under the same variant.

**Why.** Tailwind resolves `min-h-0 flex-1 min-h-[26rem]` by **stylesheet
order**, not by the order they are written, so the one that wins is not the one
you meant and nothing says otherwise. [D-042](#d-042) documented the trap and it
has shipped **twice** since — a `TypeBadge` radius pair, and the game board's
height in [D-110](#d-110), where a human reading the diff was the only thing
that caught it. This is the part that does not depend on someone reading the
diff, which is the same argument `sweep:widths` was built on.

**It reads the design system rather than restating it.** The 23 named text
styles and the `--color-*` tokens are parsed out of `index.css` at run time,
because `text-*` carries two unrelated properties: `text-h2 text-primary` is a
named style plus a colour and is correct on nearly every component on the site,
while `text-h2 text-h3` is a real conflict. `font-` splits the same way.

**Its first finding was wrong, and that is worth recording.** It flagged
`font-display font-semibold` — a family and a weight. The script was fixed, not
the component. Had it been trusted, it would have "corrected" working code.

**Verified against a canary rather than a green result.** Fed the [D-110](#d-110)
defect verbatim plus four other cases: it catches that, a radius pair and a
variant-scoped `sm:p-2 sm:p-4`, and correctly ignores `text-h2 text-primary
font-display font-semibold` and `p-4 px-2`. On the real tree: **420 class
strings, every utility classified, zero conflicts** — so it is a guard rail
rather than a cleanup.

**What it does not do is stated in the file.** It does not resolve conflicts
across composition, because `${BOARD} min-h-[26rem]` is two strings to a static
scanner; the D-110 defect was inside one string, which is the case it covers.

---

## 2026-09-07 — Session 28 (three consistency tweaks, a dead link, and a final pass)

<a id="d-111"></a>

### D-111 · A panel is a button only when it is one — **Firm** _(applies [D-078](#d-078))_

**Reported as** "on the games index, clicking the images does nothing — only
the text below opens the game." Exactly right, and only on the stat game's card.

`ContenderPanel` rendered a `<button>` at its root whether or not it had an
`onPick`, disabling itself when it did not. The games index wraps each
thumbnail in a `<Link>`, so the markup was an **`<a>` containing a `<button>`**
— invalid HTML, and the disabled button swallowed every click over the top half
of the card. `MatchupPanel` renders a `<div>`, which is why the type game's card
worked and the stat game's did not: the two thumbnails were never the same
markup.

It renders a `<div>` with no handler now, which is the rule
[D-078](#d-078) already set for `AbilityChips` — _without an `onSelect` the
chips render as pills rather than buttons; a button that does nothing is worse
than a label._ The same sentence would have prevented this, and the fix is to
apply it rather than to invent anything.

_A `disabled` button is not a neutral way to spell "not interactive". It is
still a control: it takes part in hit-testing, it is invalid inside a link, and
it stops the click reaching whatever wrapped it._

**Guarded, and guarded non-vacuously.** A test asserts no anchor on `/games`
contains a control — and asserts first that it found at least two anchors to
check, because a regression test that passes by finding nothing is worse than
not having one.

---

<a id="d-110"></a>

### D-110 · The header answers the pointer, and the board stops being 4px too tall — **Firm** _(refines [D-054](#d-054), [D-106](#d-106), [D-109](#d-109))_

**The wordmark gained the game bar's hover, rather than the game title losing
it.** Both are a name in the `Word.` motif that navigates, and the nav links
beside the wordmark already answer the pointer — it was the only control in the
header giving nothing back. Consistency between a control that looks like one
and a control that does not is achieved by moving the second, not the first.

**The game title collapses to a mark below `xs`, and the control stays.** That
is the half of [D-054](#d-054)'s wordmark rule worth copying: the flame is still
the link home, so the chevron is still the way back to the difficulty picker —
which at 320px it is the only one of. Hiding the button outright would have
matched the letter of that rule and broken its point.

_The two are the same shape and different faults. The wordmark hides because
the header genuinely cannot fit it. This title never overflowed — it truncates
rather than pushing ([D-106](#d-106)) — so "Effective." simply arrived as
"Effe…", and a mark says more than four letters and an ellipsis._

**The boards were 904px in a 900px viewport**, so every game scrolled a few
pixels. `calc(100svh - 7rem)` subtracted the two 56px bars and knew nothing
about their two 1px bottom borders. The board now takes **whatever is left** —
`flex-1` inside a viewport-height shell — which removes the arithmetic instead
of correcting it, so a future border cannot reintroduce the same drift.
Measured after: every game route is exactly 900px in a 900px window.

**Two defects in that fix, both mine, both caught in the review pass:**

- `BOARD` came out as `min-h-0 flex-1 min-h-[26rem]` — **two conflicting
  `min-h` utilities in one string**, which Tailwind resolves by stylesheet order
  rather than by the order they are written. That is the [D-042](#d-042) trap
  exactly, and `flex-1` already sets `flex-basis: 0`, so nothing needed the
  first one.
- The title button's `sr-only` clause **duplicated the visible name**: a screen
  reader heard "Effective. Effective, choose a different game". The visible half
  is `aria-hidden` now and the `sr-only` half carries the whole accessible name,
  which also fixes the `xs` case where the visible half is gone entirely and the
  name would otherwise have lost the game.

---

## 2026-09-07 — Session 27 (the boards settle)

<a id="d-109"></a>

### D-109 · The reservation was the bug — **Firm** _(corrects [D-107](#d-107), amends [D-094](#d-094), [D-096](#d-096))_

Seven notes from playing it. **Three were the same fault, and it was mine.**

[D-107](#d-107) reserved 208px above the answer buttons so the verdict could
land without shifting anything. It worked, and it is why the buttons rendered
**~100px below the centre of the screen**, why the verdict read as sitting "in
between" rather than on the board, and why a phone wasted its best space. The
reservation solved a problem the verdict should not have been creating.

**The verdict moved onto the attacking panel** — the stat game's treatment —
and the reservation went with it. The buttons now measure **1.5px** off the
board's centre, and still shift **0px** when a round resolves.

**Why the attacker and never the defender.** The card restates it: the
`StabChip` inside names the attacking type, so covering that panel hides
nothing the card does not already say. Over the defender it would hide the
typing that was just revealed — the answer covering the answer, which is the
[D-097](#d-097) fault this whole arena has now made three times.

_And one implementation note worth keeping, because the obvious version is
wrong: placing the card explicitly at `col-start-1 row-start-1` **disturbs
auto-placement for its siblings**. The answers slid into column three, the
defender dropped into a row of its own, and the board came apart. Absolutely
positioned **inside** the attacker's cell it needs no placement at all — and it
lands on the attacker in both layouts, left column side by side and top row
stacked, without a breakpoint._

**The footer comes off the two boards.** They are sized to fill the viewport
exactly, so anything beneath one makes every game page scroll by the footer's
height, every round. It is a `handle` flag read through `useMatches()` — the
channel `handle.title` already uses — rather than a list of paths in `Layout`,
which would be a second thing to keep in step.

**The cost is stated rather than absorbed.** Credits moved into the footer at
[D-094](#d-094), so on those two routes it is one navigation away instead of on
screen. The attribution and the unofficial-fan-project line stay on all eight
other routes, including the `/games` index you arrive through — and a test now
asserts both halves, the absence on the boards and the presence everywhere
else, including that Credits is still reachable from the index.

**The type game stacks at `md`, not `sm`.** Three columns at 480px leaves each
panel about 110px wide, which is a Pokémon you cannot see. The stat game is
untouched: its two-up is ~240px at those widths and its four-up already stacks
below `lg`.

**The artwork caps at 475px, and the number is measured rather than chosen.**
The vendored official art is exactly 475×475 — every file, across a 400-file
sample — so any box larger than that is enlarging a bitmap, which is the
softness visible on a large monitor. This **amends [D-096](#d-096)**, which
deliberately let the stat game's panels upscale on the argument that capping
left a band of dead space above the name. That argument holds right up to the
point where the upscale becomes visible, and the cap only bites past it: below
475 nothing changes at all.

**The game's name goes back to the picker.** It is the one thing on that bar
that is not about the round in progress, so it is the natural home for "start a
different game". It clears the URL as well as the flag, so a refresh from there
asks again rather than replaying the game you just left. It fills the bar's
height the way the nav links do ([D-065](#d-065)), and its `sr-only` clause is
appended rather than replacing the visible word, so the name still contains what
you can see (WCAG 2.5.3).

_One thing this session caught about the tests themselves: `routes.test.jsx`
builds its own copy of the route table, and that copy had no `handle`s — so the
first assertion that depended on one was testing a footer the real app does not
render. The note above that table has warned about the duplication since it was
written; this is the first time it cost anything._

---

## 2026-09-07 — Session 26 (the board fills up, and the games ask first)

<a id="d-108"></a>

### D-108 · The games ask how you want to play — **Firm** _(reverses part of [D-092](#d-092))_

**Decision.** A bare `/games/higher` or `/games/effective` shows a start screen:
three presets and a **Customise** button that opens the settings directly. A URL
carrying settings goes straight to the board.

**This reverses "play immediately", and the situation is what changed.** When
that was decided the stat game had **two knobs**, and putting a form between a
link and the game would have been friction for nothing. It now has **six axes**
— stat, count, origin generation, type, forms, era. The overwhelm is one this
project created, and the first thing a new player meets should be three answers
rather than six questions.

**The objection that killed setup-as-a-gate is answered rather than
overridden.** A shared link still carries a game and never a form: parameters
mean play. Only a fresh, bare arrival is asked.

**Presets are settings, not modes.** Each writes a state the setup panel could
also reach by hand, so there is no fourth code path and no preset that means
something the filters cannot express — the rule `Effective.`'s tiers already
follow.

**One wrinkle decides the implementation.** `Higher.`'s Medium preset **is** the
defaults, so it writes no parameters at all — reading "have you chosen" off the
URL would land back on the bare URL and ask again, forever. So it is page state,
seeded from the URL and living **above** the arena's settings key so picking a
preset does not remount straight back into the picker. A test pins the wrinkle
down rather than leaving it as a comment: exactly one stat-game preset must
produce the bare URL.

**Two checks needed teaching.** The sweep's bare game routes now measure the
**start screen**, so parameterised routes were added back to keep measuring the
**boards** — and its "open this before measuring" entries had to move off the
bare URL, which no longer has a Setup button. Its virtual-time budget also ran
out at 29 routes and failed as _"could not read the sweep results"_, which reads
like a missing build rather than a timeout; raised, with the cause written down.

**And it found a real defect in the checker.** With the setup dialog open, WCAG
2.5.8 was failing on the footer's Credits link — measured against a chip inside
the dialog it happens to sit 20px from. A modal dialog makes the rest of the
document **inert**, so nothing behind it is a target at all. `targetFailures`
now measures inside an open dialog only. An over-eager checker is a checker
people learn to ignore.

---

<a id="d-107"></a>

### D-107 · The answers move into the board, and nothing that appears moves anything — **Firm** _(rebuilds [D-104](#d-104))_

**Reported as** four things, and the first three are one: the type game's
options sit too far from the field, the field is mostly empty, the verdict
appears below the board instead of on it, and the role labels are tiny.

**The board is now attacker │ answers │ defender** — the shape `/compare` has
always used, two subjects with the answer between them. The multipliers were a
rail along the bottom, which put the thing you press as far from the thing you
read as the screen allows, across a field holding two words. The empty middle is
what pays for the move, and the verdict now lands in that same middle cell, the
way the stat game's does.

**Three reservations, and the board has the room precisely because it was
empty.** This is the opposite call from [D-103](#d-103), which refused to
reserve in the stat game's gutter because it would have cost a quarter of a
phone's artwork; here the space is already spare, so reserving is simply right:

- the middle cell holds the answered layout's height,
- the defender panel holds a type-badge band, so revealing the typing does not
  shove the name and ability up the panel,
- every answer button holds a fixed icon slot, so a ✓ appearing does not nudge
  its own multiplier sideways.

**Measured, all three.** Defender name: **0px**. Answer grid bottom: **0px** —
the verdict's top moves from 526 to 386 while its bottom does not move at all,
which is what "it fills space already held" looks like in numbers.

_The middle cell's reservation is a measured constant rather than a
self-sizing one, and the reason is worth recording: the obvious way to size it
is to render the verdict invisibly, but the caption names the defender's
**typing**, and putting that in the markup before you answer is exactly the leak
[D-104](#d-104)'s assertions exist to catch. So it is 208px, from measuring the
verdict at 187 and leaving a wrapped line's headroom — and the first attempt at
160 was caught by measuring the button row before and after, not by looking._

**A dual type now shows both its colours.** `tintFor` takes the whole typing and
returns a diagonal gradient between the two tints, in **both** games — the stat
game's panels had been rendering Volcarona as Bug alone since the arena shipped.
[04_design §2](04_design.md) reserves the _flame_ gradient for the hero and says
never behind data; this is a different thing, and it is §3's own idea (a
Pokémon's typing colours its representation) finally able to say both halves.
It returns a `background` rather than a `background-color`, which is the one
trap for a future caller: a background-color would drop a gradient silently.

**Audited rather than argued.** Intermediate colours ought to sit between their
endpoints, but "ought to" is not this file's standard, so the audit computes all
**153 pairs at their midpoint** — where a blend is furthest from both ends — and
checks both text colours against each. Worst is Electric/Ice at **7.23**.

**And the role labels got a style rather than a hand-tune.** `ATTACKING` /
`DEFENDING` carries the entire direction of the question, and at 11px it was the
quietest thing on the board. [06_style_guide §5](06_style_guide.md)'s own rule
is that a design needing a style the table lacks gets it **added to the table**,
so `text-overline-lg` (display, 16px, uppercase, wide) is the 23rd named style —
listed on `/style`, which walks the stylesheet and would have failed if it were
not.

---

## 2026-09-07 — Session 25 (`Effective.`)

<a id="d-106"></a>

### D-106 · A bar that fits one game's name — **Firm** _(fixes [D-096](#d-096))_

`GameBar`'s title was `shrink-0`, which was correct for exactly as long as there
was one game. "Higher." fits a 320px bar; **"Effective." does not**, so the
second game shoved the Setup button **15px off the side of the screen** and
every page on the site scrolled sideways with it.

The title now truncates instead of pushing. `min-w-0` is the half that does the
work — a flex item will not shrink below its content's intrinsic width without
it, so `truncate` alone would have changed nothing, the same pairing
[D-055](#d-055) needed for the dex's sort control.

**Only `npm run sweep:widths` was ever going to find this.** The bar looks
perfect at every width anyone opens by hand, and the failure needed a second
caller with a longer name to exist at all. Worth recording as the case for
measuring rather than looking: this is a bug that was _created_ by adding a
component's second consumer, and it was reported by a machine within a minute
of that happening.

Finding it took two false starts of its own, both worth noting because the
tooling lies in a specific way: Chrome **ignores `--window-size` below about
500px**, so a "320px" reproduction is really a 500px one — and this project's
`sm` is **480px**, so that lands in the wrong layout entirely. The sweep gets a
real 320 by pinning the width on an **iframe**, which is the technique any
narrow-width measurement here has to use.

---

<a id="d-105"></a>

### D-105 · The arena did not extract, and that is the finding — **Firm** _(scopes [D-058](#d-058))_

**Decision.** There is no `GameArena` component. The two games share a
constants-and-helpers module, `components/gameChrome.jsx`, holding the board's
size, the panel's look and the clash choreography; each game lays out its own
board.

**Why, against the plan.** Extracting a shared arena was the plan, on
[D-058](#d-058)'s two-callers rule, and building it made the rule's limit
visible: **the two arenas are not the same layout.** `Higher.`'s answer _is_ its
panels, so its question and verdict live in an overlay between them, with all of
[D-103](#d-103)'s no-shift geometry. `Effective.`'s answer is a rail of
multipliers along the bottom, so its board has a row the other one does not and
needs none of that machinery. A component covering both would have taken a prop
for every difference and stopped being an abstraction of anything.

What they genuinely share is the board's **size**, the panel's **look** and the
**clash** — and those are exactly what `chipStyles.jsx`, `dexColumns.jsx` and
`pageChrome.jsx` are: shared strings in a constants module, with each component
keeping only what differs (06_style_guide §12 rule 8). Same rule, one rung down
from where the plan expected to apply it.

_The corollary is worth stating, because "go all the way up" ([D-058](#d-058))
pushes the other way: the test is whether two things are the same **thing**, not
whether they have parts in common. Two boards that answer differently are two
boards._

---

<a id="d-104"></a>

### D-104 · `Effective.` — three tiers, a random ability, and no thumb on the scale — **Firm**

**Decision.** The type game: an attacking type against a defender, name the
multiplier. **One tier at a time** — Easy is a single defending type, Medium a
dual type, Hard a Pokémon. Answers are the multiplier ladder the rest of the
site speaks in.

**Abilities are always in play, always shown, and drawn at random from the
roster.** Verified on the case that prompted it: Fire into Chandelure is **0×
with Flash Fire and ½× with Flame Body**. Drawing the ability is what makes that
a question rather than a species you memorise — you have to read the card, not
recall the Pokémon.

**There is no abilities toggle**, and two things say there should not be. A
Pokémon always has exactly one ability in play ([D-074](#d-074)), so "abilities
off" is a state this site does not model. And the toggle anyone would want
already exists: it is called **Medium**, where the defender is a typing and
there is no ability to account for.

**One tier at a time, not a mix**, and that is what makes the answer buttons a
property of the tier rather than of the round: computed once from the settings,
constant all session, so their number can never hint at the answer in front of
you.

#### The sampler picks the answer first

Uniform sampling is a broken quiz. Measured before any of this was written:
**63%** of single-type matchups and **47%** of dual ones are `1×`, so "always
guess 1×" beats a real player. So a target multiplier is drawn from the offered
set and a question is found for it — cheaply, because one defender answers
eighteen questions at once: draw it, score every attacker, keep one that lands
on the target.

Measured over 4,000 generated rounds per tier, the shipped distribution is
**25.6 / 23.6 / 25.2 / 25.5%** in Easy and within a point of even in Medium and
Hard. The best single guess went from 63% to **23.6%**.

#### `⅛×` is producible and is never asked

An answer is offered only when **at least 0.1% of the tier's question space**
produces it. That is a rule about diversity rather than a tuning constant, and
it excludes exactly one thing: `⅛×` is reachable from **four Pokémon in the
entire dex** — Dewgong, Spheal, Sealeo and Walrein, Water/Ice with Thick Fat,
the [D-084](#d-084) case — which is 0.009% of Hard's space. Sampling answers
evenly while offering it would have put that one family in **one round in
seven**. The rarest bucket the floor keeps is Hard's `4×` at 1.21%, clearing it
by 12×; the one it drops misses by 130×. Nothing sits near the line, and
`/types` still answers `⅛×` — the game just does not quiz a question with four
instances.

#### No thumb on the scale

A uniformly drawn ability decides the answer in **8.1%** of Hard rounds, and
**15.9%** once answers are balanced. Biasing the generator toward Pokémon whose
roster contains an effectiveness ability was **considered and declined**: the
ability matters as often as it really does. The numbers are here so that if the
tier ever feels thin, the decision is visible rather than something to
rediscover.

#### Three things the hard tier hides, and the one that leaked

The typing, the tint and the ability's marker. The first two were designed in;
the third was not, and shipped in the first build: `AbilityChips` shows an
accent dot on an ability that changes type matchups, which on `/compare` is
information and here is **the answer**. It would have destroyed the whole trap —
Flame Body would have shown no dot, so you would never have had to know what it
does. `markEffect` turns it off until the round resolves, and three rendered
assertions guard all three, over twelve random rounds each because a single
render could pass by drawing a Pokémon with one type and no ability.

_The first of those assertions failed for the right reason and would have kept
failing for the wrong one: it looked for `text-badge`, which the ability pill
shares with `TypeBadge`. It now looks for a type token set as a **background**
colour, which nothing but a type badge does._

#### Elsewhere

The verdict reuses `StabChip` and `StabCaption` verbatim — the site's own idiom
for "the chart said one thing and the ability changed it", struck original and
all ([D-079](#d-079)) — so the game cannot drift from the comparison board's
version of the same fact. `?type=` filters the **defending** typing in all three
tiers on the dex's own OR-within-a-group rule; `?gen=` and `?forms=` exist only
in Hard, because only Hard draws from the dex, and a URL that carries them
elsewhere would mean nothing.

**The record is now namespaced by game**, which is a correctness fix rather than
tidiness: every game spells its default settings as the empty string, so the two
would have filed their best streaks under the same key and overwritten each
other on the first round of either. `Effective.`'s accuracy topic is the
**attacking type** — "Ghost 54%" is the actionable axis, and it is one click
from a drill on exactly that.

**And one bug in `Higher.` fell out of writing this one.** Three settings
mutators could each emit an object whose URL parsed back into a _different_
object — lists filtered in place keep whatever order they were handed. Fixing
them one at a time was fixing the same thing three times, so both games now
route every mutation through a single `normalise`, and "the URL round-trips" is
a structural property rather than something each mutator has to remember.

---

## 2026-09-06 — Session 24 (the games take the field)

<a id="d-103"></a>

### D-103 · The answer stops shoving the board — **Firm** _(fixes [D-097](#d-097))_

**Reported as** "on smaller screens the answer panel is bigger than the question
panel, so when it appears it shifts the Pokémon below it down."

Measured at 390px: the card goes from **54.8px to 134.6px** — an **80px** growth
in a grid row sized by its contents, split between the two panels, so both
Pokémon jump 40px the instant you answer. Introduced by [D-097](#d-097), which
made the overlay a real row precisely so the answer would stop covering the
answer, and solved that at the cost of this.

**Reserving the taller height was the obvious fix and it is the wrong one.** It
would spend 80px of a 668px board on an empty gutter in the state you spend
nearly all your time in — a quarter of a phone's artwork, permanently, to smooth
over one transition. The transition is the thing that is wrong, not the gutter.

**So the row keeps the question's height and the answer is lifted out of flow.**
The question card stays in the row, invisible, once the round resolves; the
verdict is absolutely positioned on top of it and grows **downward**.

Downward is forced rather than chosen, and the reasoning is the whole point:
above the gutter is the first Pokémon's value, which **is** the answer, and
covering the answer with the answer is exactly the fault [D-097](#d-097) exists
to have fixed. Below it is the second Pokémon's artwork, whose name, types and
value sit lower still and stay visible. There is one safe direction and this is
it.

`display: contents` on the positioning wrapper at the side-by-side breakpoints
makes the whole arrangement disappear, so a wide board goes back to a plainly
centred child of the overlay layer and none of this applies there — it never had
the problem, because the layer is absolute at those widths already.

**Two measurement faults on the way, both mine, and both worth recording**
because the second is the kind that ships a bug with a green check beside it:

- `--window-size` is **ignored under `--dump-dom`**, so a "390px" measurement
  was really 500px. That mattered because this project's `sm` is **480px**, not
  Tailwind's default 640 — so the run was measuring the side-by-side layout,
  which never had the bug, and reporting no shift.
- The screenshot harness clicked a contender by matching `flex-col` in its class
  list. Restructuring the panel for [D-102](#d-102) moved that class to an inner
  span, so the click silently matched nothing and the "after" screenshot was
  another picture of the **before** state. It reported a 0px shift, correctly,
  about two identical images.

The fix in both cases was to assert the thing the measurement assumed: address
the panels by their grid cells rather than by a class that is free to move, and
**look at the after-image** before believing the number computed from it.

---

<a id="d-102"></a>

### D-102 · A clash is a shake, not a rebound — **Firm** _(replaces the aftershock in [D-100](#d-100) / [D-101](#d-101))_

**Reported as** "it's more like a rebound than a clash — they should clash, each
Pokémon shakes, then settles. And for four, each one should shake differently,
so it looks natural rather than robotic."

Right on both counts, and the first one names something the previous two entries
kept missing. A **rebound** is what happens when two things bounce off each
other; a **clash** is when they hit and stay hit, and everything about them
rattles. [D-100](#d-100) built a rebound and [D-101](#d-101) tuned it, and no
amount of tuning was going to turn one into the other.

**So the charge stops dead**, and the response moved off the panels and into
them.

**That relocation is load-bearing, not tidiness.** Shaking the panels themselves
would flicker the gaps between them open and shut a dozen times a round — which
is precisely the fault [D-100](#d-100) exists to have fixed, reintroduced at
higher frequency. Shaking the panel's _content_ inside an `overflow-hidden`
panel opens nothing. It is also the better reading: boxes collide, and the
things inside them rattle.

**Two animations on two elements**, because CSS transforms do not compose — a
second `animation` on the same element setting `transform` simply wins. The
shake is delayed by exactly `--dur-charge`, so the impact is one moment rather
than two that can drift apart.

**The variation is the part that stops it looking robotic**, and it is
deliberately **not random**. A render may not be a dice roll — React is entitled
to run one twice — so amplitude, rotation and duration are derived from the
round number and the panel's slot. The same round always shakes the same way and
the next one differs, which is the property `higherQuestion`'s injected `rng`
already established for the questions themselves. The first swing carries
**onward in the direction of travel**, because that is what inertia does.

Every parameter is a custom property set on the grid cell and **inherited** down
into the panel, so `ContenderPanel` knows only that it is shaking, not how — the
page owns the choreography and the component owns the mechanism.

**Measured, not eyeballed.** Frozen frames of a pinned round, with the
horizontal centroid of each panel's text read out per frame: at 250ms the four
sit at **+5.1, +9.1, −8.8, −8.6px**, at 320ms at **+1.1, −6.1, +5.0, −0.1**, and
by 520ms all four are back to zero. That is the check that they are genuinely
out of phase rather than four copies of one curve — which is exactly what the
first attempt was, silently, because the prop that turns the shake on was never
passed and the whole thing rendered static.

**The alternative was considered and declined.** The other idea on the table was
to drop the shake entirely and have the question slam down from the top like a
fight card's VERSUS. Two reasons not to. It leaves the collision with **no
response at all** — two things meeting and nothing happening is just two things
arriving. And it animates **chrome**: [D-101](#d-101) had just moved the question
to the top precisely so it would stop competing with the board, and a slam on
every round takes that back. It is a lovely idea for a _one-off_ — a game start
screen — and it stays available for one.

**One shared rule changed.** The reduced-motion block now collapses
`animation-delay` as well as `animation-duration`. The shake is delayed by the
length of the charge, so without it a reduced-motion user would wait out 220ms
for a frame that never moves.

---

<a id="d-101"></a>

### D-101 · Weight is velocity; the question is chrome and the answer is not — **Firm** _(refines [D-100](#d-100), [D-096](#d-096); its aftershock replaced by [D-102](#d-102))_

Four notes from playing it, and the first one corrects the fix before it.

**1 · "I don't feel the weight."** [D-100](#d-100) answered "too fast to
register" by making the clash _longer_ — 300ms to 560ms, most of it charge. That
was the wrong lever, and playing it proved so: a heavy thing is not a slow thing,
it is a thing that **covers ground fast and stops dead**. The charge now takes
**216ms instead of 325** over **5rem instead of 4** — roughly double the velocity
— inside a shorter total (480ms), and what it buys back it spends on the
aftershock.

The aftershock changed shape too, for the same reason. It rang **three times at
14%** of the travel, and fast low-amplitude ringing is what a _light_ thing does;
heavy things throw one big rebound and damp out. It is **two oscillations, the
first at 22%**. The diagnosis is worth keeping: when motion feels weightless,
look at velocity and at the damping, not at the duration.

**2 · The question goes to the top; the answer stays in the middle.** Reported as
the centred prompt covering the artwork with four Pokémon on a wide screen — and
it does, because at four panels each image is `object-contain`-ed into a tall
box, so all the empty space is above and below the subject and none is in the
middle. But the fix is not "move the card", it is that **the card holds two
different things**: a question you read once and keep glancing back at is
**chrome**, and chrome does not sit on the subject; an answer is an **event**,
which should interrupt, and which carries the button you are about to press. So
they get different positions, and only at the widths where the panels are side by
side — stacked, the card is a real row _between_ the panels and covers nothing.

**3 · "Correct." and its detail were two type sizes on one line.** They were,
and [D-053](#d-053) had already settled what that looks like: _"two type sizes on
one line, and no amount of aligning makes them sit together"_. Stacked, they read
as a headline and its supporting line. It costs a row of height, which the
stacked board pays out of its artwork — the trade [D-097](#d-097) made in the
other direction, now that there is a reason.

**4 · An inset ring has to be told about its container's curve.** The winner's
marking is an inset ring, so it traces the **panel's** box; in a games-index
thumbnail clipped by a card's `rounded-lg`, that gave square corners the card
then sliced off. It cannot infer the radius from what is clipping it, so
`ContenderPanel` takes a `className` — a layout hook only, under the same
contract as `TypeBadge`'s, and safe to append because the panel sets no radius of
its own.

**Also: you can erase your record.** `clearRecord` had existed since
[D-098](#d-098) with a comment saying the setup panel offers it, and the setup
panel did not — the function was written and never wired, which is its own small
lesson about comments that describe intentions. It is a **two-step button**: this
site has no confirm pattern, and a nested `<dialog>` for one button would be
absurd, so the button arms itself and the second press erases. Its armed state
lives in its own component **so that closing the panel disarms it** — resetting
the flag from the open/close effect is `setState` inside an effect, which
`react-hooks` flags and is right to. Same move the arena makes with its session
key: state belongs to the thing it is about, and then it cannot outlive it.

_Forgetting is a feature, not a debug hook. The record is the only thing this
site stores about anyone, so being able to throw it away is the other half of
storing it at all._

---

<a id="d-100"></a>

### D-100 · The clash, and the grey bar nobody designed — **Firm** _(rebuilds [D-097](#d-097); its rebound replaced by [D-102](#d-102))_

**Reported as** "the next-round animation is a quick flash — the Pokémon come in
from left and right and clash together? If so it's too fast to register." Both
halves of that turned out to be right, and the first half was a bug.

**The flash was real, and it was not the animation.** The panels converge on the
board's centre, so for the length of the round change the gap between the two
halves is **open** — and it was filled with the board's background, which was
`--color-border-subtle` because that is the `gap-px` trick that draws the 1px
divider. So every round opened a **64px light-grey bar down the middle of a
near-black screen** and slammed it shut. Nobody designed that; it fell out of
using one colour for two jobs. The board's background is `--color-base` now, so
the gap the panels close on is the page's own black, and the resting divider is
a near-black hairline — which the type tints already separate well enough.

_Found by freezing the animation mid-flight and screenshotting it, which is the
only way to look at 300ms. Worth keeping as a technique: `getAnimations()`,
`pause()`, set `currentTime`, capture — and pin `Math.random` before the app's
module runs, or every frame is a different round and the filmstrip shows
nothing._

**The reading was right, so it is now the design.** It was a generic slide-in
that happened to converge; it is a **collision** on purpose:

- **Further** — 4rem, not 2. At half the distance the charge was over before it
  registered.
- **Slower** — `--dur-clash`, 560ms, against the 300ms it had. Deliberately long
  for this scale, and the justification is the one the scale asks for: every
  other duration on the site answers something the user just did, while this is
  an event that has to be _read_.
- **Accelerating** — `--ease-clash` is the site's only accelerate curve. Things
  that ease out are arriving gently, and two Pokémon running at each other are
  not.
- **An aftershock** — on impact they recoil apart and settle through three
  decaying overshoots. Proportional to the distance travelled rather than a
  fixed pixel count, so it reads the same on a phone and a monitor. It rebounds
  **outward**, not inward: pressing inward would open gaps at the board's outer
  edges, which is the fault this entry started with.

One keyframe set rather than two animations with a delay, so the impact is a
keyframe and cannot drift out of sync with itself; the two segments carry their
own easings.

**A correction this forced.** [D-097](#d-097) recorded `--dur-slow` and
`--dur-base` as finally having consumers, and
[06_style_guide §9](06_style_guide.md) said so in its status column. The round
change outgrew `--dur-slow` one session later, so that rung is **unconsumed
again** and the table now says so. A status column that quietly goes stale is
worse than not having one.

**Not done, and on the record:** the whole board does not shake. A tremor on the
`overflow-hidden` board would open gaps at the screen edges — the same class of
fault as the grey bar — and the per-panel recoil already reads as the aftershock
that was asked for.

---

<a id="d-099"></a>

### D-099 · The sweep can open a disclosure — **Firm** _(extends [D-059](#d-059))_

**Decision.** A route in `scripts/sweep-widths.mjs` may now be a path **plus the
visible text of a button to click before measuring**. A disclosure that never
opens is reported as a failure rather than quietly measuring the closed page.

**Why.** [D-059](#d-059) replaced a manual browser pass with a measured one, and
it has been the check that catches what nobody eyeballs. But it could only ever
measure what a page renders on load — so **every surface behind a click was
invisible to it**, and two of them mattered: the games' setup dialog, which is
the biggest panel on the site, and — the one this closes retroactively — the
dex's mobile `Filters (N)` panel, unmeasured since the sweep was written.

The failure mode being guarded against is the subtle one. A checker that clicks
a button it cannot find and measures anyway does not fail; it passes, and it
claims to have swept a panel it never opened. A renamed button is all it takes.
So a missing button is its own reported failure, printed before anything else.

**It found something immediately.** The arena's entrance animation translates
each panel 2rem in from its own edge, and that 32px reached the document —
horizontal overflow at 900, 1024, 1280 and 1440, on a board whose whole point is
that it is exactly the size of the screen. Same fault as the type grid leaking
its overflow onto every page until `contain: paint` ([D-052](#d-052)), and the
same fix: a fixed-size board clips.

_Worth noting how it was nearly missed: headless Chrome under a virtual clock
does not always advance CSS animation time, so the sweep sees the animation's
first frame and holds it. That makes it stricter than a real browser here, not
less — an entrance that overflows for 300ms still overflows._

---

<a id="d-098"></a>

### D-098 · One number cannot be the record — **Firm** _(pays off [D-092](#d-092))_

**Decision.** Two records in `localStorage`, both pure functions over an
**injected** storage object (`src/lib/record.js`):

- **Best streak, keyed by the settings themselves.**
- **A lifetime accuracy log per stat**, across every session and every settings
  combination, shown worst-first in the setup panel.

**Why two.** Once the setup panel can filter by stat, generation, type and form
([D-096](#d-096)), "your best streak" is meaningless without saying _at what_: a
run of 12 on BST across the whole dex is not a run of 12 on Gen 1 Speed. A
single number would flatter the easiest settings and nothing else.

**The key is the URL, and that is the point.** `settingsKey` already emits a
canonical, defaults-omitted query string, so the same game always finds its own
record and two ways of clicking to the same settings cannot become two records —
asserted by a test that builds one settings object two ways. **This is the payoff
of [D-092](#d-092) that was not visible when it was written**: keeping settings
in the URL was argued for shareability, and it turns out to have handed us a
storage key with a canonicalisation guarantee already attached.

**The accuracy log is the half that makes this a training tool.** A high score is
a scoreboard; "Sp. Defense 58%" is a thing to do something about — so it is
sorted **worst first**, and it sits in the setup panel directly above the stat
chips that act on it. Seeing what you are bad at and drilling it is one movement.
Stats never asked about are absent rather than shown at 0%, which would read as
having got them wrong.

**Storage is injected, never reached for**, so the whole module unit-tests
against a plain stub with no DOM — the same move as the injected `rng`, for the
same reason. And every access is wrapped: private windows, cleared site data and
browsers that refuse storage all **throw on access** rather than returning null,
and a corrupt or hand-edited record degrades to an empty one rather than a blank
page. That is the forgiving-parse rule the URL readers already follow, applied to
the other untrusted input.

---

<a id="d-097"></a>

### D-097 · The verdict must not cover the answer — **Firm** _(fixes [D-096](#d-096))_ _(its row's growth fixed by [D-103](#d-103))_

**Decision.** The round's card — the prompt, then the verdict — is an absolutely
centred layer **only while the panels are in one row**. The moment the board
stacks (a pair below `sm`, or four in a 2×2 below `lg`) it becomes a **real grid
row between the halves**.

**Why.** Centring it absolutely is exactly right for a versus screen: it lands on
the divider, over artwork nobody needs to read. Stacked, the centre of the board
is not a divider — it is **where the top row's names and values are**. So the
card announcing the answer sat on top of half of the answer, which is the one
thing it must never do, and on a phone it hid the losing Pokémon's number
entirely.

It is also why the resolved card is **two rows rather than four**. As a real grid
row, every pixel of it comes off the artwork above and below; at four rows a
390px phone was left about 100px of Pokémon per panel. The verdict shares a
baseline with its detail, and the Next button shares a row with the way out —
two named styles side by side rather than one nested in the other, because
inline emphasis may override family and weight but never size
([06_style_guide §5](06_style_guide.md)).

**Motion, and what was refused.** Each panel enters from **its own outer edge**,
so a round reads as contenders arriving rather than as numbers silently changing;
the direction is a CSS variable the page sets, because "outer" depends on which
half of the grid a panel lands in. No stagger, matching the bar fill's existing
rule — four panels arriving in sequence reads as a loading state. Both animations
spend `--dur-slow` and `--dur-base`, the two rungs
[06_style_guide §9](06_style_guide.md) has carried as "unconsumed" since the
scale was written; a round change **is** the selection cross-fade `--dur-slow`
was specified for. **The slot-machine randomiser was considered and refused**: it
puts latency in front of every question in a game whose entire appeal is pace.

---

<a id="d-096"></a>

### D-096 · The games take the field — **Firm** _(redesigns [D-091](#d-091); the site's second exception to [04_design §1](04_design.md))_

**Decision.** `/games/higher` is an **arena**: a compact 56px game bar, and below
it a board the height of the viewport, split into one full-height panel per
contender. The settings move into a modal opened from that bar, and grow into
the dex's full filter vocabulary.

**Why the first build was wrong.** It was a tool page — `PageHeader`, a controls
panel, then the game — because that is what the other three pages are. The result
was a screen where the **configuration was the biggest thing on it** and the
Pokémon were thumbnails underneath. For `/compare`, `/dex` and `/types` that
shape is correct: the controls are why you came. For a game it is exactly
backwards.

**So this is a stated exception, and here is its argument.**
[04_design §1](04_design.md) already scopes its principles to the **tools**,
where "chrome that competes with the data is a defect". In a game **the Pokémon
_are_ the data** — the thing you look at is the thing you are answering about —
so a panel that fills half the screen is not decoration competing with content,
it is the content. Home holds the site's other exception ([D-070](#d-070)); this
is the second, and like that one it is an entry rather than a drift. The
exception is deliberately narrow: it licenses the game surface, not a relaxation
anywhere in the tools.

**What the panels borrow rather than invent.** Each is **tinted by its Pokémon's
primary type** at 10% over base — the site's oldest visual idea
([04_design §3](04_design.md)), not a new colour system — which also does the
board's structural work, since two panels of different colours read as two sides
without a heavier divider. Audited as **group 10** of `npm run audit:contrast`,
because a whole surface of type colour is eighteen new backgrounds for text and
"obviously fine" is exactly what group 7 was before anyone measured it
([D-058](#d-058)). The divider itself is `gap-px` over a border-coloured grid, so
it is a token rather than a border on every panel.

**Setup is a modal, and it edits a draft.** A native `<dialog>` with
`showModal()`, which buys a focus trap, Esc, and the rest of the page going inert
— so "opening setup pauses the game" costs nothing to implement. It also finally
consumes `--z-overlay`, documented for "modals / dialogs" since the scale was
written and never used. **Play commits; the chips edit a draft** — wiring them
straight to the URL would restart the game on every click, so you would lose your
streak choosing which stats to keep. Closing without changing anything leaves the
round you were on alone.

**Play starts immediately; the menu is not a gate.** The alternative — menu
first, then Play — was considered and rejected on the record: nothing else on
this site puts a form between a link and the answer, and
`/games/higher?stats=speed` should _play_, not ask.

**The filters are the dex's, reused whole.** Same parameter names, same parser
(`parseList`, now exported rather than copied), same semantics: `?gen=` is
"Introduced in" and `?type=` is a typing, meaning exactly what they mean on
`/dex`. That is [D-049](#d-049)'s one-concept-one-name rule spending itself
across a fourth surface, and it is why "Kanto Fire-types only" cost almost
nothing to add.

**One deliberate inconsistency, stated rather than left to look accidental.**
The dex's rule is "an empty group is not a constraint" ([D-040](#d-040)), and
_Introduced in_ and _Types_ keep it — they filter a pool. **The stats do not.**
They are the **question space**, not a filter over something visible: "ask me
about nothing" is not a game, so every chip starts lit, the last one cannot be
turned off, and an empty selection resolves to all of them. The labels are what
carry the difference — "Ask me about" reads as the rules, "Introduced in" and
"Types" read as filters.

**A pool can now be too small, so that is a real state.** The panel counts it
live in its footer — the way `/dex` counts its rows — and refuses Play below the
contender count. The count sits in the **footer** rather than at the end of the
body because that is where the decision is made, and at the end of a scrolling
body it was hidden under the Play bar: the one piece of feedback four filter axes
produce was the one you had to scroll for. A hand-edited URL can still reach an
unplayable game (`?asof=1&type=ghost&n=4` is three Pokémon for four seats), so
the arena has a real empty screen rather than a blank one.

**Also.** `ChipGroup` is extracted — it was private inside `DexFilters` and
hand-copied into the game's controls, and the setup panel needs five of them.
`FilterChip` gains `removable`, because the trailing × means "click to dismiss"
and the game's single-select groups cannot be dismissed. The games index gets a
**live thumbnail per game**, the same panel component at `sm` — [D-043](#d-043)'s
"a preview is the real thing" applied one level down.

---

## 2026-09-06 — Session 23 (the games)

<a id="d-095"></a>

### D-095 · `/style` was still keeping a copy, and its excuse had expired — **Firm** _(enforces [D-048](#d-048), repeats [D-090](#d-090))_

**Decision.** The playground's `DemoChip` is deleted. The filter-chip specimen is
the real `FilterChip`, and it now shows the single-select variant too.

**Why.** `DemoChip` was a hand-rebuilt filter chip carrying a comment that
justified itself: _"rebuilt from the shared constants rather than imported:
DexFilters keeps its Chip private and wires it to URL state, which this page has
none of."_ That was true when it was written and **stopped being true at
[D-058](#d-058)**, which merged the dex's chip and the type picker's into one
exported component. The justification expired and the copy stayed, because
nothing rechecks a comment's premise.

It had already drifted by the time it was found: `FilterChip` gained a
`removable` prop this session ([D-091](#d-091)) and the copy did not, so the page
whose stated contract is _"renders the real tokens and components, never
copies"_ was demonstrating a chip the app no longer had. That is the **third**
time this file has been the offender ([D-048](#d-048), [D-090](#d-090)), and the
pattern is now clear enough to name: **a specimen's excuse for being a copy needs
rechecking whenever the thing it copies is refactored** — the copy does not
announce itself, and the comment explaining it reads as settled.

Deleting it also took `LuX`, `typeColorVar`, `typeTextVar` and four `chipStyles`
constants out of the file's imports, which `npm run lint` flagged immediately —
a useful signal that the copy was genuinely gone rather than half-removed.

---

<a id="d-094"></a>

### D-094 · Credits leaves the nav so Games can enter it — **Firm** _(protects [D-062](#d-062))_

**Decision.** The header's four nav slots go to the four **tools**: Compare, Dex,
Types, Games. **Credits moves into the footer**, beside the byline and the
attribution line it expands.

**Why.** The header has a measured width budget and it was already spent.
[D-062](#d-062) established that the wordmark plus four nav items needs **373px**,
which is what allowed the `xs` breakpoint to sit at 384 and keep the wordmark
visible on a 390px phone — after the previous attempt at 360 broke the header on
every width from 360 to 383. A fifth 14px label plus its gap adds roughly 52px,
putting the requirement past 430: the wordmark would have disappeared on every
phone on the market, silently undoing the fix that session made deliberately.

So the fifth item was never really available, and the question is only which four
earn the slots. A tool people came to use beats a page they read once, and the
footer is not a demotion — it is where Credits was always **about**: the line to
its left already says "Data from PokéAPI. Statmon is an unofficial fan project",
and Credits is that sentence with its sources attached. The link now sits beside
its own subject instead of beside the tools.

**One measured consequence.** The footer's authorship group went from two items
to three and no longer fits 320px on one line, so it wraps — and the row gap is a
**target-size** number, not a taste one. These are 12px links that clear WCAG
2.5.8 only through its spacing exception, which needs 24px between neighbouring
centres; wrapped at `gap-y-1` two of them sit ~19px apart and fail. `gap-y-3`
lands at ~27px. `npm run sweep:widths` measures it at every width, and reports
every target on the site passing at 320px.

---

<a id="d-093"></a>

### D-093 · Right and wrong, without a red/green pair — **Firm** _(applies [D-051](#d-051))_

**Decision.** A resolved round marks the winner with the **accent** — a border,
a `--color-accent-muted` fill and a check icon — and lets everything else recede
by a step: the card you picked wrongly keeps its surface and takes an ×, and the
cards you did not pick drop to 60% opacity. **No success or error colour is
added.**

**Why.** A quiz wants green and red, and this palette does not have them, on
purpose ([04_design §2](04_design.md)): with eighteen type colours already doing
informational work, a red/green pair both clashes and fails colour-blind readers.
[D-051](#d-051) hit this first on the type grid and answered it with **one loud
state and three quiet ones**, which is exactly the shape a round needs — there is
one right answer and everything else is context.

**What it deliberately does not borrow.** The STAB chip's corrected state strikes
through the superseded multiplier ([D-079](#d-079)), and that idiom does **not**
transfer: there, the struck number is the chart's _wrong_ answer. Here every
number on screen is a true base stat — your pick was wrong, its Speed was not —
so the mark goes on the card rather than through the figure. Copying the
treatment without checking what it encodes would have printed a line through a
correct number.

**And the new pairing is audited.** `--color-accent-muted` has been in
[04_design §2](04_design.md) since the palette was written, described as "subtle
accent fills", and **nothing had ever consumed it**. Being a token's first
consumer is exactly when its pairings need measuring, because an unused token's
contrast has never been anyone's problem — so it is now **group 9** of
`npm run audit:contrast`: primary text on the fill at **10.64**, the accent check
icon at **4.73** against 1.4.11's non-text 3.0, and the accent border at **7.98**
against the page. If the marking ever proves too quiet, adding a semantic
success token is the documented next step
([06_style_guide §12 rule 1](06_style_guide.md)), not an improvisation.

---

<a id="d-092"></a>

### D-092 · The settings are a view; the play-through is not — **Firm** _(scopes [D-022](#d-022))_

**Decision.** A game's **settings** live in the URL like every other view on this
site — `/games/higher?stat=speed&n=4&asof=1`, defaults omitted. The **round, the
score and the streak do not**; they are local React state. Changing a setting
starts a new game, implemented by keying the session subtree on the settings URL
rather than by a reset branch or an effect.

**Why.** [D-022](#d-022) says the URL is the single source of truth, and it has
been absolute across three tools, so departing from it needs stating rather than
doing. The line that holds is what a link is _for_: a Statmon URL reproduces
**what you are looking at**, and for a game that is the game you chose to play,
not the round you happen to be on. Putting a round in the URL would make Back
replay it and a refresh re-ask it; putting the score there would make it
editable. Neither is a view — a play-through is an event, and events are the one
thing this site has never had.

The consequence is pleasant rather than awkward: because settings are a URL and
the session is scoped to it, `key={higherUrl(settings)}` is the whole
implementation of "changing the stat starts a new game". No effect, no
`useEffect` on a prop, no reset function — the state is simply scoped to the
thing it belongs to. A score carried across a switch from BST to Speed is a
score for neither.

**What stays under the old rule.** Everything that _is_ a view: `?asof=` means
the same thing here as on the other three tools, the stat and the count are
canonicalised on read the way `parseView` and `parseTypes` canonicalise theirs,
and a hand-edited or stale setting degrades to its default rather than throwing.
`?stat=spAtk&asof=1` even maps **across the Gen 1 Special split** rather than
resetting — the same question asked of the generation that had one stat for it —
by reusing the dex's own `ACROSS_THE_SPLIT`, now exported rather than copied.

---

<a id="d-091"></a>

### D-091 · The games, and the modes that were consolidated away — **Firm**

**Decision.** Statmon gets a fourth section: `/games`, an index, with
**`Higher.`** at `/games/higher` as the first game — two or four Pokémon, one
stat, pick the highest. A second game, `Effective.`, is specified and not yet
built.

**The brief listed more modes than the game needs.** Highest BST, highest single
stat, and "which of these four moves first" are **one game with two knobs**:
`stat` (Any, or one of the era's stats, or BST) and `n` (2 or 4). "Who moves
first" is not a mode, it is `stat: speed, n: 4` — writing it as one would have
been a third code path for a value of two existing ones, and a third thing for a
player to choose between before playing anything. `Any` is the default because a
fresh stat each round is what actually trains you; picking one is the drill, and
speed is the drill this whole project started over.

**Two things were measured first, and both invalidated the obvious build.**

- **A random type matchup is 1× about two thirds of the time.** Of the 324
  single-type cells, **204 are 1×** and only 8 are 0×; across all 153 dual-type
  defenders, 47% are 1× and just **2.2% are 4×**. So a uniformly sampled type
  quiz is one where "always guess 1×" scores 63%, and `Effective.` must pick the
  **answer** first and then find a question for it. Recorded now because it is
  the constraint that shapes that game, and the engine is built to take it.
- **A random stat pair is often not a question at all.** Over 200k draws from the
  default forms: ties are **1.2% on BST and 2.5% on Speed** — rounds with two
  right answers, which the game can only accept one of — and another ~10% land
  within five points, which is a coin flip wearing a question's clothes.

So `higherQuestion` rejects a tie **always** and rejects a margin under a floor
(3 for a stat, 5 for BST, because five points of a 175–1125 BST range is nothing
while five points of Speed is a real difference). It deliberately does **not**
cap how easy a round can be: 21–38% of pairs are more than 50 apart, and a game
that never lets you win easily is exhausting rather than rigorous.

**Reuse, rather than a second data layer.** The pool is `filterRows(ALL_POKEMON,
{ asof, includeForms: false })` — the dex's own filter, which already caps on
`introducedIn` rather than `generation` ([D-049](#d-049)) and already hides
alternate forms ([D-056](#d-056)), so a Gen 1 game is exactly 151 Pokémon without
this module knowing that. Values come from `eraView`, the stat set from
`statKeysFor`, the names from `SORT_LONG_LABEL`, and the follow-up links from
`compareUrl` and `viewToSearch`. The only genuinely new component is the
contender card, and it is new for a reason: `PokemonCard` opens with six stat
bars, so reusing it would print the answer on screen before the question was
asked.

**Randomness is injected, not reached for.** Every generator takes an `rng`
defaulting to `Math.random`, which is what makes a round reproducible in a test —
and what would make the backlog's **daily puzzle** a caller rather than a rewrite.

**Every round ends with a link into the tool that would have answered it** —
`/compare/a/vs/b` for two contenders, the dex sorted by that stat for four. That
is the argument for a game living on a reference site at all: it is the same data
asking instead of answering, and the loop closes back into the tools.

**Two things this session also cleaned up, both found by the work rather than by
a check.**

- **The site's own name disagreed with itself.** `index.html`'s `<title>` said
  "Pokémon comparison, dex and type chart" while `Layout`'s `SITE_TITLE` said
  "Pokémon stat tools" — under a comment asserting the two matched. A crawler
  read one and a visitor who clicked Home read the other. Both now say the same
  thing, and `routes.test.jsx` reads the two files and asserts it, because
  [D-086](#d-086)'s finding was precisely that no check reads prose.
- **Home's "soon" chip is gone with the last unlinked tool.** The tools row had a
  greyed variant for exactly one entry, and now that Games is live nothing uses
  it. Keeping the branch for a hypothetical fifth tool is the deleted
  `StatBar.jsx` mistake — code held for a future caller — and the games index is
  the honest home for "not built yet", where it can say what the thing will be
  rather than only that it is coming.

**Scope, stated.** Home now carries **four** preview sections, which is the count
[D-043](#d-043) named as this pattern's limit. A fifth tool should turn the
previews into a grid of compact ones rather than adding a fifth full-height band;
the rule is "every feature is represented on Home", not "every feature gets 500px
of it".

---

## 2026-09-06 — Session 22 (three faults from using it)

<a id="d-090"></a>

### D-090 · `/style` had a hand-copy, and it drifted inside one session — **Firm** _(enforces [D-048](#d-048))_

The STAB group's caption — "vs Ghost / Poison · ● Levitate" — was written inline
on the comparison card and **copied by hand into `/style`** as a specimen. Within
the same session the real one grew an `sr-only` expansion for its accent dot
([D-087](#d-087)'s sibling fix), and the copy did not. So the page whose entire
stated contract is _"renders the real tokens and components, never copies, so it
cannot drift from the app"_ was shipping a drifted copy of the thing it was
demonstrating — the second time that page has been the offender ([D-048](#d-048)).

It is now `StabCaption`, exported beside `StabChip` and `StabLabel` and used by
both callers. Two callers is the [D-058](#d-058) threshold for when a block stops
being page markup and becomes a component; `/style` counts as a caller, which is
the part that was missed.

_Worth logging rather than fixing quietly, because the failure mode is
specific: a specimen page makes copies feel legitimate. The rule is that a
specimen is a **call site**, not a rendering of what the call site looks like._

---

<a id="d-089"></a>

### D-089 · A label belongs on the first line of what it labels — **Firm** _(refines [D-080](#d-080))_

The card's controls band aligned its rows `items-center`, so on a two-row
ability roster "ABILITY" sat beside the **gutter between the rows**, pointing at
nothing. The rows now align on the **baseline**.

The convention is not a preference: a `<dt>` sits at the top of its `<dd>`, and
a form label sits on the first line of its control, because a reader enters a
two-column block at the top of the right-hand column. Every other labelled group
on this site already does it by construction — `GenerationStrip`, `TypePicker`
and `DexFilters` all put the label _above_ their chips.

**Baseline rather than `items-start`**, because the label is 11px against a 21px
chip: aligning the boxes sits it 5px high, and it is the text a reader lines up,
not the box. It also needs no number, where the alternative is a hardcoded
offset that breaks the moment either type style changes.

---

<a id="d-088"></a>

### D-088 · The grid's cross-hair was fighting paint order — **Firm** _(fixes [D-052](#d-052))_

Two halves of one bug, reported as "the rounded square doesn't get the
highlight, the background does" and "the cells above light up, the ones below
don't".

Both are **tree order**. Each cell's fill is a `position: relative` `<div>`
_inside_ the `<td>`, and the td is positioned with `z-index: auto` — so it is
**not** a stacking context, and the pseudo-elements and every cell's fill all
compete in the same one, resolving by document order:

- the row tint (`::before`) comes before its own cell's fill, so the fill
  painted over it and only the 1px gutter around each cell lit up;
- the column bar (`::after`) comes after its own cell but before every **later**
  row's, so it covered the cells above the pointer and was painted over by the
  ones below.

Both now carry an explicit `z-index`. The `<td>` deliberately does **not** — a
z-index there would make it a stacking context and trap the full-height column
bar inside one cell, which is the thing [D-052](#d-052) built it to escape.

_Reproduced in isolation before and after, because "it looks wrong on hover" is
not a thing the test suite can hold._

---

<a id="d-087"></a>

### D-087 · Scroll restoration keyed by tool, not by history entry — **Firm** _(fixes [D-024](#d-024))_

**Every click threw the page back to the top.** Measured: Swap and a form chip
both took the scroll position from 327px to 0.

The cause is the collision of two decisions that were each right. [D-022](#d-022)
makes the URL the single source of truth, so **every control navigates** —
picking a Pokémon, swapping, choosing a generation, toggling a type. And
`<ScrollRestoration>` keys saved positions by `location.key`, which
`navigate(…, { replace: true })` mints fresh every time. A new key has no saved
position, and the fallback for that is scrolling to the top. The tools that keep
state in the **path** were worst hit, because there the URL changes most.

`getKey` now returns the **tool** — the first path segment — so a tool's URLs
share one entry. An in-tool change restores the position it just saved, which is
a no-op; moving between tools still has nothing to restore and still lands at
the top; and returning to a tool comes back where you were, which is what the
browser would have done anyway. All three verified in a real browser.

**The same fix was owed to focus.** `useFocusOnNavigate` fired on every
_pathname_ change, so on `/compare` it yanked focus to `<main>` out of the very
chip you had just clicked — a keyboard user lost their place on every pick, and
was told the page had changed when it had not. It is keyed on the tool now too.

_`toolOf` earns its own module and a test that walks the real route table, since
it answers "which URLs are the same page" for two behaviours at once, and would
regress silently — a route added later that broke the rule would look fine._

---

## 2026-09-06 — Session 21 (the pre-commit review)

<a id="d-086"></a>

### D-086 · Four numbers in the prose were wrong, and no check reads prose — **Firm**

An independent review of the diff before committing. The seven CI checks were
all green throughout; every fault below is in **prose** — comments and docs —
which is the one artefact nothing in the pipeline validates.

- **"Seven of them bend a matchup" is five.** Stated in `lib/abilities.js`,
  `abilities.test.js`, `02_research` and [D-078](#d-078). The 21 is right; the
  subset is Zapdos, Raikou, Entei, Suicune and Hisuian Typhlosion.
- **The `ae` counts cited PokéAPI's raw totals where their siblings cite stored
  ones** — 466/568/28 against an actual 464/566/26. The build's own no-op filter
  drops two records (Hisuian Sliggoo and Goodra each restate Shell Armor), which
  is exactly the drop `se` and `te` document. Wrong in five places.
- **`abilityLabel("good-as-gold")` rendered "Good As Gold".** The exception list
  covered six prepositions and missed the seventh. The guard test matches
  `/-[a-z]/`, so it can catch a raw slug leaking through but is structurally
  blind to a casing error; each exception is now asserted by name.
- **`abilityLabel(null)` threw.** `defaultAbility` returns null for the fourteen
  ability-less entries, and Home called it unguarded — safe only because its
  mascots are hardcoded. It now returns `""`.

Plus a real accessibility regression: the caption's accent dot on `/compare`
carries the "changes type matchups" meaning and was `aria-hidden` with no
`sr-only` expansion — **the same defect [D-065](#d-065) fixed on the generation
strip, reintroduced one file over.** And `AbilityChips` had grown a fourth chip
colour pair locally instead of in `chipStyles.jsx`, which is the drift that
module exists to stop.

_Worth writing down because of what it says about the checks: `audit:contrast`,
`sweep:widths` and `check:docs` between them measure colour, layout and links,
and all three were green while four factual claims in the documentation were
false. A number in a sentence is not covered by anything. The dataset counts are
now re-derivable in one command, which is the closest this gets to a check._

---

<a id="d-085"></a>

### D-085 · The artwork's position is the guarantee; its size never was — **Firm** _(corrects [D-082](#d-082))_

[D-082](#d-082) sized the artwork so its **subject** would clear the controls
band, deriving `N ≤ 280` from the tightest-cropped decile. The review found the
derivation did not hold at the value shipped — `top-33` (132px) misses its own
second constraint by 2px, and no 4px-grid position satisfies both at N = 280.

Re-measuring is what showed the derivation was not merely mis-solved but
**unsound**. It mixed statistical bases — a 10th percentile for the top, a mean
for the bottom — and, worse, the top constraint cannot be satisfied by sizing at
all: across a 180-artwork sample the minimum subject inset is **0.0%**.
Blacephalon's art touches the very edge of its square, so for that entry the box
top _is_ the subject top and no `N` clears anything.

**So the box now starts at 144px — exactly where the controls band ends.** The
guarantee becomes positional and absolute, holds for every crop including the
0% one, and needs no percentile reasoning whatsoever. 280 stops being a
derivation and becomes what it always should have been: a **budget** for how far
the art may bleed behind the stat bars.

_The lesson: a guarantee that depends on the distribution of the content is not
a guarantee. The constraint was expressible in geometry alone, and geometry
alone is what it should have been written in._

---

<a id="d-084"></a>

### D-084 · ⅛× exists, and the tier list was dropping it — **Firm** _(fixes [D-073](#d-073))_

**A real bug, found by fuzzing rather than by reading.** An ability
**multiplies** the chart's answer ([D-073](#d-073)), so a defender that already
resists an attacking type twice and then halves it again lands on **⅛×** — a
value the type chart alone can never produce. `MULT_ORDER` and `MULT_LABEL` were
both written against the six values typing can reach, so:

- `matchupTiers` filters attackers by **exact equality** against `MULT_ORDER`.
  A multiplier missing from that list does not render wrong — it renders **not at
  all**. The attacking type silently vanished from every tier on `/types`.
- `formatMult` fell through to `` `${m}×` ``, printing a bare **`0.125×`** on the
  STAB chip where the whole scale elsewhere reads `⅛×`.

**Four entries reach it, and it is their DEFAULT reading, not an opt-in one:**
Dewgong, Spheal, Sealeo and Walrein are Water/Ice with **Thick Fat in slot 1** —
Ice is ¼× into Water/Ice, and Thick Fat halves Ice. Nothing about that is exotic;
it simply is not a case anybody would think to write down, which is why the
sweep found it and four rounds of reading did not.

**⅛× is correct, so it is added rather than clamped.** The games really do stack
damage this way; rounding it back to ¼× would be a lie told to protect a
constant. `MULT_ORDER` gains `0.125` and `MULT_LABEL` gains `⅛×`.

**The guard is a sweep, not an example.** `typeView.test.js` now walks **every
entry × every ability × every attacking type × four generations** and asserts no
multiplier falls outside `MULT_ORDER`, plus that every value in it has a label
without a decimal point. Verified non-vacuous: reverting the one-line fix fails
it, naming Dewgong and Walrein.

_The lesson: [D-073](#d-073)'s membership rule bounded the **table's entries** to
the chart's vocabulary and quietly assumed that bounded the **products** too. A
rule about inputs is not a rule about outputs._

---

## 2026-09-06 — Session 20 (four spacing faults, each with a different cause)

<a id="d-083"></a>

### D-083 · Four gaps that looked like taste and were not — **Firm** _(refines [D-080](#d-080), [D-079](#d-079), [D-019](#d-019))_

Four "this looks a bit off" reports. Each had a mechanical cause, and none of
them was the number it appeared to be.

**1 · The controls band was bottom-aligned, so its slack showed at the top.**
The band is a fixed 88px, but 960 of 1,259 entries need only two chip rows —
48px — so **40px of it is slack**. `content-end` put that slack _between the name
and the chips_, where it is a visible gap that changes size with the roster:
Volcarona showed 40px of it, Chandelure 13, for no reason a reader could see.
Top-aligned, the chips always sit the same distance below the name and the slack
falls between them and the portrait, where the artwork's own transparent margin
already lives and no edge marks it. The four-row Tauros case still overflows, ending at 162px — on the
artwork's transparent margin for that crop, though unlike the band's position
(D-085) that is not a guarantee. Four entries of 1,259.

**2 · Home's STAB pills were stretched, not spaced.** Both measured **122px**
though "Bug ¼×" is visibly shorter than "Fire 2̶×̶ 0×" — because a flex **column**
stretches its children to the widest by default, padding the shorter pill out
and leaving dead space inside it. `items-center` sizes each to its content
(Bug is now 100px). Only Home had it: `/compare` lays the same pills out in a
wrapping **row**, where `stretch` governs height rather than width — which is
also why [D-079](#d-079)'s change did not surface it.

**3 · The page's two edges were the same number and are not the same kind of
edge.** `py-8` gave 32px above the heading and 32px below the last card. The top
is bounded by a **sticky** header that stays attached to the content as you
scroll; the bottom is **terminal** — a rule, then the end of the page. Nothing is
gained by ending close to it. Now `pt-10 pb-20`, and the bottom number is the
`pb-20` Home already spent, so "space before the footer" is one number across the
site instead of two that happened to differ.

**4 · Home's section margins were uniform and the space they produced was
not.** The gap from a section's bottom to the _next section's artwork_ measured
**167px (Compare), 17px (Dex), 205px (Types)** — a tenfold spread from a single
`mt-28`, because only the dex preview has figures that climb above their own
heading ([D-072](#d-072) pins them at `-top-44`, 95px above the section top). The
margin was measuring the wrong thing: a reader sees the art before the heading.
`mt-36` plus pulling those figures to `-top-36` gives **167 / 81 / 237**.

**And one real bug the alignment complaint exposed.** "No Pokémon selected" hung
72px below "Pick two Pokémon to compare." Collapsing `EmptyCard`'s three mirrored
bands into one centred zone fixed the centring — and revealed that the card was
**674px against the other two at 618**, a stray 56px head spacer left behind by
[D-082](#d-082)'s reorder that nothing else had caught. The three cards are equal
again, and all three messages centre at 161.

_The lesson the four share: **a spacing value is not the spacing you get.** Three
of these were correct numbers producing wrong space — through alignment, through
flex defaults, and through content that overflows its own box._

---

## 2026-09-06 — Session 19 (the controls move off the portrait)

<a id="d-082"></a>

### D-082 · The controls move off the portrait — **Firm** _(places [D-080](#d-080), re-derives [D-081](#d-081))_

**The reported bug was "the chips overflow onto Chandelure". They do not
overflow.** Chandelure's band content measures **75px inside an 88px band** — it
fits, with 13px to spare, and only four entries in the entire dex (the Tauros
family) exceed the band at all, by 14px. The problem was never size. It was
**position**:

|                        |                                               |
| ---------------------- | --------------------------------------------- |
| Artwork box            | y 28 → 380                                    |
| Artwork **subject**    | y **63 → 344**                                |
| Controls band          | y **232 → 320** — entirely inside the subject |
| Scrim across that band | 0% → 35% opaque                               |

So the chips sat on the **brightest, least-scrimmed part of the subject**, and
covered 112px of it. Diagnosing this as overflow would have produced a taller
band, which is more chips on the same Pokémon.

**The measurement that closed off the easy answers.** PokéAPI's official artwork
is **tightly cropped**: sampling the alpha bounding boxes, subjects fill
**10%–90%** of the square (p10 top 4.6%, p90 bottom 95.2%). There is no
whitespace anywhere in the image. "Move the chips to where the art is empty" was
never an available move, and neither was any horizontal rearrangement — the
user's forms-left / abilities-right idea was measured too: splitting a 255px
column in half sends Chandelure's three abilities from two rows to three, so it
is **vertically worse**, not better.

**Why the obvious fix was rejected.** The tempting answer was [D-081](#d-081)'s
own rule applied to the other axis — cap the artwork to the 176px portrait
window. Sized to clear the chips, the artwork ends at y=300 while the stats begin
at y=368, so **it would no longer reach the stat bars at all** — and
`--color-track-glass` exists for the single purpose of letting the art show
_through_ them ([04_design §6](04_design.md)). A fix that silently deletes a
documented feature is not a fix. Rejected on that, not on taste.

**So the controls moved above the portrait instead**, into the identity block:
name, dex number, types, **form, ability**, then the picture. That is what those
two controls _are_ — which Pokémon this card is, and which version of it is in
play — so this is the placement the information already implied. Sitting them
mid-portrait was the accident, inherited from when only `FormChips` lived there
and **845 of 1,259 entries rendered nothing at all**. Abilities made the band
unconditional, which is what turned an occasional overlap into a permanent one.

**The rule worth keeping**: _thin, sparse content may bleed over the artwork; a
row of opaque 21px pills may not._ A 2px stat bar genuinely reads as bleeding
behind; chips read as covering. Same treatment, opposite result, and the scrim
was tuned for the first case only.

**It cost nothing.** Card stays 616 / 424, `ComparisonCard`'s top zone stays 320
(head 56 + controls 88 + body 176), its slack is untouched, and no height in
[04_design](04_design.md) moved. The artwork is re-derived to **280px at
`top-33`** from two constraints — subject below the chips (`top + 0.05N ≥ 144`)
and, below md, above the scrim's opaque point (`top + 0.9N ≤ 382`).

**And the smaller artwork shows more Pokémon**, which is the whole argument in
one line: the visible share of the subject goes **60% → 72%** at ≥md and
**70% → 93%** below it, because none of it is behind a chip any more. The art
also reaches _further_ behind the stat bars than before (60px → 92px), so the
feature the rejected option would have deleted is strengthened instead.

---

## 2026-09-06 — Session 18 (the board's second pass: shape, labels, a runaway image)

<a id="d-081"></a>

### D-081 · The artwork is capped to what the card can show — **Firm**

**A square that grows with width, in a band whose height is fixed.** The card's
`<img>` is `w-full aspect-square`, so its height tracks the card's **width**,
while the band that displays it is a constant 232–280px. The two only agree by
coincidence, and they stop agreeing as soon as a card gets wide.

Measured across the breakpoints, the box is **718px at a 767px viewport** — the
top third of a Pokémon — and **476px at 1023px**. So this was reported as a
mobile bug and is not one: it recurs at the **top of every column-count band**,
worst just before each breakpoint, where the card is widest before the grid adds
a column and halves it again. At 390px and at 1024px+ it happens to be fine,
which is exactly why three rounds of hand-testing never saw it — the same shape
of miss as the type grid's overflow ([D-052](#d-052)).

`max-w-[22rem]` (352px), centred. **The number is derived, not chosen**: the box
measures 315–347px at every width that already looked right, so 352 changes
nothing there and clamps everything else to that same appearance. The rule
generalises: _cap a container-sized element at the size it has where it already
looks correct._

> **Re-derived by [D-082](#d-082).** The cap is now **280px at `top-33`**, set by
> the vertical window rather than by matching the old look — 352px kept the
> chips sitting on the artwork's subject. The horizontal diagnosis above still
> stands and is still why a cap exists at all; only the number moved.

---

<a id="d-080"></a>

### D-080 · The card's controls get their names back — **Firm**

Form chips and ability chips were two stacked bands of **visually identical
chips with nothing on screen saying which was which** — "Base / Mega" and
"Flame Body / Swarm" read as one undifferentiated blob of controls. They are now
one 88px band, a two-column grid with `text-overline` **FORM** and **ABILITY**
labels.

**This is not a new idea, it is the site's own pattern arriving late.**
`GenerationStrip`, `TypePicker` and `DexFilters` all label their groups; the
Pokémon card was the one control surface that did not. **Left-aligned**, because
the stat rows immediately below are label-left — the card now reads as one spec
sheet with a label column instead of a portrait with chips floating on it.

**Held to 88px, which is exactly what the two bands occupied (40 + 48).** That
constraint is the whole reason this was safe to do: relabelling the band's
insides moves none of its outsides, so `PokemonCard` stays 616, `ComparisonCard`'s
top zone stays `md:h-80`, `EmptyCard` stays in step, and every number in
[04_design](04_design.md) stays true.

**The FORM row holds its space when there is one form**, showing an em dash —
845 of 1,259 entries have exactly one, and a row that vanished for two thirds of
the dex would slide the ability row up and change the card's height with it.
Same [D-050](#d-050) rule that keeps the generation strip unconditional.

---

<a id="d-079"></a>

### D-079 · The STAB chip is a pill, and the cause is stated once — **Firm** _(completes [D-058](#d-058), revises [D-073](#d-073))_

**The site had exactly one stretched control, and it was the one that looked
wrong.** `StabChip`'s `full` variant was `w-full justify-between` — sized by its
container instead of its content — and `ComparisonCard` is `md:col-span-2`, so
below `lg` it spans the whole board. Measured: **686px at 767px wide and 819px
at 900px**, to hold about 120px of text. Fine only at ≥1024px, where the
three-column grid happens to make the card narrow.

Every other chip on this site is a content-sized pill (`chipStyles.jsx`). This
one now is too, and that **finishes [D-058](#d-058)'s merge**: the `full` /
`dense` split existed because one was a bar and one was a pill. With both pills
the only remaining difference is size, so the prop is now **`size="sm" | "md"`**
— the prop `Button` and `TypeBadge` already take. The group does the layout: a
centred wrapping row, which needs no max-width and wraps itself at 320px.

Measured after: **152px corrected, 113px plain, identical at every width from
320 to 1280.**

**And the ability's name left the chip.** [D-073](#d-073) put `via Levitate`
under the type as a second line, which made a corrected chip **43px against its
sibling's 32** and stacked 11px text under 12px. The mistake was structural
rather than typographic: **a defender has exactly one ability**, so naming it on
each corrected chip was redundant by construction. It moves to the caption line
that already sat under the group —

```
   [● Ground  2̶×̶ 0× ⊘]   [● Dark 2× ⌃]
      vs Ghost / Poison · ● Levitate
```

— carrying `AbilityChips`' own "changes type matchups" dot, so the caption and
the chip on the defender's card visibly refer to each other. It appears **only
when a chip was actually corrected**, so a Levitate that changed nothing is not
advertised as though it had.

The general rule, which is what makes this consistent with the rest of the
session: **the chip states the effect; the surface states the cause.** Home's
board obeys it in its own frame — `FeaturedComparison` names each Pokémon's
ability under its head — rather than growing a caption it has no room for
([D-067](#d-067)'s "flare goes in the frame").

**`/style` was missing both chips this touched.** `AbilityChips` was absent
entirely and `StabChip` appeared only incidentally inside the sample board, so
its four tiers and its corrected state had no reference anywhere — drift in the
page whose stated job is preventing drift, which is the second time that page
has been the offender ([D-048](#d-048)). Both are now specimens, and the chip
section's heading finally counts to four.

---

## 2026-09-06 — Session 17b (what the review caught)

<a id="d-078"></a>

### D-078 · Two floors, not one; and a URL that argued with its own parser — **Firm** _(fixes [D-073](#d-073), [D-075](#d-075))_

A review pass over the abilities work found three real defects. All three are the
same shape: **a rule that was right, applied one level too shallowly.**

**1. Hidden abilities were handed out from Generation III.** [D-073](#d-073)
states the Gen 3 floor and stops there — but hidden abilities arrived in
**Gen 5**, and `past_abilities` only half records that. The 540 empty-slot
records cover the common case; the ones where the hidden slot was later
_replaced_ do not, because there is no empty record to read. Zapdos is stored as
a single substitution, `{until: 5, slots: {3: "lightning-rod"}}`, whose `until`
reaches back to Gen 3 with nothing to stop it. **21 entries were shown a hidden
ability in Ruby and Sapphire, and five of them bend a matchup** — a Gen 3
Suicune came out immune to Water.

The fix is a second floor, `HIDDEN_FROM_GEN = 5`, stated rather than derived for
exactly the reason the first one is. The general lesson is worth keeping: **the
API records which hidden ability was held, never that one could be held at all**
— absence of a record is not evidence of presence.

_It also disproved a line in this log._ D-073 justified `since` with "Zapdos
carried Lightning Rod from Gen 3". It did not — that copy is hidden, so it did
not exist until Gen 5. `since` is still right, but the Pokémon that need it are
**Rhyhorn and Electrike** (Lightning Rod, slot 1–2, from Gen 3) and **Gastrodon**
(Storm Drain, from Gen 4). Corrected here and in
[02_research §13](02_research.md#13-abilities-for-the-planned-abilities-feature).

**2. `/types` emitted an `ab=` its own parser discarded.** [D-075](#d-075)'s
whole argument is that a link should never carry a parameter the page would
throw away on arrival — and the page did exactly that, because it compared the
_old_ generation's selection against the _new_ generation's default without
re-resolving in between. Switching a Gengar board to Gen 6 wrote
`ab=cursed-body` while rendering Levitate.

`/compare` had it right, in a local helper. **That helper is now
`abilityParam` in `lib/abilities.js` and both tools go through it**, which is the
real fix: the rule was correct and the second copy of it was not, which is
[D-058](#d-058)'s lesson arriving in a new place. Resolve first, then compare to
the default — that order is the entire function.

**3. The "changes type matchups" dot ignored `since`.** `affectsTypes` took no
generation, so on a Gen 4 board Storm Drain was marked as mattering while the
STAB block correctly declined to change. A marker that promises something the
page then does not do is worse than no marker.

**A test that could not fail, replaced.** The invariant that would have caught
the first bug was exactly the shape of a test already written — "never resolves
an era roster with a gap in it" — which asserted every slug was _truthy_.
`abilitiesAsOf` filters nulls before mapping, so that held by construction and
the test could never fail whatever the resolver did. It now asserts the roster's
**shape** (unique, ≤3, hidden last, slot 1 present), and the hidden-ability floor
is its own whole-dex assertion.

**Two smaller things, both the same failure of nerve about previews.**
`FeaturedTypes` showed Krookodile's ability beside tiers computed _without_ it —
harmless only because Krookodile's abilities do not touch effectiveness, and
silently wrong the moment the featured Pokémon changed. And the non-interactive
chip variant conveyed which ability was selected **by fill alone**, having
dropped `aria-pressed` along with the button; it carries `sr-only` text now, and
lost the hover a `<span>` should never have had.

**And one UX wart.** Searching a Pokémon that did not exist at the current
`?asof=` dropped the _Pokémon_ and kept the generation, landing on a half-typing
with no explanation. The search is the more recent intent, so **the lens gives
way instead** — which is also what `/compare` does when a selection cannot honour
a generation.

---

## 2026-09-05 — Session 17 (abilities: the roster, and the matchups it bends)

<a id="d-077"></a>

### D-077 · The empty state is the state most likely to be unreadable — **Firm**

Two small defects, both found by screenshotting the feature rather than by
reading it, and both in the case nothing was designed around.

**"Abilities arrived in Gen 3" shipped illegible.** The ability band sits over
the card's artwork, and the chips carry their own fill so they read fine — but
the two empty states are bare text, and on a Gen 1 board that text landed across
Charizard's tail in `text-tertiary` with no shadow. The stats band immediately
below it has solved this since it was written (`statsShadow`); the new band
simply had not inherited the lesson. It now carries the same shadow, and the
text is `secondary`. **The general point: a band that is usually full of opaque
chips gets its contrast tested by the one case where it is not.**

**The ability chip on `/types` was pushed to the far edge by `ml-auto`,** on the
reasoning that identity and control are two groups (the proximity rule). At
1400px that stranded "Levitate" about 700px from the Pokémon it belongs to,
where it read as a page action rather than as part of the subject. The rule was
applied correctly and produced the wrong result, because the ability is not a
separate group — the line is one statement: _Eelektross, Electric, Levitate._

---

<a id="d-076"></a>

### D-076 · The comparison card's top zone is only fixed from `md` — **Firm** _(protects [D-057](#d-057))_

The ability band added 48px to all three cards, and on a phone one of those
48s bought nothing. `ComparisonCard`'s top zone is a fixed height **so that its
mirrored stat rows line up with `PokemonCard`'s** — and that alignment is a ≥md
concern, which the card's own comment has said since D-057: below md the three
cards are stacked and nothing has to line up. So below md the fixed height was
already dead space, and this feature grew it to a ~70px hole above the stats.

It is now `md:h-80` with ordinary padding below that. Two things come of it, and
the second is the one worth writing down:

- `/compare` at 390px went 2,487px → 2,470px. Modest, and the honest total is
  still **2,343px → 2,470px**: the ability band costs about 127px on a phone,
  which is content rather than waste and is the price of the feature.
- **It also removes a clipping risk that was silent.** The top zone is
  `overflow-hidden`. A corrected STAB chip is two lines tall, and two of them at
  320px could have exceeded a fixed 320px zone and simply been cut off with
  nothing to indicate it. `sweep:widths` measures horizontal overflow and target
  size — it would not have caught this. Below md the zone now grows instead.

---

<a id="d-075"></a>

### D-075 · `/types` answers for a Pokémon, and the Pokémon is never a second source of truth — **Firm** _(extends [D-051](#d-051))_

**The gap this closes was in D-051's own argument.** That decision justified the
page by pointing out that every other type chart makes you go elsewhere to
answer a dual-type question. But `/types` still made you go elsewhere to answer
_"what beats Corviknight"_ — you had to already know it is Steel/Flying. The
page could only be asked about a **typing**, and the question people actually
have names a **Pokémon**.

So the search bar is not a new tool, and not a fourth one: it is the missing
input method for the tool that was already there. `SearchBar` comes over from
`/compare` unchanged — it is already a labelled combobox that announces its
result count ([D-065](#d-065)), and a second search box built here would have
been the exact drift [D-058](#d-058) exists to prevent.

**The framing that made the URL fall out for free:**

> The subject of the page is a defending **typing**. A Pokémon is a way to
> _name_ one — plus, optionally, an ability that bends it.

So the typing stays in the path where it has always been, and the Pokémon rides
along as `?as=`, **validated against that path rather than trusted**. If its
typing at the generation being read is not the typing on screen, the parameter
is dropped. Three things follow at no cost:

- Clicking a type chip off drops the Pokémon **with no cleanup branch anywhere**
  — the parameter simply stops validating.
- Switching to a generation the Pokémon did not exist in, or was a different
  typing in, does the same. Clefairy is Normal at Gen 5 and Fairy today, and
  each is only valid in its own era.
- A stale or hand-edited link degrades to a plainer view of the same page, the
  rule `parseAsOf` and `parseTypes` already follow.

The one trap: **the comparison has to be canonical on both sides.** Volcarona is
stored Bug/Fire and canonicalises to Fire/Bug, so comparing the stored order
position-by-position against the path would have rejected the very Pokémon that
produced the URL. Both sides go through `parseTypes`.

**Home's type preview follows the tool** ([D-043](#d-043)). It previewed a bare
typing, which after this change would advertise the version before it, so it now
previews **Krookodile** — the artwork becomes the subject rather than decoration
beside it. Its abilities do not touch type effectiveness, so the tiers are
unchanged and the Black & White easter egg ([D-044](#d-044)) survives. That
split is deliberate: this preview sells the search, and the flagship board above
it sells the ability.

---

<a id="d-074"></a>

### D-074 · A Pokémon always has an ability, so the board reads with one — **Firm**

**Decision.** The selected ability defaults to the **first slot of the era's
roster**, and there is no "no ability" state. In the games a Pokémon always has
exactly one in play; a neutral default would be a state that does not exist.
`AbilityChips` is therefore `FormChips` in behaviour — always exactly one
active — and the default is spelled as **no URL parameter at all**, the same
rule `?asof=` follows.

**The cost was accepted with its eyes open, and it is visible on the front
page.** Chandelure's first ability is **Flash Fire**, so Volcarona's Fire STAB
against it is 0× rather than ½× — and `FeaturedComparison` had to be changed to
score through the defender's ability, because Home showing ½× where `/compare`
shows 0× is precisely the drift [D-032](#d-032)/[D-058](#d-058) exist to
prevent. A live preview that disagrees with the tool is a mockup. The board now
names each Pokémon's ability under its type badges — as text, not chips, since
this board is not interactive and a control would be a lie — so the 0× has its
cause on screen instead of reading as a bug.

**What the alternative would have cost.** Opt-in would have kept the URL and the
front page exactly as they were, and left `/compare/krookodile/vs/eelektross`
reading 2× Ground — the example [05_roadmap](05_roadmap.md) uses to explain why
this feature is worth building at all. Being right by default was worth a
changed screenshot.

**One correction fell out of it.** The generation strip's dot said
`, stats differ from today` to a screen reader. A changed ability roster now
marks a generation too, and on Volcarona vs Chandelure **no stat differs** — so
that sentence had become specifically false for the exact user who cannot see
the dot. It now says `, differs from today`, which is what the dot ever claimed.

---

<a id="d-073"></a>

### D-073 · Abilities: hardcode the effect, verify what can be verified — **Firm**

**Decision.** Shipped the last unchecked near-term item on
[05_roadmap Phase 6](05_roadmap.md). The roster and its history come from
PokéAPI into the dataset; the ~20 abilities that change type effectiveness are a
hardcoded table beside `lib/typeChart.js`, and they feed `effectiveness()`
alongside the era's chart. `/compare/krookodile/vs/eelektross` said Ground was
2× and now says 0×, which is the point.

**The rule that decides what is in the table**, written down because a
hand-maintained list without one grows by vibes:

> An ability is in the table when its effect is expressible as
> **`defending type → multiplier` within the chart's own vocabulary**
> (0, ¼, ½, 1, 2, 4). Everything else is a damage calculator.

It settles every borderline case in advance, and it is checkable — a test
asserts every multiplier is in `MULT_ORDER`:

- **Move properties are not types.** **[02_research §13](02_research.md#13-abilities-for-the-planned-abilities-feature)
  listed Wind Rider as a candidate and was wrong**: it evades _wind_ moves
  (Tailwind, Bleakwind Storm), not Flying-type ones. Same category as
  Bulletproof, Soundproof and Queenly Majesty. Fluffy is in for its other clause
  only — it doubles Fire, which is a type relation; its contact-halving is not.
- **Off-vocabulary multipliers are not in.** Dry Skin's Fire **×1.25** and
  Filter / Solid Rock / Prism Armor's **×0.75** would create a 2.5× tier with no
  row in `MULT_ORDER` and no label in `formatMult`. Dry Skin's Water immunity
  stays; only its Fire clause is dropped.
- **Wonder Guard is the one exception**, and it is a rule over the final product
  rather than a per-type map. One line, one test, one Pokémon — and Shedinja's
  tier list is the clearest demonstration the feature has.

**Hardcoded is still not unverified.** [D-047](#d-047) re-derives the type chart
from `damage_relations` on every data build; there is no equivalent here,
because PokéAPI states Levitate's effect as the prose _"Evades Ground moves."_
and nowhere as data. But the **keys** are checkable, and now are: `build:data`
asserts every slug in the table is a real ability that some Pokémon in the dex
actually has, and fails the build otherwise. That catches a typo, a rename, and
an entry written for a Pokémon this dataset does not carry. The semantics are
guarded by `abilities.test.js`, whose expected values are Bulbapedia's rather
than this codebase's — the `eras.test.js` rule, because a test that restates the
table would pass on a wrong table.

**What the data turned out to be**, measured rather than assumed:

- **Zero new network requests.** All 1,259 entries already had `abilities` and
  `past_abilities` in the cache. In particular `/ability/{name}` is not needed:
  `past_abilities` encodes an ability _arriving_ as `ability: null`.
- **+8.2 kB gzip** (dataset 29.8 → 38.0 kB). A slug dictionary would save about
  **0.8 kB** and cost a container-format change to the file — measured, and not
  taken. Era history is only **0.8 kB of the 8.2**, so it was never a trade.
- **The encoding is two flat fields** (`ab` normal, `ah` hidden) because the dex
  makes it free: the hidden ability is **always slot 3**, there is never more
  than one, and never more than two normal. Asserted over all 1,259 entries.
- Eras are stored as **slot patches** like `se`, not whole rosters like `te`:
  540 of the 566 stored records are a single empty slot, and patching measured 1.5 kB
  gzip cheaper.

**The era interaction is load-bearing, not decoration.** **Gengar carried
Levitate through Generation VI**, so a Ground STAB into it reads 0× at `?asof=6`
and 2× today — the clearest era interaction on the site, and it costs nothing
because `?asof=` already existed. Pikachu's Lightning Rod arrived in Gen 5;
Zapdos's left in Gen 6. Two abilities also needed a **`since`**: Lightning Rod
and Storm Drain only _redirected_ until Gen 5, so a Gen 3 board that granted the
immunity would have been confidently wrong for a Pokémon that really did have
the ability then.

**Abilities arrived in Generation III, and that is ours to state.** PokéAPI
emits no record saying Pikachu had none in Red and Blue — it reports Static with
no history at all. A Gen 1 or Gen 2 board therefore shows a band reading
"Abilities arrived in Gen 3" rather than no band, per [D-050](#d-050): a control
that comes and goes shoves the board around and teaches nobody why it went. The
14 entries with no abilities at all get the same treatment.

**The `differs` dot needed a floor for the same reason.** A changed roster now
marks a generation on the strip — it has to, or the site's clearest era
interaction would be invisible on the control that selects it. But **not below
Gen 3**: "nobody had abilities then" is a fact about the games, true of all
1,259 entries, so counting it would put a dot on Gen 2 for every one of them and
say nothing — the [D-049](#d-049) reason the dex has no dots. Confined to Gen 3
up it marks 18% of the strip's chips; counting the universal ones took it to 27%.

**Geometry.** A 48px band, where the form chips get 40: ability names are words
where form labels are abbreviations, and the widest roster in the dex
(Hydrapple, 38 characters over three chips) needs the room. That number moves
three files which each write the arithmetic down — `PokemonCard` 568 → 616,
`ComparisonCard`'s top zone 272 → 320, and `EmptyCard` mirroring both.

> **Superseded by [D-080](#d-080) and [D-082](#d-082).** The two bands are now
> one labelled 88px **controls** band — the same 40 + 48 total, so the card
> heights above are unchanged — and it sits **above** the portrait rather than
> below it, because chips on the artwork covered the subject.

**Noted, not fixed:** the dataset ships **Megas that do not exist in the games**
— `eelektross-mega`, `feraligatr-mega`, `meganium-mega`, `pyroar-mega`,
`excadrill-mega`, `scovillain-mega` — carrying invented abilities (`Eelevate`,
`Dragonize`, `Fire Mane`, `Mega Sol`, `Piercing Drill`, `Spicy Spray`). That is
pre-existing, but abilities is the first feature to **print it on screen**, so
it is written down here rather than discovered later.

---

## 2026-09-05 — Session 16 (the home page: naming the flagship, framing the previews, and a greeting)

<a id="d-072"></a>

### D-072 · Flanking art points at what it flanks — **Firm** _(refines [D-069](#d-069))_

The dex preview's two figures were symmetric ([D-069](#d-069)) and still read as
ornaments parked near the heading rather than as a frame around it. Three causes,
all the same idea: **everything about a flanking figure should point inward.**

- **Facing.** Both artworks face left. On the right-hand side that means Archeops
  looks back at the content; on the left it meant Samurott looked **off the
  page**. A figure at the edge of a layout directs the eye, and one of the two was
  directing it away — which is why symmetry alone did not finish the job in
  [D-069](#d-069). `-scale-x-100` turns Samurott around and the pair now faces each
  other. The flagship board has always done this to Chandelure; the dex pair
  simply never got it.
- **Lean.** Both were rotated **away** from centre as well. They now tilt inward.
  Worth writing down because it is not obvious: the flip mirrors the rotation, so
  the left figure's `-rotate-6` renders as a clockwise, inward lean.
- **Anchoring.** They were pinned to the container's edges, so their distance from
  the heading grew with the viewport — a composition that read well at 1024px
  drifted into two corner ornaments at 1600px. They now hang off the **centre**
  (`right-1/2 mr-40` / `left-1/2 ml-40`), so the gap to the heading is identical
  at every width. _This is the actual reason the placement kept feeling arbitrary:
  it was arbitrary at most widths, and only correct at one._

**And the clip moved below the body mass.** More of each figure shows now, but the
fix was never simply "more" — it was **where the cut lands**. A figure cut across
the torso by a hard horizontal edge reads as pasted on; one whose legs disappear
behind an object reads as standing behind it. Same amount of Pokémon, different
sentence.

---

<a id="d-071"></a>

### D-071 · The caption goes; the screenshot bends instead of the page — **Firm** _(completes [D-070](#d-070))_

**`1,259 entries · 18 types · 9 generations` is gone.** It read as out of place
because it was: it began as a **caption for the type band** ([D-068](#d-068)),
explaining what a stripe of colour meant, and carried over to the ribbon
([D-069](#d-069)) doing the same job. The wall needs no explaining — sprites are
self-evident — so the line lost its subject two designs ago and kept its seat. It
survived three redesigns because it was cheap, not because any of them wanted it.

Three costs it was charging: a register clash, small precise data text
immediately after a large atmospheric hero; a structural orphan, belonging to
neither the hero above nor the section below; and it occupied the strip just
under the fold, which is the exact band 72vh exists to leave for the comparison
board. The claim it made is not lost — `/dex` prints "1,025 of 1,259 Pokémon"
where the number is attached to something you can act on.

`GENERATION_COUNT` went with it. **That is the second helper invented for an
intro treatment that did not survive** (after `typeCounts()`, [D-069](#d-069)),
and the pattern is the lesson rather than the deletion: a derived number is cheap
to add and feels principled — "counted, not typed" — which made it easy to carry
a caption forward three times without asking whether the design still wanted one.
Deriving a value is only a virtue once something needs the value.

---

**The hero stays 72vh, and `docs/home.png` is cropped instead.** The request was
to make the hero fill the viewport so the screenshot would frame it cleanly, and
the reason given was the screenshot. That is a documentation concern reaching
into the product, which is the exact inversion [D-064](#d-064) was written to
prevent — the docs bend to the site.

The crest is worth keeping on its own merits: a hero that fills the viewport with
nothing visible beneath it is a well-known drop-off pattern, and this page exists
to get people into the tools. Leaving the top of the live board showing is the
whole reason 72vh was chosen over 100vh in [D-070](#d-070).

**The arithmetic that gets both.** The hero is `72vh`, so at _any_ window height
it leaves 28% of the viewport to whatever is below — there is no size at which it
fills a frame by itself. Solving for one that crops cleanly instead: header (56)

- 0.72H = 900 gives **H = 1172**, so the top 900px of a 1600×1172 capture is
  exactly the header and the hero, no bleed and nothing cut. `shoot:docs` now takes
  a per-shot `cropTo` and trims with `sharp`, which it already imports for
  [D-066](#d-066)'s centring check.

**And the flagship got its screenshot back.** With `home.png` showing the hero
alone, the README displayed the dex and the type chart but not the comparison
board — two of three tools, which is precisely the failure [D-064](#d-064)
exists to prevent, arrived at from the opposite direction. `docs/compare.png`
(`/compare/volcarona/vs/chandelure`, 1600×900 like the rest of the set) restores
it, and `home.png`'s alt text — still describing "a live Volcarona vs Chandelure
comparison board" — is now true of the image that actually contains one.

---

<a id="d-070"></a>

### D-070 · The wall — nostalgia as the hero, and D-023 reversed on purpose — **Firm** _(reverses part of [D-023](#d-023); supersedes [D-069](#d-069))_

**Home opens on a full-bleed wall of pixel sprites**, 72vh, drifting slowly
diagonally, with the wordmark and tagline on a scrim over it and the counted
caption on solid base beneath.

**This reverses [D-023](#d-023)'s product-as-hero, and that is the decision.**
D-023 argued the comparison tool's own UI is Statmon's strongest, most specific
asset, and that showing it beats a generic "tell" — it explicitly rejected the
stock dark-SaaS hero. A dimmed image field with centred text over it **is** that
generic pattern. The reason it is still the right call: D-023's real objection
was to borrowing a generic _solution_ (radial glow, gradient-filled wordmark,
twin pill CTAs), and its stated rule was _"derive the visuals from the product's
own domain, which no template can generically reproduce."_ A wall of 98 real
sprites read out of the real dataset is the most domain-specific content the
project owns. The frame is borrowed; the substance cannot be.

**And the board still crests the fold.** 72vh rather than 100vh is what keeps
most of what D-023 was protecting: the first screen is the wall, and the top of
the live comparison board is visible under it, so the hero promises the product
rather than hiding it. Checked by rendering at 900px, which is what `shoot:docs`
captures.

**The scrim depth was not a taste call.** The worst backdrop a sprite can put
behind the text is a pure-white pixel. Under a scrim of `--color-base`:

| Scrim | Backdrop  | `primary` | `secondary` |
| ----- | --------- | --------- | ----------- |
| 65%   | `#606163` | **5.68**  | 2.78        |
| 80%   | `#3c3d3f` | 9.97      | **4.88**    |

Two ways to clear AA, and they trade against each other: an 80% scrim keeps the
type hierarchy and leaves the wall at 20% visibility — mostly scrim, which is
what the page already had too much of. A 65% scrim shows the wall at 35% and
requires the **tagline to move from `secondary` to `primary`**. That is
defensible on its own terms rather than as a workaround: the hero is the one
place on the site where the tagline is the wordmark's partner rather than
supporting text, and D-023 already treats the hero as typographically exempt.

**So `--hero-scrim: 65%` is a token, and group 8 of `npm run audit:contrast`
reads it.** The audit composites base over pure white at exactly that value and
checks `primary`, so the guarantee holds for any sprite, any sample, forever —
and prints `secondary`'s 2.78 beside it, so the reason the tagline is what it is
stays visible rather than becoming folklore. `routes.test.jsx` asserts the
tagline still carries `text-primary`: the audit proves the number, the test
proves the site still uses it. Two gradients sit over the flat scrim — a radial
pool behind the wordmark, a fade into the page at the bottom — and both only
ever **add** base, so the audited value stays the true floor everywhere.

**Two implementation notes worth keeping.**

- **The block is sized by the worst case for repetition, not by what looked like
  enough.** A seam-free diagonal loop needs the layer to be four identical copies
  of one block translated exactly `-50%/-50%`, so any viewport taller or wider
  than one block shows the same Pokémon twice. 14 columns covers 2688px of
  desktop at 2× tiles; **7 rows is set by a 390px phone**, where tiles halve to
  96px and 72vh is over six rows tall — at 4 rows the top of the wall visibly
  repeated a third of the way down the screen, which only showed up by rendering
  it at that width.
- **Tiles are 2× native at `md`+.** Sprites are 96px, and `image-rendering:
pixelated` at exactly double is nearest-neighbour — crisper than any
  intermediate size. Below `md` they drop to native 96px, or a phone shows two
  columns of a grid.

**Not a pre-generated mosaic.** One image instead of 98 requests was the obvious
optimisation, and [D-064](#d-064) is the entire story of why not: generated
assets go stale, and catching that took writing a script and then
[D-066](#d-066) to fix the script. A wall read from the live dataset cannot go
stale. 98 sprites is ~108KB, and every one is already cached by the dex.

---

<a id="d-069"></a>

### D-069 · Sprites, not a chart; symmetry, not a rationale — **Firm** _(revises [D-068](#d-068))_

**The band was right about the job and wrong about the answer.** It represented
the dataset honestly and nobody could tell what it was. Two separate failures,
worth keeping apart: it was **small** (a 12px stripe), and it was **unreadable**
(a proportional stripe of type frequency needs a key nobody arriving at a
Pokémon site is going to look for). Enlarging it would have fixed one.

**So the greeting is sprites.** A ribbon of pixel sprites drifting slowly
sideways, fading out at both edges, with the same count line underneath. It
needs no key — sprites read as Pokémon instantly — and it is the one asset the
project has that nothing else on the page uses at size, in a project whose
stated origin is nostalgia ([00_brainstorm §1](00_brainstorm.md)). The scale is
now felt and stated at once: the ribbon shows how many, the line says how many.

- **Sampled, not listed.** 44 entries taken at even intervals across the
  **default forms in dex order**, so the walk crosses all nine generations at a
  steady rate. Forms are excluded deliberately: they sit after the 1,025 species
  in the dataset, so sampling everything would spend the last fifth of the
  ribbon on Megas. A test asserts the sample count and that it starts at the
  beginning of the dex, so a refactor cannot quietly turn it into "the first 44".
- **Drawn at their native 96px.** Pixel art resampled to any other size loses
  the crispness that is the only reason to use sprites, and each sprite carries
  generous transparent padding, so the character reads at about half its box —
  at 64px the ribbon looked like a dotted line. This was measured by rendering
  it at three sizes, not reasoned about.
- **The loop is seam-free by construction.** The track holds the sample twice
  and the animation translates it exactly `-50%`. That only works if every item
  occupies identical width _including_ its spacing, so the 8px gap is padding on
  each item rather than a flex `gap` — a flex gap leaves n−1 gaps across the
  doubled track, making half of it half a gap short, which shows up as a hitch
  once every cycle.
- **Reduced motion needs no special case.** The global rule collapses animation
  duration and caps iteration count, so the ribbon lands on `-50%` — which is
  pixel-identical to `0`. `--dur-drift: 80s` is two orders of magnitude slower
  than the rest of the motion scale because it is ambient rather than a response
  to anything.
- **`typeCounts()` is gone**, along with its four tests. It existed for the band
  and nothing else; an exported helper kept alive only by the tests that cover
  it is upkeep for nothing.

_Superseded the same day by [D-070](#d-070): the ribbon was readable and
genuinely fun, and still a 96px strip in a page of centred text. The brief was
never "make the greeting legible", it was "make the first screen arresting", and
three attempts in, a strip was not going to get there. The sampling, the seam
maths and the counted caption all survive in the wall._

**The dex figures were placed by a rationale nobody could see.** They sat
diagonally, each at the corner nearest its own row, which is a genuinely nice
mapping and completely invisible: what a reader gets is two differently-sized
Pokémon at opposite corners, which reads as stickers rather than composition.
They now flank the table's **top edge symmetrically** — same size, mirrored
rotation, clipped by the same edge, which was the treatment that already worked
for the single figure. The derivation still decides **who** (`ROWS[0]` and
`ROWS[ROWS.length - 1]`, read off the comparator, never named); it no longer
tries to decide **where**. _The general lesson: a rule that only exists in the
code is decoration in the render._

**Spacing is a ratio, not two numbers.** A section's CTA sat 24px from its own
preview and 80px from the next section's heading — technically the right
ordering, but a button that heavy needs more than 3× to stop reading as the
kicker for the heading below it. Now 32px to its own content and 112px to the
next section (`mt-6`/`mt-20` → `mt-8`/`mt-28`), applied in `FeaturePreview` so
every section and the tools row move together. This is [D-019](#d-019)'s
proximity rule applied to a page that has grown from two sections to four.

**The page kept paying for its own additions.** Top padding went `pt-12` →
`pt-8` and the flagship's gap `mt-10` → `mt-8`, so the ribbon — which is taller
than the band it replaced — does not push the comparison board further down than
it already sits. Verified by rendering at 900px, which is what `shoot:docs`
captures, rather than by adding up margins.

---

<a id="d-068"></a>

### D-068 · A greeting under the wordmark, and one Pokémon per job — **Firm** _(revises [D-067](#d-067))_

**Naming the flagship cost the page its opening image.** [D-067](#d-067) was
right that the comparison board needed a heading, but the heading pushed the
board down: what greeted you became the wordmark, a tagline, and a second
heading — three lines of centred text where there used to be a live, colourful
board. Correct outline, worse front door.

**So the dataset itself is the greeting.** A single proportional stripe under the
tagline, one segment per type, each as wide as that type is common across all
1,259 entries — Water is visibly the widest and Ice a sliver — with three counts
beneath it: entries, types, generations. It is the shape of the thing every tool
on the site runs on, and it is **counted, not typed**: `typeCounts()` and
`GENERATION_COUNT` come out of `lib/pokemon.js` with unit tests, so a dataset
rebuild moves the band instead of quietly making it wrong. `routes.test.jsx`
asserts the rendered numbers against the dataset for the same reason.

It is **not a tool preview**, which is why it may be a new component rather than
someone else's: [D-067](#d-067)'s "flare in the frame" rule governs previews, and
this advertises the dataset rather than any tool. Colour carries nothing on its
own here — the count line is the statement and the band is marked decorative —
so "never colour alone" ([04_design §9](04_design.md)) is satisfied without
eighteen labels that could never fit at 8px.

_Replaced the next day by [D-069](#d-069). It was accurate and unreadable: a
proportional stripe of the type distribution is not something anybody landing on
the site can decode, and at 12px of height it did not read as a greeting either.
The count line below it survives — it was never the problem._

**The page paid for most of its height rather than just growing.** Top padding
went `pt-16` → `pt-12` and the flagship's gap `mt-14` → `mt-10`, so the board
sits about 110px lower than before [D-067](#d-067) rather than the ~190px the
band would otherwise have cost. It still clears a 900px viewport, speed banner
included — checked against the render, not estimated.

**Art: one Pokémon per job, and one held back.** The Black & White team is six
([D-044](#d-044)), and they are now allocated rather than reached for:

| Where     | Who                       | Why that one                                     |
| --------- | ------------------------- | ------------------------------------------------ |
| Hero      | Volcarona + Chandelure    | the site's mascots ([D-023](#d-023))             |
| Dex       | Archeops + Samurott       | the top and bottom rows of its own sort          |
| Types     | Krookodile                | the only dual type left, which the section needs |
| **Games** | **Mienshao** — _reserved_ | so the tool that ships next has a face waiting   |

Reserving one is the point of writing this down. Every preview so far has wanted
a figure, the next one will too, and a roster picked one section at a time ends
with the same Pokémon twice — which is exactly what the first pass did, putting
Volcarona in both the hero and the type preview.

**The dex gets both ends of its sort.** One figure left the composition lopsided.
The second is `ROWS[ROWS.length - 1]` — read off the comparator like `ROWS[0]`
was, never named — so the pair marks the fastest and the slowest of the six at
the corners nearest their own rows. They are deliberately **not** mirror images:
the top figure is clipped across its middle and reads from the head down, while
the bottom one clipped the same way would lose its head, so it is smaller and
sits lower, with only its crown behind the table.

_Placement revised by [D-069](#d-069): the pair is still the two ends of the
sort, but it now flanks the table's top edge symmetrically. Mapping each figure
to the corner nearest its own row is a better idea than it is a picture._

**The type preview needs a dual type, so it is Krookodile.** The section promises
"every matchup, including dual types" — the one thing the tool exists for that a
page-per-type chart cannot do ([D-051](#d-051)) — so previewing it with a single
typing would advertise the wrong capability. Ground/Dark also reads well as a
shape: six attacking types at 2× and two that do nothing at all, so the
dropped-empty-tiers behaviour ([D-051](#d-051)) is visible rather than described.
A test asserts the previewed typing has two types, so a future swap to a
single-type Pokémon fails instead of quietly under-selling the tool.

**And it sits beside the tiers, not behind them.** The hero board and the dex
table are each one card with one clean edge, so art behind them is framed. The
tier list is five thin rows with gaps between: art behind it is sliced five
times. So the section stops being centred — tiers left, Krookodile right — which
also gives the run of three sections a rhythm instead of a column.

---

<a id="d-067"></a>

### D-067 · The flagship gets a name; flare goes in the frame — **Firm** _(amends [D-023](#d-023), [D-043](#d-043))_

**The comparison tool had no name on Home.** `/compare` has a title and a
one-liner, and both feature sections already reuse their tool page's title and
subtitle **verbatim** — "Every Pokémon, sorted by any stat.", "Every matchup,
including dual types." The flagship was the one tool Home would not label, which
left the site's own tagline ("A simple set of Pokémon tools") sitting where the
comparison's description should be, reading as though it described the board.

It was not headingless to a screen reader. It carried an `sr-only` **h2** that
said _"Example comparison: Volcarona vs Chandelure"_ — so the outline was intact
but the heading named the mascots rather than the tool, and nobody sighted got
anything at all. It is gone; Home's section now opens with the same `PageHeader`
block as the other two, carrying `/compare`'s own copy, and `routes.test.jsx`
asserts the subtitle against both surfaces so the two cannot drift.

**What made the hero a hero was never the missing label.** [D-023](#d-023) firmed
an "unlabelled, mascot-flanked treatment" and [D-043](#d-043) restated the
exemption, but what those decisions were protecting is the board's _visual_
weight — the flanking mascots, its size, its place at the top, its own CTA copy
("Try it out" where the others say "Open the …"). It keeps every one of those.
What it loses is an accident.

**And the site called one tool three things:** **Compare** in the nav,
**Comparison** in the Home tools row, **Compare.** on the page. The row now says
Compare. One tool with three names is three chances to look like three tools.

---

**The rule for previews, which the hero was already following unwritten: flare
goes in the frame, never in the components.** Every difference between the hero
board and the real comparison tool is either a _subtraction of interactivity_ (no
search, no generation strip, no swap) or _framing_ (art behind it, layering, bars
growing in on mount). Not one is a restyle. That is what makes
[D-032](#d-032)/[D-043](#d-043)'s "a preview is the real thing, not a mockup"
survivable in practice — you can make a section exciting without giving it a
second implementation that goes stale, which is the failure [D-064](#d-064) had
just finished cleaning up in the screenshots.

So the two flat sections got frames, and neither component changed.

**The type preview is the defensive read, and now says so.** `MatchupSummary`
answers "what does every attacking type do to this typing", so what is on screen
is _what beats Bug / Fire_ — the 4× Rock row every Volcarona owner has been burned
by. That was never stated: the section showed a column of tinted type names with
nothing declaring what was under attack, which is unreadable — "4× Rock" means
nothing until you know what the Rock is hitting. `/types` had a label for exactly
this and wrote it inline; a second caller is when page markup becomes a
component ([D-058](#d-058)), so it moved to `MatchupHeading`, exported beside
`MatchupSummary` the way `StabLabel` sits beside `StabChip`. Its reasoning
travelled with it: coloured text and not badges, because an 11px pill beside 18px
display text is two type sizes on one line ([D-053](#d-053)). `id` and `as`
became props — `/types` labels a section with the id and is the page, so it is an
h2; Home needs no handle and sits one rung down at h3.

An illustration then joins it, on the hero's exact rules (`hidden lg:block`,
`aria-hidden`, `pointer-events-none`, `drop-shadow-art`) — plus `loading="lazy"`,
which the hero's art deliberately is not, because this one is below the fold and
Home is the only route that is not code-split ([D-060](#d-060)).

_Revised the same day by [D-068](#d-068): it was Volcarona peeking from behind
the tiers, and it is now Krookodile beside them. Behind did not work here — the
tier list is five thin rows with gaps, so art behind it is sliced by five edges
where the hero board and the dex table each frame it with one clean card._

**The dex preview got motion and one Pokémon.** The hero's bars grow in on mount
and the dex's proportional fills — the same idea, the same `animate-grow-w` —
did not. `DexRow` now takes an `animate` prop, mirroring the one `CmpRow` already
has, and only Home's preview passes it: the real table windows its rows, so rows
mount continuously as you scroll and every one of them would animate on arrival.
Motion that says nothing, on the surface that can least afford it.

**Why one illustration and not four.** The obvious idea was the other four
members of the Black & White team ([D-044](#d-044)) beside the table. Two things
ruled it out. The table fills the content width — there is no margin to sit in,
which is the whole reason the hero board (`max-w-2xl`) can be flanked and this
cannot. And four figures announce an easter egg whose charm is that nothing marks
it on screen; all six are already there, as the row sprites. So it is one figure
rising from behind the **top-right corner**, clipped by the table's own opaque
body — and it is **whoever the sort put in the top row**, read off `ROWS[0]`
rather than named, so it stays the winner if the dataset or the team changes.
Today that is Archeops at 110 Speed. It crowns the winning row, which makes the
section's promise ("sorted by any stat") visible rather than merely stated.

_Revised the same day by [D-068](#d-068): one figure left the composition
lopsided, so the other end of the sort now sits at the opposite corner. The
reasoning above is why it is two and not four._

**One test-file cleanup fell out of it.** `routes.test.jsx` had two identical
copies of a `text()` helper — strip tags, strip React's comment nodes — in two
describes. A third caller wanted it, so it is hoisted once beside `render`.

**Measured, not assumed:** `npm run sweep:widths` passes with both new images —
they are `lg`-only for the reason the hero's are, and Home's root already clips
overflow, so nothing scrolls sideways at any of the 14 widths.

---

## 2026-09-04 — Session 15 (the consistency, accessibility & responsive sweep)

<a id="d-066"></a>

### D-066 · The social preview was the wrong frame — **Firm** _(fixes [D-064](#d-064))_

**What was wrong.** `docs/preview.png` shipped as the **1200×630 Open Graph
frame sitting inside a 1280×640 window**, leaving 80px of dead space on the
right and the wordmark 40px left of centre.

**Why it happened.** [D-064](#d-064) added `?only=og` / `?only=gh` to
`docs/og-image.html` so the frames could be captured by a script instead of by
hand. That code pruned `document.querySelectorAll("section")` — and the wrappers
in that file are `div`s. It matched nothing, removed nothing, and **both**
captures photographed whichever frame came first in the DOM, which is the OG one.
`og-image.png` was therefore correct by accident, and `preview.png` was not.

Nothing caught it because the page still rendered perfectly in a browser: the
bug lived entirely in the isolation step, which only runs during a capture. The
generator's own instructions ("right-click the frame → Capture node screenshot")
had always produced the right image, so automating it is what introduced the
defect — a fair reminder that replacing a manual step with a script moves the
error, it does not remove it.

**The fix, both halves.** The script now hoists the target frame to be the body's
only child rather than pruning wrappers, so it cannot depend on markup structure;
and `shoot:docs` **measures** the result. It reads the rendered PNG with `sharp`
(already a devDependency), finds the horizontal centre of everything brighter
than the background, and fails if either social frame is more than 2px off
centre. A wrong social image is worse than a missing one, because it is the
first thing anyone sees and nothing about it looks broken.

<a id="d-065"></a>

### D-065 · Three accessibility defects the docs had not caught — **Firm**

**Decision.** Fix them, and add a test for each, because none of the three throw
and nothing in the suite would have noticed any of them regressing.

**The type chart could not be scrolled from a keyboard.** `TypeGrid`'s panel is
the one thing on the site that scrolls sideways ([D-052](#d-052)), and it was a
plain `overflow-x-auto` container. A scroll container that cannot take focus
cannot be scrolled without a pointer — at 390px eight of the eighteen columns
are visible, so the other ten were unreachable. It is now a focusable
`role="region"` with a name (WCAG 2.1.1), and the global focus ring shows where
you are.

**The nav links had no hit area.** Bare 14px text with no padding: a clickable
box about 17px tall inside a 56px header. [04_design §9](04_design.md)'s own
[D-042](#d-042) correction wrote down "nav links are 14px" and stopped there.
They now fill the header's height, which is invisible — only the text colour
changes on hover — and puts them far past WCAG 2.5.8's floor.

**The dex's controls force-zoomed iOS.** The name filter and the sort select
inherited `text-body-sm` (14px), and Safari zooms the page whenever a focused
control is under 16px, and does not zoom back. `SearchBar` was already 16px, so
the site also had its two search inputs at two different sizes. Both are now
`text-body`. A responsive variant was not available: the named text styles are
hand-written `@layer components` rules, so `md:text-body-sm` generates no CSS
([06_style_guide §13](06_style_guide.md)).

**Also, three `title=` tooltips are gone.** `title` is unreachable by keyboard,
invisible on touch and inconsistently exposed by screen readers. The STAB
expansion is `sr-only` text beside the label it explains, shared by both boards;
the truncated name in the mobile stat card drops its tooltip entirely, since
that card only renders below `md`, where the full name is on screen anyway.

**And two smaller ones.** The Pokémon artwork sat directly beside an `<h2>` of
the same name while also carrying it as `alt` text, so a screen reader said it
twice — both are decorative now. And search results are announced politely, the
way the dex already announced its count; typing used to narrow 1,259 entries to
eight in silence.

See also [D-058](#d-058), where consolidating two components exposed a contrast
failure that had been shipping on two surfaces.

<a id="d-064"></a>

### D-064 · Screenshots are generated, not taken — **Firm**

**Decision.** `npm run shoot:docs` (`scripts/shoot-docs.mjs`) renders every
documentation image from the built site.

**Why.** `docs/preview.png` — the repo's social preview — was still the launch
image, captured **before the dex and the type chart existed**. `docs/home.png`
predated the type chart's preview landing on Home. Both are the front door of
the repo, and a screenshot showing two thirds of the product is worse than no
screenshot, because it is confidently wrong.

They went stale because taking them was manual. `docs/og-image.html` literally
instructed a human to right-click a frame and choose _Capture node screenshot_.
That file now accepts `?only=og` / `?only=gh`, which strips everything but one
frame so a headless window sized to the frame captures it exactly — the same
source of truth, scripted. It also reads the vendored faces ([D-061](#d-061))
rather than Google's, so it renders the letterforms the site actually ships and
works with no network.

The README gained one image per tool for the same reason the copy changed
([D-063](#d-063)): it describes three tools and used to show one.

**The three app shots are 16:9, all at 1600×900.** They were first sized per
shot to frame their subject — 1280×1000 and 1280×820 — which made the set look
squarish and mismatched sitting next to each other in the README. One ratio and
one size reads as a set. 1600 rather than 1280 because 720px of page is not
enough for two of the three: it cuts the hero board's speed banner in half, and
it leaves the dex showing two rows of a table whose entire point is that it holds
1,259. The two social frames are deliberately **not** 16:9 — 1280×640 is the 2:1
GitHub requires and 1200×630 is the Open Graph standard. Those are platform
sizes, not aesthetic ones. See [D-066](#d-066) for what went wrong with one of
them.

<a id="d-063"></a>

### D-063 · The site says what it is — **Firm**

**Decision.** The title, description, Open Graph and Twitter copy, the
`package.json` description and the web manifest all name the three tools.

**Why.** Every one of them still described a stat-comparison site with a dex
bolted on: _"Compare two Pokémon's base stats side by side, or sort the whole dex
by any stat."_ The type chart — a third of the product, and the only page of its
kind that handles dual types without a page per pairing ([D-051](#d-051)) — did
not appear in the site's own description, its social preview, or its package
metadata. The `<title>` said "Pokémon stat tools", which stopped being true two
tools ago.

Per-route meta still awaits SSR ([D-005](#d-005)), which is exactly why the
site-level copy has to describe the whole site rather than whichever tool
happened to be flagship when it was written.

The manifest also gained `id`, `scope`, `lang`, `dir` and `categories`. Its icons
are declared `"purpose": "any"` rather than `"maskable"` — they are not designed
for a maskable safe zone, and labelling them so would just get them cropped.

`robots.txt` and `sitemap.xml` are new. Both exclude `/style`: the playground
renders every token and component on one page, so it would rank for the site's
own vocabulary while telling a visitor nothing. The sitemap lists the four real
pages and deliberately does not enumerate deep links — those are shareable URLs
generated from the dataset, effectively unbounded, not pages to index.

<a id="d-062"></a>

### D-062 · The `xs` breakpoint was wrong — **Firm** _(corrects [D-054](#d-054))_

**Decision.** `--breakpoint-xs` moves from **360px to 384px**, and the nav's gap
below `sm` tightens from `gap-3` to `gap-2`.

**What was broken.** [D-054](#d-054) added `xs` so the wordmark drops to the bare
flame mark on phones too narrow for it and the four nav items. It set the
boundary to 360 after finding the header broken at **320**, and never measured
360 itself. Measured, the header needs **385px**: 32 gutter + 121 brand + 8 gap

- 214 nav. So every width from **360 to 383** switched the wordmark on into a
  header that did not fit — clipping "Credits" and scrolling the entire site
  sideways, which is the exact failure D-054 exists to prevent, at the boundary it
  chose.

It survived because no round device width lands in that range (320, 375, 390,
430 are all outside it) and because the fallback font is narrower than Space
Grotesk — so it only reproduced reliably once the fonts were served locally and
started landing fast enough to be measured ([D-061](#d-061)).

**Why both halves.** 385 alone would push `xs` past **390**, the most common
phone width there is, and hiding the wordmark on an iPhone 14 to satisfy a
boundary is the tail wagging the dog. Taking 4px off each of the three nav gaps
brings the requirement to 373 — the same lever D-054 pulled the first time, and
for the same stated reason: the labels all stay visible, the space between them
gives. `xs` at 384 then clears it with room for platforms that render the
wordmark slightly wider.

`npm run sweep:widths` tests 360, 375, 383 and 384 so this cannot drift back.

<a id="d-061"></a>

### D-061 · The fonts are self-hosted — **Firm**

**Decision.** Both families are vendored into `public/fonts/` by
`npm run vendor:fonts`, which also generates the `@font-face` rules into
`src/fonts.css`. `index.html` no longer talks to Google.

**Why.** The rest of the site makes **zero** runtime requests — the dataset is
bundled and every sprite is committed ([D-002](#d-002), [D-025](#d-025)) — and
then `index.html` opened two `preconnect`s and a **render-blocking stylesheet**
to a third party before first paint. One external dependency, on the critical
path, standing in front of a page that otherwise has none: the browser cannot
paint text until Google's CSS arrives and names the font files. Self-hosted, the
rules ship in the stylesheet the page already downloads, the fetch starts a round
trip earlier, and no third party sees the request.

Same shape as `vendor:images` ([D-025](#d-025)): run on demand, commit the
output, never fetch at runtime. Only **latin** and **latin-ext** are kept —
Google serves ten subsets per weight, and the widest character this UI renders is
the é in "Pokémon". Two faces are preloaded from `index.html`: body copy and
headings, the ones that paint first.

`src/fonts.css` is in `.prettierignore`, like `src/data/`. It is generated, and
if Prettier reformatted it then `npm run format` and `npm run vendor:fonts` would
each undo the other's output forever.

<a id="d-060"></a>

### D-060 · Every route but Home is code-split — **Firm**

**Decision.** React Router's own `lazy` on every route except the index.

**Why.** The site shipped as one 482 kB bundle, so someone who only opened the
comparison tool still downloaded the dex table, the 18×18 grid, and the
400-line `/style` playground — a page that exists for the person building the
site, not the person using it.

**Home stays eager**, deliberately. It is the common entry, and making it lazy
only moves its download behind an extra round trip after the main chunk. It also
anchors the shared chunk: Home previews both other tools with their own
components ([D-043](#d-043)), so `DexRow`, `MatchupSummary` and the dataset are
shared code either way.

**The honest number is modest.** Measured with real resource timing, Home goes
**140.3 kB → 128.7 kB gzipped**, about 8%. The shared React + router + dataset
core is most of the weight and every route needs it. The clearer win is that no
visitor downloads `/style` any more, and each tool now pulls only its own code.

`lazy` is the router's mechanism rather than `React.lazy` + `Suspense`: in data
mode the router awaits the module as part of the navigation, so there is no
fallback to design and no flash of an empty shell.

**One consequence worth naming.** `routes.test.jsx` builds its own route table
with `element:`, because `createBrowserRouter` needs a browser history. That was
a harmless duplication while `router.jsx` also used `element:`; with `lazy:` it
meant a typo'd dynamic import could reach production with the suite green. The
route table is now exported separately, `createRouter` is a factory — building
the router at module scope touches `document`, which is what made the table
unreadable from a node test — and a test resolves every lazy route to a real
component.

<a id="d-059"></a>

### D-059 · The width sweep, and target size measured instead of assumed — **Firm**

**Decision.** `npm run sweep:widths` (`scripts/sweep-widths.mjs`) loads all 11
routes at 14 widths and asserts the document never scrolls sideways, and measures
every interactive target against WCAG 2.5.8.

**Why a script.** This check kept being done by hand and kept being done
incompletely. The type grid leaked overflow into the document for as long as it
had shipped, and three rounds of width testing missed it because 390 / 768 / 1280
are all clean while 600 and 700 are not ([D-052](#d-052), [D-055](#d-055)). A bug
you can only see at 600px is a bug you will not find by dragging a window.

It serves `dist/` with the production SPA fallback and loads each route in an
iframe sized to the width under test — an iframe establishes its own viewport, so
media queries respond to it and one browser launch covers every width. It reports
page height per route too, which is what made [D-057](#d-057) measurable.

**Getting it to be believable took longer than writing it.** A layout probe in a
headless browser is racy in several independent ways, and each one produced its
own phantom failure at roughly one run in six:

- It models **overlay scrollbars**, or every route appears to overflow by exactly
  a scrollbar's width.
- It waits for `document.fonts.ready`, because text in the fallback stack is a
  different width from text in Inter or Space Grotesk.
- It waits for **three consecutive identical readings**, not one timer and not
  two — every route but Home is a lazily-imported chunk that renders after `load`
  fires ([D-060](#d-060)), and a transient can sit still for longer than a single
  interval.
- It forces a layout flush before reading, since `scrollWidth` can return a
  cached value while `getBoundingClientRect()` reports the settled box. That
  combination is how one version printed a 1016px overflow beside an **empty**
  list of overflowing elements.
- It pins the frame's width in CSS as well as the attribute, and it **re-measures
  any failure in a fresh frame before reporting it.** A transient does not
  survive an independent second measurement; a page that genuinely overflows
  fails every time.

Verified both ways: ten consecutive clean runs, and a deliberately injected
1200px element is caught at every width with the offending node named. A flaky
checker is worse than no checker, because you learn to mute it.

**What it found about `FormChips`.** [04_design §9](04_design.md) and
[05_roadmap Phase 5](05_roadmap.md) both carried them as "the one likely WCAG
2.5.8 spacing failure on the site" since [D-042](#d-042). Measured, **they pass.**
The chips are 45–59 × 21px, and in Minior's eight-form wrapped worst case the
tightest neighbouring centre is **27.1px** against the 24px the spacing exception
requires. It was never a failure; it was an unverified guess that had been
carried in two documents and a roadmap item for three sessions. The margin is
only 3px, so the sweep keeps measuring it rather than the docs going back to
asserting it.

<a id="d-058"></a>

### D-058 · One page shell, one filter chip, one STAB chip — **Firm**

**Decision.** Three more shared modules, and the deviations that survive are
stated rather than left looking like oversights.

**The page shell.** Six routes had six vertical rhythms and two header
treatments: Credits left-aligned with an 18px description against the three
tools' centred 14px one, `/style` on its own `px-6` gutter against the uniform
`px-4` [06_style_guide §8](06_style_guide.md) documents, and the accent dot
hand-copied seven times. `PageHeader` renders that block for the tools, Credits,
`/style` and Home's feature sections — `as` picks the heading level, so a Home
section is the same block one rung down the outline without a second `<h1>`.
`pageChrome.jsx` holds the two container rhythms that remain: `PAGE_TOOL` for
working surfaces, `PAGE_CONTENT` for read-and-leave pages. Home's hero and the
404's numeral stay exempt, as one-off treatments at a different size.

`/compare` also gains the controls panel `/dex` and `/types` already had — it was
the only tool leaving its controls bare on the page background, and it is the
flagship. The lens sits **below** the divider there where the other two put it
above, and that is the real relationship rather than drift: elsewhere the
generation decides what the controls below may offer, here the selection decides
what the strip may offer ([D-045](#d-045)).

**`FilterChip`.** The dex's filters and the type picker were two components that
were the same component: same `CHIP` base, a byte-identical geometry string, the
same colour dot when off, the same type fill and trailing × when on.
[D-048](#d-048) unified their colours and stopped one rung short. The type
chart's two-type cap is the only prop that survived as behaviour.

**`StabChip`, and a real AA failure.** `ComparisonCard`'s `EffChip` and
`FeaturedComparison`'s `StabPill` drew the same data at 14% vs 16% fill and
28–55% vs a flat 32% border — drift on exactly the two surfaces
[D-032](#d-032) exists to keep aligned. Merging them put the pairing in front of
`audit:contrast` for the first time, and it **failed**: the resisted and immune
multiplier at `text-tertiary` measured **3.59–4.38** over the type fill, below AA
on **17 of the 18 types**, and had been shipping that way on both surfaces since
the chip was written. Neither copy looked like a text-on-fill pairing worth
auditing, which is how it hid.

Lightening the fill cannot rescue it — `tertiary` needs the fill near 5% to clear
4.5, which is no tint at all — so the muting moves off the text. `secondary`
clears every type at 5.17+, and the tier still reads from its icon and its border
strength, which is the direction [04_design §9](04_design.md) points anyway: the
multiplier should never have leaned on colour to say "resisted". Added as group 7
of `npm run audit:contrast`.

**The deviation that stays.** The type picker does **not** collapse behind a
disclosure on a phone, where the dex's type chips do. They look like the same
control at the same width, and only one folds away — which reads as drift until
you ask what each is for. On `/dex` the chips are one optional filter among
several with the payload below them, so hiding them lifts the answer up the
screen. On `/types` the picker **is** the tool, and collapsing it puts a tap in
front of the page's only interaction.

The dex's real table and Home's preview of it also drew the same header row at
two heights (`h-10` vs `py-2`) with two alignment mechanisms; both now read
`HEAD_CELL` / `HEAD_INNER` / `HEAD_ALIGN` from `dexColumns.jsx`.

<a id="d-057"></a>

### D-057 · The comparison board stops repeating itself on a phone — **Firm** _(extends [D-010](#d-010))_

**Decision.** Below `md`, the two Pokémon cards drop their six stat bars, and the
comparison card is reordered **above** them.

**What was wrong.** [D-010](#d-010) answered "the mirrored row does not fit below
768px" and was never revisited as the board grew. Stacked in one column you
scrolled past two 568px Pokémon cards — each carrying its own six stat bars —
before reaching the comparison card, which then showed **the same six stats a
third time** as per-stat cards, with the verdict last on a 2,727px page. The
numbers were rendered three times on one screen, and the answer was furthest from
the top.

**Measured.** 2,727px → 2,343px. The height is a 14% cut, which is real but not
the headline; the number that matters is where the verdict sits, which moves from
roughly 1,550px down the page to roughly 450px.

The cards keep what only they have — identity, artwork, forms, total — and their
portrait grows into some of the freed space, because with the bars gone the
artwork is what the card is for at that width. **A Gen 1 board is unaffected**:
the stats band is hidden wholesale, so the five-vs-six question does not arise.
The equal-height invariant ([04_design §5](04_design.md)) is a ≥`md` concern
anyway — below it the three cards are stacked, not side by side, and nothing has
to line up.

---

## 2026-09-04 — Session 14 (pre-push review)

<a id="d-056"></a>

### D-056 · Alternate forms are hidden by default — **Firm** _(reverses part of [D-039](#d-039))_

**Decision.** The dex opens on the **1,025 default forms**, not all 1,259. The
"Hide alternate forms" toggle starts on.

**What this reverses.** [D-039](#d-039) shipped the opposite lean, arguing that
Megas are a large part of _why_ someone looks a stat up. That is still true —
which is why the toggle exists and is one click away — but it is not an argument
for the resting state. The dex people picture is the National Dex, and opening on
1,259 rows with Charizard appearing three times is a busier answer than the
question deserves.

**The count line does the advertising.** With forms hidden, the resting state
reads **"1,025 of 1,259 Pokémon"** rather than a bare total, so the 234 hidden
entries announce themselves instead of quietly not existing. That is the only
reason hiding them by default is safe: an unexplained absence would be worse
than a busy table. Toggling drops the qualifier to "1,259 Pokémon".

**Old links keep their meaning.** The param inverts — `forms=1` now means show —
but `?forms=0` was always an _explicit_ hide and still hides. Only a bare `/dex`
changes, which is the point. The clean state is still a bare `/dex`, since the
default stays out of the URL either way ([D-022](#d-022)).

**Tests that leaned on the old default were made explicit rather than
re-baselined.** The era-ceiling tests now pass `includeForms: true` on purpose:
they exist to prove that Alolan Raichu is absent from a Gen 3 dex _because it did
not exist yet_, and that means nothing if forms are hidden anyway.

<a id="d-055"></a>

### D-055 · Three grid fixes, and why a box-shadow was not one of them — **Firm**

**Decision.** The last round of polish on the type grid.

**The axis labels fill their cell.** A short badge floating in a 28px row read as
a different kind of thing sitting _beside_ the grid rather than part of it. Both
axes now match the cell height exactly, so the matrix is uniform edge to edge.

**The selected column is framed on all four sides.** [D-053](#d-053) put an
accent rule down each edge and left the ends open, so two lines ran into nothing.
The header carries the top edge and the last row the bottom.

**The sticky column was letting the grid show through beside it.** Scrolling a
narrow screen revealed a sliver of cells to the _left_ of the row label. The
cause is that sticky offsets resolve against the **scrollport**, so `left-0`
parks the header at the inner edge of the panel's 6px padding and leaves a strip
the cells scroll straight through.

**And a pre-existing one the same sweep caught.** The dex's phone sort row put
its Filters button 18px off the side of a 320px screen, cut off with no way to
reach it — a flex item will not shrink below its content's intrinsic width, and
that `<select>`'s longest option is "Sort: Base stat total". `min-w-0` fixes it.
It had been there since the dex shipped; three sample widths never found it, and
a **10 routes × 11 widths matrix** found it on the first run.

**The fix that did not work is the interesting part.** A `box-shadow` extending
left of the header is the obvious answer and it fails: inside a table the cells'
own positioned boxes — they are `position: relative` for the cross-hair
([D-052](#d-052)) — paint over the header's background layer, shadow included.
Probing the paint stack showed the cell on top at every pixel of the strip. An
absolutely positioned **pseudo-element** works, because the header is `sticky`
with a z-index and therefore a stacking context that sits above them. Worth
recording: "give it a background that extends further" is not reliable inside a
table, and the paint order has to be checked rather than assumed.

<a id="d-054"></a>

### D-054 · An `xs` breakpoint, for the wordmark — **Firm**

**Decision.** Added `--breakpoint-xs: 360px`, used in exactly one place: below it
the header shows the flame mark alone and drops the "Statmon." wordmark.

**Why it was needed.** Four tools in the nav ([D-051](#d-051)) plus the wordmark
overflow a 320px viewport by 39px, and an overflowing header scrolls **every page
on the site** sideways — the rule [D-010](#d-010)/[D-029](#d-029)/[D-039](#d-039)
have held since launch. Tightening the gaps bought back enough for 360 and up
([D-050](#d-050)) but not for 320.

**Why a new breakpoint rather than reusing `sm`.** Hiding the wordmark at `sm`
(480px) would remove it from _every_ phone to fix the handful that cannot fit it.
The alternatives were each worse: shrinking the nav type breaks the scale, and
letting the header wrap breaks the `h-14` the dex's sticky column headers are
pinned to ([D-041](#d-041)). So the design got the breakpoint it actually needed
— the [D-035](#d-035) principle, applied to a breakpoint instead of a text style.

**What is not lost.** The flame Poké Ball is half the mark by
[D-026](#d-026)'s own description and remains the link home, so the brand is
present at every width; only the word goes.

**Found during the pre-push review**, along with a doc claim that said 1,066
entries have no history when the true figure is 1,045 — 1,259 minus the 193 with
stat history is not the same as "no history", because 21 entries have a type era
and no stat era. Every numeric claim in the docs is now checked against the
dataset rather than against arithmetic done in prose.

<a id="d-053"></a>

### D-053 · Colour both axes; mark the selection at the edges — **Firm**

**Decision.** Four refinements to the type chart, two of which have the same
answer and one of which had to be solved twice.

**The matchup heading mixed two type sizes.** "Attacking" was `text-h4` (18px
display) sitting next to `TypeBadge` pills at 11px, and no amount of aligning
makes those sit together on one line. The typing is now set as **text in its own
colour** at the heading's own size — the pairing [D-023](#d-023) established for
the comparison board's diffs, and one group 2 of the contrast audit already
covers. It reads as a sentence: "Attacking Water / Flying".

**Both axes are colour-coded now, and both fill their space.** Row headers were
already `TypeBadge`s, but left-aligned in a fixed column, so eighteen names of
different lengths left a ragged edge and a different-sized gap on every row; they
now fill the column. Column headers were eighteen grey abbreviations, which meant
counting columns to find one — they are filled badges too. The two axes are read
the same way, and the grid gets a coloured frame instead of a ragged one.

**Dimming the unselected headers was tried and reverted in the same pass.** It
was the obvious way to make the selection pop, and it directly undid the point of
colouring them: seventeen columns got harder to find in order to mark two.

**The badges in the grid drop the pill shape.** Inside a matrix the axis labels
_are_ cells, and a row of fully-rounded pills against a column of `rounded-xs`
cells reads as two systems sharing a table — so `TypeBadge` gained a `radius`
prop and the grid asks for the cells' corner. A prop rather than a class the
caller appends, because `rounded-xs` after `rounded-full` does not win: Tailwind
resolves that by stylesheet order, the same trap that gave the dex's sort control
the wrong height ([D-042](#d-042)).

**And the tier list drops them entirely.** Same diagnosis as the heading: a 14px
multiplier beside 11px pills is two type sizes on one line. The attackers are now
coloured text at the multiplier's size, flowing as a sentence — a tier is already
a group, so each name did not need its own container, and a ten-type row wraps
like prose instead of a hedge.

**Two spacing fixes worth recording only because they were invisible until they
were not.** The heading's typing gets an em dash, so "Attacking" and the types
are not jammed together. And the grid panel gained `p-1.5`: with the table flush
to the edge, the panel's own 16px corner radius cut across the corner badges and
made them look differently rounded from the rest of the axis. The padding
survives scrolling at both ends, which is not a given for a horizontal scroll
container.

**Marking the selected column: the wash could not do it.** A tint over the cells
is the natural move and it is boxed in by contrast — 22% dropped 2× text to
**4.14** and ½× to **4.24**, both under AA, and 12%, the most that stays legal,
is a **1.23** change nobody would notice. Anything visible enough to help buries
the number it is helping you find. So the weight went somewhere that costs the
text nothing: an **accent rule down each edge of the column**, which draws two
continuous lines the full height of the grid, with the 12% wash on top as
support. The audit carries both washed pairings so the ceiling stays enforced
rather than remembered.

<a id="d-052"></a>

### D-052 · The grid is scanned, not read — **Firm**

**Decision.** Three complaints about the type chart, one of which turned out to
be measurable rather than a matter of taste, and one of which uncovered a real
bug.

**"It takes me a second to spot what I want."** It did, and the numbers said why.
As _fills_, the four cell states were the same cell: 2× against ½× measured
**1.42**, ½× against a blank **1.10**, and 0× against ½× exactly **1.00** —
identical, separated only by the colour of 11px text. All the information was in
the type, none of it in the visual field, so the grid had to be read cell by
cell rather than scanned.

**The first fix was wrong, and measuring it said so.** The instinct was a
luminance ramp sinking resisted cells _below_ the surface — base → surface →
elevated. On a near-black UI the dark end has no room: those steps measured 1.08
and 1.10, no better than what they replaced. Brightness is where the range is, so
the scale now runs the other way: one loud state for 2× (a 55% accent blend,
**3.00** clear of the baseline) and everything else quiet. 55% is the ceiling —
70% would look better still and drops primary text to 3.78, under AA.

**"It is largely empty space."** Two causes. Every 1× cell was blank, so ~70% of
the grid was holes with nothing for the eye to track along; they now carry the
baseline fill, which also gives the rows and columns something continuous to
follow. And the table sat at its natural width inside a much wider panel, leaving
a strip of dead space to the right of the last column — it now fills the panel,
with the row-header column sized explicitly so the slack goes to the data columns
rather than to the one column that had no width of its own.

**A cross-hair, because a matrix is a lookup.** Hovering a cell lights its row
and column ([index.css](../src/index.css)). Two overlays rather than a row
background, since every cell now has its own fill and would paint over it.

**"Pick up to two" felt out of place.** It was: no other control on the site
captions itself. Gone from the screen — the chips dim when the cap is reached,
which says it at the moment it matters — and kept `sr-only`, where dimming is
the harder cue to notice.

**The bug this uncovered, and the testing lesson.** Filling the panel exposed
that the grid's overflow **leaked into the document's scrollable width**: at
600px the page grew a real horizontal scrollbar and a wheel gesture over the
header moved it 144px, breaking the site's oldest layout rule. It had been there
since the page shipped. It survived `overflow: hidden` on both axes of the
panel — only `contain: paint` stops it, which is the signature of the sticky row
header escaping the container's clip.

**390 / 768 / 1280 were all clean.** Every width this project has ever tested at
walked straight past it; it lived at 600 and 700. The sweep now runs **ten
widths** and checks for a real scrollbar (`innerHeight − clientHeight`) as well
as attempting the scroll, because the programmatic check alone had been reporting
a false negative at 390 for other reasons. A rule enforced at three sample points
is a rule enforced at three sample points.

---

## 2026-09-04 — Session 11 (the type chart)

<a id="d-051"></a>

### D-051 · The type chart, dual types included — **Firm**

**Decision.** Built `/types`, Statmon's third tool and the last thing the Home
tools row still advertised as "soon". One page holds two things: the full
effectiveness matrix as a reference, and a **dual-type readout**, which
everywhere else on the web means a separate page per pairing. The typing is a
path deep link (`/types/water/flying`, mirroring `/compare/<p1>/vs/<p2>`) and
the generation is `?asof=`, so a matchup is a link like every other view here.

**The research that justified the page.** "Has an existing matchup ever changed?"
turned out to be yes, **six times, at exactly two boundaries** — and the answer
was already sitting in the data [D-047](#d-047) derived:

| Boundary  | Changes among types that already existed                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Gen 1 → 2 | Bug → Poison ½×; Poison → Bug 1×; Ice → Fire ½×; Ghost → Psychic 2× (Gen 1 shipped a **bug** — the printed chart always said super effective) |
| Gen 5 → 6 | Ghost → Steel 1×; Dark → Steel 1×                                                                                                             |

Plus the additions: Dark and Steel in Gen 2, Fairy in Gen 6. Nothing changed
within Gens 2–5 or 6–9, which is why there are exactly three charts in history.
This page therefore needs the generation lens more than either existing tool: the
chart **is** its subject, and at Gen 1 the grid is 15×15 rather than 18×18.

**No red/green.** Every other type chart colours all 324 cells red and green —
which [04_design §2](04_design.md) rules out outright: it clashes with eighteen
type colours and is not colourblind-safe.

> **Revised by [D-052](#d-052).** This decision also left 1× cells blank and gave
> the other three states nearly identical fills, on the reasoning that a sparse
> grid makes the exceptions pop. In use it did the opposite — the states were
> indistinguishable without reading them, and the blanks left nothing to track
> along. The fills and the empty cells are both gone; the no-red/green
> constraint above still stands and still shapes the answer.

**Why a tier list rather than eighteen rows.** The question people bring to a
type chart is "what beats this?", and tiers answer it in one look where a list in
canonical order makes you scan and compare yourself. **Empty tiers are dropped**,
so the shape of the answer carries information: a typing with no 4× row has no
double weakness, and an absent row says that faster than an empty one.

**One documented exception to a firm rule.** The grid panel scrolls sideways
below about 1024px. [D-010](#d-010)/[D-029](#d-029)/[D-039](#d-039) rejected
sideways scrolling for the comparison board and the dex — but both of those are
**lists**, where columns can be dropped and the remaining ones still answer the
question. A matrix has no such subset: drop columns and it stops being the
chart. So the scroll is confined to the bordered panel, the page around it never
scrolls, and on a phone the picker and readout come first, because "what beats
Water/Flying" is what you want on a phone and the matrix is the reference you
scroll to. Verified by _attempting_ the scroll rather than by measuring
`documentElement.scrollWidth`, which counts a clipped descendant's extent and
over-reports for exactly this shape.

**Reuse over invention.** The page adds two pure modules (`typesIn` on
`typeChart.js`, and `lib/typeView.js` for the URL and the tiers) and three
components, and otherwise runs on what was already here: `GenerationStrip`,
`TypeBadge`, `FeaturePreview`, `chipStyles`, and the effectiveness maths built
for the comparison card. `dexGenerations()` became **`allGenerations()`**, since
a third tool wanted it and nothing about it was ever dex-specific.

**Home advertises it** ([D-043](#d-043)): the tools chip is a link, and the
preview is the real `MatchupSummary` for **Bug / Fire** — Volcarona's typing, so
it happens to show the mascot's famous 4× Rock weakness. Same easter-egg spirit
as the dex preview's Black & White team ([D-044](#d-044)). _This is Home's third
tool preview, and D-043 puts the pattern's ceiling at about four: the next tool
should trigger the compact-grid rethink it describes rather than letting the page
keep growing._

**The header nav was the easy thing to miss.** The page works perfectly when you
type its URL, so nothing failed while `Layout`'s nav still listed three tools. A
route test now asserts every page links to `/types`, because "a tool nobody can
navigate to" is a state the whole test suite was happy with.

---

## 2026-09-04 — Session 10 (two layout nits, one shared cause)

<a id="d-050"></a>

### D-050 · The strip is always present, and on the dex it lives in the panel — **Firm**

**Decision.** Two complaints, one of them a repeat, and the fix for both is
placement rather than styling.

**The comparison board moved when you picked a Pokémon.** The strip was absent
until a selection existed, so the row it shares with Swap grew when it arrived
and pushed the whole board down the page. That is
[D-046](#d-046)'s appearing-and-vanishing control again — the thing that decision
set out to remove — left behind on the one screen where it also caused a layout
shift, because "no Pokémon selected" was still being treated as "nothing to
offer". It now renders **unconditionally**: with nothing picked, the whole
timeline is on offer, and a generation chosen before the first Pokémon survives
into the selection. Verified as zero movement at 390 / 768 / 1280px.

_Inlining the label beside the chips would have equalised the row's height on
desktop and was the tempting fix, but the shift would have survived on a phone,
where the row stacks. Removing the condition removes the shift everywhere._

**The dex's strip had no visual home.** Everything else on that page is either in
the controls card or in the table; the strip was a third thing floating on the
background above a large panel. It was kept outside because the panel collapses
on a phone — but only the **chip groups** collapse, and the name box already
lives inside the card and stays visible. So the strip now leads the panel above a
divider, outside the collapsible region: visible at every width, and reading top
to bottom as the relationship actually is — choose the dex, then narrow it.

**Which surfaced a third problem worth fixing.** Two generation controls now
share one panel, and at Gen 1 the lower one was **inert**: filtering the Gen 1
dex to "Gen 1" is every row it already has. So the origin filter is renamed from
**"Generations"** to **"Introduced in"** — named for what it filters, which is
what keeps it apart from a strip that also says a generation — and it is hidden
entirely whenever the lens leaves it a single option.

---

## 2026-09-04 — Session 9 (the dex as of a generation)

<a id="d-049"></a>

### D-049 · The dex reads as of a generation — and that caps its rows — **Firm**

**Decision.** `/dex` takes the same generation lens as the comparison board, with
one addition that makes it more than a stat swap: **"as of Gen 3" also decides
which Pokémon are in the table.** Anything that debuted later is gone. The result
is a dex you could have used while playing that game — 392 rows at Gen 3, 151 at
Gen 1, the latter with five stat columns and a **Special you can sort by**.

**Why the lens filters as well as re-reads.** A table headed "Gen 3" that lists
Volcarona is simply wrong, and nobody playing Gen 3 wants it there. The ceiling
is `introducedIn`, not `generation` — Alolan Raichu is a Gen 1 _species_ that
arrived in Gen 7, and a `generation <= asof` test would have let it into a Gen 3
dex. Type filtering moves to the era's typing for the same reason: a Gen 5 dex
offers no Fairy chip, and Clefairy answers to Normal there.

**Why not per-row history popups.** The alternative on the table was a Gen 1
toggle plus an ⓘ on each of the ~62 rows whose stats later changed, opening its
old values. It was rejected on one argument: **the dex exists to rank.** A popup
states a fact about one row; it cannot answer "who was the fastest Pokémon in
Gen 3", which is the entire reason this tool is a sortable table. History that
the sort cannot reach is trivia sitting next to a ranking instrument — and it
would have cost 193 markers of chrome in a table built for scanning, plus a
popup layer that has to survive windowed 48px rows. The lens feeds the sort, so
`?asof=1&sort=special` ranks the 151 by the stat they actually had.

**`asof` and `gen` are different axes, so they get different names.** The dex
already spends `?gen=` on the **origin filter** ("Pokémon introduced in Gen 5"),
which is not the same question as "the dex as it stood in Gen 5" — and both are
on screen at once. So the lens is **`?asof=`** on both tools; `/compare`'s
`?gen=`, written a day earlier and never committed, was renamed to match. One
concept, one name. The labels carry the distinction too: the strip says **"Dex as
of"** on the dex — because it changes the rows — and **"Stats as of"** on the
comparison board, where it does not.

**Two degradations, both self-healing.** A stale `?asof=3&gen=7` would otherwise
be a table with nothing in it, so the origin filter's canonical list is capped at
the lens. And a sort key the lens has no column for **maps across the Special
split** (`spAtk`/`spDef` ↔ `special`) rather than being discarded: switch a
Sp. Atk ranking to the Gen 1 dex and you get the Special ranking, which is the
same question asked of the generation that had one stat for it. Both are done in
one place, so a chip click and a hand-edited URL land in the same state.

**No dots on this strip.** The comparison board marks the generations whose board
differs from today ([D-046](#d-046)). Across 1,259 rows nearly every generation
contains _something_ that changed, so every chip would be marked and the mark
would carry no information. It stays a two-Pokémon affordance.

**One performance note, measured rather than assumed.** `DexRow` takes `asof` as
a **primitive** and resolves its own view, instead of being handed a view object.
The row is memoised because the windowing hook re-renders the table on every
scroll frame; a fresh object per render would give it a new prop identity each
time and re-render every visible row as you scroll. Resolving the whole
era-filtered dex for the sort measures **~1ms** — the same order as the filter
and sort themselves — so it stays unmemoised, as [D-039](#d-039) established.

**Verified against the dataset, not from memory.** Two of the new assertions
failed on the first run and **both were my expectations**: Chansey is 18th by Gen
1 Special, not top-eight, and a Pokémon's row _index_ is not its rank when the
two tables being compared are different sizes. Exactly the [D-039](#d-039)
lesson, which is why the counts in these tests are computed from `ALL_POKEMON`
rather than typed in.

---

## 2026-09-04 — Session 8 (style consolidation)

<a id="d-048"></a>

### D-048 · One chip vocabulary; the playground stops keeping its own copies — **Firm**

**Decision.** The colour half of a toggle chip lives once, in
`src/components/chipStyles.jsx`, and the three chip families keep only their
geometry. And `/style` — the page whose whole claim is that it renders the real
thing — now imports the data it displays instead of restating it.

**The chip drift, caught at three copies.** Form chips, the dex filter chips and
the new generation strip ([D-046](#d-046)) had the same four class strings
hand-copied into each. That is exactly the failure [D-032](#d-032) wrote up when
it built `Button`: variants that start identical and diverge one careless edit at
a time. What differs between them is real and stays local — form chips are
compact enough for the card's fixed 40px band, filter chips carry a dot and a
dismiss ×, generation chips are near-square around one numeral — so the split is
**colour and shape shared, size and padding local** ([04_design §6](04_design.md)).

A constants module rather than a `Chip` component, because a component would
have to take a prop for each of those geometries and would end up a worse
version of three clear call sites. It has to be `.jsx`: Tailwind only scans
`.jsx` ([D-038](#d-038)), and `react-refresh` allows a component file to export
only components — the same pair of constraints that produced `dexColumns.jsx`.

**The fourth copy of the 18 types.** [D-038](#d-038) consolidated three
hand-maintained copies of the type list into `lib/types.js` and added assertions
tying them together. It missed one — in `/style`, of all files, the page whose
stated purpose is that it cannot drift from the app. It had been there since the
playground was written.

The lesson is not "look harder". It is that **a consistency claim survives only
as long as something checks it**: the three copies D-038 knew about are still
correct because a test asserts it, and the one it did not know about quietly
stayed wrong. So the fix is not only the import — it is a test that fails on
_any_ second list of the 18 anywhere in `src/`, named file by file. Verified by
planting a copy and watching it fail, because a guard nobody has seen fail is a
guess.

**Also.** `/style` now renders all three chip geometries side by side, so a
divergence between them is visible on a page someone actually looks at rather
than inferred from three files. `04_design` §5 gained the Gen 1 board's 532px
height and the control row; §6 gained the generation strip and the chip table;
`06_style_guide` gained a usage rule for shared class modules and a section on
what the playground is and where it has been wrong.

---

## 2026-09-03 — Session 7 (generation-accurate comparisons)

<a id="d-047"></a>

### D-047 · The type chart moves with the era — **Firm**

**Decision.** When the board is read at an earlier generation, the STAB matchup
is scored on **that generation's type chart**, not today's. Three charts have
ever existed — Generation 1, Generations 2–5, and Generation 6 onward — and
`lib/typeChart.js` now carries the two older ones as `CHART_ERAS` beside the
current `CHART`, plus `TYPE_INTRODUCED_IN` for the three types that arrived
late (Dark and Steel in Gen 2, Fairy in Gen 6).

**Why this was not optional.** [D-046](#d-046) swaps a Pokémon's typing to its
era's, which on its own would produce a board mixing Gen 1 typings with Gen 9
maths — Gen 2–5 Ghost reading 1× into Steel when it was ½×, or Gen 1 Bug
reading ½× into Poison when it was 2×. Half the change would have been worse
than none: it looks authoritative and is wrong.

**It is much smaller than it sounds.** Once types that did not exist yet are
excluded from a matchup, only **four attacking rows differ in Gen 1** (Ice,
Poison, Bug, Ghost) and **two in Gen 2–5** (Ghost, Dark). Everything else is
inherited. Fire's modern row mentions Steel, but in Gen 1 that entry can never
be reached, so the row needs no historical copy — the existence filter does the
work that a hand-written era chart would otherwise have to.

**Whole rows, not cell patches.** A patch can override a cell but cannot express
one that is simply absent, and Gen 1's Ice row is defined as much by what is
missing (Fire did not resist Ice) as by what it contains. Replacing whole
attacking rows is unambiguous and reads as the chart it is.

**Hardcoded, but no longer merely trusted.** [D-018](#d-018) hardcoded the chart
as canonical static data, which is still right — but "canonical" is not the same
as "typed correctly". `npm run build:data` now fetches all 18 `/type` resources
and asserts our chart matches PokéAPI cell for cell **across all three eras**,
failing the build on any mismatch. The first run found **zero drift** in the
existing chart, which is the outcome that makes the check worth keeping: it
confirms the hand-written data and would have caught a typo in the new rows.

**The Gen 1 Ghost/Psychic question, answered deliberately.** Gen 1's own type
chart says Ghost is super effective on Psychic; the games shipped a bug that
made it do nothing. PokéAPI records the bug, and so do we — someone asking what
a Gen 1 matchup looked like is asking about the game they played, not about the
manual.

<a id="d-046"></a>

### D-046 · One generation strip for the board, always shown — **Firm**

**Decision.** Both historical readings — Gen 1's Special split and later stat
revisions — are one control: a strip of numbered chips, **one per generation the
two selected Pokémon both existed in**, on the same line as Swap. The newest
chip is today. The generation lives in the URL as `?asof=`, so a historical
matchup is a link like any other view on this site ([D-022](#d-022)). _(Written
as `?gen=` on the day; renamed the next, when the dex needed `gen` for its own
origin filter — see [D-049](#d-049).)_

**Why one control and not two.** The obvious build is a "Gen 1 Special" toggle
plus a generation dropdown. That is two overlapping controls that can
contradict each other — what does "Gen 5" plus "Gen 1 Special" mean? — and needs
a rule for which wins. Scoping one generation to the whole board makes both
features one thing and deletes two rules that would otherwise be hand-written:
Gen 1's five-stat shape is just what the dataset returns when you ask for Gen 1,
and "only offer Gen 1 when both are Gen 1 Pokémon" is just where the strip
starts.

**Every shared generation, not only the ones that changed.** The first build
offered only the _eras_ — the ranges between changes — and hid the control
entirely when a matchup had no history, which is 1,045 of 1,259 entries. In use
that was the wrong call, and the reason is worth recording: **the control's
presence depended on a computation across both slots** — the shared range
intersected with the change-boundaries of either — so it appeared and vanished
for reasons nothing on screen explained. You could not learn the rule by using
it. A plain range is legible instead: pair a Gen 1 Pokémon with Volcarona and
the strip starts at 5, so "why can't I pick Gen 1" answers itself. The extra
options are honest — "as of Gen 3, Pikachu had these stats" is true whether or
not Gen 3 differs from Gen 4 — and a **dot marks the generations that differ
from today**, so the strip doubles as a map of where this matchup has history.
The dot is paired with screen-reader text rather than carrying meaning alone
([04_design §1](04_design.md) rule 4).

**Numbers, not range labels.** "Gen 1 · Gen 2–5 · Gen 6–now" does not fit beside
Swap at any width once there are nine of them, and a generation is a number
people already think in. The visible label is a bare numeral with the accessible
name built _around_ it — `Generation 5`, not a replacement string — because
WCAG 2.5.3 needs the visible text inside the accessible name ([D-042](#d-042)).

**What answers "a Gen 1 Pokémon against a modern one".** Nothing, deliberately:
the strip starts at the later debut, so that board is unreachable. Gen 1 is a
different _measurement_, not a different value — five stats, and Special is not
Sp. Atk. One Special row against two modern ones has no honest layout, and a
five-stat 425 total against a six-stat 550 is a category error rather than a
delta, on one of the three headline numbers of the board. So Gen 1 is a state
both cards are in or neither is. _(This was the original instinct at the start
of the session — "you can only switch to the gen 1 stats if you are comparing 2
gen 1 Pokemon" — arrived at again from the other direction.)_

**Per-card selectors, considered and rejected.** Giving each card its own
generation would unlock comparing a Pokémon to its past self (Pikachu Gen 5 vs
Gen 9), which is genuinely nice. It costs more than it returns: the primary use
case — "I am playing Gen 3, show me both at Gen 3" — becomes a two-step action;
Gen 1 has to be special-cased back into a linked control anyway, so one option
behaves unlike the rest; and the STAB block loses its answer to "which
generation's chart is this?" when the two sides disagree. Worth revisiting only
if same-Pokémon-across-eras becomes a thing people ask for.

**Layout.** The strip takes the width it needs on the left and Swap sits
opposite it, rather than two stacked centred rows leaving the middle of a
1,120px page empty. Below `sm` they stack — nine chips plus a button do not fit
on a phone, though the nine chips alone do.

**A Gen 1 board is 532px, not 568.** Five stat rows instead of six shortens the
cards by exactly one 36px row. All three switch together, so they stay equal
height and the mirrored rows stay aligned — the [D-019](#d-019) rhythm holds at
both heights. The empty card takes the board's stat list rather than assuming
six, so a half-filled Gen 1 board does not go lopsided.

**Known and deliberate: the form chips still offer Megas in a Gen 1 view.**
Picking one is not an error — it navigates to that form, and since the form did
not exist in Gen 1 the generation falls back to current, visibly. Hiding forms
per generation would remove working functionality to prevent a state that
already resolves itself gracefully.

**Gen 1 totals read lower, and that is correct.** Alakazam is 405 in Gen 1 and
500 today, because Gen 1 had one fewer stat to add up. Worth writing down: it
looks like a bug the first time you see it, and it is the single most likely
thing to be "fixed" by mistake later.

<a id="d-045"></a>

### D-045 · Historical stats and typings, as eras — **Firm**

**Decision.** The dataset now carries what a Pokémon's base stats and typing
**used to be**, as `statEras` / `typeEras` records plus an `introducedIn` date
per entry. Two real situations motivated it: Generation 1 had no Sp. Atk /
Sp. Def — a single **Special** stat covered both — and a number of Pokémon have
had stats revised since (Butterfree's Sp. Atk was 80 through Gen 5, Aegislash
was cut down in Gen 8, Zacian-Crowned in Gen 9).

**PokéAPI has all of it, which was not a given.** Three fields, all sharing one
rule — a record's `generation` is the **last generation those values applied
in** — which the dataset keeps verbatim as `until` rather than converting, so
the stored data reads the same as its source:

| Field                        | Coverage                              |
| ---------------------------- | ------------------------------------- |
| `pokemon.past_stats`         | **193** of 1,259 entries, 213 records |
| `pokemon.past_types`         | **29** entries                        |
| `type.past_damage_relations` | 8 of 18 types → [D-047](#d-047)       |
| `pokemon-form.version_group` | the debut of each alternate form      |

**Gen 1's Special had to come from the API, not from a formula.** The tempting
shortcut is "Gen 1 Special became Sp. Atk in Gen 2". It is wrong for **43 of the
151** Gen 1 species — Chansey 105 → 35, Gyarados 100 → 60, Hypno 115 → 73,
Charizard 85 → 109. A derived Gen 1 board would have been confidently wrong for
28% of the generation it was built for. PokéAPI records the real value for all 151.

**Seven records are traps.** PokéAPI also emits a `past_stats` record when only
the **EV yield** changed, and Blissey, Roselia, Yanma, Dusclops, Duskull,
Misdreavus and Slowking each carry one whose base stat is identical. Kept, they
would put a "Gen 3" chip on Blissey's board that changes nothing on screen. The
build drops any record whose value matches the one it would replace — comparing
against the **running** resolved value rather than against today's, so a record
that restores an earlier value would still survive.

**Alternate forms need their own date.** An alt form does not debut with its
species: Alolan Raichu is a Gen 1 species introduced in Gen 7, and Mega Alakazam
a Gen 1 species introduced in Gen 6. Without `introducedIn`, an era selector
would happily offer Gen 1 for a form that did not exist yet. The build reads it
from each form's `version_group` (161 of the 234 alternate forms are re-dated;
the rest debut with their species), which needed a version-group → generation
map — 32 more cached requests.

**Where the logic lives.** `src/lib/eras.js`, pure functions over plain data with
no React and no DOM, unit-tested directly — the same split as
[`lib/dexTable.js`](../src/lib/dexTable.js), and for the same reason: the
interesting part here is resolution, not rendering. `STAT_ORDER` was deliberately
**not** extended with `special`; the stored six-stat array's order depends on it,
and so does every dex consumer. Era patches index into `ERA_STAT_KEYS`
(`STAT_ORDER` plus `special`) instead, so the modern six are untouched.

**Cost.** The dataset grew 121,962 → 128,074 bytes, **+1.1 kB gzipped** — the
compact-encoding rules of [D-036](#d-036) applied to the new fields, which are
absent entirely on the ~85% of entries with no history. The whole-dataset
round-trip test covers them for free, which is what that test was for.

**Deliberately not done.** The **dex table** stays current-generation. "Sort the
whole dex as of Gen 1" is a genuinely good feature and `lib/eras.js` would drop
straight into it, but it is a second tool's worth of UI and this pass was scoped
to the comparison tool. **Home** keeps no era control either: [D-043](#d-043)
requires a live preview for every _tool_, and this is an enhancement to a tool
whose preview is already the hero board. Recorded rather than left implicit, so
the rule is not silently skipped.

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
  hides them for anyone who wants the clean National Dex. _(The default was
  later flipped — the clean dex is the resting state and the toggle reveals the
  forms; see [D-056](#d-056).)_ Forms sort beside their
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

### D-023 · Home = product-as-hero; Volcarona + Chandelure mascots; blunt suite copy; type-colored diffs — **Firm** _(product-as-hero reversed by [D-070](#d-070); the board named by [D-067](#d-067))_

**Decision.**

- **Product-as-hero.** _(No longer true — [D-070](#d-070) put a sprite wall above
  the board. The board is still on Home, still built this way, and still crests
  the fold; it is no longer the first thing on the page.)_ The Home hero **is**
  the product: a live, fixed featured comparison rendered by `FeaturedComparison.jsx` (**Volcarona vs Chandelure**, pulled from the real dataset via `getBySlug`), reusing the comparison tool's exact visual language (mirrored type-colored bars, type-tinted center diffs, the flame "Higher total +N" delta, the flame speed banner, and — in the head center — the attacker's **STAB** effectiveness as compact type-tinted pills). Bars grow in once on mount (pure-CSS `animate-grow-w`, no effect). **Volcarona + Chandelure are adopted as the site's pseudo-mascots**: their **pixel sprites sit inside the comparison cards**, while their **official-art illustrations peek out from behind** the board's left/right edges (soft drop-shadow, `lg`+ only) for a nostalgic feel.
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

**Why.** My preference — purple (pastel) over orange. Volcarona and Chandelure are both favorites and I genuinely can't rank them, so the palette honors both (Volcarona mascot + Chandelure colors) while keeping the "flame" thread. Pastel purple also suits the calm-tech minimalist tone better than a hot orange. Colors were lifted slightly from the authentic tones for contrast on the near-black background, and the accent is kept bluer/lighter than the purple-family type colors so it never reads as a type. Sourced hexes and rationale in [04_design §2](04_design.md); research in [02_research §7](02_research.md).

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

## Open / Undecided — none

This section held four questions "to resolve before or during Phase 1" and was
never emptied; all four were answered by Phase 3 and two of them twice over.
Kept as a record of what was genuinely open at the start rather than deleted.

- ~~**Project template specifics**~~ — ✅ no template. Plain Vite + React, with
  React Router and Wrangler layered in when each was needed ([D-013](#d-013)).
- ~~**Styling approach within Tailwind**~~ — ✅ CSS variables. The 18 type
  colours are `--color-type-*` tokens read through `typeColorVar()`, and the
  parallel JSON map the spec anticipated was never built because the tokens made
  it redundant ([D-028](#d-028), [04_design §3](04_design.md)).
- ~~**Mobile layout strategy**~~ — ✅ per-stat cards under 768px
  ([D-010](#d-010)), later corrected so the comparison card is the ONLY stats
  surface at that width ([D-057](#d-057)).
- ~~**Testing depth for MVP**~~ — ✅ Vitest, and rather more of it than the
  question imagined: **478 tests across 15 files**, plus four checks that are not
  tests at all (`audit:classes`, `audit:contrast`, `check:docs`,
  `sweep:widths`). Playwright was never added, and
  [Phase 5](05_roadmap.md#phase-5--fast-follow-v2) records why: the headless
  width sweep covers the thing it was wanted for.

---

_Template for new entries:_

```
### D-0XX · <short title> — <Firm | Provisional>
**Decision.** <what>
**Why.** <reasoning, trade-offs, links to research>
```
