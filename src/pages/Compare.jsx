import { useNavigate, useParams, useSearchParams } from "react-router";
import { LuArrowLeftRight, LuShuffle } from "react-icons/lu";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { PAGE_TOOL } from "../components/pageChrome";
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
//
// So are the two abilities (D-073), from `?a1=`/`?a2=`, and for the same reason:
// an ability a Pokémon does not have at the generation being read degrades to
// its first one rather than rendering a board that never existed. Only P2's can
// change what the comparison card says — P1 is the attacker — but both are part
// of the view, and Swap turns the board around.

// `abilityParam` (lib/abilities.js) is what keeps a slug out of the URL when it
// is simply the Pokémon's first at that generation — the site-wide "defaults
// stay out of the URL" rule. It lives there rather than here because /types
// needs the identical rule, and the copy that page kept was subtly wrong.

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
  // Resolved against the era's roster, so this is always an ability the card
  // can actually show — or null, for a Gen 1 board and the handful of entries
  // that have none.
  const a1 = resolveAbility(p1, asof, searchParams.get("a1"));
  const a2 = resolveAbility(p2, asof, searchParams.get("a2"));

  // Selection lives in the URL; `replace` keeps history uncluttered while
  // building/toggling forms so Back returns to where the user came from.
  // Abilities are omitted at their default so the common case stays a clean
  // path, and dropped entirely when the Pokémon or the generation changes under
  // them — `resolveAbility` would only discard them on the next render anyway,
  // and carrying a dead parameter through the URL bar is worse than not.
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

  // **Keeps the lens, and draws inside it** (D-123). The pair comes from the
  // pool that existed at `asof`, so hitting Random on a Gen 1 board hands back
  // two Gen 1 Pokémon rather than two modern ones that quietly drop the
  // generation on arrival. Abilities are cleared, the way they are whenever the
  // Pokémon change under them.
  // Clearing a slot is just the URL without that slug — `compareUrl` already
  // spells every combination, including the partial one-slot form. The ability
  // goes with it: `?a1=` for a Pokémon that is no longer there is a dead
  // parameter, and `resolveAbility` would drop it on the next render anyway.
  const clearP1 = () => go(null, p2, asof, null, a2);
  const clearP2 = () => go(p1, null, asof, a1, null);

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

      {/* One controls panel, the same surface /dex and /types put their controls
          on. This page used to leave the strip and Swap floating bare on the
          page background — three tools, two treatments, and the odd one out was
          the flagship.

          The lens sits BELOW the divider here where the other two tools put it
          above, and that difference is the real relationship rather than drift:
          on /dex and /types the generation decides what the controls below it
          can even offer, so it leads. Here it is the selection that decides
          which generations the strip may offer (D-045), so it follows. */}
      <div className="mb-5 rounded-lg border border-border-subtle bg-surface p-4">
        <div role="search" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchBar label="Search Pokémon 1" onSelect={selectP1} />
          <SearchBar label="Search Pokémon 2" onSelect={selectP2} />
        </div>

        {/* Board controls, on one line: the generation strip takes the width it
            needs on the left and Swap sits opposite it, rather than stacking two
            centred rows and leaving the middle empty. Below sm they stack, since
            nine chips plus a button do not fit on a phone.
            Swap is pinned right with its own `ml-auto` rather than the row using
            `justify-between`: with justify-between, Swap sat on the left of the
            row and jumped across the moment the strip grew. */}
        <div className="mt-4 flex flex-col items-center gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:items-end">
          <GenerationStrip
            label="Stats as of"
            options={genOptions}
            asof={asof}
            onSelect={selectAsOf}
          />
          {/* Random sits before Swap and is never disabled: it is the one
              control here that works from an empty board, and on an empty board
              it is the only thing to do besides type. Swap still needs a
              selection to have something to turn around. */}
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

      {/* Board: source order card1, card2, comparison, reordered per width.
          On lg the comparison sits in the middle; at md the two cards share a
          row and it spans below them; **below md it comes first**.

          That last one is the fix for a board that had quietly become three
          copies of itself on a phone (D-057). Stacked single-column, you used
          to scroll past two 568px Pokémon cards — each with its own six stat
          bars — before reaching the comparison card, which then showed the same
          six stats a third time as per-stat cards, with the actual verdict last
          at ~2,400px. The cards now drop their bars below md (PokemonCard), so
          there is one stats surface, and it leads. */}
      <div className="grid gap-5 items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
