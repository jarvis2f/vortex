import { UserStatus } from "@prisma/client";
import { api } from "~/trpc/react";
import { Switch } from "~/lib/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/lib/ui/tooltip";
import React from "react";

export default function UserStatusSwitch({
  id,
  status,
}: {
  id: string;
  status: UserStatus;
}) {
  const utils = api.useUtils();
  const updateMutation = api.user.updateStatus.useMutation({
    onSuccess: () => {
      void utils.user.getAll.refetch();
    },
  });

  const handleStatusChange = (status: UserStatus) => {
    void updateMutation.mutateAsync({
      id,
      status,
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex">
          <Switch
            checked={status === UserStatus.ACTIVE}
            onCheckedChange={(checked) => {
              handleStatusChange(
                checked ? UserStatus.ACTIVE : UserStatus.BANNED,
              );
            }}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent align="center">
        {status === UserStatus.ACTIVE ? "封禁此用户" : "激活此用户"}
      </TooltipContent>
    </Tooltip>
  );
}
