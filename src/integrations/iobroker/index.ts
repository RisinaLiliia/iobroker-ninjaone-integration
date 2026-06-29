import { SystemConnectionConfig } from "../../config/env";
import { IoBrokerClient } from "./IoBrokerClient";
import { MockIoBrokerClient } from "./MockIoBrokerClient";
import { UnsupportedIoBrokerClient } from "./UnsupportedIoBrokerClient";

export function createIoBrokerClient(config: SystemConnectionConfig): IoBrokerClient {
  if (config.useMock) {
    return new MockIoBrokerClient();
  }

  return new UnsupportedIoBrokerClient();
}
