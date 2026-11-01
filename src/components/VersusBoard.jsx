import { useState } from "react";
import { LuArrowLeftRight, LuChevronDown, LuPlus } from "react-icons/lu";
import AbilityChips from "./AbilityChips";
import CmpRow from "./CmpRow";
import Dialog from "./Dialog";
import IconButton from "./IconButton";
import PokemonPicker from "./PokemonPicker";
import SpeedBanner from "./SpeedBanner";
import TypeBadge from "./TypeBadge";
import { Summary, TypeMatchup } from "./ComparisonCard";
import { tintFor } from "./gameChrome";
import {
  CHIP,
  CHIP_FILTER_GEOMETRY,
  CHIP_OFF,
  CHIP_STATIC,
} from "./chipStyles";
import { STAT_LABEL } from "../lib/stats";
import { artworkFor } from "../lib/pokemon";
import { dexNumberOf } from "../lib/dexTable";
import { abilityLabel, affectsTypes } from "../lib/abilities";

// The comparison on a phone, below `md`, as one card designed for the screen
// rather than the desktop's three cards stacked.
//
// It opens on the two Pokémon side by side, attacker on the left and defender
// on the right, each on a tint of its primary type, as the games' panels are.
// Those two tiles are what make the rest work: once left and right have names,
// the stats can be the desktop's own mirrored rows, a number and a bar on each
// side of the label, at 36px a row rather than a card per stat. The rows fit:
// the desktop's middle card gives them 288px at 1024, and a 360px phone gives
// them 296.
//
// Then the verdicts, together and before the numbers: the higher total and the
// STAB matchup, which are the comparison card's own (`Summary` and
// `TypeMatchup`), and who moves first. The ability that can change the STAB
// line sits directly above it, under its Pokémon. Last, the stats, closed by
// each side's total, as each desktop card closes with its own.
//
// Tapping a tile opens the full-screen picker for that side, the swap button
// sits between the tiles, and an ability is chosen from a sheet. With no
// `actions`, the board is read-only, which is how Home previews it: the same
// component with its controls taken away, never a copy.
export default function VersusBoard({
  p1,
  p2,
  v1,
  v2,
  keys,
  a1,
  a2,
  actions = null,
  heading = true,
  className = "",
}) {
  // Which side's picker or ability sheet is open: 1, 2, or neither.
  const [picking, setPicking] = useState(null);
  const [choosing, setChoosing] = useState(null);
  const sides = {
    1: { slot: 1, pokemon: p1, view: v1, ability: a1 },
    2: { slot: 2, pokemon: p2, view: v2, ability: a2 },
  };
  const ready = p1 && p2;
  const opener = (set, slot) => (actions ? () => set(slot) : null);

  // As on the desktop card: the bars re-grow when the numbers change, and only
  // then. Choosing an ability re-renders the board but leaves them alone.
  const barKey = ready
    ? keys.map((k) => `${v1.stats[k]}/${v2.stats[k]}`).join(",")
    : "empty";

  // The dialogs sit beside the card, not inside it, because the page hides the
  // card from `md` (`className`). A dialog inside a hidden element stays open
  // but can't be seen, and holds the whole page: turn a tablet from portrait
  // to landscape with the picker open, and nothing can be clicked. Beside it,
  // the dialog becomes the desktop's centred panel instead.
  return (
    <>
      <section
        className={`flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface ${className}`}
      >
        {heading && <h2 className="sr-only">Comparison</h2>}

        {/* The two sides, edge to edge across the card's top with a 1px seam,
          as the games' panels sit. Every pixel of width goes to the names:
          the longest word in any name, "Brambleghast", is 136px at `text-h3`,
          and each side has 146px on a 360px phone. At 320 a few of the longest
          wrap mid-word rather than push the page sideways, as the four-up game
          panels' names do.

          The swap button sits on the seam rather than in a column of its own,
          which would cost each name 18px, centred on the artwork. */}
        <div className="relative grid grid-cols-2 gap-px bg-border-subtle">
          <Tile {...sides[1]} onOpen={opener(setPicking, 1)} />
          <Tile {...sides[2]} onOpen={opener(setPicking, 2)} />
          <div className="absolute top-11 left-1/2 -translate-x-1/2">
            {actions ? (
              <IconButton
                label="Swap"
                variant="outline"
                onClick={actions.swap}
                disabled={!p1 && !p2}
              >
                <LuArrowLeftRight aria-hidden />
              </IconButton>
            ) : (
              <span
                aria-hidden
                className="inline-flex size-9 items-center justify-center rounded-full border border-border-strong bg-elevated text-overline text-tertiary"
              >
                vs
              </span>
            )}
          </div>
        </div>

        {/* Each ability centred under its own side. */}
        {(p1 || p2) && (
          <div className="grid grid-cols-2 gap-2 border-t border-border-subtle p-3">
            <Ability {...sides[1]} onOpen={opener(setChoosing, 1)} />
            <Ability {...sides[2]} onOpen={opener(setChoosing, 2)} />
          </div>
        )}

        {ready && (
          <>
            {/* The comparison card's own top zone, in flow rather than at its
              fixed 320px, since nothing beside it has to line up. */}
            <div className="flex flex-col items-center gap-6 border-t border-border-subtle px-4 py-6 text-center">
              <Summary p1={p1} p2={p2} v1={v1} v2={v2} />
              <div className="w-full border-t border-border-subtle" />
              <TypeMatchup attacker={p1} attack={v1} defend={v2} ability={a2} />
            </div>
            <SpeedBanner
              p1={p1}
              p2={p2}
              a={v1.stats.speed}
              b={v2.stats.speed}
            />
            <div key={barKey} className="px-4 pt-3 pb-4">
              {keys.map((k) => (
                <CmpRow
                  key={k}
                  label={STAT_LABEL[k]}
                  a={v1.stats[k]}
                  b={v2.stats[k]}
                  aColor={v1.types[0]}
                  bColor={v2.types[0]}
                  animate
                />
              ))}
            </div>
            <Totals v1={v1} v2={v2} />
          </>
        )}
      </section>

      {actions && (
        <>
          <PokemonPicker
            open={picking !== null}
            title={`Pokémon ${picking ?? 1}`}
            label={`Search Pokémon ${picking ?? 1}`}
            current={sides[picking]?.pokemon ?? null}
            onSelect={picking === 2 ? actions.selectP2 : actions.selectP1}
            onClear={picking === 2 ? actions.clearP2 : actions.clearP1}
            onClose={() => setPicking(null)}
          />
          <AbilitySheet
            {...(sides[choosing] ?? sides[1])}
            open={choosing !== null}
            onSelect={choosing === 2 ? actions.selectA2 : actions.selectA1}
            onClose={() => setChoosing(null)}
          />
        </>
      )}
    </>
  );
}

