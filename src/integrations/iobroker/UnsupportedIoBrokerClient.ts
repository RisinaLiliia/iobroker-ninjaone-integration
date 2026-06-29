import { IoBrokerClient } from "./IoBrokerClient";
import { NormalizedDevice } from "../../domain/device";

export class UnsupportedIoBrokerClient implements IoBrokerClient {
  async listDevices(): Promise<NormalizedDevice[]> {
    throw new Error(
      "Real ioBroker API integration is not implemented yet. Replace this adapter once the target API contract is confirmed.",
    );
  }
}
