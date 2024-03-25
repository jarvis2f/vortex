import Image from "next/image";
import { cn } from "~/lib/utils";

export default function Logo({
  className,
  isCollapsed = false,
}: {
  className?: string;
  isCollapsed?: boolean;
}) {
  return (
    <div className={cn("flex items-center", className)}>
      <Image src="/logo-3d.png" alt="logo" height={80} width={80} />
      {!isCollapsed && <span className="-ml-5 text-2xl font-bold">vortex</span>}
    </div>
  );
}
