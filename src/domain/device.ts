export type DeviceHealth = "online" | "offline" | "unknown";

export interface DeviceMetric {
  key: string;
  value: string | number | boolean | null;
  unit?: string;
}

export interface NormalizedDevice {
  externalId: string;
  name: string;
  health: DeviceHealth;
  site?: string;
  ipAddress?: string;
  lastSeenAt?: string;
  metrics: DeviceMetric[];
  raw?: unknown;
}

export type SyncStatus = "synced" | "skipped" | "failed";

export interface SyncResult {
  externalId: string;
  status: SyncStatus;
  reason?: string;
}

export interface SyncSummary {
  fetchedAt: string;
  totalDevices: number;
  syncedDevices: number;
  failedDevices: number;
  results: SyncResult[];
}
