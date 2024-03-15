"use client";
import { GithubIcon, LogOutIcon, UserIcon, WalletIcon } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "~/lib/ui/button";
import { cn, comparePath } from "~/lib/utils";
import { usePathname } from "next/navigation";
import { ThemeChange } from "~/app/_components/theme-provider";
import Logo from "~/app/_components/logo";
import { type Menu } from "~/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/lib/ui/tooltip";
import { type CSSProperties, Fragment, type ReactNode } from "react";
import { Separator } from "~/lib/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/lib/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/lib/ui/avatar";
import { useSession } from "next-auth/react";
import { env } from "~/env";

interface MenuProps {
  menus: Menu[];
  isCollapsed?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function Menu({
  menus,
  isCollapsed = false,
  className,
  style,
}: MenuProps) {
  const pathName = usePathname();

  const menusWithActive = menus.map((menu) => {
    return {
      ...menu,
      active: menu.href ? false : comparePath(pathName, menu.href!),
    };
  });

  const renderCollapsedMenu = (menu: Menu, index: number): ReactNode => {
    if (menu.href) {
      const active = comparePath(pathName, menu.href);
      return (
        <Tooltip key={index} delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              href={menu.href}
              target={menu.href.startsWith("http") ? "_blank" : undefined}
              className={cn(
                buttonVariants({
                  variant: active ? "default" : "ghost",
                  size: "icon",
                }),
                "h-9 w-9",
                active &&
                  "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white",
              )}
            >
              {menu.icon && <menu.icon className="h-4 w-4" />}
              <span className="sr-only">{menu.title}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-4">
            {menu.title}
          </TooltipContent>
        </Tooltip>
      );
    }
    return (
      <Fragment key={index}>
        <Separator orientation="horizontal" />
        {menu.children?.map((child, index) => {
          return renderCollapsedMenu(child, index);
        })}
      </Fragment>
    );
  };

  const renderMenu = (menu: Menu, index: number): ReactNode => {
    if (menu.href) {
      const active = comparePath(pathName, menu.href);
      return (
        <Link
          key={index}
          href={menu.href}
          target={menu.href.startsWith("http") ? "_blank" : undefined}
          className={cn(
            buttonVariants({
              variant: active ? "default" : "ghost",
              size: "sm",
            }),
            active &&
              "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white",
            "justify-start",
          )}
        >
          {menu.icon && <menu.icon className="mr-2 h-4 w-4" />}
          {menu.title}
        </Link>
      );
    }
    return (
      <Fragment key={index}>
        <label className="block py-2 text-xs">{menu.title}</label>
        {menu.children?.map((child, index) => {
          return renderMenu(child, index);
        })}
      </Fragment>
    );
  };

  return (
    <div
      data-collapsed={isCollapsed}
      style={style}
      className={cn(
        "group fixed z-10 flex h-full flex-col justify-between gap-4 overflow-x-hidden py-2 data-[collapsed=true]:py-2",
        className,
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex h-16 items-center justify-center">
          <Logo isCollapsed={isCollapsed} />
        </div>

        <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
          {menusWithActive.map((menu, index) =>
            isCollapsed
              ? renderCollapsedMenu(menu, index)
              : renderMenu(menu, index),
          )}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-3 py-2">
        <UserProfile isCollapsed={isCollapsed} />
        <ThemeChange />
        {!isCollapsed && <Version />}
      </div>
    </div>
  );
}

function UserProfile({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { data: session } = useSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={
                session?.user.image && session?.user.image !== ""
                  ? session?.user.image
                  : "/user-profile.svg"
              }
            />
            <AvatarFallback>
              {session?.user.name
                ?.split(" ")
                .map((name) => name[0])
                .join("") ?? "U"}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <span className="text-sm">
              {session?.user?.name ?? session?.user?.email}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="top">
        <DropdownMenuItem className="cursor-pointer">
          <Link
            href={`/user/${session?.user.id}`}
            className="flex w-full items-center"
          >
            <UserIcon size={16} />
            <span className="ml-3 text-sm">个人中心</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Link
            href={`/user/${session?.user.id}/balance`}
            className="flex w-full items-center"
          >
            <WalletIcon size={16} />
            <span className="ml-3 text-sm">余额</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/auth/signout" className="flex w-full items-center">
            <LogOutIcon size={16} />
            <span className="ml-3 text-sm">退出</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Version() {
  return (
    <div className="min-w-[120px] cursor-pointer overflow-hidden rounded bg-accent p-2 text-xs text-muted-foreground">
      <Link
        href="https://github.com/jarvis2f/vortex"
        target="_blank"
        className="flex gap-1 whitespace-nowrap break-normal"
      >
        <GithubIcon className="h-4 w-4" />v{env.NEXT_PUBLIC_VERSION}
      </Link>
    </div>
  );
}
