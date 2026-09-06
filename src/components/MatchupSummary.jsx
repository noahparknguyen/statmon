import AbilityChips from "./AbilityChips";
import { spriteFor } from "../lib/pokemon";
import { formatMult } from "../lib/typeChart";
import { matchupTiers } from "../lib/typeView";
import { capitalize, typeColorVar } from "../lib/types";

// What every attacking type does to one defending typing, grouped into
// effectiveness tiers (D-051).
//
// This is the page's answer to the dual-type problem: the question people bring
// to a type chart is "what beats this?", and a tier list answers it in one look
// where eighteen rows in canonical order would make you scan and compare them
// yourself. **Empty tiers are dropped**, so the shape of the answer is itself
// information — a typing with no 4× row simply has no double weakness, and that
// reads faster as an absent row than as an empty one.
//
// The attackers are set as coloured text rather than as badges, for the reason
// the heading above them was changed (D-053): a 14px multiplier beside 11px
// pills is two type sizes on one line, and the pills won nothing here — a tier
// is already a group, so each name does not need its own container. Colour
// still carries the type, on the same audited pairing.
//
// The whole thing is `matchupTiers` plus that; the grouping, the ordering and
// the era's chart all live in lib/typeView.js.
//
// `MatchupHeading` ships beside it because the tier list is unreadable without
// a statement of what is being attacked, and Home needs the same statement the
// tool makes (D-067). It was written inline on /types; a second caller is
// exactly when a block stops being page markup and becomes a component, which
// is the D-058 rule. Two component exports from one file is the StabChip /
// StabLabel shape already in use, so react-refresh stays happy.

// The typing under attack, set as coloured text rather than as badges — an
// 11px pill beside 18px display text is two type sizes on one line, and no
// amount of aligning makes them sit together (D-053). The colour pairing is the
// one group 2 of `npm run audit:contrast` covers.
//
// `as` is the heading level, not a style, for the same reason PageHeader takes
// it: /types is the page, so its readout is an <h2>, while Home's sits inside a
// feature section and is an <h3> one rung down. `id` is a prop because only
// /types labels a section with it (aria-labelledby); Home's heading precedes
// its list directly and needs no handle.
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

// The same statement when a **Pokémon** named the typing rather than the chips
// (D-075): its sprite and name, then the typing in exactly the treatment above,
// then its abilities.
//
// A sibling export rather than a branch inside `MatchupHeading`, because Home
// calls that one and has no Pokémon to show — and because this is a different
// shape (an image and a control alongside the heading) rather than a different
// wording. Two component exports from one file is the StabChip / StabLabel
// arrangement already in use, so react-refresh stays happy.
//
// The heading is the Pokémon's name and the typing is inside it, so a screen
// reader gets "Attacking — Eelektross, Electric" as one statement. The sprite
// is decorative: the name is right beside it.
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
      <img
        src={spriteFor(pokemon)}
        alt=""
        width="40"
        height="40"
        className="shrink-0 [image-rendering:pixelated]"
      />
      <Heading id={id} className="text-h4 text-secondary">
        Attacking
        <span aria-hidden className="text-tertiary">
          {" — "}
        </span>
        <span className="text-primary">{pokemon.name}</span>
        {/* Not aria-hidden, unlike the em dash above it: a comma is a pause a
            screen reader should get, where a dash between a label and its value
            is punctuation it should not read out. */}
        <span className="text-tertiary">{", "}</span>
        {types.map((t, i) => (
          <span key={t}>
            {i > 0 && <span className="text-tertiary"> / </span>}
            <span style={{ color: typeColorVar(t) }}>{capitalize(t)}</span>
          </span>
        ))}
      </Heading>
      {/* Directly after the typing, not pushed to the far edge. An `ml-auto`
          here read as a page action rather than as part of the subject — at
          1400px it stranded "Levitate" some 700px from the Pokémon it belongs
          to, which is the proximity rule working against the meaning rather
          than for it. The whole line is one statement: Eelektross, Electric,
          Levitate. */}
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

// The tier's own label does the work a colour would elsewhere: 4× and 0× are the
// two rows people are looking for, so they get the brightest treatment, and the
// middle of the list recedes. Never colour alone — the multiplier is text.
const TIER_TONE = (mult) =>
  mult > 1 || mult === 0 ? "text-primary" : "text-tertiary";

export default function MatchupSummary({ types, asof = null, ability = null }) {
  // `ability` is the defending Pokémon's, when one named this typing (D-075).
  // It moves attackers between tiers rather than annotating them — Ground
  // leaves the 2× row and joins the 0× one for a Levitate holder, which is what
  // "what beats this" actually means for that Pokémon.
  const tiers = matchupTiers(types, asof, ability);
  if (tiers.length === 0) return null;

  return (
    <dl className="flex flex-col gap-2">
      {tiers.map(({ mult, types: attackers }) => (
        <div
          key={mult}
          className="grid grid-cols-[2.5rem_1fr] items-baseline gap-3 rounded-md border border-border-subtle bg-surface px-3 py-2.5"
        >
          <dt className={`text-stat-sm text-right ${TIER_TONE(mult)}`}>
            {formatMult(mult)}
          </dt>
          {/* Flowed as text rather than laid out as a grid of chips, so a
              ten-type tier wraps like a sentence instead of a hedge. */}
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
