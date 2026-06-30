# Project Plan

## Dokumentinformationen

- Projekt: `ioBroker - NinjaOne Integration`
- Dokumenttyp: `Projektplan`
- Stand: `30.06.2026`
- Status: `Working Draft`

## Planungsannahmen

Die Planung orientiert sich an einem kleinen kommerziellen Backend-Projekt mit fokussiertem Scope und einer initialen Umsetzungsdauer von ca. `5 bis 7 Arbeitstagen`. Die Dauer kann sich verlaengern, falls API-Zugaenge, Dokumentation oder Testumgebungen nicht rechtzeitig vorliegen.

## Projektphasen

### Phase 1 - Anforderungsanalyse und Projektrahmen

- Dauer: `1 AT`
- Ziel: Projektziel, Scope, technische Randbedingungen und offene Punkte abstimmen

Deliverables:

- abgestimmte Projektuebersicht
- erste technische Annahmen dokumentiert
- offene Fragen und Risiken erfasst

Abhaengigkeiten:

- Verfuegbarkeit der Aufgabenbeschreibung
- grobe Kenntnis der Zielsysteme

### Phase 2 - Projektsetup und Grundstruktur

- Dauer: `1 AT`
- Ziel: technische Basis fuer die Implementierung schaffen

Deliverables:

- TypeScript-Projektsetup
- Build- und Startskripte
- Konfigurationsstruktur ueber Umgebungsvariablen
- grundlegende Projektstruktur fuer Adapter, Services und HTTP-Layer

Abhaengigkeiten:

- abgestimmtes Zielbild aus Phase 1

### Phase 3 - Architektur und Datenmodell

- Dauer: `0.5 bis 1 AT`
- Ziel: internen Datenfluss und Verantwortlichkeiten festlegen

Deliverables:

- definiertes Normalisierungsmodell fuer Geraetedaten
- dokumentierte technische Architektur
- festgelegte Integrationsschnittstellen zwischen Komponenten

Abhaengigkeiten:

- Projektsetup abgeschlossen

### Phase 4 - Implementierung der Integrationslogik

- Dauer: `2 bis 3 AT`
- Ziel: funktionalen Integrationsablauf implementieren

Deliverables:

- `IoBrokerClient` Schnittstelle
- `NinjaOneClient` Schnittstelle
- Business-Service fuer Datenvorschau und Synchronisation
- Mock-Adapter fuer beide Systeme
- HTTP-Endpunkte fuer technische Tests

Abhaengigkeiten:

- Architektur und Datenmodell definiert

### Phase 5 - API-Research und Vorbereitung der Realintegration

- Dauer: `1 bis 2 AT`
- Ziel: reale API-Anbindung technisch vorbereiten

Deliverables:

- strukturierte API-Recherche fuer `ioBroker`
- strukturierte API-Recherche fuer `NinjaOne`
- Liste benoetigter Endpunkte, Tokens und Feldzuordnungen
- dokumentierte offene Fragen fuer den Kunden oder Fachbereich

Abhaengigkeiten:

- Zugriff auf API-Dokumentation
- idealerweise Testzugangsdaten

### Phase 6 - Integrations- und Testvorbereitung

- Dauer: `0.5 bis 1 AT`
- Ziel: Testfaelle, Testablauf und technische Nachweise vorbereiten

Deliverables:

- initialer Testplan
- Testfaelle fuer Health Check, Datenbezug, Mapping und Synchronisation
- Freigabekriterien fuer den Wechsel von Mock auf Realintegration

Abhaengigkeiten:

- API-Research ausreichend konkret

## Aktueller Fortschritt

### Erledigt

- [x] Projektsetup erstellt
- [x] Environment-Konfiguration vorbereitet
- [x] mock-first Architektur umgesetzt
- [x] Adapter-Schnittstellen fuer `ioBroker` und `NinjaOne` angelegt
- [x] `DeviceSyncService` fuer Vorschau und Synchronisation implementiert
- [x] HTTP-Endpunkte fuer technische Tests bereitgestellt
- [x] Build und TypeScript-Check erfolgreich ausgefuehrt
- [x] initiale API-Recherche fuer `ioBroker` und `NinjaOne` dokumentiert
- [x] erster lesender `IoBrokerRestClient` fuer `objects` und `states` implementiert
- [x] vorhandenen `IoBrokerRestClient` gegen ein echtes Kundensystem validieren
- [x] State-Mapping zwischen  `/v1/objects`  und `/v1/states` für den Realadapter implementiert


