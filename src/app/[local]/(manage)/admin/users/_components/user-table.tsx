"use client";
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "~/lib/ui/input";
import { type ChangeEvent, useMemo, useState } from "react";
import Table from "~/app/[local]/_components/table";
import { api } from "~/trpc/react";
import { type UserGetAllOutput } from "~/lib/types/trpc";
import ID from "~/app/[local]/_components/id";
import UserColumn from "~/app/[local]/_components/user-column";
import UserStatusSwitch from "~/app/[local]/(manage)/admin/users/_components/user-status";
import { TooltipProvider } from "~/lib/ui/tooltip";
import { Badge } from "~/lib/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/lib/ui/dropdown-menu";
import { Button } from "~/lib/ui/button";
import { MoreHorizontalIcon, XIcon } from "lucide-react";
import UserRoleSettings from "~/app/[local]/(manage)/admin/users/_components/user-role-setting";
import { DataTableViewOptions } from "~/app/[local]/_components/table-view-options";

export default function UserTable() {
  const [keyword, setKeyword] = useState("");
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const isFiltered = useMemo(() => keyword !== "", [keyword]);

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize],
  );

  const users = api.user.getAll.useQuery({
    page: pageIndex,
    size: pageSize,
    keyword: keyword,
  });

  const columns: ColumnDef<UserGetAllOutput>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        return (
          <ID id={row.getValue("id")} createdAt={row.original.createdAt} />
        );
      },
    },
    {
      accessorKey: "info",
      header: "信息",
      cell: ({ row }) => {
        return <UserColumn user={row.original} />;
      },
    },
    {
      id: "rules",
      header: "角色",
      cell: ({ row }) => {
        return (
          <div className="max-w-20 space-y-1">
            {row.original.roles.map((role) => (
              <Badge key={role}>{role}</Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "status",
      header: "状态",
      cell: ({ row }) => {
        return (
          <UserStatusSwitch id={row.original.id} status={row.original.status} />
        );
      },
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => {
        return (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
              >
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <UserRoleSettings
                id={row.original.id}
                roles={row.original.roles}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    columns,
    data: users.data?.users ?? [],
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil((users.data?.total ?? 0) / 10),
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
            placeholder="过滤名称 | 邮箱"
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
        <div className="flex space-x-2">
          <DataTableViewOptions table={table} />
        </div>
      </div>
      <TooltipProvider delayDuration={100}>
        <Table table={table} isLoading={users.isLoading} />
      </TooltipProvider>
    </div>
  );
}
