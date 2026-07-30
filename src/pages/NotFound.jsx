import { Link } from "react-router";
import { LuArrowLeft } from "react-icons/lu";

// 404 — Phase 3.5 stub, on-brand and helpful. Catches any unmatched route.
export default function NotFound() {
  return (
    <div className="max-w-content mx-auto px-4 py-24 text-center">
      <p className="text-display-hero text-accent">404</p>
      <h1 className="mt-2 text-h1">This page fainted.</h1>
      <p className="mx-auto mt-2 max-w-md text-body text-secondary">
        We couldn&apos;t find what you were looking for.
      </p>
      <div className="mt-8 flex justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-elevated border border-border-subtle text-secondary text-button transition-colors hover:text-primary hover:border-border-strong"
        >
          <LuArrowLeft aria-hidden />
          Back home
        </Link>
      </div>
    </div>
  );
}
