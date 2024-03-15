import type { LucideIcon } from "lucide-react";
import { type CONFIG_KEYS } from "~/lib/constants/config";
import type React from "react";
import { type ComponentType } from "react";
import { type ForwardTrafficDimensions } from "../constants";

export interface Menu {
  title: string;
  href?: string;
  icon?: LucideIcon;
  children?: Menu[];
}

export type CONFIG_KEY = (typeof CONFIG_KEYS)[number];

export type CustomComponentRef = {
  beforeSubmit: () => Promise<boolean>;
};

export type CustomComponentProps = {
  value: string;
  onChange: (value: string) => void;
  innerRef?: React.Ref<CustomComponentRef>;
};

export interface ConfigSchema {
  title: string;
  description: string;
  component: "input" | "textarea" | "select" | "switch" | "custom";
  type:
    | "string"
    | "number"
    | "boolean"
    | "json"
    | "markdown"
    | "password"
    | "cron";
  customComponent?: ComponentType<CustomComponentProps>;
  options?: {
    label: string;
    value: string;
  }[];
}

export type LogMessage = (PinoLogMessage | ZapLogMessage) & {
  module: string;
  msg: string;
  level: string | number;
};

export interface PinoLogMessage {
  time: number;
  pid: number;
  hostname: string;
}

export interface ZapLogMessage {
  ts: number;
  caller: string;
}

export type ForwardTrafficDimensions =
  (typeof ForwardTrafficDimensions)[keyof typeof ForwardTrafficDimensions];
