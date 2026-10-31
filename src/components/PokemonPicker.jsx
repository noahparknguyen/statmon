import { LuX } from "react-icons/lu";
import ChipGroup from "./ChipGroup";
import Dialog from "./Dialog";
import FormChips from "./FormChips";
import IconButton from "./IconButton";
import SearchBar from "./SearchBar";
import TypeBadge from "./TypeBadge";
import { formsOf, spriteFor } from "../lib/pokemon";
import { dexNumberOf } from "../lib/dexTable";

// A phone's way to choose a Pokémon: the whole screen, the search field
// focused and the keyboard up, the results in a list under it. The desktop's
// search fields are dropdowns, and on a phone a dropdown has nowhere to drop
// to above the keyboard. Compare opens it for either side of its board, and
// Types for the defender.
//
// Until something is typed, the space under the field says what's chosen now,
// as a row like the results it would replace, with the × that removes it, the
// same control the desktop card has. Under it, the Pokémon's other forms: a
// form is the same Pokémon in another version, so it's a choice of Pokémon,
// and lives here rather than with the ability. Each block is 16px from the
// next, the gap between groups in every panel.
//
// `title` names the dialog and `label` the field, the way the desktop names
// its own search fields: "Pokémon 1" and "Search Pokémon 1" on Compare.
export default function PokemonPicker({
  open,
  title,
  label,
  current,
  onSelect,
  onClear,
  onClose,
}) {
  const choose = (p) => {
    onSelect(p);
    onClose();
  };
  const forms = current ? formsOf(current) : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      closeLabel={`Close ${title}`}
      placement="full"
    >
      <SearchBar
        label={label}
        onSelect={choose}
        layout="list"
        autoFocus
        idle={
          current && (
            <div className="mt-4 flex flex-col gap-4">
              <div role="group" aria-label="Selected">
                <div className="mb-2 text-overline text-tertiary">Selected</div>
                {/* A result row's anatomy (SearchBar), on the elevated fill a
                    result takes when it's the active one. */}
                <div className="flex min-h-12 items-center gap-3 rounded-md bg-elevated py-1 pr-1 pl-3">
                  <img
                    src={spriteFor(current)}
                    alt=""
                    width="32"
                    height="32"
                    className="shrink-0 [image-rendering:pixelated]"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-body-sm text-primary">
                      {current.name}
                    </span>
                    <span className="text-caption text-tertiary">
                      #{String(dexNumberOf(current)).padStart(4, "0")}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    {current.types.map((t) => (
                      <TypeBadge key={t} type={t} size="sm" />
                    ))}
                  </span>
                  <IconButton
                    label={`Remove ${current.name}`}
                    onClick={() => {
                      onClear();
                      onClose();
                    }}
                  >
                    <LuX aria-hidden />
                  </IconButton>
                </div>
              </div>
              {forms.length > 1 && (
                <ChipGroup label="Form" name={`${current.name}'s form`}>
                  <FormChips pokemon={current} onSelect={choose} size="md" />
                </ChipGroup>
              )}
            </div>
          )
        }
      />
    </Dialog>
  );
}
