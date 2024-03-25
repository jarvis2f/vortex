"use client";
import * as React from "react";
import { type ChangeEvent, useMemo, useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  type PaginationState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { api } from "~/trpc/react";
import { Input } from "~/lib/ui/input";
import Table from "~/app/[local]/_components/table";
import { type WithdrawalGetAllOutput } from "~/lib/types/trpc";
import { Button } from "~/lib/ui/button";
import { CheckSquareIcon, XIcon } from "lucide-react";
import { DataTableViewOptions } from "~/app/[local]/_components/table-view-options";
import ID from "~/app/[local]/_components/id";
import UserColumn from "~/app/[local]/_components/user-column";
import { MoneyInput } from "~/lib/ui/money-input";
import { TableFacetedFilter } from "~/app/[local]/_components/table-faceted-filter";
import { WithdrawalStatusOptions } from "~/lib/constants";
import { Badge } from "~/lib/ui/badge";
import { toast } from "~/lib/ui/use-toast";
import { WithdrawalStatus } from ".prisma/client";

interface WithdrawalTableProps {
  page?: number;
  size?: number;
  keyword?: string;
  filters?: string;
}

export default function WithdrawalTable({
  page,
  size,
  keyword: initialKeyword,
  filters,
}: WithdrawalTableProps) {
  const [keyword, setKeyword] = useState(initialKeyword ?? "");
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: page ?? 0,
    pageSize: size ?? 10,
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    filters ? (JSON.parse(filters) as ColumnFiltersState) : [],
  );

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize],
  );

  const withdrawals = api.withdrawal.getAll.useQuery({
    page: pageIndex,
    size: pageSize,
    keyword: keyword,
    status: columnFilters.find((filter) => filter.id === "status")
      ?.value as WithdrawalStatus[],
  });

  const updateStatusMutation = api.withdrawal.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "操作成功",
        description: "提现状态已更新, 已自动更新用户钱包收益余额",
      });
      void withdrawals.refetch();
    },
  });

  const columns: ColumnDef<WithdrawalGetAllOutput>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        return <ID id={row.original.id} createdAt={row.original.createdAt} />;
      },
    },
    {
      accessorKey: "amount",
      header: "提现金额",
      cell: ({ row }) => {
        return (
          <MoneyInput
            className="text-sm"
            displayType="text"
            value={String(row.original.amount)}
          />
        );
      },
    },
    {
      accessorKey: "address",
      header: "地址",
      cell: ({ row }) => {
        return <ID id={row.original.address} />;
      },
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        return (
          <Badge className="rounded-md px-2 py-1 text-white">
            {row.original.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "user",
      header: "用户",
      cell: ({ row }) => <UserColumn user={row.original.user} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        if (row.original.status === WithdrawalStatus.WITHDRAWN) {
          return null;
        }
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void updateStatusMutation.mutateAsync({
                id: row.original.id,
                status: WithdrawalStatus.WITHDRAWN,
              });
            }}
          >
            <CheckSquareIcon className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    columns,
    data: withdrawals.data?.withdrawals ?? [],
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil((withdrawals.data?.total ?? 0) / 10),
    state: {
      pagination,
      columnFilters,
      columnVisibility,
    },
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
  });

  const isFiltered = useMemo(
    () => keyword !== "" || columnFilters.length > 0,
    [keyword, columnFilters],
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="ID/用户ID"
            value={keyword ?? ""}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setKeyword(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
          <TableFacetedFilter
            column={table.getColumn("status")}
            title="状态"
            options={WithdrawalStatusOptions}
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
        <div className="flex space-x-2">
          <DataTableViewOptions table={table} />
        </div>
      </div>
      <Table table={table} isLoading={withdrawals.isLoading} />
    </div>
  );
}
