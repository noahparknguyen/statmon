import { useNavigate, useParams, useSearchParams } from "react-router";
import { LuArrowLeftRight, LuShuffle } from "react-icons/lu";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { PAGE_TOOL, PANEL, RULE_ABOVE } from "../components/pageChrome";
import SearchBar from "../components/SearchBar";
import PokemonCard from "../components/PokemonCard";
import ComparisonCard from "../components/ComparisonCard";
import GenerationStrip from "../components/GenerationStrip";
import { getBySlug } from "../lib/pokemon";
import { compareUrl } from "../lib/compareUrl";
import { eraView, generationOptions, parseAsOf } from "../lib/eras";
import { abilityParam, resolveAbility } from "../lib/abilities";
import { STAT_ORDER } from "../lib/stats";
import { randomMatchup } from "../lib/randomMatchup";

// The comparison page. The URL is the only source of truth: the selection comes
// from the path (/compare/<p1>/vs/<p2>) or, with one slot filled, from a query
// parameter. Every pick, swap, and form change navigates to the URL for the
// next state, so back, forward, and shared links work with no local state to
// keep in sync. P1 is the attacker and P2 the defender.
//
// The generation the board is read at comes from `?asof=` the same way. It's
// checked against the selection rather than trusted, so switching to a Mega
// while reading a Gen 1 board, a form that didn't exist then, falls back to
// today's generation instead of showing a board that never existed.
//
// So are the two abilities, from `?a1=` and `?a2=`, for the same reason: an
// ability a Pokémon didn't have in that generation falls back to its first.
// Only P2's can change what the comparison card says, since P1 is the
// attacker, but both are part of the view, and Swap turns the board around.

// `abilityParam` (lib/abilities.js) keeps an ability out of the URL when it's
// the Pokémon's first in that generation, as defaults are everywhere. It lives
// there because /types needs exactly the same rule.

