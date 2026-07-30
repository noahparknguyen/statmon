import { typeColorVar, typeTextVar, capitalize } from "../lib/types";

// A type pill, colored by the type token. `size="sm"` for search rows.
export default function TypeBadge({ type, size = "md" }) {
  const pad = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-0.5";
  return (
    <span
      className={`text-badge rounded-full ${pad}`}
      style={{ backgroundColor: typeColorVar(type), color: typeTextVar(type) }}
    >
      {capitalize(type)}
    </span>
  );
}
