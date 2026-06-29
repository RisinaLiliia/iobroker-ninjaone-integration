import { NormalizedDevice, SyncResult } from "../../domain/device";
import { NinjaOneClient } from "./NinjaOneClient";

export class MockNinjaOneClient implements NinjaOneClient {
  async upsertDevices(devices: NormalizedDevice[]): Promise<SyncResult[]> {
    return devices.map((device) => ({
      externalId: device.externalId,
      status: "synced",
    }));
  }
}
