import { useNavigate, useParams, useSearchParams } from "react-router";
import GenerationStrip from "../components/GenerationStrip";
import MatchupSummary from "../components/MatchupSummary";
import TypeGrid from "../components/TypeGrid";
import TypePicker from "../components/TypePicker";
import { allGenerations, parseAsOf } from "../lib/eras";
import { parseTypes, typesUrl } from "../lib/typeView";
import { capitalize, typeColorVar } from "../lib/types";

// The type chart — Statmon's third tool (D-051).
//
// Two things in one page, which is the point: the full effectiveness matrix as a
// reference, and a **dual-type readout**, which everywhere else on the web means
// a separate page per pairing. Picking one or two types answers "what beats
// this?" without leaving the chart behind.
//
// No local state, like every other page here (D-022): the typing is the path
// (`/types/water/flying`, mirroring `/compare/<p1>/vs/<p2>`) and the generation
// is `?asof=`, so a matchup is a link. The generation matters more here than
// anywhere else on the site — the chart is the subject, and it has genuinely
// changed six times (D-047).
//
// On a phone the picker and readout come first and the grid follows, because
// "what beats Water/Flying" is what you want on a phone; the matrix is the
// reference you scroll to.
export default function TypeChart() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  // The generation is read first: it decides which types exist at all, so a
  // typing is parsed against it rather than against today's eighteen. That is
  // what stops `/types/water/fairy?asof=5` claiming a Fairy that had not been
  // invented — it degrades to Water alone.
  const asof = parseAsOf(searchParams, []);
  const types = parseTypes([params.t1, params.t2], asof);

  const go = (nextTypes, nextAsOf = asof) =>
    navigate(typesUrl(nextTypes, nextAsOf), { replace: true });

  return (
    <div className="max-w-content mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-h1">
          Types<span className="text-accent">.</span>
        </h1>
        <p className="mt-1 text-body-sm text-secondary">
          Every matchup, including dual types.
        </p>
      </header>

      <div className="rounded-lg border border-border-subtle bg-surface p-4">
        <div className="mb-4 border-b border-border-subtle pb-4">
          <GenerationStrip
            label="Chart as of"
            options={allGenerations()}
            asof={asof}
            // Re-parsed against the new generation, so switching to Gen 5 while
            // reading a Fairy matchup drops the Fairy rather than keeping a
            // typing that generation never had.
            onSelect={(next) => go(parseTypes(types, next), next)}
          />
        </div>
        <TypePicker types={types} asof={asof} onChange={(t) => go(t)} />
      </div>

      {types.length > 0 && (
        <section className="mt-6" aria-labelledby="matchup-heading">
          {/* One type size on one baseline. Badges here put 11px pills beside
              18px display text, and no amount of aligning makes those two sit
              together — so the typing is set as text in its own colour instead,
              which is the pairing D-023 already established for the comparison
              board's diffs and group 2 of the contrast audit already covers. */}
          <h2 id="matchup-heading" className="mb-3 text-h4 text-secondary">
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
          </h2>
          <MatchupSummary types={types} asof={asof} />
        </section>
      )}

      <section className="mt-8" aria-labelledby="grid-heading">
        <h2 id="grid-heading" className="mb-3 text-h4">
          Full chart
        </h2>
        <p className="mb-3 text-caption text-tertiary">
          Rows attack, columns defend. Blank is 1× — only the matchups that
          deviate are marked.
        </p>
        <TypeGrid asof={asof} highlight={types} />
      </section>
    </div>
  );
}
