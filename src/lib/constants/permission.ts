import { Role } from "@prisma/client";
import { wildcard } from "~/lib/utils";

export const PERMISSIONS: Record<string, Role[]> = {
  // data permission
  "data:agent": [Role.ADMIN],
  "data:forward": [Role.ADMIN],
  "data:network": [Role.ADMIN],
  "data:wallet": [Role.ADMIN],
  "data:user": [Role.ADMIN],
  "data:payment": [Role.ADMIN],
  "data:ticket": [Role.ADMIN],

  // trpc router permission
  "router:user:getAll": [Role.ADMIN],
  "router:user:updateStatus": [Role.ADMIN],
  "router:user:updateRoles": [Role.ADMIN],
  "router:user:updateBalance": [Role.ADMIN],
  "router:rechargeCode:getAll": [Role.ADMIN],
  "router:rechargeCode:create": [Role.ADMIN],
  "router:rechargeCode:delete": [Role.ADMIN],
  "router:agent:create": [Role.AGENT_PROVIDER],
  "router:agent:update": [Role.AGENT_PROVIDER],
  "router:payment:getAll": [Role.ADMIN],
  "router:withdrawal:getAll": [Role.ADMIN],
  "router:withdrawal:create": [Role.AGENT_PROVIDER],
  "router:withdrawal:updateStatus": [Role.ADMIN],

  // page permission
  "page:/dashboard": [Role.USER],
  "page:/forward": [Role.USER],
  "page:/agent/*/config": [Role.AGENT_PROVIDER],
  "page:/agent/*/forward": [Role.AGENT_PROVIDER],
  "page:/agent/*/install": [Role.AGENT_PROVIDER],
  "page:/agent/*/log": [Role.AGENT_PROVIDER],
  "page:/network": [Role.USER],
  "page:/user/*": [Role.USER],
  "page:/admin/users": [Role.ADMIN],
  "page:/admin/log": [Role.ADMIN],
  "page:/admin/config/*": [Role.ADMIN],
  [`page:${process.env.NEXT_PUBLIC_UMAMI_URL ?? "/not-found"}`]: [Role.ADMIN],

  // page element permission
  "page:button:addAgent": [Role.AGENT_PROVIDER],
  "page:button:updateBalance": [Role.ADMIN],
  "page:button:viewOtherUsers": [Role.ADMIN],
};

export function hasPermission(
  session: { user: { roles: Role[] } },
  permission: keyof typeof PERMISSIONS,
) {
  const roles = session.user.roles;
  let needRoles: Role[] | undefined = PERMISSIONS[permission];
  if (permission.startsWith("page:")) {
    for (const [key, value] of Object.entries(PERMISSIONS)) {
      if (!key.startsWith("page:")) {
        continue;
      }
      if (wildcard(key.substring(5), permission.substring(5), "/")) {
        needRoles = value;
        break;
      }
    }
  }
  if (!needRoles) {
    return true;
  }
  return needRoles.some((r) => roles.includes(r));
}
