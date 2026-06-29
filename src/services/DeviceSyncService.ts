import { NormalizedDevice, SyncSummary } from "../domain/device";
import { IoBrokerClient } from "../integrations/iobroker/IoBrokerClient";
import { NinjaOneClient } from "../integrations/ninjaone/NinjaOneClient";

export class DeviceSyncService {
  constructor(
    private readonly ioBrokerClient: IoBrokerClient,
    private readonly ninjaOneClient: NinjaOneClient,
  ) {}

  async previewDevices(): Promise<NormalizedDevice[]> {
    return this.ioBrokerClient.listDevices();
  }

  async syncDevices(): Promise<SyncSummary> {
    const devices = await this.ioBrokerClient.listDevices();
    const results = await this.ninjaOneClient.upsertDevices(devices);

    return {
      fetchedAt: new Date().toISOString(),
      totalDevices: devices.length,
      syncedDevices: results.filter((result) => result.status === "synced").length,
      failedDevices: results.filter((result) => result.status === "failed").length,
      results,
    };
  }
}
