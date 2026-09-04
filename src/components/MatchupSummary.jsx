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

// The tier's own label does the work a colour would elsewhere: 4× and 0× are the
// two rows people are looking for, so they get the brightest treatment, and the
// middle of the list recedes. Never colour alone — the multiplier is text.
const TIER_TONE = (mult) =>
  mult > 1 || mult === 0 ? "text-primary" : "text-tertiary";

export default function MatchupSummary({ types, asof = null }) {
  const tiers = matchupTiers(types, asof);
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