// Each side's base stat total, closing the stats the way each desktop card's
// footer closes its own: `text-stat-lg` under a `text-overline` label, 56px
// tall over a rule. The two figures sit on their own sides, as every row above
// does, and the higher one is `primary` and the lower `tertiary`, as a row's
// values are, so a tie leaves both bright.
function Totals({ v1, v2 }) {
  const tone = (mine, theirs) =>
    mine >= theirs ? "text-primary" : "text-tertiary";
  return (
    <div className="mx-4 grid h-14 grid-cols-[1fr_auto_1fr] items-center border-t border-border-subtle">
      <span className={`text-stat-lg ${tone(v1.bst, v2.bst)}`}>{v1.bst}</span>
      <span className="text-overline text-tertiary">Base stat total</span>
      <span className={`text-right text-stat-lg ${tone(v2.bst, v1.bst)}`}>
        {v2.bst}
      </span>
    </div>
  );
}

// One side: the artwork, name, number, and typing, on the primary type's tint.
// A button when the board is live, since the tile is the side, and changing the
// side is what tapping it means. Its visible text is its name, and the
// screen-reader half says what the button does (WCAG 2.5.3).
//
// The tile fills its half of the grid, since the seam is the grid's own
// background showing through the gap, and anything the tiles leave uncovered
// would show it too. So an empty side is a filled half with the dashed slot
// inside it.
function Tile({ slot, pokemon, view, onOpen }) {
  if (!pokemon) {
    return (
      <div className="flex bg-surface p-2">
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="flex min-h-44 w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong p-2 text-center text-body-sm text-secondary transition-colors hover:text-primary active:text-primary"
          >
            <LuPlus aria-hidden className="shrink-0" />
            Choose Pokémon {slot}
          </button>
        )}
      </div>
    );
  }

  const Box = onOpen ? "button" : "div";
  return (
    <Box
      {...(onOpen ? { type: "button", onClick: onOpen } : {})}
      className={`flex min-w-0 flex-col items-center gap-1 border border-transparent px-2 py-3 text-center ${
        onOpen
          ? "transition-colors hover:border-border-strong active:border-border-strong"
          : ""
      }`}
      style={{ backgroundColor: tintFor(view.types) }}
    >
      {/* Decorative: the name follows it. */}
      <img
        src={artworkFor(pokemon)}
        alt=""
        width="96"
        height="96"
        decoding="async"
        className="size-24 object-contain drop-shadow-art"
      />
      <span className="text-h3 break-words text-primary">{pokemon.name}</span>
      <span className="text-caption text-secondary">
        #{String(dexNumberOf(pokemon)).padStart(4, "0")}
      </span>
      <span className="mt-1 flex flex-wrap justify-center gap-1">
        {view.types.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </span>
      {onOpen && <span className="sr-only">, change Pokémon {slot}</span>}
    </Box>
  );
}

