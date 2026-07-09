type DateFormatStyle = "short" | "medium" | "long";

const dateFormatters: Record<DateFormatStyle, Intl.DateTimeFormat> = {
  short: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }),
  medium: new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }),
  long: new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }),
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(
  value: string | Date,
  style: DateFormatStyle = "medium",
): string {
  const date = value instanceof Date ? value : new Date(value);
  return dateFormatters[style].format(date);
}

export function formatDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return dateTimeFormatter.format(date);
}

export function formatDueLabel(dueAt: string, now = Date.now()): string {
  const date = new Date(dueAt);
  const diffDays = Math.ceil((date.getTime() - now) / (1000 * 60 * 60 * 24));
  const formatted = formatDateTime(dueAt);

  if (diffDays < 0) return `${formatted} · overdue`;
  if (diffDays === 0) return `${formatted} · today`;
  if (diffDays === 1) return `${formatted} · tomorrow`;
  return `${formatted} · ${diffDays} days`;
}

export function appealTitle(appeal: {
  violation_id: string;
  issue_category?: string | null;
}): string {
  const category = appeal.issue_category ?? "Violation";
  return `${category} appeal`;
}
