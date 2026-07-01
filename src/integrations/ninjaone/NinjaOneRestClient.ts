import {
  NinjaOneConfig,
  NinjaOneDeviceMatchField,
} from "../../config/env";
import { NormalizedDevice, SyncResult } from "../../domain/device";
import { NinjaOneClient } from "./NinjaOneClient";

interface NinjaOneAccessTokenResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
}

interface NinjaOneDevice {
  id: number;
  uid?: string;
  displayName?: string;
  systemName?: string;
  dnsName?: string;
  netbiosName?: string;
  userData?: Record<string, unknown>;
}

interface NinjaOneCustomFieldDefinition {
  name?: string;
  apiPermission?: "NONE" | "READ_ONLY" | "WRITE_ONLY" | "READ_WRITE";
  active?: boolean;
  entityType?: string;
}

interface CachedAccessToken {
  token: string;
  expiresAt: number;
}

interface NinjaOneMatch {
  device: NinjaOneDevice;
  field: NinjaOneDeviceMatchField;
  value: string;
}

export class NinjaOneRestClient implements NinjaOneClient {
  private cachedToken?: CachedAccessToken;

  constructor(private readonly config: NinjaOneConfig) {}

  async upsertDevices(devices: NormalizedDevice[]): Promise<SyncResult[]> {
    const ninjaDevices = await this.listDevices();
    const availableCustomFields = this.shouldWriteCustomFields()
      ? await this.listWritableCustomFieldNames()
      : new Set<string>();

    return Promise.all(
      devices.map((device) => this.syncDevice(device, ninjaDevices, availableCustomFields)),
    );
  }

  private async syncDevice(
    device: NormalizedDevice,
    ninjaDevices: NinjaOneDevice[],
    availableCustomFields: Set<string>,
  ): Promise<SyncResult> {
    try {
      const match = this.findMatch(device, ninjaDevices);
      if (!match) {
        return {
          externalId: device.externalId,
          status: "skipped",
          reason: "No matching NinjaOne device found",
        };
      }

      const performedUpdates: string[] = [];

      if (this.shouldWriteStandardFields()) {
        const standardPayload = this.buildStandardPayload(device, match.device);
        if (standardPayload) {
          await this.patchDevice(match.device.id, standardPayload);
          performedUpdates.push("standard");
        }
      }

      if (this.shouldWriteCustomFields()) {
        const customFieldPayload = this.buildCustomFieldPayload(device, availableCustomFields);
        if (Object.keys(customFieldPayload).length > 0) {
          await this.patchCustomFields(match.device.id, customFieldPayload);
          performedUpdates.push("custom-fields");
        }
      }

      if (performedUpdates.length === 0) {
        return {
          externalId: device.externalId,
          status: "skipped",
          reason: `Matched NinjaOne device ${match.device.id}, but no writable target fields are configured`,
        };
      }

      return {
        externalId: device.externalId,
        status: "synced",
        reason: `Matched NinjaOne device ${match.device.id} by ${match.field}=${match.value}; updated ${performedUpdates.join(", ")}`,
      };
    } catch (error) {
      return {
        externalId: device.externalId,
        status: "failed",
        reason: error instanceof Error ? error.message : "Unknown NinjaOne sync error",
      };
    }
  }

  private async listDevices(): Promise<NinjaOneDevice[]> {
    const pageSize = 200;
    const devices: NinjaOneDevice[] = [];
    let after: number | undefined;

    while (true) {
      const query = new URLSearchParams({ pageSize: String(pageSize) });
      if (after !== undefined) {
        query.set("after", String(after));
      }

      const page = await this.requestJson<NinjaOneDevice[]>(`/v2/devices?${query.toString()}`);
      if (page.length === 0) {
        break;
      }

      devices.push(...page);

      if (page.length < pageSize) {
        break;
      }

      after = page[page.length - 1]?.id;
      if (after === undefined) {
        break;
      }
    }

    return devices;
  }

  private async listWritableCustomFieldNames(): Promise<Set<string>> {
    const fields = await this.requestJson<NinjaOneCustomFieldDefinition[]>(
      "/v2/device-custom-fields",
    );

    return new Set(
      fields
        .filter(
          (field) =>
            field.entityType === "NODE" &&
            field.active !== false &&
            (field.apiPermission === "READ_WRITE" || field.apiPermission === "WRITE_ONLY"),
        )
        .map((field) => field.name)
        .filter((name): name is string => typeof name === "string" && name.trim().length > 0),
    );
  }

