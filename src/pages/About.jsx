import PageHeader from "../components/PageHeader";
import { PAGE_CONTENT } from "../components/pageChrome";

// About — the origin story, in the author's own words (D-118).
//
// **The copy is his, edited only for grammar and repetition.** Two earlier
// drafts of mine failed in the same direction: the first read like release
// notes, the second kept the shape but was still me doing an impression. The
// fix was to stop writing it. What is here is the author's own account with
// spelling and subject-verb agreement corrected, "over time" unglued, and one
// duplicated "During" varied — nothing else.
//
// **One paragraph was added and it is the only addition**: the generation lens.
// The story ends at "I built more tools" without it, and the lens is the one
// feature that came DIRECTLY out of the replay the page opens with — the site
// was describing Pokémon as they are now while he was playing them as they
// were. It earns its place by belonging to the origin rather than by being
// impressive.
//
// **Credits are not here.** They moved to the footer (D-119), where they sit on
// every page instead of one, which suits attribution better than a section
// nobody navigates to.
// Body copy sits in a measure rather than the full content width: 1,120px of
// 16px text is about 130 characters a line, roughly twice what anyone reads
// comfortably. Centred, because `PageHeader` above it is — a narrow column
// pinned left under a centred heading reads as a layout that lost an argument.
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
        {/* A sign-off, because the page is signed work rather than a section of
            a product. The footer carries the byline on every route; this is the
            one place it is a person ending a letter instead of a credit. */}
        <p className="text-primary">&mdash; Noah</p>
      </div>
    </div>
  );
}
