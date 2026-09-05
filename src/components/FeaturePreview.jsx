import { LuArrowRight } from "react-icons/lu";
import Button from "./Button";
import PageHeader from "./PageHeader";

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
      <PageHeader as="h2" title={title} subtitle={description} />

      <div>{children}</div>

      <div className="mt-6 flex justify-center">
        <Button to={to}>
          {cta}
          <LuArrowRight aria-hidden />
        </Button>
      </div>
    </section>
  );
}
