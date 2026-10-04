import { LuX } from "react-icons/lu";
import TypeBadge from "./TypeBadge";
import FormChips from "./FormChips";
import AbilityChips from "./AbilityChips";
import IconButton from "./IconButton";
import StatBar from "./StatBar";
import { CHIP_CELL, CHIP_CELL_LABEL } from "./chipStyles";
import { STAT_ORDER, STAT_LABEL } from "../lib/stats";
import { artworkFor, formsOf } from "../lib/pokemon";
import { dexNumberOf } from "../lib/dexTable";

// TCG-inspired card. Artwork is a bold square backdrop bleeding behind the
// stat bars; a scrim keeps them legible. Vertical spec is on an 8pt rhythm and
// is shared with ComparisonCard so all three cards are equal height with
// aligned stat rows: head 56 + controls 88 + body 176 (= 320 top zone),
// stats (pt-2 + 6×h-9 + pb-4 = 240), footer 56 → 616 total.
//
// **Below md the card is 424 and carries no stats at all** (D-057): head 56 +
// controls 88 + body 224 + footer 56. At that width the board is
// one column with the comparison card above, which already shows all six stats
// as per-stat cards naming both Pokémon — so the bars here were the same
// numbers a second time. The equal-height invariant is a ≥md concern anyway:
// below md the three cards are stacked, not side by side, and nothing has to
// line up.
//
// In a Generation 1 view there are five stat rows, not six — Gen 1 had a single
// Special where the modern schema has Sp. Atk and Sp. Def (D-045) — so the
// stats band is 204 and the card 580. All three cards switch era together, so
// they stay equal height and the mirrored rows stay aligned either way.
//
// **The controls band is 88 and sits ABOVE the portrait** (D-080, moved by
// D-082). 88 is the same total the two separate form and ability bands used to
// occupy (40 + 48), so relabelling and then relocating them moved none of their
// outsides: the card stays 616, the comparison card's top zone stays 320, and
// every height in 04_design stays true.
//
// It is above the portrait because form and ability are **identity** — which
// Pokémon this card is, and which version of it is in play — so they belong
// with the name, the dex number and the type badges. Below the portrait they
// sat on the artwork, and unlike the stat bars (2px, sparse) a row of 21px
// opaque pills does not read as bleeding behind anything: it reads as covering.
//
// **The artwork box starts at 144px — exactly where the controls band ends —
// and is capped at 280px** (D-081, re-derived by D-082, corrected by D-085).
// It is `w-full aspect-square`, so its height follows the card's WIDTH while
// the space that shows it is fixed: uncapped it measured 718px at a 767px
// viewport and 476px at 1023px, clipping every subject to its top third.
//
// **The position is the guarantee; the size is only a budget.** An earlier
// derivation sized the artwork so that its SUBJECT would start below the chips,
// using the tightest-cropped decile — which was unsound, because PokéAPI's
// official artwork is cropped to the subject and the tightest of them
// (Blacephalon) touches the very edge of its square. At 0% inset no size clears
// anything: the box top is the subject top. Starting the box AT the band's
// bottom edge instead makes the guarantee absolute and independent of the crop,
// and needs no statistics at all.
//
// 280 is then just how far the art may bleed. It reaches 424 — the full card
// below md, and 104px behind the stat bars above it — with the scrim taking
// over from 90% of the card's height, which is the fade the scrim exists for
// (04_design §6).

// Stats, typing, BST and the ability roster come from the era view
// (lib/eras.js) rather than straight off the entry, so the card renders
// whichever generation is selected. `view` is always supplied; `eraView(p,
// null)` is today's values untouched.
//
// The scrim and the text shadow are utilities in index.css (`.bg-scrim-art`,
// `.shadow-on-art`) rather than strings built here (D-134).

