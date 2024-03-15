import Image from "next/image";
import { cn } from "~/lib/utils";

interface SearchEmptyStateProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function SearchEmptyState({
  width,
  height,
  className,
}: SearchEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center",
        className,
      )}
    >
      <Image
        src="/casual-life-3d-boy-with-magnifier-in-hand.png"
        alt="No results found"
        width={width ?? 200}
        height={height ?? 200}
      />
      <h2 className="mt-4 text-center text-2xl text-gray-500">
        It looks like there are no results for your search. <br />
      </h2>
    </div>
  );
}
