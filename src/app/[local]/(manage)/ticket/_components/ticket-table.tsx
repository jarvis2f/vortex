"use client";
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "~/lib/ui/input";
import * as React from "react";
import { type ChangeEvent, useMemo, useState } from "react";
import Table from "~/app/[local]/_components/table";
import { api } from "~/trpc/react";
import { type TicketGetAllOutput } from "~/lib/types/trpc";
import ID from "~/app/[local]/_components/id";
import UserColumn from "~/app/[local]/_components/user-column";
import { Button } from "~/lib/ui/button";
import { XIcon } from "lucide-react";
import Link from "next/link";
import TicketStatusBadge from "~/app/[local]/(manage)/ticket/_components/ticket-status-badge";
import TicketClose from "~/app/[local]/(manage)/ticket/_components/ticket-close";

export default function TicketTable({ keyword: k }: { keyword: string }) {
  const [keyword, setKeyword] = useState(k);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const isFiltered = useMemo(() => keyword && keyword !== "", [keyword]);

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize],
  );

  const tickets = api.ticket.getAll.useQuery({
    page: pageIndex,
    size: pageSize,
    keyword: keyword,
  });

  const columns: ColumnDef<TicketGetAllOutput>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        return <ID id={row.original.id} createdAt={row.original.createdAt} />;
      },
    },
    {
      accessorKey: "title",
      header: "标题",
      cell: ({ row }) => {
        return (
          <Link
            href={`/ticket/${row.original.id}`}
            className="max-w-[20rem] overflow-x-hidden hover:underline"
          >
            <div className="flex flex-col gap-1">
              <p>{row.original.title}</p>
            </div>
          </Link>
        );
      },
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        return <TicketStatusBadge status={row.original.status} />;
      },
    },
    {
      accessorKey: "createdBy",
      header: "创建者",
      cell: ({ row }) => <UserColumn user={row.original.createdBy} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        if (row.original.status === "CLOSED") {
          return null;
        }
        return (
          <div className="flex gap-1">
            <TicketClose id={row.original.id} />
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    columns,
    data: tickets.data?.tickets ?? [],
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil((tickets.data?.total ?? 0) / 10),
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            value={keyword ?? ""}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setKeyword(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => {
                setKeyword("");
                table.resetColumnFilters();
              }}
              className="h-8 px-2 lg:px-3"
            >
              重置
              <XIcon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/ticket/new">
            <Button className="h-8 px-2 lg:px-3">创建新的工单</Button>
          </Link>
        </div>
      </div>
      <Table table={table} isLoading={tickets.isLoading} />
    </div>
  );
}