export default function PokemonCard({
  pokemon,
  view,
  keys,
  ability,
  onSelectForm,
  onSelectAbility,
  onClear = null,
}) {
  // The empty card takes the board's stat list rather than assuming six, so a
  // half-filled Gen 1 board keeps both cards the same height.
  if (!pokemon) return <EmptyCard keys={keys} />;

  const primary = view.types[0];
  const forms = formsOf(pokemon);
  // Alternate forms (Mega/regional/…) share their species' National Dex number
  // — see dexNumberOf, which the dex table needs for every row.
  const dex = dexNumberOf(pokemon);

  return (
    <div className="relative flex flex-col overflow-hidden bg-surface border border-border-subtle rounded-lg">
      {/* Decorative: the <h2> below carries the same name, so alt text here
          only makes a screen reader announce it twice. */}
      {/* Eager and high priority, against the site's usual `loading="lazy"`.
          This is the largest element on /compare and sits at the top of the
          board on every width from md up, so it IS the LCP — and a lazy LCP
          image is the classic way to make a page measure slower than it is:
          the browser defers the one fetch the paint is waiting on.
          Below md the comparison card is above these (D-057), so on a phone
          this fetches slightly earlier than it is needed. That is the right
          side to err on for a desktop-first tool, and it is two images. */}
      <img
        src={artworkFor(pokemon)}
        alt=""
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="pointer-events-none absolute inset-x-0 top-36 z-0 mx-auto w-full max-w-70 aspect-square object-contain drop-shadow-art"
      />
      <div className="pointer-events-none absolute inset-0 z-1 bg-scrim-art" />

      <div className="relative z-2 flex flex-col">
        {/* Head */}
        <div className="h-14 flex items-start justify-between gap-3 px-4 pt-4">
          <div className="min-w-0">
            <h2 className="text-h3 truncate shadow-on-art">{pokemon.name}</h2>
            <div className="text-caption text-secondary mt-0.5 shadow-on-art">
              #{String(dex).padStart(4, "0")}
            </div>
          </div>
          {/* Badges and the clear button sit SIDE BY SIDE in the head's right
              column rather than stacked, because the head is a fixed 56px
              (D-080's arithmetic) and two badges already use 40px of it. A
              third stacked item would overflow the band; a third column does
              not change its height at all. */}
          <div className="flex shrink-0 items-start gap-2">
            <div className="flex flex-col items-end gap-1.5">
              {view.types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
            {/* **A button only when it does something** — the rule D-078 set
                and D-111 had to apply twice. `/compare` is the only caller
                today, so the `null` default guards nothing yet; it is here so
                that a read-only caller gets no control rather than a disabled
                one, which is how the games index acquired an invisible button
                that ate clicks (D-111).

                The site's one icon button (D-135), 36px like every compact
                control, which clears WCAG 2.5.8's 24px floor outright rather
                than through its spacing exception. `-mr-2` sets the X itself
                on the card's content edge rather than its hit box, and `-mt-2.5`
                centres it on the FIRST badge (D-141). Top-aligned it sat
                centred on the pair of badges, which looked right for a dual
                type and left a single type's X 10px below its only badge.
                Always visible, never hover-only: a control that appears on
                hover is undiscoverable and unreachable on touch. */}
            {onClear && (
              <IconButton
                label={`Remove ${pokemon.name}`}
                onClick={onClear}
                className="-mr-2 -mt-2.5"
              >
                <LuX aria-hidden />
              </IconButton>
            )}
          </div>
        </div>

        {/* Controls. One 88px band holding both chip groups, each named by a
            `text-overline` label in its own column (D-080).

            They used to be two unlabelled bands of visually identical chips,
            stacked, with nothing on screen saying which was which — "Base /
            Mega" and "Flame Body / Swarm" read as one blob of controls. Naming
            a control group is the site's own pattern everywhere else
            (GenerationStrip, TypePicker, DexFilters), and this was the one
            place it was missing.

            Left-aligned rather than centred, because that is what the stat rows
            immediately below do: the card now reads as one spec sheet with a
            label column instead of a portrait with chips floating on it.

            **Rows align on the BASELINE, so a label sits on the first line of
            its chips** (D-089). A label names a group, and a reader enters a
            two-column block at the top of the right-hand column — which is why
            a `<dt>` sits at the top of its `<dd>` and a form label sits on the
            first line of its control. Centring instead put "Ability" beside the
            gutter BETWEEN two wrapped chip rows, pointing at nothing. Baseline
            rather than `items-start` because the label is 11px against a 21px
            chip: aligning the boxes would sit it 5px high, and aligning the text
            is what the eye actually reads. It also needs no number — the other
            way round is a hardcoded offset that breaks the moment either type
            style changes.

            Shadowed like those stat rows, and for the same reason: this sits
            over the artwork, and while the chips carry their own fill, the
            labels and both empty states are bare text — "Abilities arrived in
            Gen 3" landed unreadable across Charizard's tail on a Gen 1 board.

            **Top-aligned, not bottom-aligned** (D-083). The band is a fixed 88px
            but its content is 48px for the two thirds of the dex that fit on two
            rows, so 40px of it is slack — and bottom-aligning put that slack
            between the name and the chips, where it is a visible gap that
            changes size with the roster. Volcarona showed 40px of it and
            Chandelure 13, for no reason a reader could see. Top-aligned, the
            chips always sit the same distance below the name and the slack falls
            between them and the portrait, where the artwork's own transparent
            margin already lives and nothing marks the edge. The four-row Tauros case still
            overflows the band, ending at 162px — 18px into the artwork box. It
            lands on that artwork's transparent margin, but unlike the band's
            own position that is a property of the crop rather than a
            guarantee. Four entries of 1,259. */}
        <div className="h-22 grid grid-cols-[auto_1fr] content-start items-start gap-x-3 gap-y-1.5 px-4 pt-1 shadow-on-art">
          {/* The FORM row holds its space even for the 845 entries with one
              form, where `FormChips` renders nothing. A row that disappears
              would slide the ability row up and change the card's height for
              two thirds of the dex — the D-050 rule, and here it is also what
              keeps the three cards equal. */}
          <span className={`${CHIP_CELL_LABEL} text-overline text-tertiary`}>
            Form
          </span>
          {/* `CHIP_CELL` reserves one chip's height, so the em-dash branch is
              the same box as the chips branch. Without it the placeholder was
              24px against a chip's 21 — inline text taking its height from the
              inherited line-height — and both labels shifted up by a few pixels
              the moment a Pokémon had alternate forms. */}
          <div className={CHIP_CELL}>
            {forms.length > 1 ? (
              <FormChips pokemon={pokemon} onSelect={onSelectForm} />
            ) : (
              <span className="text-caption text-tertiary">&mdash;</span>
            )}
          </div>

          <span className={`${CHIP_CELL_LABEL} text-overline text-tertiary`}>
            Ability
          </span>
          {/* Same reservation: `AbilityChips` renders a sentence rather than
              chips for the 14 entries with no abilities, and on every Gen 1 or
              Gen 2 board. */}
          <div className={CHIP_CELL}>
            <AbilityChips
              abilities={view.abilities}
              selected={ability}
              onSelect={onSelectAbility}
              gen={view.gen}
              // Named per card, the way the two search fields are: /compare
              // renders this control twice, and two groups both called
              // "Ability" tell a screen reader nothing about which board they
              // belong to.
              label={`${pokemon.name}'s ability`}
            />
          </div>
        </div>

        {/* Body — the clear portrait window. Taller below md, where the stat
            band is gone: the portrait is what the card is FOR at that width. */}
        <div className="h-56 md:h-44" />

        {/* Stats over the lower artwork. Hidden below md: at that width the
            comparison card above already shows all six as per-stat cards naming
            both Pokémon, so these were the second of three copies of the same
            numbers on one screen (D-057). What the card keeps is what only it
            has — the identity, the artwork, the forms and the total. */}
        {/* **These grow in too** (D-124). The centre card's bars animated and
            the two beside them did not, which made the board look like it was
            loading in halves.

            Keyed on THIS card's own values, not the board's: a card re-animates
            when its own Pokémon or era changes, and holds still when the other
            side changes underneath it. The comparison card between them keys on
            both, because both are what it is comparing. */}
        <div
          key={view.keys.map((k) => view.stats[k]).join(",")}
          className="hidden md:block px-4 pt-2 pb-4 shadow-on-art"
        >
          {view.keys.map((k) => (
            <div
              key={k}
              className="grid grid-cols-[2rem_1fr_2.5rem] items-center gap-3 h-9"
            >
              <span className="text-overline text-secondary">
                {STAT_LABEL[k]}
              </span>
              {/* The glass track, because this is the one bar that sits over
                  artwork: the art shows through it (04_design §5). */}
              <StatBar
                value={view.stats[k]}
                type={primary}
                track="glass"
                animate
              />
              <span className="text-stat text-primary text-right">
                {view.stats[k]}
              </span>
            </div>
          ))}
        </div>

        {/* BST */}
        <div className="h-14 mx-4 flex items-center justify-between border-t border-border-subtle">
          <span className="text-overline text-tertiary">Base stat total</span>
          <span className="text-stat-lg text-primary">{view.bst}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyCard({ keys = STAT_ORDER }) {
  return (
    <div className="flex flex-col overflow-hidden bg-surface border border-dashed border-border-subtle rounded-lg">
      {/* Head, controls and portrait as ONE zone (56 + 88 + 176/224), rather
          than three empty bands mirroring the filled card's. Nothing here needs
          their boundaries — but the message does need to sit where
          ComparisonCard's "Pick two Pokémon to compare." sits, and that one is
          centred in the whole 320px top zone. Kept as three bands, this text
          centred inside the 176px portrait alone and hung 72px lower than its
          pair (D-083). */}
      <div className="h-92 md:h-80 flex items-center justify-center">
        <span className="text-body-sm text-tertiary">No Pokémon selected</span>
      </div>
      <div className="hidden md:block px-4 pt-2 pb-4">
        {keys.map((k) => (
          <div
            key={k}
            className="grid grid-cols-[2rem_1fr_2.5rem] items-center gap-3 h-9"
          >
            <span className="text-overline text-tertiary">{STAT_LABEL[k]}</span>
            <StatBar />
            <span className="text-stat text-tertiary text-right">–</span>
          </div>
        ))}
      </div>
      <div className="h-14 mx-4 flex items-center justify-between border-t border-border-subtle">
        <span className="text-overline text-tertiary">Base stat total</span>
        <span className="text-stat-lg text-tertiary">–</span>
      </div>
    </div>
  );
}
