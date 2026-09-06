// Which tool a URL belongs to (D-087).
//
// Every tool on this site keeps its state in the URL (D-022), and two of them
// keep it in the **path**: `/compare/<p1>/vs/<p2>` and `/types/<t1>/<t2>`. So
// "the pathname changed" and "the user went somewhere else" are different
// questions, and the layout needs the second one — for scroll restoration,
// which otherwise threw you to the top of the page on every click, and for the
// focus move that announces a page change, which otherwise yanked focus out of
// the control you had just used.
//
// Its own module rather than a constant inside `Layout.jsx` for the usual two
// reasons (06_style_guide §12 rule 8): `react-refresh` requires a component
// file to export only components, and putting it in `router.jsx` — the natural
// home, since it is a fact about the route table — would be a cycle, because
// that module imports `Layout`.
//
// Deliberately the first path segment rather than the matched route id. The two
// path-state tools each have several route entries (`/types`, `/types/:t1`,
// `/types/:t1/:t2`), and those are one page to a reader; a route id would make
// picking a second type count as leaving.
export const toolOf = (pathname) => pathname.split("/")[1] || "home";
