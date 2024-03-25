import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center">
        <Image src="/loading.gif" alt="loading" width="30" height="30" />
      </div>
    </div>
  );
}
