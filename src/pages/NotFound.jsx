import { LuArrowLeft } from "react-icons/lu";
import Button from "../components/Button";
import { PAGE_CONTENT } from "../components/pageChrome";

// The 404 page. It catches any unmatched route, and Cloudflare serves
// index.html for unknown paths, so it renders there too.
export default function NotFound() {
  return (
    <div className={`${PAGE_CONTENT} text-center`}>
      <p className="text-display-hero text-accent">404</p>
      <h1 className="mt-2 text-h1">This page fainted.</h1>
      {/* The line under a page's title: `text-body-sm`, 4px below it, as
          `PageHeader` sets it everywhere else. */}
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
