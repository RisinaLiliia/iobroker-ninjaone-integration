# ioBroker NinjaOne Integration

This repository contains a mock-first backend skeleton for an integration between `ioBroker` and `NinjaOne`.

## Documentation

Project documentation is maintained under [docs/README.md](/Users/liliya/Desktop/iobroker-ninjaone-integration/docs/README.md).

The main internal project documents are:

- `01_Project_Overview.md`
- `02_Project_Plan.md`
- `03_Technical_Architecture.md`
- `04_API_Research.md`
- `05_Test_Plan.md`

## Current Technical Status

- TypeScript backend skeleton is in place
- configuration is loaded via environment variables
- both external integrations currently run in mock mode
- HTTP endpoints exist for `health`, `devices`, and `sync`
- real API clients for `ioBroker` and `NinjaOne` are not implemented yet

## Run Locally

```bash
npm run dev
```

Build and start:

```bash
npm run build
npm run start
```
