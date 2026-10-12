// What the router shows while a code-split page is still arriving on a first
// load: someone opening `/dex` directly rather than getting there from Home.
//
// It isn't a spinner, and paints almost nothing on purpose. The stylesheet
// already gives the page `--color-base` and `color-scheme: dark`, so it's the
// right colour before any JavaScript runs, and there's no white flash to
// cover. Declaring it also stops React Router warning "No `HydrateFallback`
// element provided" on every lazy route, in every visitor's console.
//
// The `role="status"` line is the part that does something: a screen reader is
// told the page is loading rather than meeting an empty document. It's
// `sr-only` because a visible "Loading…" that flashes for 40ms is worse than
// nothing.
//
// It never renders on a navigation within the site: there the router awaits
// the page's code as part of the navigation, which is why the routes use the
// router's `lazy` rather than React.lazy and Suspense (see router.jsx).
//
// Its own file rather than a function inside `router.jsx`, because
// `react-refresh` needs a module that defines a component to export only
// components, and `router.jsx` exports a route table and a factory.
export default function HydrateFallback() {
  return (
    <div className="min-h-svh bg-base">
      <span role="status" className="sr-only">
        Loading Statmon…
      </span>
    </div>
  );
}
