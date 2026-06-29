# Technical Architecture

## Dokumentinformationen

- Projekt: `ioBroker - NinjaOne Integration`
- Dokumenttyp: `Technische Architektur`
- Stand: `27.06.2026`
- Status: `Working Draft`

## Architekturziel

Die Architektur soll eine stabile und austauschbare Integrationsschicht zwischen `ioBroker` und `NinjaOne` bereitstellen. Externe APIs sollen nicht direkt in der Business-Logik angesprochen werden. Stattdessen werden Adapter verwendet, die spaeter durch echte API-Implementierungen ersetzt werden koennen.

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

Geplante Erweiterung:

- Ersetzen der Mock-Adapter durch echte API-Clients
- Kapselung von Authentifizierung, Request-Mapping und Fehlerbehandlung pro Fremdsystem

### 3. Business Logic Layer

Verantwortung:

- Orchestrierung des Datenflusses
- Lesen, Normalisieren und Weiterreichen von Geraetedaten
- Zusammenfassen von Synchronisationsergebnissen

Bereits umgesetzt:

- `src/services/DeviceSyncService.ts`

Geplante Erweiterung:

- Ergaenzung von Validierung, Mapping-Regeln und differenzierter Fehlerbehandlung

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

- Zugriff auf `ioBroker` per REST API oder ueber einen anderen Adaptermechanismus
- konkrete Zielobjekte in `NinjaOne`: `devices`, `assets` oder benutzerdefinierte Felder
- notwendige Feldzuordnung zwischen Quell- und Zielsystem
- Umfang der Fehlerbehandlung in Phase 1 vs. Phase 2
