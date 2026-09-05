# Statmon — Decisions (Step 3)

_A dated log of what's decided and **why**. The highest-value doc for a solo dev: six weeks from now, "why did I pick X over Y?" is answered here instead of re-litigated. Newest entries at the top. Entries marked **Provisional** are current leans pending a build-time gut-check; **Firm** are settled._

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
