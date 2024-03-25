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
import { type PaymentGetAllOutput } from "~/lib/types/trpc";
import { Button } from "~/lib/ui/button";
import { MoreHorizontalIcon, XIcon } from "lucide-react";
import { DataTableViewOptions } from "~/app/[local]/_components/table-view-options";
import ID from "~/app/[local]/_components/id";
import UserColumn from "~/app/[local]/_components/user-column";
import { MoneyInput } from "~/lib/ui/money-input";
import { TableFacetedFilter } from "~/app/[local]/_components/table-faceted-filter";
import { PaymentStatusOptions } from "~/lib/constants";
import { type $Enums } from ".prisma/client";
import { cn, formatDate } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/lib/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "~/lib/ui/dialog";
import { Badge } from "~/lib/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/lib/ui/accordion";
import PaymentInfo from "~/app/[local]/(manage)/admin/config/_components/payment-info";

type PaymentStatus = $Enums.PaymentStatus;

interface PaymentTableProps {
  page?: number;
  size?: number;
  keyword?: string;
  filters?: string;
}

export default function PaymentTable({
  page,
  size,
  keyword: initialKeyword,
  filters,
}: PaymentTableProps) {
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

  const payments = api.payment.getAll.useQuery({
    page: pageIndex,
    size: pageSize,
    keyword: keyword,
    status: columnFilters.find((filter) => filter.id === "status")
      ?.value as PaymentStatus[],
  });

  const columns: ColumnDef<PaymentGetAllOutput>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        return <ID id={row.original.id} createdAt={row.original.createdAt} />;
      },
    },
    {
      accessorKey: "targetAmount",
      header: "充值金额",
      cell: ({ row }) => {
        return (
          <MoneyInput
            className="text-sm"
            displayType="text"
            value={String(row.original.targetAmount)}
          />
        );
      },
    },
    {
      accessorKey: "amount",
      header: "到账金额",
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
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        return <PaymentStatusBadge status={row.original.status} />;
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
        if (!row.original.paymentInfo && !row.original.callback) {
          return null;
        }
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
            <DropdownMenuContent>
              <PaymentInfoDialog paymentInfo={row.original.paymentInfo} />
              <PaymentCallbackDialog callback={row.original.callback} />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    columns,
    data: payments.data?.payments ?? [],
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil((payments.data?.total ?? 0) / 10),
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
            placeholder="ID/用户ID/信息"
            value={keyword ?? ""}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setKeyword(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
          <TableFacetedFilter
            column={table.getColumn("status")}
            title="状态"
            options={PaymentStatusOptions}
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
      <Table table={table} isLoading={payments.isLoading} />
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "text-primary-background rounded bg-primary-foreground px-2 py-1 text-xs",
        status === "SUCCEEDED" && "bg-green-500/80 text-white",
        status === "FAILED" && "bg-red-500/80 text-white",
      )}
    >
      {status}
    </span>
  );
}

function PaymentInfoDialog({ paymentInfo }: { paymentInfo: any }) {
  if (!paymentInfo) {
    return null;
  }
  return (
    <Dialog modal={true}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(e) => e.preventDefault()}
        >
          Payment Info
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent
        className="h-full w-full max-w-none overflow-y-auto md:h-auto md:w-2/3"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <PaymentInfo paymentInfo={paymentInfo} />
      </DialogContent>
    </Dialog>
  );
}

function PaymentCallbackDialog({ callback }: { callback: any }) {
  if (!callback) {
    return null;
  }
  return (
    <Dialog modal={true}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(e) => e.preventDefault()}
        >
          Events
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent
        className="h-full w-full max-w-none overflow-y-auto md:h-auto md:w-2/3"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <Accordion type="single" collapsible className="w-full">
          {callback.map((event: any, index: number) => {
            return (
              <AccordionItem value={`callback_${index}`}>
                <AccordionTrigger className="flex items-center">
                  <div className="w-[100px] text-left">
                    <Badge className="rounded-md px-2 py-1 text-white">
                      {event.status}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">
                    {formatDate(new Date(event.created_at as string))}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <PaymentInfo paymentInfo={event} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}
