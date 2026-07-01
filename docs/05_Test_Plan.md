# Test Plan

## Dokumentinformationen

- Projekt: `ioBroker - NinjaOne Integration`
- Dokumenttyp: `Testplan`
- Stand: `01.07.2026`
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

### TC-06 Verhalten des realen NinjaOne-Pfads bei fehlendem Match

- Ziel: erwartbares Verhalten dokumentieren, wenn ein `ioBroker`-Geraet keinem `NinjaOne`-Device zugeordnet werden kann
- Vorbedingung: Pflichtkonfiguration gesetzt, Realmodus aktiv
- Schritte:
  - `POST /sync` ausfuehren
- Erwartetes Ergebnis:
  - HTTP `200`
  - mindestens ein Ergebnis mit Status `skipped`
  - technische Begruendung, dass kein passendes `NinjaOne`-Device gefunden wurde

### TC-07 Lesender Realmodus fuer ioBroker

- Ziel: pruefen, ob der vorhandene `ioBroker`-Realadapter technisch erreichbar ist
- Vorbedingung:
  - `MOCK_IOBROKER=false`
  - gueltiger Wert fuer `IOBROKER_BASE_URL`
  - optional gueltige Werte fuer `IOBROKER_USERNAME`, `IOBROKER_PASSWORD`, falls Basic Auth aktiviert ist
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

### TC-09 NinjaOne OAuth im Realmodus

- Ziel: pruefen, ob der reale `NinjaOne`-Adapter einen Access Token abrufen kann
- Vorbedingung:
  - `MOCK_NINJAONE=false`
  - gueltige Werte fuer `NINJAONE_BASE_URL`, `NINJAONE_CLIENT_ID`, `NINJAONE_CLIENT_SECRET`
- Schritte:
  - Service starten
  - `POST /sync` gegen einen kleinen Testdatensatz ausfuehren
- Erwartetes Ergebnis:
  - kein Fehlerbild aus dem Token-Endpunkt
  - bei Fehlkonfiguration technische Meldung aus `/ws/oauth/token`

### TC-10 Standard-Write ueber userData

- Ziel: pruefen, ob `NinjaOne`-Devices ueber `PATCH /v2/device/{id}` aktualisiert werden koennen
- Vorbedingung:
  - `MOCK_NINJAONE=false`
  - `NINJAONE_WRITE_MODE=standard`
  - mindestens ein bestaetigtes Match zwischen `ioBroker` und `NinjaOne`
- Schritte:
  - `POST /sync` aufrufen
  - Zielgeraet in `NinjaOne` per API oder UI pruefen
- Erwartetes Ergebnis:
  - HTTP `200`
  - Ergebnisstatus `synced`
  - `userData` enthaelt die erwarteten `ioBroker...` Felder

### TC-11 Custom-Field-Write

- Ziel: pruefen, ob vorkonfigurierte `custom-fields` beschrieben werden koennen
- Vorbedingung:
  - `MOCK_NINJAONE=false`
  - `NINJAONE_WRITE_MODE=custom-fields` oder `both`
  - passende `NINJAONE_CF_*` Werte gesetzt
  - Custom Fields im Tenant vorhanden und per API beschreibbar
- Schritte:
  - `POST /sync` aufrufen
  - Zielgeraet in `NinjaOne` per API oder UI pruefen
- Erwartetes Ergebnis:
  - HTTP `200`
  - Ergebnisstatus `synced` oder `skipped`, falls kein beschreibbares Feld konfiguriert ist
  - bei Erfolg enthalten die Ziel-`custom-fields` die erwarteten Werte

## Geplante Erweiterungen des Testplans

Sobald echte API-Zugaenge vorliegen, werden folgende Testfaelle ergaenzt:

- Mapping realer Antworten in das interne Datenmodell
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
- Der reale Lesezugriff auf `ioBroker` ist implementiert und technisch gegen ein konkretes Kundensystem nachvollzogen
- Der reale Schreibzugriff auf `NinjaOne` ist implementiert, aber noch nicht gegen einen echten Tenant validiert
- Postman-Collection oder API-Testskripte werden spaeter als separates Artefakt ergaenzt
