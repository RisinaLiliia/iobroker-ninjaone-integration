# Technical Architecture

## Dokumentinformationen

- Projekt: `ioBroker - NinjaOne Integration`
- Dokumenttyp: `Technische Architektur`
- Stand: `29.06.2026`
- Status: `Working Draft`

## Architekturziel

Die Architektur soll eine stabile und austauschbare Integrationsschicht zwischen `ioBroker` und `NinjaOne` bereitstellen. Externe APIs sollen nicht direkt in der Business-Logik angesprochen werden. Stattdessen werden Adapter verwendet, die spaeter durch echte API-Implementierungen ersetzt werden koennen.

## Aktueller Architekturstatus

Die Zielarchitektur ist inzwischen teilweise umgesetzt.

Bereits umgesetzt:

- zentrale Konfigurationsschicht ueber `src/config/env.ts`
- Adapter-Schnittstellen fuer `ioBroker` und `NinjaOne`
- `mock-first` Integrationskern mit `DeviceSyncService`
- technische HTTP-Endpunkte fuer Health, Vorschau und Sync
- lesender Realadapter fuer `ioBroker` auf Basis von `ioBroker.rest-api`

Noch nicht vollstaendig umgesetzt:

- echter schreibender `NinjaOne`-Adapter
- produktives Feldmapping zwischen Quell- und Zielsystem
- differenzierte Fehlerklassen und produktionsnahe Logging-Strategie
- echte End-to-End Validierung gegen beide Kundensysteme

## System Context

```text
+-----------+        +---------------------------+        +-----------+
| ioBroker  | -----> | Integration Backend       | -----> | NinjaOne  |
|           |        |                           |        |           |
| states    |        | - Adapter Layer           |        | devices   |
| objects   |        | - Business Logic          |        | assets    |
+-----------+        | - HTTP Test Endpoints     |        +-----------+
                     +---------------------------+
```

## Implementierungsstatus der externen Anbindungen

| System | Aktueller Modus | Status | Bemerkung |
|---|---|---|---|
| `ioBroker` | Mock oder Real | teilimplementiert | Mock vorhanden, Realadapter fuer lesenden REST-Zugriff vorhanden |
| `NinjaOne` | Mock oder Unsupported | teilimplementiert | Mock vorhanden, Realadapter noch nicht implementiert |

## Architekturprinzipien

- klare Trennung zwischen externer Kommunikation und Business-Logik
- Konfiguration ausschliesslich ueber Umgebungsvariablen
- keine produktiven Zugangsdaten im Repository
- `mock-first` Entwicklung fuer fruehe technische Stabilitaet
- austauschbare Adapter fuer spaetere Realintegration
- geringes, nachvollziehbares Backend ohne unnoetige Framework-Komplexitaet

## Logische Komponenten

### 1. Configuration Layer

Verantwortung:

- Laden und Validieren technischer Konfiguration
- Steuerung von Mock- und Realmodus
- zentrale Bereitstellung von Laufzeitparametern

Bereits umgesetzt:

- `src/config/env.ts`

### 2. Integration Layer

Verantwortung:

- technische Kommunikation mit Fremdsystemen
- Kapselung von Authentifizierung, Request-Aufbau und Response-Verarbeitung
- Austauschpunkt fuer Mock- und Realadapter

Bereits umgesetzt:

- `src/integrations/iobroker/*`
- `src/integrations/ninjaone/*`

Aktueller technischer Stand:

- `ioBroker`:
  - `MockIoBrokerClient` vorhanden
  - `IoBrokerRestClient` vorhanden
  - aktueller Realzugriff liest `objects` und `states` per REST
- `NinjaOne`:
  - `MockNinjaOneClient` vorhanden
  - `UnsupportedNinjaOneClient` signalisiert bewusst, dass die Realintegration noch offen ist

Geplante Erweiterung:

- Ergaenzung des fehlenden `NinjaOne`-Realadapters
- Kapselung von Authentifizierung, Request-Mapping und Fehlerbehandlung pro Fremdsystem
- spaetere Absicherung durch Retry-, Timeout- und Logging-Strategien

### 3. Business Logic Layer

Verantwortung:

- Orchestrierung des Datenflusses
- Lesen, Normalisieren und Weiterreichen von Geraetedaten
- Zusammenfassen von Synchronisationsergebnissen

Bereits umgesetzt:

- `src/services/DeviceSyncService.ts`

Geplante Erweiterung:

- Ergaenzung von Validierung, Mapping-Regeln und differenzierter Fehlerbehandlung
- Trennung zwischen Vorschau, Delta-Ermittlung und produktiver Synchronisation bei wachsendem Umfang

### 4. HTTP Layer

Verantwortung:

- technische Test- und Diagnoseendpunkte
- einfache Ausfuehrung der Synchronisation
- Fehlerbehandlung fuer API-Aufrufe gegen den lokalen Service

Bereits umgesetzt:

- `src/http/createApp.ts`
- `src/index.ts`

Geplante Erweiterung:

- klarere Trennung zwischen Routing, Controllern und Fehlerobjekten bei wachsendem Funktionsumfang

## Datenmodell

Das System verwendet ein internes, normalisiertes Geraetemodell. Dadurch werden Unterschiede zwischen `ioBroker` und `NinjaOne` nicht direkt in der Business-Logik verarbeitet.

Aktuell umgesetzt:

- `externalId`
- `name`
- `health`
- `site`
- `ipAddress`
- `lastSeenAt`
- `metrics[]`

Vorteil:

- API-spezifische Felder bleiben in den Adaptern
- Mapping und Validierung koennen zentral gesteuert werden

