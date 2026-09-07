// What the router shows while a code-split chunk is still arriving on a COLD
// load — someone opening `/dex` directly rather than walking there from Home.
//
// It is not a spinner and deliberately paints almost nothing: `body` already
// carries `--color-base` and `color-scheme: dark` from the stylesheet, so the
// page is the right colour before a line of JavaScript runs and there is no
// white flash to cover. What was missing was the DECLARATION — without it
// React Router warns "No `HydrateFallback` element provided" on every lazy
// route, which was 14 of the 15 pages, in every visitor's console.
//
// The `role="status"` line is the part that does something: a screen reader is
// told the page is loading rather than meeting an empty document. It is
// `sr-only` because a visible "Loading…" that flashes for 40ms is worse than
// nothing.
//
// This never renders on an in-app navigation — there the router awaits the
// module as part of the navigation, which is the whole reason `lazy` is used
// instead of React.lazy + Suspense (router.jsx).
//
// Its own file rather than a function inside `router.jsx`, for the reason
// `toolKey.js` is its own file (06_style_guide §12 rule 8): `react-refresh`
// requires a module that defines a component to export only components, and
// `router.jsx` exports a route table and a factory.
export default function HydrateFallback() {
  return (
    <div className="min-h-screen bg-base">
      <span role="status" className="sr-only">
        Loading Statmon…
      </span>
    </div>
  );
}
