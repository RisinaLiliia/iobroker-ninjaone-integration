import { SystemConnectionConfig } from "../../config/env";
import { NinjaOneClient } from "./NinjaOneClient";
import { MockNinjaOneClient } from "./MockNinjaOneClient";
import { UnsupportedNinjaOneClient } from "./UnsupportedNinjaOneClient";

export function createNinjaOneClient(config: SystemConnectionConfig): NinjaOneClient {
  if (config.useMock) {
    return new MockNinjaOneClient();
  }

  return new UnsupportedNinjaOneClient();
}
