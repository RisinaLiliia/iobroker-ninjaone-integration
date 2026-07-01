# Technical Architecture

## Dokumentinformationen

- Projekt: `ioBroker - NinjaOne Integration`
- Dokumenttyp: `Technische Architektur`
- Stand: `01.07.2026`
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
- schreibender Realadapter fuer `NinjaOne` auf Basis der Public API v2

Noch nicht vollstaendig umgesetzt:

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
| `NinjaOne` | Mock oder Real | teilimplementiert | Mock vorhanden, Realadapter fuer OAuth, Device-Match und Schreibzugriff vorhanden |

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
  - `NinjaOneRestClient` vorhanden
  - aktueller Realzugriff liest `devices`, holt OAuth-Token und schreibt nach `userData` oder optional `custom-fields`

Geplante Erweiterung:

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
NinjaOneRestClient
        |
        v
POST /sync ist technisch moeglich, aber noch nicht gegen einen realen NinjaOne-Tenant validiert
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
   +--> GET /v1/states?filter=<deviceId>.*
   |
   v
NormalizedDevice[]
```

### Sequence fuer den aktuellen Schreibzugriff nach NinjaOne

```text
HTTP Client
   |
   v
POST /sync
   |
   v
DeviceSyncService
   |
   v
NinjaOneRestClient
   |
   +--> POST /ws/oauth/token
   |
   +--> GET /v2/devices?pageSize=...
   |
   +--> Match bestehendes NinjaOne-Device
   |
   +--> PATCH /v2/device/{id}
   |
   +--> optional PATCH /v2/device/{id}/custom-fields
   |
   v
SyncSummary
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
- `NINJAONE_OAUTH_SCOPE`
- `NINJAONE_REQUEST_TIMEOUT_MS`
- `NINJAONE_DEVICE_MATCH_FIELDS`
- `NINJAONE_WRITE_MODE`
- `NINJAONE_STANDARD_USERDATA_PREFIX`
- `NINJAONE_CF_EXTERNAL_ID`
- `NINJAONE_CF_HEALTH`
- `NINJAONE_CF_IP_ADDRESS`
- `NINJAONE_CF_LAST_SEEN_AT`
- `NINJAONE_CF_METRICS_JSON`

Regel:

- im Mock-Modus duerfen API-Werte leer bleiben
- im Realmodus muessen die benoetigten Variablen vorhanden sein
- `IOBROKER_USERNAME` und `IOBROKER_PASSWORD` sind optional, falls der REST-Adapter im Kundensystem ohne Basic Auth betrieben wird

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
- `POST /sync` kann im Voll-Realmodus bereits den `NinjaOne`-Realadapter ansprechen, benoetigt dafuer aber valide Zielkonfiguration und bestaetigte Match-Regeln

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
- ob Phase 1 in `NinjaOne` ausschliesslich ueber `userData`, ueber `custom-fields` oder ueber `both` schreiben soll
- welche `NinjaOne`-Match-Felder pro Kunde die stabilste Zuordnung liefern
- notwendige Feldzuordnung zwischen Quell- und Zielsystem
- Umfang der Fehlerbehandlung in Phase 1 vs. Phase 2
