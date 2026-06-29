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

export interface IoBrorerConfig
extends SystemConnectionConfig {
  objectFilter?: string;
  objectType?: string;
  requestTimeout?: number;
}

export interface AppConfig {
  port: number;
  ioBroker: IoBrorerConfig;
  ninjaOne: SystemConnectionConfig;
}

function parserPositiveInt (value: string | undefined, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid positive integer value: ${value}`);
     }
   return defaultValue;
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
      username: ioBrokerMock ? readOptionalEnv("IOBROKER_USERNAME") : readRequiredEnv("IOBROKER_USERNAME"),
      password: ioBrokerMock ? readOptionalEnv("IOBROKER_PASSWORD") : readRequiredEnv("IOBROKER_PASSWORD"),
      objectFilter: process.env.IOBROKER_OBJEKT_FILTER ?? "*",
      objectType: process.env.IOBROKER_OBJEKT_TYPE ??  "device",
      requestTimeout: parserPositiveInt(process.env.IOBROKER_REQUEST_TIMEOUT, 10000),
    },
    ninjaOne: {
      useMock: ninjaOneMock,
      baseUrl: ninjaOneMock ? readOptionalEnv("NINJAONE_BASE_URL") : readRequiredEnv("NINJAONE_BASE_URL"),
      clientId: ninjaOneMock ? readOptionalEnv("NINJAONE_CLIENT_ID") : readRequiredEnv("NINJAONE_CLIENT_ID"),
      clientSecret: ninjaOneMock ? readOptionalEnv("NINJAONE_CLIENT_SECRET") : readRequiredEnv("NINJAONE_CLIENT_SECRET"),
    },
  };
}
