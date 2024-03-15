import { encryptPassword, generateSalt, getUserMust } from "./user";
import { dbMock } from "../../../test/jest.setup";

describe("User", () => {
  it("should generate a salt", () => {
    const salt = generateSalt();
    expect(salt).toHaveLength(32);
  });

  it("should encrypt a password", () => {
    const password = "password";
    const salt = "890ed0f8d5f5f741cc22ea34f4aa7d6d";
    const encryptedPassword = encryptPassword(password, salt);
    expect(encryptedPassword).not.toEqual(password);
    expect(encryptedPassword).toHaveLength(1024);
  });

  it("should throw an error if user is not found", async () => {
    dbMock.user.findUnique.mockResolvedValue(null);
    const id = "mockUserId";
    await expect(getUserMust(id)).rejects.toThrow(`User ${id} not found`);
  });
});
