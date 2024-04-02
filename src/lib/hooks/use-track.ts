import { useSession } from "next-auth/react";

export function useTrack() {
  const { data: session } = useSession();
  return {
    track: (event: string, data: Record<string, any>) => {
      if (typeof umami === "undefined") {
        return;
      }
      if (session?.user) {
        umami.track(event, {
          ...data,
          userId: session.user.id,
          userEmail: session.user.email ?? "",
          userName: session.user.name ?? "",
        });
      } else {
        umami.track(event, {
          ...data,
        });
      }
    },
  };
}
