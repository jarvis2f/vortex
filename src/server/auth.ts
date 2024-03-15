import { PrismaAdapter } from "@next-auth/prisma-adapter";
import {
  type DefaultSession,
  type DefaultUser,
  getServerSession,
  type NextAuthOptions,
} from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import { env } from "~/env";
import { db } from "~/server/db";
import { encryptPassword } from "~/server/core/user";
import { Role } from "@prisma/client";
import { UserStatus } from ".prisma/client";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      status: UserStatus;
      roles: Role[];
      isSetupPassword: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    status: UserStatus;
    roles: Role[];
    password: string | null;
  }
}

/**
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    verifyRequest: "/auth/verify",
    newUser: "/auth/new",
    error: "/auth/error",
  },
  callbacks: {
    signIn: async ({ user }) => {
      if (user.status === UserStatus.BANNED) {
        return "/auth/error?error=UserBanned";
      }
      return true;
    },
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.roles = user.roles;
        token.status = user.status;
        token.isSetupPassword = !!user.password;
      }
      if (trigger === "signUp" && user && !user.roles.includes(Role.ADMIN)) {
        const count = await db.user.count();
        if (count === 1) {
          await db.user.update({
            where: {
              id: user.id,
            },
            data: {
              roles: {
                push: [Role.ADMIN],
              },
            },
          });
          token.roles = [...user.roles, Role.ADMIN];
        }
      }
      return {
        ...token,
      };
    },
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          roles: token.roles,
          status: token.status,
          isSetupPassword: token.isSetupPassword,
        },
      };
    },
  },
  session: {
    strategy: "jwt",
  },
  adapter: PrismaAdapter(db),
  providers: [
    EmailProvider({
      server: env.EMAIL_SERVER,
      from: env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.username,
          },
        });
        const password = encryptPassword(
          credentials.password,
          user?.passwordSalt ?? "",
        );

        if (user && user.password === password) {
          return user;
        } else {
          return null;
        }
      },
    }),
  ],
};

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  authOptions.providers.push(
    GithubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
  );
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  authOptions.providers.push(
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const getServerAuthSession = () => getServerSession(authOptions);
