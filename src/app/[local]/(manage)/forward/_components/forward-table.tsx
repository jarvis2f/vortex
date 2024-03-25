"use client";
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
import { TableFacetedFilter } from "~/app/[local]/_components/table-faceted-filter";
import { ForwardStatusOptions } from "~/lib/constants";
import { type ForwardGetAllOutput } from "~/lib/types/trpc";
import { type AgentInfo } from "~/lib/types/agent";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/lib/ui/tooltip";
import { $Enums, type Agent, ForwardTargetType } from ".prisma/client";
import { Button } from "~/lib/ui/button";
import { MoreHorizontalIcon, XIcon } from "lucide-react";
import { DataTableViewOptions } from "~/app/[local]/_components/table-view-options";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/lib/ui/dropdown-menu";
import ForwardDelete from "~/app/[local]/(manage)/forward/_components/forward-delete";
import ForwardModifyRemark from "~/app/[local]/(manage)/forward/_components/forward-modify-remark";
import ForwardResetTraffic from "~/app/[local]/(manage)/forward/_components/forward-reset-traffic";
import ForwardNew from "~/app/[local]/(manage)/forward/_components/forward-new";
import ID from "~/app/[local]/_components/id";
import UserColumn from "~/app/[local]/_components/user-column";
import Traffic from "~/app/[local]/_components/traffic";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import ForwardStatus = $Enums.ForwardStatus;

interface ForwardTableProps {
  page?: number;
  size?: number;
  keyword?: string;
  filters?: string;
  agentId?: string;
  userId?: string;
}

export default function ForwardTable({
  page,
  size,
  keyword: initialKeyword,
  filters,
  agentId,
}: ForwardTableProps) {
  const { data: session } = useSession();
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

  const users = api.forward.getAll.useQuery({
    page: pageIndex,
    size: pageSize,
    keyword: keyword,
    status: columnFilters.find((filter) => filter.id === "status")
      ?.value as ForwardStatus[],
    agentId: agentId,
  });

  const renderAgent = (
    agent: Pick<Agent, "id" | "name" | "info">,
    port: number,
  ) => {
    const ip = agent.info
      ? (agent.info as unknown as AgentInfo).ip?.ipv4
      : undefined;
    return (
      <p className="flex gap-2">
        <Link href={`/agent?id=${agent.id}`}>
          <span className="text-primary/50 hover:text-primary/100">
            {agent.name}
          </span>
        </Link>
        {ip && <span className="text-foreground/50"> ({ip})</span>}
        <span>:{port}</span>
      </p>
    );
  };

  const columns: ColumnDef<ForwardGetAllOutput>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        return <ID id={row.original.id} />;
      },
    },
    {
      accessorKey: "agent",
      header: "服务器",
      cell: ({ row }) => {
        const agent = row.original.agent;
        return renderAgent(agent, row.original.agentPort);
      },
    },
    {
      accessorKey: "target",
      header: "目标",
      cell: ({ row }) => {
        return row.original.targetType === ForwardTargetType.AGENT ? (
          renderAgent(row.original.targetAgent!, row.original.targetPort)
        ) : (
          <p className="gap-1">
            <span>{row.original.target}</span>
            <span>:{row.original.targetPort}</span>
          </p>
        );
      },
    },
    {
      accessorKey: "usedTraffic",
      header: "已用流量",
      cell: ({ row }) => (
        <Traffic
          upload={row.original.upload}
          download={row.original.download}
          relationId={row.original.id}
        />
      ),
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        const option = ForwardStatusOptions.find(
          (option) => option.value === row.original.status,
        );
        return (
          <span
            className={cn(
              "flex min-w-16 max-w-20 items-center",
              row.original.status === "CREATED_FAILED" && "text-red-500",
            )}
          >
            {option?.icon && (
              <option.icon className="mr-1 inline-block h-4 w-4" />
            )}
            {option?.label}
          </span>
        );
      },
    },
    {
      accessorKey: "user",
      header: "用户",
      cell: ({ row }) => <UserColumn user={row.original.createdBy} />,
    },
    {
      accessorKey: "remark",
      header: "备注",
      cell: ({ row }) => {
        return (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <p className="line-clamp-2 max-w-[10rem] text-xs text-muted-foreground">
                {row.original.remark}
              </p>
            </TooltipTrigger>
            <TooltipContent side="left" className="flex items-center gap-4">
              {row.original.remark}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: "actions",
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
              <ForwardModifyRemark
                forwardId={row.original.id}
                remark={row.original.remark}
                trigger={
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    修改备注
                  </DropdownMenuItem>
                }
              />
              {session?.user?.roles?.includes(Role.ADMIN) && (
                <ForwardResetTraffic
                  forwardId={row.original.id}
                  trigger={
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={(e) => e.preventDefault()}
                    >
                      重置流量
                    </DropdownMenuItem>
                  }
                />
              )}
              <DropdownMenuSeparator />
              <ForwardDelete
                forwardId={row.original.id}
                trigger={
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    删除
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    columns,
    data: users.data?.forwards ?? [],
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil((users.data?.total ?? 0) / 10),
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
            placeholder="(服务器/用户ID)/备注"
            value={keyword ?? ""}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setKeyword(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
          <TableFacetedFilter
            column={table.getColumn("status")}
            title="状态"
            options={ForwardStatusOptions}
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
          <ForwardNew
            trigger={
              <Button className="ml-auto hidden h-8 lg:flex">添加</Button>
            }
            agentId={agentId}
          />
          <DataTableViewOptions table={table} />
        </div>
      </div>
      <Table table={table} isLoading={users.isLoading} />
    </div>
  );
}
