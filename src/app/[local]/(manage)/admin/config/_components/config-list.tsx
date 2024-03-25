import { type Config } from "@prisma/client";
import ConfigField from "~/app/[local]/(manage)/admin/config/_components/config-field";
import { type CONFIG_KEY, type ConfigSchema } from "~/lib/types";

export default function ConfigList({
  configs,
  schemaMap,
  relationId = "0",
}: {
  configs: Config[];
  schemaMap: Partial<Record<CONFIG_KEY, ConfigSchema>>;
  relationId?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex w-full flex-col gap-3 md:w-2/3">
        {Object.keys(schemaMap).map((key, index) => {
          const config = configs.find((config) => config.key === key);
          return (
            <ConfigField
              key={index}
              config={
                config ?? {
                  key: key as CONFIG_KEY,
                  value: null,
                  relationId: relationId,
                }
              }
              schema={schemaMap[key as CONFIG_KEY]!}
            />
          );
        })}
      </div>
    </div>
  );
}