  private findMatch(sourceDevice: NormalizedDevice, ninjaDevices: NinjaOneDevice[]): NinjaOneMatch | undefined {
    const candidates = this.sourceMatchCandidates(sourceDevice);

    for (const candidate of candidates) {
      for (const field of this.config.deviceMatchFields) {
        const matches = ninjaDevices.filter((device) =>
          this.normalizeMatchValue(this.readMatchField(device, field)) === candidate.normalized,
        );

        if (matches.length === 1) {
          return {
            device: matches[0],
            field,
            value: candidate.original,
          };
        }

        if (matches.length > 1) {
          throw new Error(
            `Multiple NinjaOne devices matched ${field}=${candidate.original}. Narrow the match fields or align device naming.`,
          );
        }
      }
    }

    return undefined;
  }

  private sourceMatchCandidates(
    device: NormalizedDevice,
  ): Array<{ original: string; normalized: string }> {
    const uniqueValues = new Set<string>();

    return [device.name, device.externalId, device.ipAddress]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim())
      .filter((value) => {
        const normalized = this.normalizeMatchValue(value);
        if (!normalized || uniqueValues.has(normalized)) {
          return false;
        }
        uniqueValues.add(normalized);
        return true;
      })
      .map((value) => ({
        original: value,
        normalized: this.normalizeMatchValue(value)!,
      }));
  }

  private readMatchField(device: NinjaOneDevice, field: NinjaOneDeviceMatchField): string | undefined {
    return device[field];
  }

  private normalizeMatchValue(value: string | undefined): string | undefined {
    return value?.trim().toLowerCase();
  }

  private buildStandardPayload(
    device: NormalizedDevice,
    targetDevice: NinjaOneDevice,
  ): { userData: Record<string, unknown> } | undefined {
    const prefix = this.config.standardUserDataPrefix.trim();
    if (!prefix) {
      return undefined;
    }

    const userData = {
      ...(targetDevice.userData ?? {}),
      [`${prefix}ExternalId`]: device.externalId,
      [`${prefix}Health`]: device.health,
      [`${prefix}IpAddress`]: device.ipAddress ?? null,
      [`${prefix}LastSeenAt`]: device.lastSeenAt ?? null,
      [`${prefix}MetricCount`]: device.metrics.length,
      [`${prefix}MetricsJson`]: JSON.stringify(device.metrics),
    };

    return { userData };
  }

  private buildCustomFieldPayload(
    device: NormalizedDevice,
    availableCustomFields: Set<string>,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    const mapping = this.config.customFieldMapping;

    this.assignCustomField(payload, availableCustomFields, mapping.externalId, device.externalId);
    this.assignCustomField(payload, availableCustomFields, mapping.health, device.health);
    this.assignCustomField(payload, availableCustomFields, mapping.ipAddress, device.ipAddress);
    this.assignCustomField(payload, availableCustomFields, mapping.lastSeenAt, device.lastSeenAt);
    this.assignCustomField(
      payload,
      availableCustomFields,
      mapping.metricsJson,
      JSON.stringify(device.metrics),
    );

    return payload;
  }

  private assignCustomField(
    payload: Record<string, unknown>,
    availableCustomFields: Set<string>,
    fieldName: string | undefined,
    value: unknown,
  ): void {
    if (!fieldName || value === undefined) {
      return;
    }

    if (!availableCustomFields.has(fieldName)) {
      return;
    }

    payload[fieldName] = value;
  }

  private async patchDevice(
    deviceId: number,
    body: { userData: Record<string, unknown> },
  ): Promise<void> {
    await this.requestVoid(`/v2/device/${deviceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  private async patchCustomFields(deviceId: number, body: Record<string, unknown>): Promise<void> {
    await this.requestVoid(`/v2/device/${deviceId}/custom-fields`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  private shouldWriteStandardFields(): boolean {
    return this.config.writeMode === "standard" || this.config.writeMode === "both";
  }

  private shouldWriteCustomFields(): boolean {
    return this.config.writeMode === "custom-fields" || this.config.writeMode === "both";
  }

  private async requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.request(path, init);
    return (await response.json()) as T;
  }

  private async requestVoid(path: string, init?: RequestInit): Promise<void> {
    await this.request(path, init);
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(`${this.config.baseUrl!.replace(/\/+$/, "")}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...(init?.headers ?? {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `NinjaOne request failed: ${response.status} ${response.statusText} for ${path}${errorBody ? ` - ${errorBody}` : ""}`,
        );
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
      return this.cachedToken.token;
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId!,
      client_secret: this.config.clientSecret!,
    });

    if (this.config.oauthScope) {
      body.set("scope", this.config.oauthScope);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl!.replace(/\/+$/, "")}/ws/oauth/token`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `NinjaOne token request failed: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ""}`,
        );
      }

      const tokenResponse = (await response.json()) as NinjaOneAccessTokenResponse;
      if (!tokenResponse.access_token) {
        throw new Error("NinjaOne token response did not include an access_token");
      }

      const expiresInMs = Math.max((tokenResponse.expires_in ?? 3600) - 30, 60) * 1000;
      this.cachedToken = {
        token: tokenResponse.access_token,
        expiresAt: Date.now() + expiresInMs,
      };

      return tokenResponse.access_token;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