## Data Flow

### Technischer Ablauf

```text
GET data from ioBroker
        |
        v
Normalize to internal device model
        |
        v
Apply business orchestration
        |
        v
Send mapped payload to NinjaOne
        |
        v
Return synchronization summary
```

### Aktueller Mock-Ablauf

```text
MockIoBrokerClient
        |
        v
DeviceSyncService
        |
        v
MockNinjaOneClient
```

### Aktueller Hybrid-/Realzustand

```text
IoBrokerRestClient
        |
        v
DeviceSyncService
        |
        +--> GET /devices funktioniert mit realen ioBroker-Daten
        |
        v
UnsupportedNinjaOneClient
        |
        v
POST /sync im Voll-Realmodus derzeit noch nicht produktiv nutzbar
```

### Sequence fuer den aktuellen Lesezugriff

```text
HTTP Client
   |
   v
GET /devices
   |
   v
DeviceSyncService
   |
   v
IoBrokerRestClient
   |
   +--> GET /v1/objects?filter=...&type=...
   |
   +--> GET /v1/objects?filter=<deviceId>.*&type=state
   |
   +--> GET /v1/state/{stateId}
   |
   v
NormalizedDevice[]
```

## Projektstruktur

### Aktueller Stand

```text
src/
  config/
  domain/
  http/
  integrations/
    iobroker/
    ninjaone/
  services/
```

### Zielbild fuer die naechsten Ausbaustufen

```text
src/
  config/
  controllers/
  routes/
  services/
  integrations/
  domain/
  types/
  utils/
```

Hinweis:

Die aktuelle Struktur ist fuer die erste Ausbaustufe bewusst kompakt gehalten. Eine Aufteilung in `controllers`, `routes`, `types` und `utils` ist sinnvoll, sobald echte API-Logik, Validierung, Logging und mehrere Use Cases hinzukommen.

## Konfiguration

Die Konfiguration wird ueber Umgebungsvariablen gesteuert.

Relevante Parameter:

- `PORT`
- `MOCK_IOBROKER`
- `MOCK_NINJAONE`
- `IOBROKER_BASE_URL`
- `IOBROKER_USERNAME`
- `IOBROKER_PASSWORD`
- `IOBROKER_OBJECT_FILTER`
- `IOBROKER_OBJECT_TYPE`
- `IOBROKER_REQUEST_TIMEOUT_MS`
- `NINJAONE_BASE_URL`
- `NINJAONE_CLIENT_ID`
- `NINJAONE_CLIENT_SECRET`

Regel:

- im Mock-Modus duerfen API-Werte leer bleiben
- im Realmodus muessen die benoetigten Variablen vorhanden sein

## Schnittstellen nach aussen

Der Service bietet derzeit einfache HTTP-Endpunkte:

- `GET /health`
- `GET /devices`
- `POST /sync`

Zweck:

- technischer Health Check
- Vorschau auf normalisierte Geraetedaten
- manuelle Ausloesung eines Synchronisationslaufs

Aktueller Reifegrad:

- `GET /health` ist fuer Mock- und Konfigurationsdiagnose nutzbar
- `GET /devices` kann bereits fuer die Validierung des `ioBroker`-Realadapters genutzt werden
- `POST /sync` ist im Voll-Realmodus erst sinnvoll, wenn `NinjaOne` ebenfalls einen Realadapter besitzt

Noch nicht umgesetzt:

- authentifizierte Betriebsendpunkte
- administrative Steuerung fuer geplante Sync-Jobs
- strukturierte API-Versionierung

## Fehlerbehandlung

Aktuelle Strategie:

- Fehler aus Service oder Adapter werden an den HTTP-Layer weitergegeben
- der HTTP-Layer antwortet mit `500` und einer technischen Fehlermeldung

Geplante Erweiterungen:

- strukturierte Fehlerklassen
- fachliche Fehlercodes
- Logging mit Korrelations-ID
- saubere Trennung zwischen technischen und fachlichen Fehlern

## Sicherheitsaspekte

- keine Secrets im Code
- Zugangsdaten nur per Environment
- produktive Basis-URLs nicht fest im Quelltext
- spaetere API-Tokens duerfen nicht geloggt werden

Fuer den produktiven Ausbau empfohlen:

- Secret-Management ueber CI/CD oder Hosting-Umgebung
- Redaction sensibler Header in Logs
- Timeouts und Retry-Strategie fuer externe Requests

## Bereits umgesetzte Architekturentscheidungen

- Verwendung eines `mock-first` Ansatzes fuer die erste Ausbaustufe
- Trennung von Adapter-Layer und Business-Logik
- Verzicht auf produktionsnahe Secrets im Repository
- interner Normalisierungsansatz fuer Geraetedaten

## Geplante Erweiterungspunkte

Die Architektur ist bewusst so vorbereitet, dass folgende Schritte ohne Grundumbau moeglich sind:

- Ersetzen der Mock-Adapter durch echte REST- oder Socket-Implementierungen
- Einfuehrung von Mapping-Regeln pro Geraetetyp
- zusaetzliche Validierung vor der Uebertragung
- periodische Synchronisation per Scheduler
- Persistenz fuer Sync-Historie oder Fehlerprotokolle

## Offene Architekturentscheidungen

- finaler Zugriff auf `ioBroker` ausschliesslich per REST API oder spaeter ueber alternative Mechanismen
- konkrete Zielobjekte in `NinjaOne`: `devices`, `assets` oder benutzerdefinierte Felder
- notwendige Feldzuordnung zwischen Quell- und Zielsystem
- Umfang der Fehlerbehandlung in Phase 1 vs. Phase 2
