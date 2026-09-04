import { formsOf, formLabel } from "../lib/pokemon";
import { CHIP, CHIP_OFF, CHIP_ON } from "./chipStyles";

// Toggle chips for a Pokémon's alternate forms. Renders nothing when the
// Pokémon has only one form. Clicking a chip swaps the selection instantly.
//
// The most compact of the three chip families (chipStyles.jsx): these sit in
// the card's fixed 40px band, which eight forms (Minior) already fill to two
// rows — so the geometry stays tighter than the 36px used elsewhere, and is the
// one known WCAG 2.5.8 spacing exception on the site (04_design §9, D-042).
const FORM_CHIP = `${CHIP} px-2 py-1 transition-colors`;
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
            className={`${FORM_CHIP} ${active ? CHIP_ON : CHIP_OFF}`}
          >
            {formLabel(form)}
          </button>
        );
      })}
    </div>
  );
}