### In Arbeit

- [ ] relevante Namespaces, `object.type` Werte und State-IDs im Zielsystem dokumentieren
- [ ] `IOBROKER_BASE_URL` und reale Zugangsdaten fuer die technische Validierung bestaetigen

### Offen

- [ ] API-Research fuer NinjaOne Public API weiter konkretisieren
- [ ] OAuth-Flow fuer `NinjaOne` technisch verifizieren
- [ ] erstes belastbares Feldmapping zwischen `ioBroker` und `NinjaOne` definieren
- [ ] realen `NinjaOneClient` implementieren
- [ ] Schreibpfad in `NinjaOne` validieren, insbesondere `PATCH /v2/device/{id}/custom-fields`
- [ ] End-to-End Test mit echten Kundenzugangsdaten durchfuehren

### Statusuebersicht

| Arbeitspaket | Status | Stand | Nachweis |
|---|---|---|---|
| Projektsetup und Grundstruktur | erledigt | `28.06.2026` | Projektstruktur, Build-Skripte, HTTP-Startpunkt |
| Mock-first Integrationskern | erledigt | `28.06.2026` | `MockIoBrokerClient`, `MockNinjaOneClient`, `DeviceSyncService` |
| API-Research Grundfassung | erledigt | `28.06.2026` | `docs/04_API_Research.md` |
| Lesender Realadapter fuer `ioBroker` | erledigt | `29.06.2026` | `src/integrations/iobroker/ioBrokerRestClient.ts` |
| Validierung gegen echtes `ioBroker`-System | erledigt  | `30.06.2026` | Kundenzugang, Namespace- und State-Pruefung  |
| Realadapter fuer `NinjaOne` | offen | `-` | noch nicht implementiert |
| End-to-End Realintegration | offen | `-` | nach Auth- und Mapping-Klaerung |

## Milestones

### M1 - Projektgrundlage steht

- Projektuebersicht abgestimmt
- Projektstruktur aufgebaut

### M2 - Architektur ist belastbar

- Datenfluss dokumentiert
- Adapter- und Service-Schnittstellen definiert

### M3 - Mock-End-to-End ist lauffaehig

- Service startet
- Geraete koennen gelesen und synchronisiert werden

### M4 - Realintegration ist vorbereitet

- API-Recherche dokumentiert
- benoetigte Endpunkte und Authentifizierungswege identifiziert

## Risiken

### Risiko 1 - Unvollstaendige oder uneinheitliche API-Dokumentation

Auswirkung:

- Verzogerung bei der Realintegration
- zusaetzliche technische Abstimmungen notwendig

Massnahmen:

- API-Research frueh beginnen
- offene Fragen dokumentiert sammeln
- Mock-Adapter als technische Entkopplung beibehalten

### Risiko 2 - Testzugangsdaten liegen nicht rechtzeitig vor

Auswirkung:

- keine echten End-to-End Tests gegen Produktivnahe Umgebungen

Massnahmen:

- Mock-Modus als Standard
- klare Definition der spaeteren Austauschpunkte

### Risiko 3 - Datenmodell zwischen ioBroker und NinjaOne passt nicht direkt zusammen

Auswirkung:

- zusaetzlicher Mapping- und Validierungsaufwand

Massnahmen:

- internes Normalisierungsmodell verwenden
- Mapping explizit dokumentieren

### Risiko 4 - Unklare fachliche Anforderungen an die zu uebertragenden Felder

Auswirkung:

- Nacharbeit an der Integrationslogik

Massnahmen:

- Scope und Feldliste in der API-Recherche explizit trennen
- Fachfragen als Entscheidungen protokollieren

## Priorisierte Arbeitspakete

### Kurzfristig

- Dokumentation strukturieren
- Architektur und Projektplan finalisieren
- API-Recherche initial aufsetzen

### Danach

- echte `ioBroker`-API analysieren
- echte `NinjaOne`-API analysieren
- Mapping-Strategie festlegen
- Realadapter implementieren

## Definition of Done fuer die Initialphase

Die Initialphase ist abgeschlossen, wenn:

- die Projektdokumentation strukturiert vorliegt
- der Service lokal reproduzierbar startet
- ein mockbasierter End-to-End Ablauf nachweisbar ist
- technische Anschlussfaehigkeit fuer die Realintegration gegeben ist
- die naechsten Schritte fuer API-Anbindung und Test klar dokumentiert sind
