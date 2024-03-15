import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { normalizeUrl } from "next/dist/build/webpack/loaders/css-loader/src/utils";
import { toast } from "~/lib/ui/use-toast";
import { type ReactFlowStore } from "reactflow";
import { Prisma } from ".prisma/client";
import crypto from "crypto";
import { Regexps } from "~/lib/constants";
import { Decimal } from "decimal.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import JsonFilterBase = Prisma.JsonFilterBase;

dayjs.extend(relativeTime);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function comparePath(path: string, target: string) {
  path = normalizeUrl(path, true);
  return path.startsWith(target);
}

export function copyToClipboard(text: string) {
  if (!document) return;
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
    toast({
      description: "已复制到剪贴板",
    });
  } catch (err) {
    console.error("Unable to copy to clipboard", err);
  }
  document.body.removeChild(textArea);
}

export const BYTE_UNITS = {
  Bytes: 1,
  Kilobytes: 1024,
  Megabytes: 1024 ** 2,
  Gigabytes: 1024 ** 3,
  Terabytes: 1024 ** 4,
  Petabytes: 1024 ** 5,
};

export const ByteUnitsShort = {
  Bytes: "B",
  Kilobytes: "KB",
  Megabytes: "MB",
  Gigabytes: "GB",
  Terabytes: "TB",
  Petabytes: "PB",
};

export type ByteUnit = keyof typeof BYTE_UNITS;
const BYTE_UNITS_KEYS = Object.keys(BYTE_UNITS) as ByteUnit[];

export function findBestByteUnit(byteArray: number[]): ByteUnit {
  let bestByteUnit: ByteUnit = "Bytes";
  const maxByte = Math.max(...byteArray);
  for (const byteUnit of BYTE_UNITS_KEYS) {
    if (maxByte >= BYTE_UNITS[byteUnit]) {
      bestByteUnit = byteUnit;
    } else {
      break;
    }
  }
  return bestByteUnit;
}

export function convertBytes(
  value: number,
  from: ByteUnit,
  to: ByteUnit,
): number {
  return Number(
    new Decimal(value).mul(BYTE_UNITS[from]).div(BYTE_UNITS[to]).toFixed(2),
  );
}

export function convertBytesToBestUnit(value: number): [number, string] {
  const bestUnit = findBestByteUnit([value]);
  return [convertBytes(value, "Bytes", bestUnit), ByteUnitsShort[bestUnit]];
}

export function formatDate(date: Date | number) {
  if (typeof date === "number") {
    date = new Date(date);
  }
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
}

export function uuid() {
  return Math.random().toString(36).substring(2);
}

export function getNewNodePosition(flowStore: ReactFlowStore) {
  const {
    height,
    width,
    transform: [transformX, transformY, zoomLevel],
  } = flowStore;

  const zoomMultiplier = 1 / zoomLevel;

  const centerX = -transformX * zoomMultiplier + (width * zoomMultiplier) / 2;
  const centerY = -transformY * zoomMultiplier + (height * zoomMultiplier) / 2;

  return {
    x: centerX,
    y: centerY,
  };
}

const operatorMapping: Record<string, keyof JsonFilterBase> = {
  "=": "equals",
  "!=": "not",
  like: "string_contains",
  "<": "lt",
  "<=": "lte",
  ">": "gt",
  ">=": "gte",
};

export function parseJsonQuery(query: string): JsonFilterBase | undefined {
  const parts = query.split(" ");
  if (parts.length !== 3) {
    throw new Error("Invalid query syntax");
  }
  const paths = parts[0]!.trim();
  const op = parts[1]!.trim();
  let value = parts[2]!.trim();

  let key: keyof JsonFilterBase | undefined = operatorMapping[op];
  if (op === "like") {
    if (value.startsWith("%") && value.endsWith("%")) {
      value = value.slice(1, -1);
    } else if (value.startsWith("%")) {
      key = "string_starts_with";
      value = value.slice(1);
    } else if (value.endsWith("%")) {
      key = "string_ends_with";
      value = value.slice(0, -1);
    }
  }

  if (!key) {
    throw new Error("Invalid operator");
  }

  return {
    path: paths.split(".").flatMap((part) => {
      if (part.includes("[") && part.includes("]")) {
        const [key, index] = part.split("[");
        return [key!, index!.slice(0, -1)];
      } else {
        return part;
      }
    }),
    [key]: value,
  };
}

