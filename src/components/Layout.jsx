import { Link, NavLink, Outlet } from "react-router";
import { LuGithub } from "react-icons/lu";

// Shared shell across all routes (D-022): a sticky brand/nav header, the routed
// page in the <main> landmark, and a muted footer with attribution. Token-driven
// and keyboard-navigable; the wordmark links home, nav marks the active route.
const REPO_URL = "https://github.com/noahparknguyen/statmon";

function navClass({ isActive }) {
  return [
    "text-button transition-colors hover:text-primary",
    isActive ? "text-primary" : "text-secondary",
  ].join(" ");
}

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-base text-primary">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-1300 focus:rounded-md focus:border focus:border-border-strong focus:bg-elevated focus:px-3 focus:py-2 focus:text-button focus:text-primary"
      >
        Skip to content
      </a>
      <header
        className="sticky top-0 border-b border-border-subtle bg-base/85 backdrop-blur"
        style={{ zIndex: "var(--z-sticky)" }}
      >
        <div className="max-w-content mx-auto flex items-center justify-between gap-4 px-4 h-14">
          <Link to="/" className="flex items-center gap-2 text-h3 text-primary">
            <img
              src="/favicon.svg"
              alt=""
              width="24"
              height="24"
              className="shrink-0"
            />
            <span>
              Statmon<span className="text-accent">.</span>
            </span>
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-5">
            <NavLink to="/compare" className={navClass}>
              Compare
            </NavLink>
            <NavLink to="/credits" className={navClass}>
              Credits
            </NavLink>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border-subtle">
        <div className="max-w-content mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-5">
          <p className="text-caption text-tertiary">
            Data from PokéAPI. Statmon is an unofficial fan project, not
            affiliated with Nintendo, Game Freak, or The Pokémon Company.
          </p>
          {/* Byline + repo read as one authorship group, so they sit together
              on the right rather than leaving the link stranded mid-row. */}
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-caption text-tertiary">
              Built by Noah Park-Nguyen
            </span>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-caption text-tertiary transition-colors hover:text-secondary"
            >
              <LuGithub aria-hidden />
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
