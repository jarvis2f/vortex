"use client";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/lib/ui/avatar";
import { type User } from ".prisma/client";
import { useSession } from "next-auth/react";
import { hasPermission } from "~/lib/constants/permission";
import { useMemo } from "react";

export default function UserColumn({
  user,
}: {
  user: Pick<User, "id" | "image" | "name" | "email">;
}) {
  const { data: session } = useSession();
  const canViewOtherUsers = useMemo(() => {
    return hasPermission(session!, "page:button:viewOtherUsers");
  }, [session]);
  const email = useMemo(() => {
    if (canViewOtherUsers) return user.email;
    if (!user.email) return "";
    const [name, domain] = user.email.split("@");
    const len = name!.length;
    const first = name![0];
    const last = name![len - 1];
    const middle = "*".repeat(len - 2);
    return `${first}${middle}${last}@${domain}`;
  }, [user.email]);

  return (
    <Link
      href={canViewOtherUsers ? `/user/${user.id}` : ""}
      className="block w-min"
    >
      <div className="flex max-w-[12rem] items-center space-x-2 overflow-hidden rounded hover:bg-accent">
        <Avatar>
          <AvatarImage
            src={
              user.image && user.image !== "" ? user.image : "/user-profile.svg"
            }
          />
          <AvatarFallback>
            {user.name
              ?.split(" ")
              .map((name) => name[0])
              .join("") ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>
    </Link>
  );
}
