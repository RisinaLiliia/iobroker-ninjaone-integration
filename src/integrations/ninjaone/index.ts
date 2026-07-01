import { NinjaOneConfig } from "../../config/env";
import { NinjaOneClient } from "./NinjaOneClient";
import { MockNinjaOneClient } from "./MockNinjaOneClient";
import { NinjaOneRestClient } from "./NinjaOneRestClient";

export function createNinjaOneClient(config: NinjaOneConfig): NinjaOneClient {
  if (config.useMock) {
    return new MockNinjaOneClient();
  }

  return new NinjaOneRestClient(config);
}
