import { LuArrowLeft } from "react-icons/lu";
import Button from "../components/Button";
import { PAGE_CONTENT } from "../components/pageChrome";

// 404 — on-brand and helpful. Catches any unmatched route; on Cloudflare the
// SPA fallback serves index.html for unknown paths, so this renders there too.
export default function NotFound() {
  return (
    <div className={`${PAGE_CONTENT} text-center`}>
      <p className="text-display-hero text-accent">404</p>
      <h1 className="mt-2 text-h1">This page fainted.</h1>
      {/* The line under a page's title: `text-body-sm`, 4px under it, as
          `PageHeader` sets it everywhere else (06_style_guide §5.1). */}
      <p className="mx-auto mt-1 max-w-md text-body-sm text-secondary">
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
