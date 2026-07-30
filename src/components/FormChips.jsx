import { formsOf, formLabel } from "../lib/pokemon";

// Toggle chips for a Pokémon's alternate forms. Renders nothing when the
// Pokémon has only one form. Clicking a chip swaps the selection instantly.
export default function FormChips({ pokemon, onSelect }) {
  const forms = formsOf(pokemon);
  if (forms.length <= 1) return null;

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {forms.map((form) => {
        const active = form.slug === pokemon.slug;
        return (
          <button
            key={form.slug}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(form)}
            className={`text-badge rounded-full px-2 py-1 border transition-colors ${
              active
                ? "bg-accent text-accent-contrast border-transparent"
                : "bg-elevated text-secondary border-border-strong hover:text-primary"
            }`}
          >
            {formLabel(form)}
          </button>
        );
      })}
    </div>
  );
}
