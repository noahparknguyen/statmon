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

// The type chart: the full effectiveness matrix as a reference, and a readout
// for one or two defending types. Elsewhere, a dual-type readout usually means
// a separate page per pairing. Here, picking types answers "what beats this?"
// without leaving the chart.
//
// No local state, like every page here: the typing is the path
// (`/types/water/flying`, as with `/compare/<p1>/vs/<p2>`) and the generation
// is `?asof=`, so a matchup is a link. The generation matters most here,
// because the chart is the subject: six matchups between existing types have
// changed, at Gen 2 and at Gen 6.
//
// On a phone the picker and readout come first and the grid follows, because
// "what beats Water/Flying" is what you want on a phone, and the matrix is the
// reference you scroll to.
export default function TypeChart() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  // The generation is read first, because it decides which types exist, so a
  // typing is parsed against it rather than today's 18. That stops
  // `/types/water/fairy?asof=5` claiming a Fairy that didn't exist yet: it
  // falls back to Water alone.
  const asof = parseAsOf(searchParams, []);
  const types = parseTypes([params.t1, params.t2], asof);

  // The Pokémon that named this typing, if one did. Checked against the path
  // rather than trusted, so it lasts only while the typing on screen is its
  // own, which is what lets turning a type chip off drop it with no cleanup
  // code below.
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
    // Checked here as well as on read: dropping a type, or moving to a
    // generation where the Pokémon didn't exist or had another typing, drops
    // it. A link should never carry a parameter its own page would drop on
    // arrival. The ability goes with the Pokémon, since an ability with nobody
    // to belong to isn't a state this page has.
    const keep = defends(nextMon, nextTypes, nextAsOf);
    navigate(
      typesUrl(nextTypes, {
        asof: nextAsOf,
        as: keep ? nextMon.slug : null,
        // Through abilityParam, which resolves against the new generation
        // before comparing with the default, so a Gengar board switched to
        // Gen 6 doesn't carry Cursed Body in its URL while showing Levitate.
        ability: keep ? abilityParam(nextMon, nextAsOf, nextAbility) : null,
      }),
      { replace: true, preventScrollReset: true },
    );
  };

  // Picking a Pokémon is picking its typing: the page's subject doesn't change,
  // only how it was named. So this goes to that typing's path with the Pokémon
  // along, which lights up the type chips and shows why the answer is what it
  // is.
  //
  // A pick the current generation can't hold drops the generation, not the
  // pick. Searching for Iron Valiant while reading Gen 3 should show Iron
  // Valiant, because the search is the newer intent. The comparison page does
  // the same, so the two tools behave alike.
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
            heart. `SearchBar` is the comparison tool's own control, already a
            labelled combobox that announces its result count, so a second
            search box here would only drift from it. */}
        <div role="search">
          <SearchBar label="Search Pokémon" onSelect={selectMon} />
        </div>
        <TypePicker types={types} asof={asof} onChange={(t) => go(t)} />
      </div>

      {types.length > 0 && (
        <section className="mt-6" aria-labelledby="matchup-heading">
          {/* The headings live in MatchupSummary.jsx, because Home's preview
              uses them too. The Pokémon version adds the sprite, the name, and
              the abilities, with the typing set the same way. */}
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
          {/* Shown only at widths where it's true. The cut-off column at the
              panel's edge hints at it for a mouse, and the focus ring for a
              keyboard, but neither tells you the grid is wider than the screen
              before you try. */}
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
