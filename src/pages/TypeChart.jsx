import { useNavigate, useParams, useSearchParams } from "react-router";
import GenerationStrip from "../components/GenerationStrip";
import PageHeader from "../components/PageHeader";
import { PAGE_TOOL, PANEL, RULE_BELOW } from "../components/pageChrome";
import MatchupSummary, {
  DefenderHeading,
  MatchupHeading,
} from "../components/MatchupSummary";
import SearchBar from "../components/SearchBar";
import TypeGrid from "../components/TypeGrid";
import TypePicker from "../components/TypePicker";
import { abilityParam, resolveAbility } from "../lib/abilities";
import { allGenerations, eraView, parseAsOf } from "../lib/eras";
import { defends, parseDefender, parseTypes, typesUrl } from "../lib/typeView";

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

  // The Pokémon that named this typing, if one did. Validated against the path
  // rather than trusted (D-075), so it survives exactly as long as the typing
  // on screen is still its own — which is what makes clicking a type chip off
  // drop it with no cleanup branch anywhere below.
  const mon = parseDefender(types, searchParams, asof);
  const view = mon ? eraView(mon, asof) : null;
  const ability = mon
    ? resolveAbility(mon, asof, searchParams.get("ab"))
    : null;

  const go = (
    nextTypes,
    nextAsOf = asof,
    nextMon = mon,
    nextAbility = ability,
  ) => {
    // Re-validated here as well as on read: dropping a type, or moving to a
    // generation the Pokémon did not exist in (or was a different typing in),
    // strips it. A link should never carry a parameter its own page would
    // discard on arrival — and the ability goes with the Pokémon, since an
    // ability with nobody to belong to is not a state this page has.
    const keep = defends(nextMon, nextTypes, nextAsOf);
    navigate(
      typesUrl(nextTypes, {
        asof: nextAsOf,
        as: keep ? nextMon.slug : null,
        // Through abilityParam, which RESOLVES against the new generation
        // before comparing it to the default. Comparing the old selection
        // directly wrote parameters this page's own parser then discarded —
        // switching a Gengar board to Gen 6 emitted `ab=cursed-body` while
        // rendering Levitate.
        ability: keep ? abilityParam(nextMon, nextAsOf, nextAbility) : null,
      }),
      { replace: true, preventScrollReset: true },
    );
  };

  // Picking a Pokémon IS picking its typing — the page's subject does not
  // change, only the way it was named. So this navigates to that typing's
  // canonical path with the Pokémon riding along, which lights up the type
  // chips and shows why the answer is what it is.
  //
  // **A pick that the current generation cannot hold drops the generation, not
  // the pick.** Searching Iron Valiant while reading Gen 3 used to land on a
  // half-typing with the Pokémon silently gone and nothing to explain it; the
  // search is the more recent intent, so the lens gives way. That is also what
  // /compare does — `parseAsOf` returns null for a generation the selection
  // never shared — so the two tools behave the same under the same gesture.
  const selectMon = (p) => {
    const gen = asof != null && p.introducedIn > asof ? null : asof;
    return go(parseTypes(eraView(p, gen).types, gen), gen, p, null);
  };

  return (
    <div className={PAGE_TOOL}>
      <PageHeader
        title="Types"
        subtitle="Every matchup, including dual types."
      />

      <div className={PANEL}>
        <div className={RULE_BELOW}>
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
        {/* The two ways to name a defending typing, in the order people reach
            for them: the Pokémon you know by name, then the types you know by
            heart. `SearchBar` is the comparison tool's own control, unchanged —
            it is already a labelled combobox that announces its result count
            (D-065), and a second search box built here would drift from it. */}
        <div role="search">
          <SearchBar label="Search Pokémon" onSelect={selectMon} />
        </div>
        <TypePicker types={types} asof={asof} onChange={(t) => go(t)} />
      </div>

      {types.length > 0 && (
        <section className="mt-6" aria-labelledby="matchup-heading">
          {/* The heading moved into MatchupSummary.jsx when Home grew a preview
              that needs the same statement of what is under attack (D-067). Its
              reasoning — one type size on one baseline, so the typing is
              coloured text and not badges (D-053) — travelled with it.
              The Pokémon variant adds the sprite, the name and the abilities;
              the typing inside it is set identically (D-075). */}
          {mon ? (
            <DefenderHeading
              id="matchup-heading"
              pokemon={mon}
              types={types}
              abilities={view.abilities}
              ability={ability}
              onSelectAbility={(slug) => go(types, asof, mon, slug)}
              gen={view.gen}
            />
          ) : (
            <MatchupHeading id="matchup-heading" types={types} />
          )}
          <MatchupSummary types={types} asof={asof} ability={ability} />
        </section>
      )}

      <section className="mt-8" aria-labelledby="grid-heading">
        <h2 id="grid-heading" className="mb-3 text-h4">
          Full chart
        </h2>
        <p className="mb-3 text-caption text-tertiary">
          Rows attack, columns defend. A cell with no label is 1×.
          {/* Said out loud only where it is true. The cut-off column at the
              panel's edge is the affordance for a pointer, and the focus ring
              is the one for a keyboard, but neither tells you the grid is
              wider than the screen before you try. */}
          <span className="lg:hidden">
            {" "}
            Scroll the chart sideways for the rest.
          </span>
        </p>
        <TypeGrid asof={asof} highlight={types} />
      </section>
    </div>
  );
}
