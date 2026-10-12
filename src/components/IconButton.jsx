// A button whose only content is an icon, so every one on the site has the
// same size and behaviour.
//
// 36px, the site's compact control size, which clears WCAG 2.5.8's 24px floor
// outright rather than through its spacing exception. The icon inside is 16px:
// `text-body`'s 1em, the size an icon takes when there's no text beside it to
// take its size from.
//
// Two variants, and the difference is where the button stands:
//   · `ghost` (default): on its own. Borderless, and hover gives it a fill so
//     the pointer gets an answer. Remove and Close.
//   · `outline`: in a row of bordered controls, where a borderless one would
//     read as a gap. It has the unselected chip's look (chipStyles.jsx),
//     because the controls beside it are chips. The dex's sort direction.
//
// `label` is required and becomes the accessible name, since an icon-only
// control with no name is announced as just "button". Where there's more than
// one, it's named for what it acts on ("Remove Volcarona", not "Remove").
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
