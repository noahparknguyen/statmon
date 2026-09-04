import { useNavigate, useParams, useSearchParams } from "react-router";
import { LuArrowLeftRight } from "react-icons/lu";
import Button from "../components/Button";
import SearchBar from "../components/SearchBar";
import PokemonCard from "../components/PokemonCard";
import ComparisonCard from "../components/ComparisonCard";
import GenerationStrip from "../components/GenerationStrip";
import { getBySlug } from "../lib/pokemon";
import { compareUrl } from "../lib/compareUrl";
import { eraView, generationOptions, parseAsOf } from "../lib/eras";
import { STAT_ORDER } from "../lib/stats";

// The core comparison page. The URL is the single source of truth (D-022): the
// selection is derived from the path deep link (/compare/<p1>/vs/<p2>) or, for a
// partial one-slot state, from a query param. Every pick/swap/form-change just
// navigates to the URL for the next state, so back/forward and shared links work
// with no local state to keep in sync. P1 is the attacker, P2 the defender.
//
// The generation the board is read at (D-045) is derived the same way, from
// `?asof=`. It is validated against the current selection rather than trusted, so
// switching to a Mega while reading a Gen 1 board — a form that did not exist
// then — falls back to the current generation instead of rendering a view that
// never existed.
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
  // One stat list for the whole board. Both sides always agree — everything
  // available in Gen 1 is one of the 151 Gen 1 species — but the empty card has
  // no view of its own to read, and the three cards must stay the same height.
  const keys = v1?.keys ?? v2?.keys ?? STAT_ORDER;

  // Selection lives in the URL; `replace` keeps history uncluttered while
  // building/toggling forms so Back returns to where the user came from.
  const go = (a, b, g = asof) =>
    navigate(compareUrl(a?.slug, b?.slug, g), { replace: true });
  const selectP1 = (p) => go(p, p2);
  const selectP2 = (p) => go(p1, p);
  const swap = () => go(p2, p1);
  const selectAsOf = (g) => go(p1, p2, g);

  return (
    <div className="max-w-content mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-h1">
          Compare<span className="text-accent">.</span>
        </h1>
        <p className="mt-1 text-body-sm text-secondary">
          See who&apos;s faster, hits harder, and is bulkier.
        </p>
      </header>

      {/* Search bars */}
      <div role="search" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <SearchBar label="Search Pokémon 1" onSelect={selectP1} />
        <SearchBar label="Search Pokémon 2" onSelect={selectP2} />
      </div>

      {/* Board controls, on one line: the generation strip takes the width it
          needs on the left and Swap sits opposite it, rather than stacking two
          centred rows and leaving the middle empty. Below sm they stack, since
          nine chips plus a button do not fit on a phone.
          Swap is pinned right with its own `ml-auto` rather than the row using
          `justify-between`: the strip renders nothing until a Pokémon is picked,
          and with justify-between that left Swap sitting on the left of an empty
          row, then jumping across the moment you chose one. */}
      <div className="mb-3 flex flex-col items-center gap-3 sm:flex-row sm:items-end">
        <GenerationStrip
          label="Stats as of"
          options={genOptions}
          asof={asof}
          onSelect={selectAsOf}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={swap}
          disabled={!p1 && !p2}
          className="shrink-0 sm:ml-auto"
        >
          <LuArrowLeftRight aria-hidden />
          Swap
        </Button>
      </div>

      {/* Board: source order card1, card2, comparison. On lg the comparison
        is reordered into the middle; below lg it spans below the two cards. */}
      <div className="grid gap-5 items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:order-1">
          <PokemonCard
            pokemon={p1}
            view={v1}
            keys={keys}
            onSelectForm={selectP1}
          />
        </div>
        <div className="lg:order-3">
          <PokemonCard
            pokemon={p2}
            view={v2}
            keys={keys}
            onSelectForm={selectP2}
          />
        </div>
        <div className="md:col-span-2 lg:col-span-1 lg:order-2">
          <ComparisonCard p1={p1} p2={p2} v1={v1} v2={v2} keys={keys} />
        </div>
      </div>
    </div>
  );
}
