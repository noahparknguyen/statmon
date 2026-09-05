import { memo } from "react";
import { Link } from "react-router";
import TypeBadge from "./TypeBadge";
import { spriteFor } from "../lib/pokemon";
import { compareUrl } from "../lib/compareUrl";
import { dexNumberOf } from "../lib/dexTable";
import { eraView } from "../lib/eras";
import { statPct } from "../lib/stats";
import { typeColorVar } from "../lib/types";

// One dex row. Memoised because the windowing hook re-renders the table on every
// scroll frame while the on-screen rows themselves rarely change.
//
// Column order matches DexTable's header exactly; which columns are shown is
// purely responsive, so the DOM order is the same at every width:
//   #  |  Pokemon  |  Types  |  HP Atk Def SpA SpD Spe  |  [sorted stat]  |  BST

// The stat cell's proportional fill. Scaled to the same fixed 255 reference as
// every other bar on the site (D-011), tinted with the Pokemon's primary type,
// and kept faint enough that the number on top stays the thing you read —
// verified against text-primary by npm run audit:contrast.
const FILL_ALPHA = "28%";

// `animate` grows the fill in on mount, and only Home's preview passes it
// (D-067). It is a prop rather than the default for the same reason CmpRow's is:
// the real table windows its rows, so rows mount continuously while you scroll
// and every one of them would animate on arrival — motion that says nothing,
// on the surface that can least afford it. The two branches are written out
// rather than composed because `--target` and `width` are different mechanisms;
// reduced motion is handled globally by the rule that collapses animation
// duration (index.css).
function StatCell({ value, color, className = "", animate = false }) {
  const fill = `color-mix(in srgb, ${typeColorVar(color)} ${FILL_ALPHA}, transparent)`;
  return (
    <td className={`px-1 ${className}`}>
      <div className="relative flex h-7 items-center justify-end overflow-hidden rounded-xs px-1.5">
        {animate ? (
          <div
            className="absolute inset-y-0 left-0 animate-grow-w"
            style={{ "--target": statPct(value), backgroundColor: fill }}
          />
        ) : (
          <div
            className="absolute inset-y-0 left-0"
            style={{ width: statPct(value), backgroundColor: fill }}
          />
        )}
        <span className="relative text-stat-sm text-primary">{value}</span>
      </div>
    </td>
  );
}

// `asof` is passed as a plain number rather than a resolved view object on
// purpose: this component is memoised because the windowing hook re-renders the
// table on every scroll frame, and a fresh object would give it a new prop
// identity each time and re-render every visible row. A primitive keeps the memo
// working, and resolving one row's view here costs nothing. (D-049)
function DexRow({
  pokemon,
  rowIndex,
  keys,
  asof,
  mobileStat,
  heightClass,
  animate = false,
}) {
  const view = eraView(pokemon, asof);
  const primary = view.types[0];
  const dex = dexNumberOf(pokemon);

  return (
    <tr
      // aria-rowindex is how a virtualised table stays coherent to a screen
      // reader: only a slice of rows is in the DOM, so each one states its real
      // position within the aria-rowcount the table declares. +2 = 1-based,
      // past the header row.
      aria-rowindex={rowIndex + 2}
      className={`${heightClass} border-b border-border-subtle transition-colors hover:bg-surface`}
    >
      <td className="hidden px-2 sm:table-cell">
        <span className="text-caption text-tertiary">
          #{String(dex).padStart(4, "0")}
        </span>
      </td>

      <td className="px-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <img
            src={spriteFor(pokemon)}
            alt=""
            width="32"
            height="32"
            loading="lazy"
            decoding="async"
            className="shrink-0 [image-rendering:pixelated]"
          />
          <div className="min-w-0">
            <Link
              // Built through the shared helper rather than by hand, so the
              // partial one-slot URL shape lives in exactly one place (D-022).
              // Carries the lens through, so a name clicked in a Gen 3 dex opens
              // a Gen 3 comparison rather than silently jumping to today.
              to={compareUrl(pokemon.slug, null, asof)}
              className="block truncate text-body-sm text-primary transition-colors hover:text-accent"
            >
              {pokemon.name}
            </Link>
            {/* Types have no column of their own until lg, so they ride along
                under the name at narrower widths. */}
            <span className="mt-0.5 flex gap-1 lg:hidden">
              {view.types.map((t) => (
                <TypeBadge key={t} type={t} size="sm" />
              ))}
            </span>
          </div>
        </div>
      </td>

      <td className="hidden px-2 lg:table-cell">
        <span className="flex gap-1">
          {view.types.map((t) => (
            <TypeBadge key={t} type={t} size="sm" />
          ))}
        </span>
      </td>

      {keys.map((key) => (
        <StatCell
          key={key}
          value={view.stats[key]}
          color={primary}
          className="hidden md:table-cell"
          animate={animate}
        />
      ))}

      {mobileStat && (
        <StatCell
          value={view.stats[mobileStat]}
          color={primary}
          className="md:hidden"
          animate={animate}
        />
      )}

      <td className="px-2 text-right">
        <span className="text-stat-sm text-primary">{view.bst}</span>
      </td>
    </tr>
  );
}

export default memo(DexRow);
