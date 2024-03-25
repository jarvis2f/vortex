import * as React from "react";
import { type Column } from "@tanstack/react-table";
import { FacetedFilter } from "~/app/[local]/_components/faceted-filter";

interface TableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

export function TableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: TableFacetedFilterProps<TData, TValue>) {
  const selectedValues = new Set(column?.getFilterValue() as string[]);

  return (
    <FacetedFilter
      title={title}
      options={options}
      value={selectedValues}
      onChange={(value) => {
        const filterValues = value ? Array.from(value) : undefined;
        column?.setFilterValue(filterValues?.length ? filterValues : undefined);
      }}
    />
  );
}
