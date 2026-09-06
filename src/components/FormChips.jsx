import { formsOf, formLabel } from "../lib/pokemon";
import { CHIP, CHIP_OFF, CHIP_ON } from "./chipStyles";

// Toggle chips for a Pokémon's alternate forms. Renders nothing when the
// Pokémon has only one form. Clicking a chip swaps the selection instantly.
//
// The most compact geometry in the chip family (chipStyles.jsx), shared with
// AbilityChips: both sit in the card's 88px controls band beside a `FORM` /
// `ABILITY` label (D-080), and eight forms (Minior) already fill this row to
// two — so the geometry stays tighter than the 36px used elsewhere, and is the
// one known WCAG 2.5.8 spacing exception on the site (04_design §9, D-042).
//
// Renders nothing for a single-form Pokémon, which is 845 of the 1,259 entries.
// The card supplies the em-dash placeholder rather than this component, because
// what must not collapse is the labelled ROW, not the chips.
const FORM_CHIP = `${CHIP} px-2 py-1 transition-colors`;
export default function FormChips({ pokemon, onSelect }) {
  const forms = formsOf(pokemon);
  if (forms.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
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
