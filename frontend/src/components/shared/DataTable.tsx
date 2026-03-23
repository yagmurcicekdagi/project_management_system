import type { ReactNode } from "react";
import { Table, THead, TBody, TR, TH, TD } from "../ui/table";

export type ColumnDef<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = Readonly<{
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}>;

export default function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No results found.",
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
      <Table>
        <THead>
          <TR>
            {columns.map((col) => (
              <TH key={col.header} className={col.className}>
                {col.header}
              </TH>
            ))}
          </TR>
        </THead>
        <TBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TR key={i}>
                {columns.map((col) => (
                  <TD key={col.header} className={col.className}>
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-zinc-800" />
                  </TD>
                ))}
              </TR>
            ))
          ) : data.length === 0 ? (
            <TR>
              <TD
                colSpan={columns.length}
                className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500"
              >
                {emptyMessage}
              </TD>
            </TR>
          ) : (
            data.map((row, i) => (
              <TR
                key={i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={
                  onRowClick
                    ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                    : undefined
                }
              >
                {columns.map((col) => (
                  <TD key={col.header} className={col.className}>
                    {col.cell(row)}
                  </TD>
                ))}
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}
