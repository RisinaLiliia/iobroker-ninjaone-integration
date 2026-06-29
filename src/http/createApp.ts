import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { AppConfig } from "../config/env";
import { DeviceSyncService } from "../services/DeviceSyncService";

interface AppDependencies {
  config: AppConfig;
  deviceSyncService: DeviceSyncService;
}

export function createApp({ config, deviceSyncService }: AppDependencies) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      integrations: {
        ioBroker: config.ioBroker.useMock ? "mock" : "configured",
        ninjaOne: config.ninjaOne.useMock ? "mock" : "configured",
      },
    });
  });

  app.get("/devices", async (_req, res, next) => {
    try {
      const devices = await deviceSyncService.previewDevices();
      res.json({
        count: devices.length,
        devices,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/sync", async (_req, res, next) => {
    try {
      const summary = await deviceSyncService.syncDevices();
      res.json(summary);
    } catch (error) {
      next(error);
    }
  });

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({
      error: error.message,
    });
  });

  return app;
}
