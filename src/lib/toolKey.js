// Which tool a URL belongs to.
//
// Every tool keeps its state in the URL, and two keep it in the path:
// `/compare/<p1>/vs/<p2>` and `/types/<t1>/<t2>`. So "the path changed" and
// "you went somewhere else" are different questions, and the layout needs the
// second. Scroll restoration would otherwise throw you to the top on every
// click, and the focus move that announces a new page would pull focus out of
// the control you'd just used.
//
// Its own module rather than a constant in `Layout.jsx` for two reasons:
// `react-refresh` needs a component file to export only components, and
// `router.jsx`, the natural home, imports `Layout`, so putting it there would
// make a cycle.
//
// It's the first path segment rather than the matched route on purpose. The
// two path-state tools each have several routes (`/types`, `/types/:t1`,
// `/types/:t1/:t2`) that are one page to a reader, and matching on the route
// would count picking a second type as leaving.
export const toolOf = (pathname) => pathname.split("/")[1] || "home";
