export type Status = "NEW" | "IN_PROGRESS" | "COMPLETED";

export type StatusMeta = {
  label: string;
  pillToneClass: string;
  dotToneClass: string;
  countToneClass: string;
};

export const STATUS_CONFIG: Record<Status, StatusMeta> = {
  NEW: {
    label: "New",
    pillToneClass:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    dotToneClass: "bg-slate-400",
    countToneClass: "text-slate-700 dark:text-slate-300",
  },
  IN_PROGRESS: {
    label: "In progress",
    pillToneClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    dotToneClass: "bg-blue-500",
    countToneClass: "text-blue-600 dark:text-blue-300",
  },
  COMPLETED: {
    label: "Completed",
    pillToneClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    dotToneClass: "bg-emerald-500",
    countToneClass: "text-emerald-600 dark:text-emerald-300",
  },
};

export const STATUSES = Object.keys(STATUS_CONFIG) as Status[];

export const STATUS_OPTIONS: Array<{ value: Status; label: string }> = STATUSES.map(
  (value) => ({
    value,
    label: STATUS_CONFIG[value].label,
  }),
);

export function createEmptyColumns<T>() {
  const cols = {} as Record<Status, T[]>;
  for (const status of STATUSES) {
    cols[status] = [];
  }
  return cols;
}

export function isKnownStatus(status: unknown): status is Status {
  return (
    typeof status === "string" &&
    Object.prototype.hasOwnProperty.call(STATUS_CONFIG, status)
  );
}
