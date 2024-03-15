import { getServerAuthSession } from "~/server/auth";
import Logo from "~/app/_components/logo";
import Welcome from "~/app/_components/welcome";
import Link from "next/link";

export default async function Home() {
  const session = await getServerAuthSession();

  return (
    <main className="relative flex h-screen w-full items-center justify-center p-4">
      <Logo className="absolute left-6 top-6" />
      <Welcome className="-z-10 h-screen w-screen" />
      <div className="absolute right-6 top-10">
        {session ? (
          <Link href="/dashboard" className="text-2xl underline">
            Dashboard
          </Link>
        ) : (
          <Link href="/auth/signin" className="text-2xl">
            Sign In
          </Link>
        )}
      </div>
    </main>
  );
}
