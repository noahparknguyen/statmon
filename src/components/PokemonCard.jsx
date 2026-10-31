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

// A trading-card-style card for one Pokémon. The artwork is a large square
// that bleeds behind the stat bars, with a scrim keeping them readable.
//
// Heights follow an 8px rhythm and match ComparisonCard, so the three cards on
// the board are the same height, with their stat rows lined up: head 56 +
// controls 88 + portrait 176 (a 320px top zone), stats 240 (pt-2 + 6 × h-9 +
// pb-4), and the total row 56, for 616 in all.
//
// The card is the desktop board's, from md up. A phone gets `VersusBoard`,
// whose tiles carry the identity and whose mirrored rows carry the stats.
//
// A Gen 1 view has five stat rows, since Gen 1 had a single Special, so the
// stats band is 204 and the card 580. All three cards switch generation
// together, so they stay level either way.
//
// The 88px controls band sits above the portrait, because form and ability are
// identity: which Pokémon this is, and which version is in play. They belong
// with the name, number, and type badges. A row of solid chips over the
// artwork would read as covering it, where the thin stat bars read as sitting
// behind.
//
// The artwork box starts at 144px, exactly where the controls band ends, and is
// capped at 280px. It's `w-full aspect-square`, so its height follows the
// card's width while the space that shows it is fixed: uncapped, it would be
// 718px tall on a 767px screen, cropping every Pokémon to its top third.
//
// The position is the guarantee, and the size is only a budget. PokéAPI's
// artwork is cropped tight to the Pokémon, and the tightest (Blacephalon)
// touches the edge of its square, so no size could keep every subject clear of
// the chips. Starting the box where the band ends does, whatever the crop.
//
// The cap is how far the art may bleed: 104px behind the stat bars, with the
// scrim taking over from 90% of the card's height.

// Stats, typing, BST, and abilities come from the era view (lib/eras.js)
// rather than the entry itself, so the card shows whichever generation is
// selected. `view` is always supplied, and `eraView(p, null)` is today's values.
//
// The scrim and the text shadow are classes in index.css (`.bg-scrim-art`,
// `.shadow-on-art`) rather than strings built here.

export default function PokemonCard({
  pokemon,
  view,
  keys,
  ability,
  onSelectForm,
  onSelectAbility,
  onClear = null,
}) {
  // An empty card takes the board's stat list rather than assuming six, so a
  // half-filled Gen 1 board keeps both cards the same height.
  if (!pokemon) return <EmptyCard keys={keys} />;

  const primary = view.types[0];
  const forms = formsOf(pokemon);
  // Alternate forms share their species' National Dex number: see dexNumberOf.
  const dex = dexNumberOf(pokemon);

  return (
    <div className="relative flex flex-col overflow-hidden bg-surface border border-border-subtle rounded-lg">
      {/* Decorative: the <h2> below has the same name, so alt text would only
          make a screen reader say it twice. */}
      {/* Eager and high priority, unlike the site's usual `loading="lazy"`.
          From md up this is the largest thing on /compare, near the top, so
          the page's load time is measured by it, and lazy loading would delay
          the one image the first paint waits for. On a phone the card is
          hidden, but the versus tiles show the same image, so it's the same one
          download either way. */}
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
          {/* The badges and the clear button sit side by side rather than
              stacked, because the head is a fixed 56px and two badges already
              use 40px of it. A third stacked item would overflow, while a
              third column doesn't change the height. */}
          <div className="flex shrink-0 items-start gap-2">
            <div className="flex flex-col items-end gap-1.5">
              {view.types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
            {/* A button only when it does something. /compare is the only
                caller today, but a read-only caller gets no control rather
                than a disabled one.

                The site's one icon button, 36px like every compact control,
                which clears WCAG 2.5.8's 24px minimum outright. `-mr-2` puts
                the X itself on the card's content edge rather than its hit
                area, and `-mt-2.5` centres it on the first badge, so it sits
                level with a single type's only badge. Always visible, never
                hover-only, because a control that only appears on hover can't
                be found or reached on a touch screen. */}
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

        {/* Controls: one 88px band holding both chip groups, each named by a
            label in its own column, as the site names every control group
            (GenerationStrip, TypePicker, DexFilters). Left-aligned like the
            stat rows below, so the card reads as one spec sheet with a label
            column.

            Rows align on the baseline, so a label sits on the first line of
            its chips: a reader enters a two-column block at the top of the
            right-hand column. Centring would put "Ability" beside the gap
            between two wrapped rows of chips, pointing at nothing. Baseline
            rather than `items-start`, because the label is 11px against a
            21px chip: aligning the boxes would sit it 5px high, and aligning
            the text needs no hard-coded offset.

            Shadowed like the stat rows, because this sits over the artwork.
            The chips have their own fill, but the labels and both empty
            states are bare text that could land on a busy part of the art.

            Top-aligned in the band. Most Pokémon fit in two rows (48px), so the
            band has slack, and top-aligning puts it between the chips and the
            portrait, where the artwork's own transparent margin is, rather than
            as a gap under the name that changes size from Pokémon to Pokémon.
            The few with four rows of chips, like Tauros, overflow the band by
            18px, onto the artwork's transparent margin. */}
        <div className="h-22 grid grid-cols-[auto_1fr] content-start items-start gap-x-3 gap-y-1.5 px-4 pt-1 shadow-on-art">
          {/* The Form row keeps its space even for the 845 entries with one
              form, where `FormChips` renders nothing. A row that disappeared
              would slide the ability row up and change the card's height for
              two thirds of the dex, and the three cards would stop matching. */}
          <span className={`${CHIP_CELL_LABEL} text-overline text-tertiary`}>
            Form
          </span>
          {/* `CHIP_CELL` reserves one chip's height, so the dash takes the same
              box as the chips. Otherwise the dash would be 24px against a
              chip's 21, and both labels would shift a few pixels whenever a
              Pokémon had alternate forms. */}
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
          {/* The same reservation: `AbilityChips` shows a sentence rather than
              chips for the 14 entries with no abilities, and on every Gen 1 or
              Gen 2 board. */}
          <div className={CHIP_CELL}>
            <AbilityChips
              abilities={view.abilities}
              selected={ability}
              onSelect={onSelectAbility}
              gen={view.gen}
              // Named per card, like the two search fields: /compare shows this
              // control twice, and two groups both called "Ability" wouldn't
              // tell a screen reader which card each belongs to.
              label={`${pokemon.name}'s ability`}
            />
          </div>
        </div>

        {/* The portrait window. */}
        <div className="h-44" />

        {/* Stats over the lower part of the artwork. */}
        {/* These bars grow in too, like the comparison card's, so the board
            doesn't look like it's loading in halves.

            Keyed on this card's own values, not the board's: a card
            re-animates when its own Pokémon or generation changes, and holds
            still when the other side changes. The comparison card between them
            keys on both, since it compares both. */}
        <div
          key={view.keys.map((k) => view.stats[k]).join(",")}
          className="px-4 pt-2 pb-4 shadow-on-art"
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
                  artwork, which shows through it. */}
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
      {/* Head, controls, and portrait as one zone (56 + 88 + 176) rather than
          three empty bands. The message has to sit where
          ComparisonCard's "Pick two Pokémon to compare." does, centred in the
          whole 320px top zone. Split into three bands, it would centre in the
          portrait alone and hang 72px lower than its pair. */}
      <div className="h-80 flex items-center justify-center">
        <span className="text-body-sm text-tertiary">No Pokémon selected</span>
      </div>
      <div className="px-4 pt-2 pb-4">
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
