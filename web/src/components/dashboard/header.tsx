type DashboardHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function DashboardHeader({
  title,
  description,
  action,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