export function encrypt({ data, key }: { data: any; key: string }) {
  const dataStr = JSON.stringify(data);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    key.slice(0, 32),
    key.slice(32, 48),
  );
  const encrypted = Buffer.concat([
    cipher.update(dataStr, "utf8"),
    cipher.final(),
  ]);
  return encrypted.toString("hex");
}

export async function validateSignature({
  payload,
  signature,
  secret,
}: {
  payload: any;
  signature: string;
  secret: string;
}) {
  try {
    const computedSignature = await generateSignature(payload, secret);
    return computedSignature === signature;
  } catch (error) {
    console.error("Signature validation error:", error);
    return false;
  }
}

export async function generateSignature(payload: any, secret: string) {
  const hmac = crypto.createHmac("sha256", secret);
  return hmac.update(JSON.stringify(payload)).digest("hex");
}

export function generateServerKeyPair() {
  const ecdh = crypto.createECDH("prime256v1");
  const publicKey = ecdh.generateKeys("hex");
  return {
    serverPrivateKey: ecdh.getPrivateKey("hex"),
    serverPublicKey: publicKey,
  };
}

const REGEXP_PARTS = /([*?])/g;

class WildcardMatcher {
  private readonly text: string;
  private readonly hasWild: boolean;
  private readonly separator: RegExp | string;
  private readonly parts: Array<string | RegExp>;

  constructor(text: string, separator: RegExp | string) {
    this.text = text || "";
    this.hasWild = text.indexOf("*") >= 0;
    this.separator = separator;
    this.parts = text.split(separator).map(this.classifyPart.bind(this));
  }

  public match(
    input: string | string[] | Record<string, any>,
  ): boolean | string[] | Record<string, any> {
    let matches: any = true;
    const parts = this.parts;
    const partsCount = parts.length;
    let testParts: string[];

    if (typeof input === "string" || input instanceof String) {
      if (!this.hasWild && this.text != input) {
        matches = false;
      } else {
        testParts = (input || "").split(this.separator as string);
        for (let ii = 0; matches && ii < partsCount; ii++) {
          if (parts[ii] === "*") {
          } else if (ii < testParts.length) {
            matches =
              parts[ii] instanceof RegExp
                ? (parts[ii] as RegExp).test(testParts[ii]!)
                : parts[ii] === testParts[ii];
          } else {
            matches = false;
          }
        }
      }
    } else if (Array.isArray(input)) {
      matches = [];

      for (let ii = input.length; ii--; ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if (this.match(input[ii])) {
          matches.push(input[ii]);
        }
      }
    } else if (typeof input === "object") {
      matches = {};

      for (const key in input) {
        if (this.match(key)) {
          matches[key] = input[key];
        }
      }
    }

    return matches;
  }

  private classifyPart(part: string): string | RegExp {
    // in the event that we have been provided a part that is not just a wildcard
    // then turn this into a regular expression for matching purposes
    if (part === "*") {
      return part;
    } else if (part.indexOf("*") >= 0 || part.indexOf("?") >= 0) {
      return new RegExp(part.replace(REGEXP_PARTS, ".$1"));
    }

    return part;
  }
}

export function wildcard(
  text: string,
  test: string | string[] | Record<string, any>,
  separator?: RegExp | string,
): boolean | string[] | Record<string, any> {
  const matcher = new WildcardMatcher(text, separator ?? /[\/.]/);
  return matcher.match(test);
}

export function isBase64(str: string) {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
}

export function isJson(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch (err) {
    return false;
  }
}

export function isTrue(value: any) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export function isValidHost(value: any) {
  return (
    typeof value === "string" &&
    (Regexps.ipv4.test(value) ||
      Regexps.ipv6.test(value) ||
      Regexps.domain.test(value))
  );
}

export function isIpv4(value: any) {
  return typeof value === "string" && Regexps.ipv4.test(value);
}

export function isIpv6(value: any) {
  return typeof value === "string" && Regexps.ipv6.test(value);
}

export function isDomain(value: any) {
  return typeof value === "string" && Regexps.domain.test(value);
}

export function isValidPort(value: any, min = 1, max = 65535) {
  value = Number(value);
  return Number.isInteger(value) && value >= min && value <= max;
}
