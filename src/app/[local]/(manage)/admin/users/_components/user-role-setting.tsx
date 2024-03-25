import { useState } from "react";
import { Role } from "@prisma/client";
import { api } from "~/trpc/react";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "~/lib/ui/command";
import { Check } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "~/lib/ui/dropdown-menu";

export default function UserRoleSettings({
  id,
  roles: originRoles,
}: {
  id: string;
  roles: Role[];
}) {
  const utils = api.useUtils();
  const [roles, setRoles] = useState(originRoles ?? []);
  const updateRolesMutation = api.user.updateRoles.useMutation({
    onSuccess: () => {
      void utils.user.getAll.refetch();
    },
  });

  function handleUpdateRoles() {
    void updateRolesMutation.mutateAsync({
      id,
      roles,
    });
  }

  return (
    <DropdownMenuSub onOpenChange={(open) => !open && handleUpdateRoles()}>
      <DropdownMenuSubTrigger
        className="cursor-pointer"
        onSelect={(e) => e.preventDefault()}
      >
        修改角色
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <Command>
          <CommandList>
            <CommandGroup heading={"修改之后需重新登录"}>
              {Object.values(Role as object).map((role: Role) => (
                <CommandItem
                  key={role}
                  value={role}
                  onSelect={(value) => {
                    const r = Role[value.toUpperCase() as keyof typeof Role];
                    if (roles.includes(r)) {
                      setRoles(roles.filter((role) => role !== r));
                    } else {
                      setRoles([...roles, r]);
                    }
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      roles.includes(role) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {role}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
