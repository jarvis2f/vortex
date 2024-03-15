import {
  convertBytes,
  convertBytesToBestUnit,
  findBestByteUnit,
  generateServerKeyPair,
  isTrue,
  isValidHost,
  isValidPort,
  parseJsonQuery,
  wildcard,
} from "./utils";

describe("utils", () => {
  describe("findBestByteUnit", () => {
    it("should find best byte unit correctly", () => {
      expect(findBestByteUnit([1])).toEqual("Bytes");
      expect(findBestByteUnit([1024])).toEqual("Kilobytes");
      expect(findBestByteUnit([1024 * 1024])).toEqual("Megabytes");
      expect(findBestByteUnit([1, 1024, 1024 * 1024])).toEqual("Megabytes");
      expect(findBestByteUnit([1, 1024 * 1024])).toEqual("Megabytes");
    });
  });

  describe("convertBytes", () => {
    it("should convert bytes correctly", () => {
      expect(convertBytes(1024, "Kilobytes", "Bytes")).toEqual(1024 * 1024);
      expect(convertBytes(1024, "Kilobytes", "Megabytes")).toEqual(1);
      expect(convertBytes(1024, "Kilobytes", "Gigabytes")).toEqual(0);
      expect(convertBytes(1024 ** 2, "Kilobytes", "Gigabytes")).toEqual(1);
      expect(convertBytes(1023, "Kilobytes", "Megabytes")).toEqual(1);
    });
  });

  describe("convertBytesToBestUnit", () => {
    it("should convert bytes to best unit correctly", () => {
      expect(convertBytesToBestUnit(1024)).toStrictEqual([1, "KB"]);
      expect(convertBytesToBestUnit(1024 * 1024)).toStrictEqual([1, "MB"]);
      expect(convertBytesToBestUnit(1024 * 1024 * 1024)).toStrictEqual([
        1,
        "GB",
      ]);
    });
  });

  describe("parseJsonQuery", () => {
    it("should parse query correctly", () => {
      expect(parseJsonQuery("a = 1")).toStrictEqual({
        path: ["a"],
        equals: "1",
      });
      expect(parseJsonQuery("a.b.c = 1")).toStrictEqual({
        path: ["a", "b", "c"],
        equals: "1",
      });
      expect(parseJsonQuery("a.b.c != 1")).toStrictEqual({
        path: ["a", "b", "c"],
        not: "1",
      });

      expect(parseJsonQuery("a.b.c like 1")).toStrictEqual({
        path: ["a", "b", "c"],
        string_contains: "1",
      });

      expect(parseJsonQuery("a.b.c like %1")).toStrictEqual({
        path: ["a", "b", "c"],
        string_starts_with: "1",
      });

      expect(parseJsonQuery("a.b.c like 1%")).toStrictEqual({
        path: ["a", "b", "c"],
        string_ends_with: "1",
      });

      expect(parseJsonQuery("a.b[0] < 1")).toStrictEqual({
        path: ["a", "b", "0"],
        lt: "1",
      });
    });

    it("should throw error when query is invalid", () => {
      expect(() => parseJsonQuery("a.b.c")).toThrow("Invalid query syntax");
      expect(() => parseJsonQuery("a.b.c =")).toThrow("Invalid query syntax");
      expect(() => parseJsonQuery("a.b.c = 1 2")).toThrow(
        "Invalid query syntax",
      );
      expect(() => parseJsonQuery("a.b.c = 1 2 3")).toThrow(
        "Invalid query syntax",
      );
      expect(() => parseJsonQuery("a.b.c = 1 2 3 4")).toThrow(
        "Invalid query syntax",
      );
      expect(() => parseJsonQuery("a.b.c = 1 2 3 4 5")).toThrow(
        "Invalid query syntax",
      );
      expect(() => parseJsonQuery("a.b.c = 1 2 3 4 5 6")).toThrow(
        "Invalid query syntax",
      );
    });
  });

  describe("generateServerKeyPair", () => {
    it("should generate key pair correctly", async () => {
      const { serverPrivateKey, serverPublicKey } = generateServerKeyPair();
      expect(serverPrivateKey).toBeTruthy();
      expect(serverPublicKey).toBeTruthy();
    });
  });

  describe("wildcard", () => {
    it("should match wildcard correctly", () => {
      expect(wildcard("foo.*", "foo.bar")).toBe(true);
      expect(wildcard("foo.*", "foo")).toBe(true);
      expect(wildcard("foo/*", "foo", "/")).toBe(true);
      expect(wildcard("foo/*/bar", "foo", "/")).toBe(false);
      expect(wildcard("foo/*/bar", "foo/1/bar", "/")).toBe(true);
      expect(wildcard("a", "a.b")).toBe(false);
      expect(wildcard("foo.**", "foo.bar.baz")).toBe(true);
      expect(wildcard("a.b.*", ["a.b.c", "a.b", "a", "a.b.d"])).toStrictEqual([
        "a.b.d",
        "a.b",
        "a.b.c",
      ]);
      expect(
        wildcard("a.*.c", {
          "a.b.c": {},
          "a.b": {},
          a: {},
          "a.b.d": {},
        }),
      ).toStrictEqual({ "a.b.c": {} });
    });
  });

  describe("isTrue", () => {
    it("should return true for true", () => {
      expect(isTrue("true")).toBe(true);
      expect(isTrue("1")).toBe(true);
      expect(isTrue(true)).toBe(true);
      expect(isTrue(1)).toBe(true);
    });

    it("should return false for false", () => {
      expect(isTrue("false")).toBe(false);
      expect(isTrue("0")).toBe(false);
      expect(isTrue(false)).toBe(false);
      expect(isTrue(0)).toBe(false);
      expect(isTrue(undefined)).toBe(false);
      expect(isTrue(null)).toBe(false);
      expect(isTrue("")).toBe(false);
    });
  });

  describe("isValidHost", () => {
    it("should return true for valid host", () => {
      expect(isValidHost("localhost.com")).toBe(true);
      expect(isValidHost("0.0.0.0")).toBe(true);
      expect(isValidHost("::1")).toBe(true);
    });

    it("should return false for invalid host", () => {
      expect(isValidHost("localhost.com:8080")).toBe(false);
      expect(isValidHost("0.0")).toBe(false);
      expect(isValidHost("0.0.0.0.0")).toBe(false);
    });
  });

  describe("isValidPort", () => {
    it("should return true for valid port", () => {
      expect(isValidPort(1)).toBe(true);
      expect(isValidPort("1")).toBe(true);
      expect(isValidPort(65535)).toBe(true);
    });

    it("should return false for invalid port", () => {
      expect(isValidPort(-1)).toBe(false);
      expect(isValidPort(65536)).toBe(false);
      expect(isValidPort("")).toBe(false);
      expect(isValidPort("1.1")).toBe(false);
    });
  });
});
