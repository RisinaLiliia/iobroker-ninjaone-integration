import dotenv from "dotenv";

dotenv.config({ quiet: true });

export interface SystemConnectionConfig {
  baseUrl?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  useMock: boolean;
}

export interface IoBrokerConfig extends SystemConnectionConfig {
  objectFilter: string;
  objectType: string;
  requestTimeoutMs: number;
}

export type NinjaOneDeviceMatchField =
  | "displayName"
  | "systemName"
  | "dnsName"
  | "netbiosName"
  | "uid";

export type NinjaOneWriteMode = "standard" | "custom-fields" | "both";

export interface NinjaOneCustomFieldMapping {
  externalId?: string;
  health?: string;
  ipAddress?: string;
  lastSeenAt?: string;
  metricsJson?: string;
}

export interface NinjaOneConfig extends SystemConnectionConfig {
  requestTimeoutMs: number;
  deviceMatchFields: NinjaOneDeviceMatchField[];
  writeMode: NinjaOneWriteMode;
  standardUserDataPrefix: string;
  oauthScope?: string;
  customFieldMapping: NinjaOneCustomFieldMapping;
}

export interface AppConfig {
  port: number;
  ioBroker: IoBrokerConfig;
  ninjaOne: NinjaOneConfig;
}

const ninjaOneDeviceMatchFieldValues = [
  "displayName",
  "systemName",
  "dnsName",
  "netbiosName",
  "uid",
] as const satisfies readonly NinjaOneDeviceMatchField[];

const ninjaOneWriteModeValues = [
  "standard",
  "custom-fields",
  "both",
] as const satisfies readonly NinjaOneWriteMode[];

function parsePositiveInt(value: string | undefined, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid positive integer value: ${value}`);
  }
  return parsed;
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === "true";
}

function parsePort(value: string | undefined): number {
  if (!value) {
    return 3000;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}

function parseEnum<T extends string>(
  value: string | undefined,
  defaultValue: T,
  allowedValues: readonly T[],
): T {
  if (value === undefined) {
    return defaultValue;
  }

  if (!allowedValues.includes(value as T)) {
    throw new Error(`Invalid value "${value}". Allowed values: ${allowedValues.join(", ")}`);
  }

  return value as T;
}

function parseCsvList(value: string | undefined, defaultValues: string[]): string[] {
  if (value === undefined) {
    return defaultValues;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

export function loadConfig(): AppConfig {
  const ioBrokerMock = parseBoolean(process.env.MOCK_IOBROKER, true);
  const ninjaOneMock = parseBoolean(process.env.MOCK_NINJAONE, true);

  return {
    port: parsePort(process.env.PORT),
    ioBroker: {
      useMock: ioBrokerMock,
      baseUrl: ioBrokerMock ? readOptionalEnv("IOBROKER_BASE_URL") : readRequiredEnv("IOBROKER_BASE_URL"),
      username: readOptionalEnv("IOBROKER_USERNAME"),
      password: readOptionalEnv("IOBROKER_PASSWORD"),
      objectFilter: process.env.IOBROKER_OBJECT_FILTER ?? "*",
      objectType: process.env.IOBROKER_OBJECT_TYPE ?? "device",
      requestTimeoutMs: parsePositiveInt(process.env.IOBROKER_REQUEST_TIMEOUT_MS, 10000),
    },
    ninjaOne: {
      useMock: ninjaOneMock,
      baseUrl: ninjaOneMock ? readOptionalEnv("NINJAONE_BASE_URL") : readRequiredEnv("NINJAONE_BASE_URL"),
      clientId: ninjaOneMock ? readOptionalEnv("NINJAONE_CLIENT_ID") : readRequiredEnv("NINJAONE_CLIENT_ID"),
      clientSecret: ninjaOneMock ? readOptionalEnv("NINJAONE_CLIENT_SECRET") : readRequiredEnv("NINJAONE_CLIENT_SECRET"),
      requestTimeoutMs: parsePositiveInt(process.env.NINJAONE_REQUEST_TIMEOUT_MS, 10000),
      deviceMatchFields: parseCsvList(process.env.NINJAONE_DEVICE_MATCH_FIELDS, [
        "displayName",
        "systemName",
        "dnsName",
      ]).map((field) =>
        parseEnum(field, "displayName", ninjaOneDeviceMatchFieldValues),
      ),
      writeMode: parseEnum(process.env.NINJAONE_WRITE_MODE, "both", ninjaOneWriteModeValues),
      standardUserDataPrefix: process.env.NINJAONE_STANDARD_USERDATA_PREFIX ?? "ioBroker",
      oauthScope: readOptionalEnv("NINJAONE_OAUTH_SCOPE"),
      customFieldMapping: {
        externalId: readOptionalEnv("NINJAONE_CF_EXTERNAL_ID"),
        health: readOptionalEnv("NINJAONE_CF_HEALTH"),
        ipAddress: readOptionalEnv("NINJAONE_CF_IP_ADDRESS"),
        lastSeenAt: readOptionalEnv("NINJAONE_CF_LAST_SEEN_AT"),
        metricsJson: readOptionalEnv("NINJAONE_CF_METRICS_JSON"),
      },
    },
  };
}
