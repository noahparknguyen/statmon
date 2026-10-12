import AbilityChips from "./AbilityChips";
import { spriteFor } from "../lib/pokemon";
import { formatMult } from "../lib/typeChart";
import { matchupTiers } from "../lib/typeView";
import { capitalize, typeColorVar } from "../lib/types";

// What every attacking type does to one defending typing, grouped into
// effectiveness tiers.
//
// The question people bring to a type chart is "what beats this?", and a tier
// list answers it at a glance, where 18 rows in canonical order would leave you
// to scan and compare. Empty tiers are dropped, so the shape of the answer says
// something: a typing with no 4× row has no double weakness, and an absent row
// reads faster than an empty one.
//
// The attacking types are coloured text rather than badges: a 14px multiplier
// beside 11px pills would be two type sizes on one line, and a tier is already
// a group, so each name doesn't need its own container. The colour still
// carries the type, on the audited pairing.
//
// The grouping, ordering, and the generation's chart are all in
// lib/typeView.js's `matchupTiers`.
//
// The headings are exported from here too, because the tier list is unreadable
// without saying what's being attacked, and Home's preview says it the same way
// /types does. Several component exports from one file, like StabChip's, keep
// react-refresh happy.

// The typing under attack, as coloured text rather than badges: an 11px pill
// beside 18px text would be two type sizes on one line, and no aligning makes
// them sit together. `npm run audit:contrast` checks the colour pairing.
//
// `as` sets the heading level, not the style, as in PageHeader: /types is the
// page, so its readout is an <h2>, while Home's sits inside a section and is an
// <h3>. `id` is a prop because only /types labels a section with it
// (aria-labelledby). Home's heading comes right before its list and needs none.
export function MatchupHeading({ types, id, as: Heading = "h2" }) {
  return (
    <Heading id={id} className="mb-3 text-h4 text-secondary">
      Attacking
      <span aria-hidden className="text-tertiary">
        {" — "}
      </span>
      {types.map((t, i) => (
        <span key={t}>
          {i > 0 && <span className="text-tertiary"> / </span>}
          <span style={{ color: typeColorVar(t) }}>{capitalize(t)}</span>
        </span>
      ))}
    </Heading>
  );
}

// The same heading when a Pokémon named the typing rather than the type chips:
// its sprite and name, then the typing set as above, then its abilities.
//
// A separate export rather than a branch in `MatchupHeading`, because Home uses
// that one and has no Pokémon to show, and because this is a different shape,
// with an image and a control beside the heading, not just different words.
//
// The Pokémon's name and the typing are both inside the heading, so a screen
// reader hears "Attacking Eelektross, Electric" as one statement. The sprite is
// decorative, since the name is right beside it.
export function DefenderHeading({
  pokemon,
  types,
  abilities,
  ability,
  onSelectAbility = null,
  gen = null,
  id,
  as: Heading = "h2",
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* The sprite and the heading are one unit that never wraps apart: the
          heading's own text wraps instead. Otherwise, at 390px, the sprite
          could end up on a line by itself above the words it belongs to. */}
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={spriteFor(pokemon)}
          alt=""
          width="40"
          height="40"
          className="shrink-0 [image-rendering:pixelated]"
        />
        <Heading id={id} className="min-w-0 text-h4 text-secondary">
          Attacking
          <span aria-hidden className="text-tertiary">
            {" — "}
          </span>
          <span className="text-primary">{pokemon.name}</span>
          {/* Not aria-hidden, unlike the dash above: a comma is a pause a
            screen reader should get, where a dash between a label and its
            value is punctuation it shouldn't read out. */}
          <span className="text-tertiary">{", "}</span>
          {types.map((t, i) => (
            <span key={t}>
              {i > 0 && <span className="text-tertiary"> / </span>}
              <span style={{ color: typeColorVar(t) }}>{capitalize(t)}</span>
            </span>
          ))}
        </Heading>
      </div>
      {/* Right after the typing, not pushed to the far edge, where on a wide
          screen it would look like a page action, hundreds of pixels from the
          Pokémon it belongs to. The whole line is one statement: Eelektross,
          Electric, Levitate. */}
      <div>
        <AbilityChips
          abilities={abilities}
          selected={ability}
          onSelect={onSelectAbility}
          gen={gen}
        />
      </div>
    </div>
  );
}

// The tier's label does the work colour would elsewhere: 4× and 0× are the two
// rows people look for, so they're brightest, and the middle of the list
// recedes. Never colour alone: the multiplier is text.
const TIER_TONE = (mult) =>
  mult > 1 || mult === 0 ? "text-primary" : "text-tertiary";

export default function MatchupSummary({ types, asof = null, ability = null }) {
  // `ability` is the defending Pokémon's, when one named this typing. It moves
  // attacking types between tiers rather than annotating them: for a Levitate
  // holder, Ground leaves the 2× row and joins the 0× row, which is what "what
  // beats this" means for that Pokémon.
  const tiers = matchupTiers(types, asof, ability);
  if (tiers.length === 0) return null;

  return (
    <dl className="flex flex-col gap-2">
      {tiers.map(({ mult, types: attackers }) => (
        <div
          key={mult}
          // An inset row: `rounded-md` and 12px of padding.
          className="grid grid-cols-[2.5rem_1fr] items-baseline gap-3 rounded-md border border-border-subtle bg-surface p-3"
        >
          <dt className={`text-stat-sm text-right ${TIER_TONE(mult)}`}>
            {formatMult(mult)}
          </dt>
          {/* Flowed as text rather than laid out as a grid of chips, so a
              ten-type tier wraps like a sentence. */}
          <dd className="text-body-sm">
            {attackers.map((t, i) => (
              <span key={t}>
                {i > 0 && (
                  <span aria-hidden className="text-tertiary">
                    {" · "}
                  </span>
                )}
                <span style={{ color: typeColorVar(t) }}>{capitalize(t)}</span>
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
