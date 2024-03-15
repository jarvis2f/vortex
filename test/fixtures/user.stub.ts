import { User } from ".prisma/client";

export const userStub = {
  user: Object.freeze<User>({
    id: "user-id",
    name: "user",
    email: "email",
    emailVerified: new Date(),
    password: "password",
    passwordSalt: "passwordSalt",
    image: "image",
    roles: [],
    createdAt: new Date(),
    status: "ACTIVE",
  }),
};
