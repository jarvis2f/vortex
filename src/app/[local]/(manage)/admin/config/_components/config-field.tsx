"use client";
import { Suspense, useRef, useState } from "react";
import { api } from "~/trpc/react";
import {
  type CONFIG_KEY,
  type ConfigSchema,
  type CustomComponentRef,
} from "~/lib/types";
import { Input } from "~/lib/ui/input";
import { Button } from "~/lib/ui/button";
import type { Config } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/lib/ui/select";
import { Switch } from "~/lib/ui/switch";
import { CONFIG_DEFAULT_VALUE_MAP } from "~/lib/constants/config";
import CodeInputDialog from "~/app/[local]/(manage)/admin/config/_components/code-input-dialog";
import { isTrue } from "~/lib/utils";
import { useTrack } from "~/lib/hooks/use-track";

export default function ConfigField({
  config,
  schema,
}: {
  config: Omit<Config, "id">;
  schema: ConfigSchema;
}) {
  const [value, setValue] = useState(
    config.value
      ? config.value
      : CONFIG_DEFAULT_VALUE_MAP[config.key as CONFIG_KEY],
  );
  const fieldRef = useRef<CustomComponentRef>(null);
  const setConfig = api.system.setConfig.useMutation();
  const { track } = useTrack();

  async function handleConfigChange() {
    if (schema.component === "custom" && fieldRef.current) {
      const result = await fieldRef.current.beforeSubmit();
      if (!result) return;
    }
    track("config-change-button", {
      key: config.key,
      value: String(value),
      relationId: config.relationId,
    });
    await setConfig.mutateAsync({
      key: config.key as CONFIG_KEY,
      value: String(value),
      relationId: config.relationId,
    });
  }

  function renderSwitch() {
    return (
      <Switch checked={isTrue(value)} onCheckedChange={(e) => setValue(e)} />
    );
  }

  function getComponent() {
    switch (schema.component) {
      case "input":
        return renderInput();
      case "textarea":
        return renderTextarea();
      case "select":
        return renderSelect();
      case "switch":
        return renderSwitch();
      case "custom":
        if (schema.customComponent) {
          return (
            <Suspense fallback={<div>Loading...</div>}>
              <schema.customComponent
                innerRef={fieldRef}
                value={value ? String(value) : ""}
                onChange={(value) => setValue(value)}
              />
            </Suspense>
          );
        }
        return (
          <div className="text-red-500">
            Custom component not configured for {schema.title}
          </div>
        );
      default:
        return (
          <div className="text-red-500">
            Unknown component {schema.component}
          </div>
        );
    }
  }

  function renderInput() {
    return (
      <Input
        type="text"
        value={String(value ?? "")}
        onChange={(e) => setValue(e.currentTarget.value)}
      />
    );
  }

  function renderTextarea() {
    return schema.type === "json" || schema.type === "markdown" ? (
      <CodeInputDialog
        title={schema.title}
        value={String(value ?? "")}
        onChange={setValue}
        language={schema.type}
      />
    ) : (
      <textarea
        className="w-full rounded border p-2 text-sm"
        value={String(value ?? "")}
        onChange={(e) => setValue(e.currentTarget.value)}
      />
    );
  }

  function renderSelect() {
    return (
      <Select value={String(value)} onValueChange={setValue}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {schema.options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="border-error/40 rounded border p-4 hover:bg-accent">
      <h3 className="mb-2 text-lg">{schema.title}</h3>
      <p className="mb-2 text-sm text-gray-500">{schema.description}</p>
      <div className="flex items-end justify-between gap-3">
        {getComponent()}
        <Button
          onClick={() => handleConfigChange()}
          disabled={config.value === value}
          loading={setConfig.isLoading}
          success={setConfig.isSuccess}
        >
          保存
        </Button>
      </div>
    </div>
  );
}
