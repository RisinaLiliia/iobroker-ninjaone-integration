import { IoBrorerConfig, SystemConnectionConfig } from "../../config/env";
import { IoBrokerClient } from "./IoBrokerClient";
import { MockIoBrokerClient } from "./MockIoBrokerClient";
import { IoBrokerRestClient } from "./ioBrokerRestClient";

export function createIoBrokerClient(config: IoBrorerConfig): IoBrokerClient {
  if (config.useMock) {
    return new MockIoBrokerClient();
  }

  return new IoBrokerRestClient(config);
}
