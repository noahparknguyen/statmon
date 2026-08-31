import { LuArrowLeft } from "react-icons/lu";
import Button from "../components/Button";

// 404 — on-brand and helpful. Catches any unmatched route; on Cloudflare the
// SPA fallback serves index.html for unknown paths, so this renders there too.
export default function NotFound() {
  return (
    <div className="max-w-content mx-auto px-4 py-24 text-center">
      <p className="text-display-hero text-accent">404</p>
      <h1 className="mt-2 text-h1">This page fainted.</h1>
      <p className="mx-auto mt-2 max-w-md text-body text-secondary">
        The link may be broken, or the page moved.
      </p>
      <div className="mt-8 flex justify-center">
        <Button to="/" variant="secondary">
          <LuArrowLeft aria-hidden />
          Back home
        </Button>
      </div>
    </div>
  );
}
