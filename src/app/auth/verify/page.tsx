import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground">
          A sign in link has been sent to your email address.
        </p>
        <Link href="/auth/signin" className="mt-4 underline">
          back to sign in
        </Link>
      </div>
    </div>
  );
}
