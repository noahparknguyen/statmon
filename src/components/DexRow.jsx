import { memo } from "react";
import { Link } from "react-router";
import { LuChevronRight } from "react-icons/lu";
import TypeBadge from "./TypeBadge";
import { spriteFor } from "../lib/pokemon";
import { compareUrl } from "../lib/compareUrl";
import { dexNumberOf } from "../lib/dexTable";
import { eraView } from "../lib/eras";
import { statPct } from "../lib/stats";
import { typeFill } from "../lib/types";

// One dex row. Memoised, because the windowing hook re-renders the table on
// every scroll frame while the rows on screen rarely change.
//
// The column order matches DexTable's header exactly. Which columns show depends
// only on the screen width, so the DOM order is the same at every width:
//   #  |  Pokémon  |  Types  |  HP Atk Def SpA SpD Spe  |  [sorted stat]  |  BST  |  ›
//
// The whole row is one link, into Compare with this Pokémon on the board: the
// name's link stretches over the row with an `::after`, so a thumb can land
// anywhere on it. The row is its containing block (`relative`), and the stat
// cells' fills, which are positioned and would sit over the link, let a tap
// through (`pointer-events-none`). A phone gets a chevron, since a list row
// that opens something says so.

// The stat cell's proportional fill. Scaled to the same fixed 255 as every other
// bar on the site, tinted with the Pokémon's primary type, and faint enough that
// the number on top stays what you read: `npm run audit:contrast` checks it
// against text-primary.
//
// One colour, even for a dual type: two darkened type colours in one bar read
// as mud, and the Types column beside the bars carries the full typing.
//
// The share is `--mix-dex-fill` in index.css, which the contrast audit reads.
const FILL_ALPHA = "var(--mix-dex-fill)";

// `animate` grows the fill in when the row appears, and only Home's preview
// passes it, as with CmpRow. The real table renders rows as you scroll, so rows
// appear constantly, and animating each one would be motion that says nothing.
// The two branches are written out separately because `--target` and `width`
// work differently. Reduced motion is handled site-wide, by the rule in
// index.css that shortens every animation.
function StatCell({ value, types, className = "", animate = false }) {
  const fill = typeFill(types, FILL_ALPHA);
  return (
    <td className={`px-1 ${className}`}>
      {/* The number sits 8px in from the cell's edge, the column header's
          inset, so a right-aligned header lines up with it. */}
      <div className="pointer-events-none relative flex h-7 items-center justify-end overflow-hidden rounded-xs px-1">
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

// `asof` is passed as a plain number rather than a resolved view object, on
// purpose. This component is memoised because the table re-renders on every
// scroll frame, and a fresh object each time would be a new prop, re-rendering
// every visible row. A number keeps the memo working, and working out one row's
// view here costs nothing.
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
  const dex = dexNumberOf(pokemon);

  return (
    <tr
      // aria-rowindex keeps a partly rendered table coherent to a screen
      // reader: only a slice of rows is in the DOM, so each states its real
      // position within the table's aria-rowcount. +2 because it counts from 1,
      // and the header row comes first.
      aria-rowindex={rowIndex + 2}
      className={`relative ${heightClass} border-b border-border-subtle transition-colors hover:bg-surface active:bg-surface`}
    >
      {/* Every cell centres its content in the same 28px box the stat cells
          use, so a row's text shares one centre line. As bare inline text, the
          dex number and the total would sit a pixel or two off it. */}
      <td className="hidden px-2 sm:table-cell">
        <span className="flex h-7 items-center text-caption text-tertiary">
          #{String(dex).padStart(4, "0")}
        </span>
      </td>

      <td className="px-2">
        <div className="flex items-center gap-2 overflow-hidden">
          {/* 48px on a phone, the row's full height, and 32 from md: half and a
              third of the sprite's 96px, so both stay crisp. The sprites carry
              their own margin, so 48 fills the row without touching its rules.

              A 48px image would still make the row 49 with its 1px rule, and
              the windowing counts on 48 (ROW_HEIGHT): a pixel a row is 1,000px
              of drift by the end of the list. `-my-px` lets the sprite's
              transparent edge overlap the rule instead. */}
          <img
            src={spriteFor(pokemon)}
            alt=""
            width="48"
            height="48"
            loading="lazy"
            decoding="async"
            className="-my-px size-12 shrink-0 [image-rendering:pixelated] md:size-8"
          />
          <div className="min-w-0">
            <Link
              // Built with the shared helper rather than by hand, so the one-slot
              // URL shape lives in one place. It carries the generation through,
              // so a name clicked in a Gen 3 dex opens a Gen 3 comparison rather
              // than quietly jumping to today.
              to={compareUrl(pokemon.slug, null, { asof })}
              className="block truncate text-body-sm text-primary transition-colors after:absolute after:inset-0 hover:text-accent active:text-accent"
            >
              {pokemon.name}
              <span className="sr-only">, open in Compare</span>
            </Link>
            {/* Types have no column of their own until lg, so at narrower
                widths they sit under the name. */}
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
          types={view.types}
          className="hidden md:table-cell"
          animate={animate}
        />
      ))}

      {mobileStat && (
        <StatCell
          value={view.stats[mobileStat]}
          types={view.types}
          className="md:hidden"
          animate={animate}
        />
      )}

      <td className="px-2">
        <span className="flex h-7 items-center justify-end text-stat-sm text-primary">
          {view.bst}
        </span>
      </td>

      <td className="pr-2 text-tertiary md:hidden">
        <LuChevronRight aria-hidden />
      </td>
    </tr>
  );
}

export default memo(DexRow);
