// A button whose only content is an icon (06_style_guide §12.2, D-135).
//
// There were three of these and no two agreed: the Pokémon card's Remove was
// 28px with a hover fill, the setup dialog's Close was 36px without one, and the
// dex's sort-direction toggle was a bordered 36px chip. Same job, three answers.
//
// **36px, the site's compact control size** (04_design §9), which clears WCAG
// 2.5.8's 24px floor outright rather than through its spacing exception. The
// icon inside is 16px: `text-body`'s 1em, the size an icon takes when there is
// no text beside it to take its size from (06_style_guide §11).
//
// Two variants, and the difference is where the button stands:
//   · `ghost` (default) — on its own. Borderless; hover gives it a fill so the
//     pointer gets an answer. Remove, Close.
//   · `outline` — in a row of bordered controls, where a borderless one would
//     read as a gap. It wears the unselected chip's look (chipStyles.jsx),
//     because the controls beside it are chips. The dex's sort direction.
//
// `label` is required and becomes the accessible name: an icon-only control
// with no name is the failure D-065 fixed on the nav. It is named for what it
// acts on where there is more than one ("Remove Volcarona", not "Remove").
import { CHIP_OFF } from "./chipStyles";

const BASE =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-body transition-colors";

const VARIANT = {
  ghost: "text-secondary hover:bg-elevated hover:text-primary",
  outline: `border ${CHIP_OFF}`,
};

export default function IconButton({
  label,
  variant = "ghost",
  className = "",
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`${BASE} ${VARIANT[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
