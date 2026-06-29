# Test Plan

## Dokumentinformationen

- Projekt: `ioBroker - NinjaOne Integration`
- Dokumenttyp: `Testplan`
- Stand: `29.06.2026`
- Status: `Initial Draft`

## Ziel

Dieser Testplan beschreibt die initiale Qualitaetssicherung fuer den Integrationsservice zwischen `ioBroker` und `NinjaOne`. Er deckt die erste Projektphase mit Fokus auf technische Funktionsfaehigkeit, Konfiguration, Datenfluss und Integrationsvorbereitung ab.

## Teststrategie

Die Tests werden in Stufen aufgebaut:

- `Static Checks`: TypeScript-Checks und Build
- `Component Tests`: Adapter- und Service-Verhalten
- `Integration Smoke Tests`: HTTP-Endpunkte und End-to-End Ablauf im Mock-Modus
- `Reale API-Tests`: nach Vorliegen der Zugangsdaten und Research-Ergebnisse

## Testumfang

### Im Scope

- Startfaehigkeit des Services
- Laden der Konfiguration
- Verhalten im Mock-Modus
- Geraetevorschau
- Synchronisationszusammenfassung
- Fehlerverhalten bei fehlender Konfiguration im Realmodus

### Nicht im Scope

- Lasttests
- Sicherheitstests auf Infrastruktur-Ebene
- Produktive Abnahmetests beim Kunden

## Testumgebungen

### Lokale Entwicklungsumgebung

Zweck:

- schneller technischer Nachweis des Datenflusses

### Mock-Modus

Zweck:

- Entwicklung und Regressionstests ohne externe Abhaengigkeiten

### Integrationsumgebung mit echten APIs

Zweck:

- Authentifizierung, Mapping und echte End-to-End Validierung

Voraussetzung:

- gueltige API-Zugangsdaten
- Netzwerkzugriff auf beide Systeme

## Testfaelle

### TC-01 Service Start im Mock-Modus

- Ziel: Sicherstellen, dass der Service mit Standardkonfiguration startet
- Vorbedingung: `MOCK_IOBROKER=true`, `MOCK_NINJAONE=true`
- Schritte:
  - Service starten
- Erwartetes Ergebnis:
  - Anwendung startet ohne Konfigurationsfehler

### TC-02 Health Endpoint

- Ziel: Verifikation des Betriebsstatus
- Schritte:
  - `GET /health` aufrufen
- Erwartetes Ergebnis:
  - HTTP `200`
  - Antwort enthaelt `status=ok`
  - Antwort enthaelt Integrationsmodus fuer beide Systeme

### TC-03 Device Preview

- Ziel: Vorschau der normalisierten Geraetedaten
- Schritte:
  - `GET /devices` aufrufen
- Erwartetes Ergebnis:
  - HTTP `200`
  - Rueckgabe der erwarteten Anzahl an Mock-Devices
  - Daten entsprechen dem internen Geraetemodell

### TC-04 Synchronisation im Mock-Modus

- Ziel: End-to-End Ablauf pruefen
- Schritte:
  - `POST /sync` aufrufen
- Erwartetes Ergebnis:
  - HTTP `200`
  - `totalDevices` ist groesser `0`
  - `syncedDevices` entspricht der Anzahl verarbeiteter Mock-Geraete
  - `failedDevices` ist `0`

### TC-05 Fehler bei fehlender Konfiguration im Realmodus

- Ziel: Sicherstellen, dass Pflichtkonfiguration validiert wird
- Vorbedingung: `MOCK_IOBROKER=false` oder `MOCK_NINJAONE=false`
- Schritte:
  - benoetigte Environment-Variablen absichtlich nicht setzen
  - Service starten
- Erwartetes Ergebnis:
  - Anwendung startet nicht
  - klare Fehlermeldung zur fehlenden Konfiguration

### TC-06 Fehlerbild fuer nicht implementierte Realadapter

- Ziel: erwartbares Verhalten des `NinjaOne`-Pfads im Realmodus dokumentieren
- Vorbedingung: Pflichtkonfiguration gesetzt, Realmodus aktiv
- Schritte:
  - `POST /sync` ausfuehren
- Erwartetes Ergebnis:
  - HTTP `500`
  - technische Meldung, dass reale `NinjaOne`-API-Integration noch nicht implementiert ist

### TC-07 Lesender Realmodus fuer ioBroker

- Ziel: pruefen, ob der vorhandene `ioBroker`-Realadapter technisch erreichbar ist
- Vorbedingung:
  - `MOCK_IOBROKER=false`
  - gueltige Werte fuer `IOBROKER_BASE_URL`, `IOBROKER_USERNAME`, `IOBROKER_PASSWORD`
- Schritte:
  - Service starten
  - `GET /devices` aufrufen
- Erwartetes Ergebnis:
  - bei gueltiger Verbindung HTTP `200`
  - Rueckgabe einer Liste normalisierter Geraete oder einer leeren Liste bei nicht passendem Filter
  - keine technische Meldung ueber einen nicht implementierten `ioBroker`-Realadapter

### TC-08 Fehlersicht bei realem ioBroker-Zugriff

- Ziel: technische Fehlerbilder bei falscher `ioBroker`-Konfiguration nachvollziehen
- Vorbedingung:
  - `MOCK_IOBROKER=false`
- Schritte:
  - absichtlich falsche URL oder falsche Zugangsdaten setzen
  - `GET /devices` aufrufen
- Erwartetes Ergebnis:
  - HTTP `500`
  - technische Fehlermeldung aus dem `ioBroker`-Request-Kontext, z. B. `401`, `404` oder Verbindungsfehler

## Geplante Erweiterungen des Testplans

Sobald echte API-Zugaenge vorliegen, werden folgende Testfaelle ergaenzt:

- Token-Abruf bei NinjaOne
- Mapping realer Antworten in das interne Datenmodell
- Upsert gegen NinjaOne mit Testobjekten
- Fehlerbehandlung fuer `401`, `404`, `429`, `5xx`

## Testdaten

Aktuell werden Mock-Geraete verwendet. Diese dienen dazu, den Datenfluss unabhaengig von externen Systemen zu pruefen.

Spaeter benoetigt:

- mindestens ein reales Beispielgeraet aus ioBroker
- mindestens ein Testobjekt oder technischer Zieltyp in NinjaOne
- definierte Feldwerte fuer Mapping-Validierung

## Testwerkzeuge

- `npm run check`
- `npm run build`
- HTTP-Client wie `curl` oder Postman
- spaeter optional automatisierte Testfaelle im Projekt

## Entry Criteria

Tests koennen fuer eine Integrationsstufe gestartet werden, wenn:

- Build erfolgreich ist
- Umgebungsvariablen gesetzt sind
- benoetigte Zielsysteme erreichbar sind

## Exit Criteria

Die initiale Testphase gilt als erfolgreich abgeschlossen, wenn:

- der Mock-Modus stabil funktioniert
- alle definierten Basis-Testfaelle erfolgreich nachvollzogen wurden
- bekannte Blocker fuer die Realintegration dokumentiert sind

## Offene Punkte

- Automatisierte Tests sind noch nicht implementiert
- Ein echter Integrationslauf gegen `ioBroker` und `NinjaOne` ist noch offen
- Der reale Lesezugriff auf `ioBroker` ist implementiert, aber noch nicht gegen das konkrete Kundensystem validiert
- Postman-Collection oder API-Testskripte werden spaeter als separates Artefakt ergaenzt
