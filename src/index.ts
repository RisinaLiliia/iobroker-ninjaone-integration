import { loadConfig } from "./config/env";
import { createApp } from "./http/createApp";
import { createIoBrokerClient } from "./integrations/iobroker";
import { createNinjaOneClient } from "./integrations/ninjaone";
import { DeviceSyncService } from "./services/DeviceSyncService";

async function main() {
  const config = loadConfig();
  const ioBrokerClient = createIoBrokerClient(config.ioBroker);
  const ninjaOneClient = createNinjaOneClient(config.ninjaOne);
  const deviceSyncService = new DeviceSyncService(ioBrokerClient, ninjaOneClient);
  const app = createApp({ config, deviceSyncService });

  app.listen(config.port, () => {
    console.info(`ioBroker/NinjaOne integration listening on port ${config.port}`);
  });
}

main().catch((error) => {
  console.error("Failed to start application", error);
  process.exitCode = 1;
});
