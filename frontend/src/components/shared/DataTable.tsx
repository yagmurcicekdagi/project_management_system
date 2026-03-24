import type { ReactNode } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";

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

function renderBody<T>(
  columns: ColumnDef<T>[],
  data: T[],
  isLoading: boolean,
  emptyMessage: string,
  onRowClick?: (row: T) => void,
): ReactNode {
  if (isLoading) {
    return Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        {columns.map((col) => (
          <TableCell key={col.header} className={col.className}>
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-zinc-800" />
          </TableCell>
        ))}
      </TableRow>
    ));
  }

  if (data.length === 0) {
    return (
      <TableRow>
        <TableCell
          colSpan={columns.length}
          className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500"
        >
          {emptyMessage}
        </TableCell>
      </TableRow>
    );
  }

  return data.map((row, i) => (
    <TableRow
      key={i}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      className={
        onRowClick
          ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50"
          : undefined
      }
    >
      {columns.map((col) => (
        <TableCell key={col.header} className={col.className}>
          {col.cell(row)}
        </TableCell>
      ))}
    </TableRow>
  ));
}

export default function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No results found.",
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.header} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {renderBody(columns, data, isLoading, emptyMessage, onRowClick)}
        </TableBody>
      </Table>
    </div>
  );
}
