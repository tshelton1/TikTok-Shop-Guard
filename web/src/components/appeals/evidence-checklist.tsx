import type { EvidenceChecklistItem } from "@/types/appeals";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";

type EvidenceChecklistProps = {
  items: EvidenceChecklistItem[];
  onChange: (items: EvidenceChecklistItem[]) => void;
  className?: string;
};

export function EvidenceChecklist({
  items,
  onChange,
  className,
}: EvidenceChecklistProps) {
  const requiredUnchecked = items.filter(
    (item) => item.required && !item.checked,
  ).length;
  const checkedCount = items.filter((item) => item.checked).length;
  const progress = items.length
    ? Math.round((checkedCount / items.length) * 100)
    : 0;

  function toggleItem(id: string) {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Evidence progress</span>
          <span className="text-muted-foreground">
            {checkedCount}/{items.length} complete
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                item.checked
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "hover:bg-muted/20",
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={item.checked}
                onChange={() => toggleItem(item.id)}
              />
              {item.checked ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                {item.required && !item.checked && (
                  <p className="mt-1 text-xs text-amber-700">Required before submit</p>
                )}
              </div>
            </label>
          </li>
        ))}
      </ul>

      {requiredUnchecked > 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm text-amber-800">
          {requiredUnchecked} required item{requiredUnchecked === 1 ? "" : "s"}{" "}
          still need to be gathered.
        </p>
      ) : (
        <p className="rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-800">
          All required evidence items are marked ready.
        </p>
      )}
    </div>
  );
}
