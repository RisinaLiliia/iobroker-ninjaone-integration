import { NormalizedDevice, SyncResult } from "../../domain/device";
import { NinjaOneClient } from "./NinjaOneClient";

export class UnsupportedNinjaOneClient implements NinjaOneClient {
  async upsertDevices(_devices: NormalizedDevice[]): Promise<SyncResult[]> {
    throw new Error(
      "Real NinjaOne API integration is not implemented yet. Replace this adapter once the target API contract is confirmed.",
    );
  }
}
