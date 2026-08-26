import { useEffect, useState } from "react";
import { useOrg, usePermissions } from "@/hooks/useScope";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { TextInput } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDataStore } from "@/store/dataStore";
import { usePeopleStore } from "@/store/peopleStore";
import {
  computeWorkload,
  openIssuesForWorkload,
  barColor,
  shiftPeriod,
  periodLabel,
} from "@/lib/workload";
import type { WorkloadPeriod } from "@/types";
import clsx from "clsx";

const PERIODS: { id: WorkloadPeriod; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];
const CHIP_TONES = ["accent", "accent2", "neutral"] as const;

export default function OrgWorkload() {
  const org = useOrg();
  const { isOrgAdmin } = usePermissions();
  const updateOrgCapacity = useDataStore((s) => s.updateOrgCapacity);
  const people = usePeopleStore((s) => s.people);
  const [period, setPeriod] = useState<WorkloadPeriod>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [capacityDraft, setCapacityDraft] = useState(org?.capacityHoursPerWeek ?? 40);

  // Debounce the capacity save so typing a new number doesn't fire an API
  // call per keystroke — only after the user pauses for 500ms.
  useEffect(() => {
    if (!org || capacityDraft === org.capacityHoursPerWeek) return;
    const t = setTimeout(() => {
      updateOrgCapacity(org.id, capacityDraft);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capacityDraft]);

  if (!org) return null;

  const allIssues = org.projects.flatMap((p) => openIssuesForWorkload(p));
  const rows = computeWorkload(
    org.members.map((m) => m.userId),
    allIssues,
    () => org.capacityHoursPerWeek,
    period,
    people,
    anchor,
  );

  return (
    <div className="flex flex-col gap-4 max-w-[900px]">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 bg-neutral-100 rounded-full p-1 shadow-sm">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={clsx(
                "px-4 py-1.5 rounded-full font-heading text-sm cursor-pointer",
                period === p.id
                  ? "bg-accent-200 text-accent-700"
                  : "text-neutral-600",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnchor((a) => shiftPeriod(a, period, -1))}
            className="w-7 h-7 rounded-full bg-neutral-100 shadow-sm hover:shadow-md cursor-pointer text-sm"
            aria-label="Previous period"
          >
            ←
          </button>
          <div className="text-[13px] font-semibold min-w-[130px] text-center">
            {periodLabel(period, anchor)}
          </div>
          <button
            onClick={() => setAnchor((a) => shiftPeriod(a, period, 1))}
            className="w-7 h-7 rounded-full bg-neutral-100 shadow-sm hover:shadow-md cursor-pointer text-sm"
            aria-label="Next period"
          >
            →
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            className="text-[12.5px] text-accent-700 font-semibold cursor-pointer"
          >
            Today
          </button>
        </div>
        <div className="hidden sm:block flex-1" />
        <div className="text-[12.5px] text-neutral-600">Working hours</div>
        {isOrgAdmin && (
          <TextInput
            type="number"
            min={1}
            step={1}
            value={capacityDraft}
            onChange={(e) => setCapacityDraft(Number(e.target.value) || 40)}
            className="w-20 h-[34px] text-[13px]"
          />
        )}
        {isOrgAdmin && (
          <div className="text-[12.5px] text-neutral-600">hr/ week</div>
        )}
      </div>

      <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 pt-4 pb-3">
          <div className="font-heading text-xl">
            Occupancy across the organization
          </div>
          <div className="text-[12.5px] text-neutral-600 mt-0.5">
            Estimated hours on open tasks due within the selected period,
            against each member's capacity.
          </div>
        </div>
        {rows.map((r) => {
          const projectKeys = org.projects
            .filter((p) => p.members.some((m) => m.userId === r.userId))
            .map((p) => p.key);
          return (
            <div key={r.userId}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 sm:px-6 py-3 border-t border-line">
                <Avatar userId={r.userId} size="sm" />
                <div className="flex-1 min-w-[100px] sm:w-[150px] sm:flex-none overflow-hidden">
                  <div className="text-sm font-semibold truncate">{r.name}</div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {projectKeys.map((k, idx) => (
                      <Pill
                        key={k}
                        tone={CHIP_TONES[idx % CHIP_TONES.length]}
                        size="sm"
                      >
                        {k}
                      </Pill>
                    ))}
                  </div>
                </div>
                <div className="w-16 flex-none text-right text-[13px] font-semibold">
                  {r.pct}%
                </div>
                <div className="order-4 sm:order-none basis-full sm:basis-auto sm:flex-1 h-2.5 rounded-full bg-neutral-200 overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(r.pct, 100)}%`,
                      background: barColor(r.pct),
                    }}
                    className="h-full rounded-full"
                  />
                </div>
                <div className="order-5 sm:order-none w-[110px] flex-none text-right text-[12.5px] text-neutral-600">
                  {r.occupied}h / {r.capacity}h
                </div>
              </div>
              {r.unscheduledHours > 0 && (
                <div className="pb-2 pl-4 sm:pl-[211px] pr-4 sm:pr-6 text-[11.5px] text-neutral-600">
                  {r.unscheduledHours}h unscheduled
                </div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && (
          <EmptyState>No members in this organization yet.</EmptyState>
        )}
      </div>
    </div>
  );
}
