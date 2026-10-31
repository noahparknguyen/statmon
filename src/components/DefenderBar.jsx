import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import AbilityChips from "./AbilityChips";
import Button from "./Button";
import Dialog from "./Dialog";
import GenerationStrip from "./GenerationStrip";
import PokemonPicker from "./PokemonPicker";
import TypePicker from "./TypePicker";
import { CHIP, CHIP_FILTER_GEOMETRY, CHIP_OFF } from "./chipStyles";
import { FIELD_LOOK } from "./fieldStyles";
import { PANEL, RULE_BELOW } from "./pageChrome";
import { allGenerations } from "../lib/eras";
import { spriteFor } from "../lib/pokemon";
import { capitalize, typeColorVar } from "../lib/types";

// The type chart's controls on a phone, below `md`: the generation, a Pokémon
// search, and the types, as the desktop's panel holds them.
//
// Until something is chosen they're in the page, since choosing is all there
// is to do there: one tap on a tile and the answer is on screen. After that
// the answer leads. The controls fold into a bar pinned under the site header,
// which says what's being attacked, and Change opens them again in a sheet.
// Pinned, so they're in reach anywhere in the chart below. The tiers under it
// are the page's (TypeChart), the same ones the desktop shows.
//
// The bar is the readout's heading on a phone: "Attacking", then the typing,
// as the desktop's heading says it (MatchupSummary). That heading is hidden
// below `md` rather than repeated a line under the bar. A Pokémon's abilities,
// which sit in that heading on a desktop, get a row of their own under the
// bar, since an ability can move a type between tiers.
//
// Searching opens the full-screen picker Compare uses, and closes the sheet
// first: a dialog never opens on top of a sheet.
export default function DefenderBar({
  types,
  asof,
  pokemon,
  view,
  ability,
  onTypes,
  onAsOf,
  onPokemon,
  onAbility,
}) {
  const [sheet, setSheet] = useState(false);
  const [search, setSearch] = useState(false);

  const choices = (
    <Choices
      types={types}
      asof={asof}
      onTypes={onTypes}
      onAsOf={onAsOf}
      onSearch={() => {
        setSheet(false);
        setSearch(true);
      }}
    />
  );

  return (
    <>
      {types.length === 0 ? (
        <div className={`${PANEL} md:hidden`}>{choices}</div>
      ) : (
        <>
          <Bar types={types} pokemon={pokemon} onOpen={() => setSheet(true)} />
          {pokemon && (
            <AbilityRow
              pokemon={pokemon}
              view={view}
              ability={ability}
              onAbility={onAbility}
            />
          )}
        </>
      )}

      {/* Each choice applies as it's made, so Done only closes the sheet. At
          the bottom, in reach of the thumb that just chose. */}
      <Dialog
        open={sheet}
        onClose={() => setSheet(false)}
        title="Defender"
        placement="sheet"
        footer={
          <Button size="sm" onClick={() => setSheet(false)} className="ml-auto">
            Done
          </Button>
        }
      >
        {choices}
      </Dialog>
      <PokemonPicker
        open={search}
        title="Pokémon"
        label="Search Pokémon"
        current={pokemon}
        onSelect={onPokemon}
        // Removing the Pokémon removes the typing it named, as turning its
        // type chips off would.
        onClear={() => onTypes([])}
        onClose={() => setSearch(false)}
      />
    </>
  );
}

// The three controls, in the desktop panel's order: the generation above a
// divider, since it decides which types there are, then the two ways to name
// a defender. The search is a button in the field's own look, because what it
// opens is the field.
function Choices({ types, asof, onTypes, onAsOf, onSearch }) {
  return (
    <>
      <div className={RULE_BELOW}>
        <GenerationStrip
          label="Chart as of"
          options={allGenerations()}
          asof={asof}
          onSelect={onAsOf}
        />
      </div>
      <button
        type="button"
        onClick={onSearch}
        className={`flex h-11 w-full items-center gap-2 text-left transition-colors hover:border-border-strong active:border-border-strong ${FIELD_LOOK}`}
      >
        <LuSearch aria-hidden className="shrink-0 text-tertiary" />
        <span className="text-tertiary">Search Pokémon</span>
      </button>
      <TypePicker types={types} asof={asof} onChange={onTypes} layout="tiles" />
    </>
  );
}

// 56px tall, as every bar is, on the `--z-raised` layer the dex's toolbar
// uses: over what scrolls under it, under the site header. `data-pinned`
// tells the page's scroll padding it's there, so focus stops below it
// (index.css).
//
// The whole card opens the sheet. The heading is real text, so it can't sit
// inside a button, and Change stretches its hit area over the card instead,
// as the dex's rows stretch their links (DexRow). The card answers the press,
// since a press on the button is a press on the card around it.
function Bar({ types, pokemon, onOpen }) {
  return (
    <div
      data-pinned="bar"
      className="sticky top-14 -mx-4 bg-base/85 px-4 py-1.5 backdrop-blur md:hidden"
      style={{ zIndex: "var(--z-raised)" }}
    >
      <div className="relative flex h-11 items-center gap-2 rounded-md border border-border-subtle bg-surface pr-1 pl-3 transition-colors hover:border-border-strong active:border-border-strong">
        {/* Decorative: the name follows it. */}
        {pokemon && (
          <img
            src={spriteFor(pokemon)}
            alt=""
            width="32"
            height="32"
            className="shrink-0 [image-rendering:pixelated]"
          />
        )}
        {/* The name gives way before the typing does, since the typing is
            what the tiers answer, and the sprite still says who it is: the
            longest, "Squawkabilly Green Plumage, Normal / Flying", is 43
            characters. Change is a word without a chevron, and the gaps are
            8px, to leave the name what room there is at 320px. */}
        <h2 className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-overline text-tertiary">Attacking</span>
          <span className="flex min-w-0 text-body-sm">
            {/* The comma inside the name's box, so a screen reader hears
                "Eelektross, Electric" rather than a comma on its own. */}
            {pokemon && (
              <span className="mr-1 min-w-0 truncate text-primary">
                {pokemon.name}
                <span className="text-tertiary">,</span>
              </span>
            )}
            <span className="shrink-0">
              {types.map((t, i) => (
                <span key={t}>
                  {i > 0 && <span className="text-tertiary"> / </span>}
                  <span style={{ color: typeColorVar(t) }}>
                    {capitalize(t)}
                  </span>
                </span>
              ))}
            </span>
          </span>
        </h2>
        <button
          type="button"
          onClick={onOpen}
          className={`${CHIP} ${CHIP_FILTER_GEOMETRY} ${CHIP_OFF} shrink-0 after:absolute after:inset-0 after:rounded-md`}
        >
          Change
          <span className="sr-only"> defender</span>
        </button>
      </div>
    </div>
  );
}

// A Pokémon's abilities, as chips a thumb can take, when there's a choice; a
// plain pill when there isn't, since a button with one option does nothing.
// The versus board's rule (VersusBoard). Lined up on the chips' first line, so
// the label stays with it when three abilities wrap, as Bronzong's do at 390px.
function AbilityRow({ pokemon, view, ability, onAbility }) {
  return (
    <div className="mt-3 flex items-baseline gap-3 md:hidden">
      {/* The group inside is named for the Pokémon, so this is for the eye. */}
      <span aria-hidden className="text-overline text-tertiary">
        Ability
      </span>
      <AbilityChips
        abilities={view.abilities}
        selected={ability}
        onSelect={view.abilities.length > 1 ? onAbility : null}
        gen={view.gen}
        label={`${pokemon.name}'s ability`}
        size="md"
      />
    </div>
  );
}
