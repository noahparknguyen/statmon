import PageHeader from "../components/PageHeader";
import { PAGE_CONTENT } from "../components/pageChrome";

// The About page: why Statmon exists. Credits are in the footer, on every page.

// The text sits in a narrower column than the page: 1,120px of 16px text is
// about 130 characters a line, roughly twice what reads comfortably. Centred,
// because the heading above it is, and a narrow column pinned left under a
// centred heading looks like a mistake.
const PROSE = "mx-auto max-w-2xl space-y-4 text-body text-secondary";

export default function About() {
  return (
    <div className={PAGE_CONTENT}>
      <PageHeader title="About" subtitle="Why this exists." />

      <div className={PROSE}>
        <p>
          Statmon is a personal site I built to be an all-in-one Pokémon
          toolkit.
        </p>
        <p>
          Over one long and uneventful summer, I decided to replay all of the
          mainline Pokémon games, generation 1 through 5. During each
          playthrough there would be a point where I had to decide between two
          Pokémon of similar types. To weigh my options I&rsquo;d look up sites
          that let me compare the stats of each mon. The problem was that the
          ones I found were either a little out of date style-wise, or filled
          with clutter I didn&rsquo;t need.
        </p>
        <p>
          That&rsquo;s ultimately what inspired me to make Statmon. I wanted
          something without all the fluff and filler, that gave you the
          information you needed without any hassle.
        </p>
        <p>
          I started with the tool I wanted most, a comparison. Over time I
          slowly built out more features and pages. The Pokédex table was added
          because I wanted to compare more Pokémon using specific filters and
          categories. The type matchup chart was added because I couldn&rsquo;t
          for the life of me remember which types were strong or weak against
          which. The games were added because I wanted to see if my knowledge
          was actually improving.
        </p>
        <p>
          Reading everything as of an older generation came last, and only
          because I was replaying those games while building this. Generation 1
          has no Sp. Attack or Sp. Defense, just one Special stat, and plenty of
          Pokémon have had their stats or typing changed since. The site was
          telling me about Pokémon as they are now, not as they were in the
          games I was actually playing.
        </p>
        <p>
          Combining all of these tools together resulted in what you see here
          now. I hope you find it just as useful as I do.
        </p>
        {/* A sign-off, because this page is a letter rather than a section of a
            product. The footer carries the byline everywhere else. */}
        <p className="text-primary">&mdash; Noah</p>
      </div>
    </div>
  );
}
