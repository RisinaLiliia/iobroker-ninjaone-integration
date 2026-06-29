import { NormalizedDevice, SyncResult } from "../../domain/device";

export interface NinjaOneClient {
  upsertDevices(devices: NormalizedDevice[]): Promise<SyncResult[]>;
}
