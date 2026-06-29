# Project Plan

## Dokumentinformationen

- Projekt: `ioBroker - NinjaOne Integration`
- Dokumenttyp: `Projektplan`
- Stand: `26.06.2026`
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

- Projektsetup erstellt
- Environment-Konfiguration vorbereitet
- mock-first Architektur umgesetzt
- Adapter-Schnittstellen fuer `ioBroker` und `NinjaOne` angelegt
- `DeviceSyncService` fuer Vorschau und Synchronisation implementiert
- HTTP-Endpunkte fuer technische Tests bereitgestellt
- Build und TypeScript-Check erfolgreich ausgefuehrt

### Naechste Schritte

1. API-Research fuer `ioBroker.rest-api` abschliessen
2. Relevante ioBroker-Endpunkte fuer `objects` und `states` dokumentieren
3. API-Research fuer NinjaOne Public API abschliessen
4. OAuth-Flow fuer NinjaOne dokumentieren
5. erstes echtes Feldmapping definieren
6. realen `IoBrokerClient` implementieren
7. realen `NinjaOneClient` implementieren
8. End-to-End Test mit Kundenzugangsdaten durchfuehren

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
