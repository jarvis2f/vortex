"use client";
import {
  Table as TableUI,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/lib/ui/table";
import { flexRender, type Table as ReactTable } from "@tanstack/react-table";
import { DataTablePagination } from "~/lib/ui/pagination";
import { LoaderIcon } from "lucide-react";
import { useTranslations } from "use-intl";

export default function Table<T>({
  table,
  isLoading,
}: {
  table: ReactTable<T>;
  isLoading: boolean;
}) {
  const t = useTranslations("global_table");
  return (
    <>
      <div className="mt-3 rounded-md border">
        <TableUI>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <LoaderIcon className="h-8 w-8 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  {t("no-data")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableUI>
      </div>
      <div className="mt-3">
        <DataTablePagination table={table} />
      </div>
    </>
  );
}