export default function Compare() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const p1Slug = params.p1 ?? searchParams.get("p1") ?? null;
  const p2Slug = params.p2 ?? searchParams.get("p2") ?? null;
  const p1 = p1Slug ? (getBySlug(p1Slug) ?? null) : null;
  const p2 = p2Slug ? (getBySlug(p2Slug) ?? null) : null;

  const genOptions = generationOptions([p1, p2]);
  const asof = parseAsOf(searchParams, [p1, p2]);
  const v1 = eraView(p1, asof);
  const v2 = eraView(p2, asof);
  // One stat list for the whole board. Both sides always agree, since
  // everything available in Gen 1 is one of its 151 species, but an empty card
  // has no view of its own to read, and the three cards must stay the same
  // height.
  const keys = v1?.keys ?? v2?.keys ?? STAT_ORDER;
  // Resolved against that generation's list, so this is always an ability the
  // card can show, or null for a Gen 1 or 2 board and the few entries with
  // none.
  const a1 = resolveAbility(p1, asof, searchParams.get("a1"));
  const a2 = resolveAbility(p2, asof, searchParams.get("a2"));

  // The selection lives in the URL, and `replace` keeps picking Pokémon and
  // forms out of the browser's history, so Back returns to where you came
  // from. Abilities are left out at their default, so the usual case is a clean
  // path, and dropped when the Pokémon or the generation changes under them:
  // `resolveAbility` would drop them on the next render anyway, and a dead
  // parameter in the URL bar is worse than none.
  const go = (a, b, g = asof, x = a1, y = a2) =>
    navigate(
      compareUrl(a?.slug, b?.slug, {
        asof: g,
        a1: abilityParam(a, g, x),
        a2: abilityParam(b, g, y),
      }),
      { replace: true, preventScrollReset: true },
    );
  const selectP1 = (p) => go(p, p2, asof, null);
  const selectP2 = (p) => go(p1, p, asof, a1, null);
  const swap = () => go(p2, p1, asof, a2, a1);
  const selectAsOf = (g) => go(p1, p2, g);
  const selectA1 = (slug) => go(p1, p2, asof, slug);
  const selectA2 = (slug) => go(p1, p2, asof, a1, slug);

  // Clearing a slot is the URL without that slug, which `compareUrl` already
  // handles, one-slot form included. The ability goes too: `?a1=` for a
  // Pokémon that's no longer there is a dead parameter.
  const clearP1 = () => go(null, p2, asof, null, a2);
  const clearP2 = () => go(p1, null, asof, a1, null);

  // Random keeps the generation and draws within it: on a Gen 1 board it gives
  // two Gen 1 Pokémon, rather than two modern ones that would drop the
  // generation on arrival. Abilities are cleared, as whenever the Pokémon
  // change.
  const surprise = () => {
    const pair = randomMatchup(asof);
    if (pair) go(pair[0], pair[1], asof, null, null);
  };

  return (
    <div className={PAGE_TOOL}>
      <PageHeader
        title="Compare"
        subtitle="See who's faster, hits harder, and is bulkier."
      />

      {/* One controls panel, the same surface /dex and /types use.

          The generation strip sits below the divider here, where the other two
          tools put it above, and the difference is deliberate. On /dex and
          /types the generation decides what the controls below it can offer,
          so it leads. Here the selection decides which generations the strip
          can offer, so it follows. */}
      <div className={`${PANEL} mb-6`}>
        <div role="search" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchBar label="Search Pokémon 1" onSelect={selectP1} />
          <SearchBar label="Search Pokémon 2" onSelect={selectP2} />
        </div>

        {/* The board's controls on one line: the generation strip takes the
            width it needs on the left, and the buttons sit opposite, rather
            than two centred rows with an empty middle. Below sm they stack,
            since nine chips and two buttons don't fit on a phone.
            The buttons are pinned right with their own `ml-auto` rather than
            `justify-between` on the row, so they stay put as the strip grows. */}
        <div
          className={`${RULE_ABOVE} flex flex-col items-center gap-3 sm:flex-row sm:items-end`}
        >
          <GenerationStrip
            label="Stats as of"
            options={genOptions}
            asof={asof}
            onSelect={selectAsOf}
          />
          {/* Random sits before Swap and is never disabled: it's the one
              control here that works on an empty board, where it's the only
              thing to do besides type. Swap needs a selection to turn
              around. */}
          <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
            <Button variant="secondary" size="sm" onClick={surprise}>
              <LuShuffle aria-hidden />
              Random
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={swap}
              disabled={!p1 && !p2}
            >
              <LuArrowLeftRight aria-hidden />
              Swap
            </Button>
          </div>
        </div>
      </div>

      {/* The board: the two cards and then the comparison, reordered by width.
          On lg the comparison sits in the middle. At md the two cards share a
          row and it spans below them. Below md it comes first: stacked in one
          column, the comparison would otherwise sit below two tall cards, and
          the cards drop their stat bars at that width (PokemonCard), so the
          comparison is the one place the stats appear, and it leads. */}
      {/* 16px between sibling surfaces, the gap every grid of cards on the site
          uses. */}
      <div className="grid gap-4 items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="order-2 md:order-1">
          <PokemonCard
            pokemon={p1}
            view={v1}
            keys={keys}
            ability={a1}
            onSelectForm={selectP1}
            onSelectAbility={selectA1}
            onClear={clearP1}
          />
        </div>
        <div className="order-3 md:order-2 lg:order-3">
          <PokemonCard
            pokemon={p2}
            view={v2}
            keys={keys}
            ability={a2}
            onSelectForm={selectP2}
            onSelectAbility={selectA2}
            onClear={clearP2}
          />
        </div>
        <div className="order-1 md:order-3 md:col-span-2 lg:col-span-1 lg:order-2">
          <ComparisonCard
            p1={p1}
            p2={p2}
            v1={v1}
            v2={v2}
            keys={keys}
            ability={a2}
          />
        </div>
      </div>
    </div>
  );
}