// The ability in play, under its Pokémon: a chip that opens the sheet when
// there's a choice to make, and a plain pill when there isn't, since a button
// with one option does nothing. The accent dot is the card's mark for an
// ability that changes type matchups (AbilityChips), and the empty states are
// AbilityChips' own sentences, so the words can't drift apart.
function Ability({ pokemon, view, ability, onOpen }) {
  if (!pokemon) return <span aria-hidden />;
  if (!view.abilities.length)
    return (
      <span className="justify-self-center text-center">
        <AbilityChips abilities={[]} gen={view.gen} />
      </span>
    );

  const effect = affectsTypes(ability, view.gen);
  const label = (
    <>
      {effect && (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-accent"
        />
      )}
      {abilityLabel(ability)}
      {effect && <span className="sr-only">, changes type matchups</span>}
    </>
  );

  if (!onOpen || view.abilities.length < 2)
    return (
      <span
        className={`${CHIP} ${CHIP_FILTER_GEOMETRY} ${CHIP_STATIC} justify-self-center`}
      >
        <span className="sr-only">{pokemon.name}&apos;s ability: </span>
        {label}
      </span>
    );

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${CHIP} ${CHIP_FILTER_GEOMETRY} ${CHIP_OFF} justify-self-center`}
    >
      {label}
      <LuChevronDown aria-hidden className="shrink-0" />
      <span className="sr-only">, {pokemon.name}&apos;s ability, change</span>
    </button>
  );
}

// The abilities to choose from, as the card's own chips at the size a thumb
// takes. Choosing one closes the sheet, since the choice is the whole task.
function AbilitySheet({ open, pokemon, view, ability, onSelect, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={pokemon ? `${pokemon.name}'s ability` : "Ability"}
      closeLabel="Close abilities"
      placement="sheet"
    >
      {pokemon && (
        <AbilityChips
          abilities={view.abilities}
          selected={ability}
          gen={view.gen}
          label={`${pokemon.name}'s ability`}
          size="md"
          onSelect={(slug) => {
            onSelect(slug);
            onClose();
          }}
        />
      )}
    </Dialog>
  );
}
