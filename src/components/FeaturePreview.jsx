import { LuArrowRight } from "react-icons/lu";
import Button from "./Button";

// The section shell every Home feature preview is built from (D-043): heading,
// one-line description, the live preview itself, and a link into the real tool.
//
// It exists so the rule "every feature gets a preview on Home" is enforced by a
// component rather than by memory — a new tool fills this in and is consistent
// by construction, the same way CmpRow keeps the two comparison boards aligned.
//
// The hero (the comparison board) deliberately does NOT use this: it is the
// flagship and keeps its unlabelled, mascot-flanked treatment. This is the
// pattern for everything after it.
export default function FeaturePreview({
  title,
  description,
  to,
  cta,
  children,
}) {
  return (
    <section className="mt-20">
      <header className="text-center">
        <h2 className="text-h1">
          {title}
          <span className="text-accent">.</span>
        </h2>
        <p className="mt-1 text-body-sm text-secondary">{description}</p>
      </header>

      <div className="mt-6">{children}</div>

      <div className="mt-6 flex justify-center">
        <Button to={to}>
          {cta}
          <LuArrowRight aria-hidden />
        </Button>
      </div>
    </section>
  );
}
