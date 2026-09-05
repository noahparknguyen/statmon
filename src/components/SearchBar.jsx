import { useState, useRef, useEffect, useId } from "react";
import { LuSearch } from "react-icons/lu";
import { searchPokemon, spriteFor } from "../lib/pokemon";
import TypeBadge from "./TypeBadge";

// Search-as-you-type with a sprite dropdown. Calls onSelect(pokemon) on pick.
export default function SearchBar({ label, onSelect }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef(null);
  const listId = useId();

  const trimmed = query.trim();
  const results = trimmed ? searchPokemon(trimmed, 8) : [];
  const showList = open && trimmed.length > 0;

  // Close on outside click.
  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const choose = (p) => {
    onSelect(p);
    setQuery("");
    setOpen(false);
    setActive(0);
  };

  const onKeyDown = (e) => {
    if (!showList || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <div className="flex items-center gap-2 h-11 px-3 bg-elevated border border-border-subtle rounded-sm focus-within:border-border-strong">
        <LuSearch aria-hidden className="shrink-0 text-tertiary" />
        <input
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && results[active] ? `${listId}-${active}` : undefined
          }
          placeholder={label}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="w-full bg-transparent outline-none text-body text-primary placeholder:text-tertiary"
        />
      </div>

      {/* The dex announces its result count as it filters; this did not, so a
          screen reader user typing here got no feedback that 1,259 Pokémon had
          narrowed to eight — or to none. The list itself is not a live region
          (a combobox's options should not be announced one by one as you type),
          so the count is reported separately and politely. (D-065) */}
      <span aria-live="polite" className="sr-only">
        {showList
          ? results.length === 0
            ? "No matches"
            : `${results.length} ${results.length === 1 ? "result" : "results"} available`
          : ""}
      </span>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute mt-1 w-full bg-surface border border-border-subtle rounded-md overflow-hidden"
          style={{
            zIndex: "var(--z-dropdown)",
            boxShadow: "var(--shadow-overlay)",
          }}
        >
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-body-sm text-tertiary">
              No matches
            </li>
          ) : (
            results.map((p, i) => (
              // role="presentation" keeps the <li> out of the a11y tree so the
              // option is an immediate child of the listbox, as ARIA requires.
              <li key={p.slug} role="presentation">
                <button
                  type="button"
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  // Focus stays in the input; the active option is conveyed by
                  // aria-activedescendant. Without this, Tab walked through all
                  // eight results instead of leaving the search field.
                  tabIndex={-1}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(p)}
                  className={`flex items-center gap-3 w-full px-3 py-2 text-left ${
                    i === active ? "bg-elevated" : ""
                  }`}
                >
                  <img
                    src={spriteFor(p)}
                    alt=""
                    width="32"
                    height="32"
                    loading="lazy"
                    className="shrink-0 [image-rendering:pixelated]"
                  />
                  <span className="text-body text-primary flex-1 truncate">
                    {p.name}
                  </span>
                  <span className="flex gap-1 shrink-0">
                    {p.types.map((t) => (
                      <TypeBadge key={t} type={t} size="sm" />
                    ))}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
