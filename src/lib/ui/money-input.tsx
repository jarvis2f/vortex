"use client";
import * as React from "react";
import { cn } from "~/lib/utils";
import { inputClass } from "~/lib/ui/input";
import { type NumberFormatBaseProps, NumericFormat } from "react-number-format";

type MoneyInputProps = NumberFormatBaseProps;

const MoneyInput = React.forwardRef<
  React.ElementRef<
    React.ForwardRefExoticComponent<
      MoneyInputProps & React.RefAttributes<HTMLInputElement>
    >
  >,
  MoneyInputProps
>(({ className, ...props }, ref) => (
  <NumericFormat
    {...props}
    getInputRef={ref}
    prefix={"$"}
    decimalScale={6}
    className={cn(
      props.displayType === "text" ? "text-3xl font-semibold" : inputClass,
      className,
    )}
  />
));
MoneyInput.displayName = "MoneyInput";

export { MoneyInput };
