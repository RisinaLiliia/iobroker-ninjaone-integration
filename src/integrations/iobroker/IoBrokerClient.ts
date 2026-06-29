import { NormalizedDevice } from "../../domain/device";

export interface IoBrokerClient {
  listDevices(): Promise<NormalizedDevice[]>;
}
