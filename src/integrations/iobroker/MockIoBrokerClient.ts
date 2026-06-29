import { NormalizedDevice } from "../../domain/device";
import { IoBrokerClient } from "./IoBrokerClient";

const mockDevices: NormalizedDevice[] = [
  {
    externalId: "iobroker.living-room.sensor-1",
    name: "Living Room Sensor",
    health: "online",
    site: "Living Room",
    ipAddress: "192.168.10.11",
    lastSeenAt: "2026-06-26T08:30:00.000Z",
    metrics: [
      { key: "temperature", value: 22.3, unit: "C" },
      { key: "humidity", value: 44, unit: "%" },
    ],
  },
  {
    externalId: "iobroker.office.plug-4",
    name: "Office Smart Plug",
    health: "offline",
    site: "Office",
    ipAddress: "192.168.10.27",
    lastSeenAt: "2026-06-26T07:55:00.000Z",
    metrics: [
      { key: "power", value: 0, unit: "W" },
      { key: "reachable", value: false },
    ],
  },
  {
    externalId: "iobroker.boiler.controller-2",
    name: "Boiler Controller",
    health: "online",
    site: "Basement",
    ipAddress: "192.168.10.34",
    lastSeenAt: "2026-06-26T08:31:00.000Z",
    metrics: [
      { key: "flow_temperature", value: 58.6, unit: "C" },
      { key: "pump_active", value: true },
    ],
  },
];

export class MockIoBrokerClient implements IoBrokerClient {
  async listDevices(): Promise<NormalizedDevice[]> {
    return mockDevices;
  }
}
