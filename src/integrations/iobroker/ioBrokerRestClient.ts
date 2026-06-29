import { IoBrorerConfig } from "../../config/env";
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
  constructor(private readonly config: IoBrorerConfig) {}

  async listDevices(): Promise<NormalizedDevice[]> {
    const filter = encodeURIComponent(this.config.objectFilter ?? "*");
    const type = encodeURIComponent(this.config.objectType ?? "device");
    const devices = await this.fetchJson<IoBrokerObject[]>(
      `/v1/objects?filter=${filter}&type=${type}`,
    );
    return Promise.all(devices.map((device) => this.normalizeDevice(device)));
  }

  private async normalizeDevice(device: IoBrokerObject): Promise<NormalizedDevice> {
    const stateObjects = await this.fetchJson<IoBrokerObject[]>(
      `/v1/objects?filter=${encodeURIComponent(`${device._id}.*`)}&type=state`,
    );

    const stateEntries = await Promise.all(
      stateObjects.map(async (stateObject) => {
        const state = await this.fetchJson<IoBrokerStateResponse>(
          `/v1/state/${encodeURIComponent(stateObject._id)}`,
        );
        return [stateObject._id, state] as const;
      }),
    );

    const stateMap = new Map(stateEntries);
    return {
      externalId: device._id,
      name: this.readableName(device.common?.name) ?? device._id,
      health: this.resolveHealth(device._id, stateMap),
      ipAddress: this.resolveIpAddress(device._id, stateMap),
      lastSeenAt: this.resolveLastSeen(device._id, stateMap),
      metrics: this.buildMetrics(device._id, stateObjects, stateMap),
      raw: {
        device,
        stateObjects,
        states: Object.fromEntries(stateEntries),
      },
    };
  }

  private buildMetrics(
    deviceId: string,
    stateObjects: IoBrokerObject[],
    stateMap: Map<string, IoBrokerStateResponse>,
  ): DeviceMetric[] {
    return stateObjects
      .map((stateObj): DeviceMetric | null => {
        const state = stateMap.get(stateObj._id);
        const value = this.toPrimitive(state?.val);
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

  private resolveHealth(
    deviceId: string,
    stateMap: Map<string, IoBrokerStateResponse>,
  ): DeviceHealth {
    const value = this.findValue(deviceId, stateMap, [
      "info.connected",
      "alive",
      "connected",
      "reachable",
      "online",
    ]);

    if (typeof value === "boolean") {
      return value ? "online" : "offline";
    }

    if (typeof value === "string") {
      const normalized = value.toLowerCase();
      if (["true", "1", "online", "connected", "alive"].includes(normalized)) {
        return "online";
      }
      if (["false", "0", "offline", "disconnected"].includes(normalized)) {
        return "offline";
      }
    }
    return "unknown";
  }

  private resolveIpAddress(
    deviceId: string,
    stateMap: Map<string, IoBrokerStateResponse>,
  ): string | undefined {
    const value = this.findValue(deviceId, stateMap, [
      "info.ip",
      "ip",
      "network.ip",
      "info.ipAddress",
    ]);
    return typeof value === "string" ? value : undefined;
  }

  private resolveLastSeen(
    deviceId: string,
    stateMap: Map<string, IoBrokerStateResponse>,
  ): string | undefined {
    const state = this.findState(deviceId, stateMap, [
      "lastSeen",
      "info.lastSeen",
      "heartbeat",
      "alive",
    ]);
    const timestamp = state?.lc ?? state?.ts;
    return typeof timestamp === "number" ? new Date(timestamp).toISOString() : undefined;
  }

  private findValue(
    deviceId: string,
    stateMap: Map<string, IoBrokerStateResponse>,
    suffixes: string[],
  ): Primitive | undefined {
    const state = this.findState(deviceId, stateMap, suffixes);
    return this.toPrimitive(state?.val);
  }

  private findState(
    deviceId: string,
    stateMap: Map<string, IoBrokerStateResponse>,
    suffixes: string[],
  ): IoBrokerStateResponse | undefined {
    for (const [stateId, state] of stateMap.entries()) {
      if (
        suffixes.some(
          (suffix) =>
            stateId === `${deviceId}.${suffix}` || stateId.endsWith(`.${suffix}`),
        )
      ) {
        return state;
      }
    }
    return undefined;
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
    const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout ?? 10000);
    try {
      const response = await fetch(
        `${this.config.baseUrl!.replace(/\/+$/, "")}${path}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: this.basicAuthHeader(),
          },
          signal: controller.signal,
        },
      );
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

  private basicAuthHeader(): string {
    const credentials = `${this.config.username!}:${this.config.password!}`;
    return `Basic ${Buffer.from(credentials).toString("base64")}`;
  }
}
