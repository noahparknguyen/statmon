import { statPct } from "../lib/stats";
import { typeColorVar } from "../lib/types";

// Reusable stat row: label · bar (colored by primary type) · value. Currently
// used only by the /style playground; kept for the future full-dex stats table
// (roadmap Phase 6). The live comparison uses its own row layouts.
export default function StatBar({ label, value, colorType }) {
  return (
    <div className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2 h-7">
      <span className="text-overline text-tertiary">{label}</span>
      <div className="h-2 rounded-full bg-elevated overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: statPct(value),
            backgroundColor: typeColorVar(colorType),
          }}
        />
      </div>
      <span className="text-stat text-primary text-right">{value}</span>
    </div>
  );
}
