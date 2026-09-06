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
// The flagship board does not use this shell: it keeps its mascot-flanked
// treatment, though it now shares the heading block (D-067). This is the pattern
// for everything after it.
//
// The two gaps are a proximity ratio, not two numbers (D-019): 32px from the
// preview to its own CTA, 144px from that CTA to the next section's heading. At
// mt-20/mt-6 the CTA sat close enough to the heading below it to look like that
// section's kicker — a button belongs to what it came from.
//
// **144 rather than 112 because a section's flanking art rises above its own
// heading** (D-083). Measured from the previous section's bottom, the gap to the
// Dex preview's Samurott was **17px** while Compare's was 167 and Types' 205 —
// the margin was uniform and the space it produced was not, because only that
// preview has figures that climb into it. The number is now set by the art
// rather than by the heading, which is the thing a reader actually sees first.
export default function FeaturePreview({
  title,
  description,
  to,
  cta,
  children,
}) {
  return (
    <section className="mt-36">
      <PageHeader as="h2" title={title} subtitle={description} />

      <div>{children}</div>

      <div className="mt-8 flex justify-center">
        <Button to={to}>
          {cta}
          <LuArrowRight aria-hidden />
        </Button>
      </div>
    </section>
  );
}
