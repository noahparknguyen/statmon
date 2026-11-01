import { LuArrowRight } from "react-icons/lu";
import Button from "./Button";
import PageHeader from "./PageHeader";

// The section shell every Home feature preview is built from: heading,
// one-line description, the live preview itself, and a link into the real tool.
//
// It makes "every feature gets a preview on Home" a component rather than
// something to remember: a new tool fills this in and is consistent from the
// start, the same way CmpRow keeps the two comparison boards aligned.
//
// The comparison board at the top doesn't use this shell: it keeps its mascots
// on either side, though it shares the heading block. This is the pattern for
// every section after it.
//
// The two gaps work as a ratio, not as two separate numbers: 32px from the
// preview to its own button, and 144px from that button to the next section.
// With the gaps closer in size, the button would look like it belonged to the
// section below it, and a button belongs to what it came from.
//
// The 144px is set by the art, not the heading: the dex preview's figures rise
// above its heading, and they're what a reader sees first, so the gap has to
// clear them. They show from `lg` only, so below it the gap is 96px, still
// three times the button's, where 144px cleared nothing and added up to 432px
// of empty page between Home's four sections.
export default function FeaturePreview({
  title,
  description,
  to,
  cta,
  children,
}) {
  return (
    <section className="mt-24 lg:mt-36">
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
