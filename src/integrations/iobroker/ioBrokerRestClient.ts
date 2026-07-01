import { IoBrokerConfig } from "../../config/env";
import { DeviceHealth, DeviceMetric, NormalizedDevice } from "../../domain/device";
import { IoBrokerClient } from "./IoBrokerClient";

type Primitive = string | number | boolean | null;

interface IoBrokerObject {
  _id: string;
  type: string;
  common?: {
    name?: string | Record<string, string>;
    role?: string;
    unit?: string;
  };
}

interface IoBrokerStateResponse {
  val?: unknown;
  ts?: number;
  lc?: number;
  ack?: boolean;
  from?: string;
}

export class IoBrokerRestClient implements IoBrokerClient {
  constructor(private readonly config: IoBrokerConfig) {}

  async listDevices(): Promise<NormalizedDevice[]> {
    const filter = encodeURIComponent(this.config.objectFilter);
    const type = encodeURIComponent(this.config.objectType);
    const response = await this.fetchJson<Record<string, IoBrokerObject>>(
      `/v1/objects?filter=${filter}&type=${type}`,
    );

    const devices = Object.entries(response).map(([id, device]) => ({
      ...device,
      _id: device._id ?? id,
    }));

    return Promise.all(devices.map((device) => this.normalizeDevice(device)));
  }

  private async normalizeDevice(device: IoBrokerObject): Promise<NormalizedDevice> {
    const stateObjectsResponse = await this.fetchJson<Record<string, IoBrokerObject>>(
      `/v1/objects?filter=${encodeURIComponent(`${device._id}.*`)}&type=state`,
    );
    const stateValuesResponse = await this.fetchJson<Record<string, IoBrokerStateResponse>>(
      `/v1/states?filter=${encodeURIComponent(`${device._id}.*`)}`,
    );

    const stateObjects = Object.entries(stateObjectsResponse)
      .map(([id, stateObject]) => ({
        ...stateObject,
        _id: stateObject._id ?? id,
      }))
      .filter((stateObject) => stateObject.type === "state");

    const stateValueEntries = Object.entries(stateValuesResponse).map(([id, state]) => [
      id,
      state?.val,
    ]) as Array<readonly [string, unknown]>;

    const stateMap = new Map<string, unknown>(stateValueEntries);
    const stateResponseMap = new Map<string, IoBrokerStateResponse>(Object.entries(stateValuesResponse));

    return {
      externalId: device._id,
      name: this.readableName(device.common?.name) ?? device._id,
      health: this.resolveHealth(device._id, stateMap),
      ipAddress: this.resolveIpAddress(device._id, stateMap),
      lastSeenAt: this.resolveLastSeen(device._id, stateResponseMap),
      metrics: this.buildMetrics(device._id, stateObjects, stateMap),
      raw: {
        device,
        stateObjects,
        states: stateValuesResponse,
      },
    };
  }

  private buildMetrics(
    deviceId: string,
    stateObjects: IoBrokerObject[],
    stateMap: Map<string, unknown>,
  ): DeviceMetric[] {
    return stateObjects
      .map((stateObj): DeviceMetric | null => {
        const value = this.toPrimitive(stateMap.get(stateObj._id));
        if (value === undefined) {
          return null;
        }

        return {
          key: stateObj._id.replace(`${deviceId}.`, ""),
          value,
          unit: stateObj.common?.unit,
        };
      })
      .filter((metric): metric is DeviceMetric => metric !== null);
  }

  private resolveHealth(deviceId: string, stateMap: Map<string, unknown>): DeviceHealth {
    const value = this.findValue(deviceId, stateMap, [
      "info.connected",
      "alive",
      "connected",
      "reachable",
      "online",
      "available",
    ]);

    if (typeof value === "boolean") {
      return value ? "online" : "offline";
    }

    if (typeof value === "string") {
      const normalized = value.toLowerCase();
      if (["true", "1", "online", "connected", "alive", "available"].includes(normalized)) {
        return "online";
      }
      if (["false", "0", "offline", "disconnected", "unavailable"].includes(normalized)) {
        return "offline";
      }
    }

    return "unknown";
  }

  private resolveIpAddress(deviceId: string, stateMap: Map<string, unknown>): string | undefined {
    const value = this.findValue(deviceId, stateMap, [
      "info.ip",
      "info.ipAddress",
      "ip",
      "ipAddress",
      "localIp",
      "network.ip",
    ]);

    return typeof value === "string" ? value : undefined;
  }

  private resolveLastSeen(
    deviceId: string,
    stateMap: Map<string, IoBrokerStateResponse>,
  ): string | undefined {
    const explicitLastSeen = this.findState(deviceId, stateMap, [
      "lastSeen",
      "last_seen",
      "heartbeat",
    ]);

    const explicitValue = this.toPrimitive(explicitLastSeen?.val);
    if (typeof explicitValue === "string" && explicitValue.trim().length > 0) {
      return explicitValue;
    }
    if (typeof explicitValue === "number") {
      return new Date(explicitValue).toISOString();
    }

    const newestTimestamp = Array.from(stateMap.values())
      .flatMap((state) => [state.lc, state.ts])
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
      .sort((left, right) => right - left)[0];

    return newestTimestamp ? new Date(newestTimestamp).toISOString() : undefined;
  }

  private findValue(
    deviceId: string,
    stateMap: Map<string, unknown>,
    suffixes: string[],
  ): Primitive | undefined {
    for (const [stateId, value] of stateMap.entries()) {
      if (this.matchesAnySuffix(stateId, deviceId, suffixes)) {
        return this.toPrimitive(value);
      }
    }

    return undefined;
  }

  private findState(
    deviceId: string,
    stateMap: Map<string, IoBrokerStateResponse>,
    suffixes: string[],
  ): IoBrokerStateResponse | undefined {
    for (const [stateId, value] of stateMap.entries()) {
      if (this.matchesAnySuffix(stateId, deviceId, suffixes)) {
        return value;
      }
    }

    return undefined;
  }

  private matchesAnySuffix(stateId: string, deviceId: string, suffixes: string[]): boolean {
    return suffixes.some(
      (suffix) => stateId === `${deviceId}.${suffix}` || stateId.endsWith(`.${suffix}`),
    );
  }

  private readableName(name: string | Record<string, string> | undefined): string | undefined {
    if (!name) {
      return undefined;
    }

    if (typeof name === "string") {
      return name;
    }

    return name.en ?? (Object.values(name)[0] as string | undefined);
  }

  private toPrimitive(value: unknown): Primitive | undefined {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value;
    }

    return undefined;
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl!.replace(/\/+$/, "")}${path}`, {
        method: "GET",
        headers: this.requestHeaders(),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `ioBroker request failed: ${response.status} ${response.statusText} for ${path}`,
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private requestHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    const authHeader = this.basicAuthHeader();
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    return headers;
  }

  private basicAuthHeader(): string | undefined {
    if (!this.config.username || !this.config.password) {
      return undefined;
    }

    const credentials = `${this.config.username}:${this.config.password}`;
    return `Basic ${Buffer.from(credentials).toString("base64")}`;
  }
}
