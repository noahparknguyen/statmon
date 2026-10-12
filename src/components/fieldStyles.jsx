// The look of a text field: the comparison and type-chart search, the dex's
// name filter, and the dex's phone sort select. One set of strings, so the
// fields can't drift apart.
//
// The border is `border-field`, not `border-subtle`. A field's edge is the one
// thing that says "type here", so WCAG 1.4.11 asks 3:1 of it: the field token
// is 3.74 against the panel, where border-subtle is 1.33.
//
// Focus is the site's one ring (`.focus-ring-within`, in index.css), drawn on
// the wrapper because the wrapper is what looks like the field.
//
// A constants-only `.jsx` module for the usual two reasons: Tailwind only scans
// `.jsx`, and `react-refresh` needs a component file to export only components.

// Shape, colour, and type. Height is the caller's: the search fields are 44px
// (`h-11`), and the phone sort select sits in a row of 36px controls. Adding
// `h-9` to a string that already says `h-11` wouldn't override it, because
// Tailwind settles that by stylesheet order, so the height is never in here.
export const FIELD_LOOK =
  "rounded-sm border border-border-field bg-elevated px-3 text-body text-primary";

// The wrapper of a field with an icon in it: the full 44px field.
export const FIELD = `flex h-11 items-center gap-2 focus-ring-within ${FIELD_LOOK}`;

// The bare input inside a FIELD. It draws nothing of its own: the wrapper is
// the field, and the wrapper carries the ring.
export const FIELD_INPUT =
  "w-full bg-transparent text-body text-primary outline-none placeholder:text-tertiary";
