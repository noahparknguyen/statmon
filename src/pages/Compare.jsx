import { useNavigate, useParams, useSearchParams } from "react-router";
import { LuArrowLeftRight } from "react-icons/lu";
import Button from "../components/Button";
import SearchBar from "../components/SearchBar";
import PokemonCard from "../components/PokemonCard";
import ComparisonCard from "../components/ComparisonCard";
import { getBySlug } from "../lib/pokemon";
import { compareUrl } from "../lib/compareUrl";

// The core comparison page. The URL is the single source of truth (D-022): the
// selection is derived from the path deep link (/compare/<p1>/vs/<p2>) or, for a
// partial one-slot state, from a query param. Every pick/swap/form-change just
// navigates to the URL for the next state, so back/forward and shared links work
// with no local state to keep in sync. P1 is the attacker, P2 the defender.
export default function Compare() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const p1Slug = params.p1 ?? searchParams.get("p1") ?? null;
  const p2Slug = params.p2 ?? searchParams.get("p2") ?? null;
  const p1 = p1Slug ? (getBySlug(p1Slug) ?? null) : null;
  const p2 = p2Slug ? (getBySlug(p2Slug) ?? null) : null;

  // Selection lives in the URL; `replace` keeps history uncluttered while
  // building/toggling forms so Back returns to where the user came from.
  const go = (a, b) =>
    navigate(compareUrl(a?.slug, b?.slug), { replace: true });
  const selectP1 = (p) => go(p, p2);
  const selectP2 = (p) => go(p1, p);
  const swap = () => go(p2, p1);

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

      {/* Swap */}
      <div className="flex justify-center mb-3">
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

      {/* Board: source order card1, card2, comparison. On lg the comparison
        is reordered into the middle; below lg it spans below the two cards. */}
      <div className="grid gap-5 items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:order-1">
          <PokemonCard pokemon={p1} onSelectForm={selectP1} />
        </div>
        <div className="lg:order-3">
          <PokemonCard pokemon={p2} onSelectForm={selectP2} />
        </div>
        <div className="md:col-span-2 lg:col-span-1 lg:order-2">
          <ComparisonCard p1={p1} p2={p2} />
        </div>
      </div>
    </div>
  );
}
