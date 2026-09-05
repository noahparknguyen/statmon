import { LuExternalLink } from "react-icons/lu";
import PageHeader from "../components/PageHeader";
import { PAGE_CONTENT } from "../components/pageChrome";

// Credits — blunt attribution pass (D-023). Sources, the repo link, and the
// unofficial-fan-project disclaimer; the shared footer carries the byline.
const CREDITS = [
  {
    title: "PokéAPI",
    desc: "Names, types, and base stats. Fetched once at build time and served locally.",
    href: "https://pokeapi.co/",
  },
  {
    title: "PokéAPI/sprites",
    desc: "Pixel sprites and official artwork.",
    href: "https://github.com/PokeAPI/sprites",
  },
  {
    title: "Source on GitHub",
    desc: "The code, docs, and decision log. Open source.",
    href: "https://github.com/noahparknguyen/statmon",
  },
];

export default function Credits() {
  return (
    <div className={PAGE_CONTENT}>
      <PageHeader title="Credits" subtitle="What Statmon is built on." />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CREDITS.map((c) => (
          <li key={c.title}>
            <a
              href={c.href}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full flex-col gap-2 rounded-lg border border-border-subtle bg-surface p-5 transition-colors hover:border-border-strong"
            >
              <span className="flex items-center gap-1.5 text-h4 text-primary">
                {c.title}
                <LuExternalLink
                  aria-hidden
                  className="text-tertiary transition-colors group-hover:text-secondary"
                />
              </span>
              <span className="text-body-sm text-secondary">{c.desc}</span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-caption text-tertiary">
        Pokémon and Pokémon character names are trademarks of Nintendo, Game
        Freak, and The Pokémon Company. Statmon is an unofficial fan project.
      </p>
    </div>
  );
}
