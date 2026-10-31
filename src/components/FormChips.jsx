import { formsOf, formLabel } from "../lib/pokemon";
import { CHIP, CHIP_FILTER_GEOMETRY, CHIP_OFF, CHIP_ON } from "./chipStyles";

// Toggle chips for a Pokémon's alternate forms. Renders nothing when the
// Pokémon has only one form. Clicking a chip swaps the selection instantly.
//
// The most compact chips on the site (chipStyles.jsx), shared with
// AbilityChips: both sit in the card's 88px controls band beside a `FORM` or
// `ABILITY` label, and eight forms (Minior) already fill this row to two lines,
// so they stay smaller than the 36px chips used elsewhere. At 21px tall, they
// pass WCAG 2.5.8 through its spacing exception rather than by size, and
// `npm run sweep:widths` checks it.
//
// Renders nothing for a single-form Pokémon, which is 845 of the 1,259 entries.
// The card supplies the dash placeholder rather than this component, because
// what mustn't collapse is the labelled row, not the chips.
// Two sizes. `sm` is the card's compact band, where eight forms already fill
// two rows. `md` is the filter chips' 36px, for a phone's dialog, where the
// chips have the room and a thumb is doing the choosing.
const FORM_CHIP = {
  sm: `${CHIP} px-2 py-1 transition-colors`,
  md: `${CHIP} ${CHIP_FILTER_GEOMETRY}`,
};
export default function FormChips({ pokemon, onSelect, size = "sm" }) {
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
            className={`${FORM_CHIP[size]} ${active ? CHIP_ON : CHIP_OFF}`}
          >
            {formLabel(form)}
          </button>
        );
      })}
    </div>
  );
}
