# Project Overview

## Dokumentinformationen

- Projekt: `ioBroker - NinjaOne Integration`
- Dokumenttyp: `Projektuebersicht`
- Stand: `01.07.2026`
- Status: `Working Draft`

## Ziel

Ziel des Projekts ist die Entwicklung eines eigenstaendigen Backend-Services, der Geraetedaten aus ioBroker ausliest, in ein internes Datenmodell ueberfuehrt und an NinjaOne uebertraegt.

Die Integration soll so aufgebaut werden, dass fachliche Logik, externe API-Anbindungen und technische Konfiguration klar voneinander getrennt sind. Dadurch bleibt die Loesung wartbar, testbar und spaeter erweiterbar.

## Projektbeschreibung

Im Projektkontext soll eine technische Schnittstelle zwischen zwei bestehenden Systemen aufgebaut werden:

- `ioBroker` als Datenquelle fuer Geraete-, Status- und ggf. Sensordaten
- `NinjaOne` als Zielsystem fuer die Weiterverarbeitung oder Synchronisation dieser Informationen

Die Anwendung wird als separates Node.js-Backend mit TypeScript umgesetzt. Kundenabhaengige Einstellungen wie Basis-URLs, Zugangsdaten und API-Parameter werden ausschliesslich ueber Umgebungsvariablen verwaltet. Harte Kodierung von produktionsrelevanten Konfigurationswerten ist nicht vorgesehen.

Fuer die fruehe Projektphase wird ein `mock-first` Ansatz verwendet. Das bedeutet, dass die technische Projektstruktur, die Business-Logik und die Schnittstellenvertraege bereits aufgebaut werden, auch wenn reale Kundenzugaenge oder finale API-Details noch nicht vollstaendig vorliegen. Reale API-Clients werden spaeter in die vorhandenen Adapter integriert.

## Business Context

Die Integration dient dazu, technische Daten aus einer operativen Quellumgebung konsistent in ein Zielsystem zu ueberfuehren. Typische Gruende fuer diese Integration sind:

- Vereinheitlichung von Geraeteinformationen
- Reduzierung manueller Uebertragungsschritte
- Aufbau einer reproduzierbaren technischen Schnittstelle
- Vorbereitung fuer spaetere Automatisierung oder Monitoring-Funktionen

## Scope

### Im Scope

- Entwicklung eines eigenstaendigen Backend-Services mit `Node.js` und `TypeScript`
- Klare Trennung zwischen Quellsystem, Business-Logik und Zielsystem
- Konfiguration ueber `.env` bzw. Umgebungsvariablen
- Aufbau eines internen Datenmodells fuer Geraeteinformationen
- Bereitstellung einer ersten HTTP-Schnittstelle fuer technische Tests
- Mock-Adapter fuer beide Systeme zur parallelen Entwicklung ohne produktive Zugaenge
- Vorbereitung fuer spaetere Anbindung der echten `ioBroker`- und `NinjaOne`-APIs

### Nicht im Scope

- Frontend oder Bedienoberflaeche fuer Endanwender
- Vollstaendige produktive Betriebsuebergabe
- Persistente Datenhaltung in einer Datenbank
- Komplexe Bidirektionalitaet zwischen beiden Systemen
- Mandantenfaehigkeit oder Multi-Customer-Betrieb in der ersten Ausbaustufe

## Voraussetzungen

Fuer die Umsetzung und spaetere produktive Anbindung werden folgende Voraussetzungen angenommen:

- Zugriff auf die technische Dokumentation von `ioBroker`
- Zugriff auf die technische Dokumentation von `NinjaOne`
- API-Zugangsdaten fuer beide Systeme
- Netzwerkzugriff zwischen dem Integrationsservice und beiden Zielendpunkten
- Testumgebung oder abgestimmte technische Freigabe fuer Integrations- und Verbindungstests

## Randbedingungen

- Die Loesung soll ohne harte Abhaengigkeit von einer konkreten Kundenumgebung entwickelt werden.
- Sicherheitsrelevante Daten duerfen nicht im Quellcode abgelegt werden.
- Die Business-Logik soll auch dann stabil bleiben, wenn sich die API-Anbindung in den Adaptern aendert.
- Die erste Projektphase priorisiert technische Struktur, Nachvollziehbarkeit und Erweiterbarkeit gegenueber Funktionsbreite.

## Erwartetes Ergebnis

Am Ende der initialen Projektphase liegt ein technisch belastbarer Integrationsservice mit folgenden Eigenschaften vor:

- lauffaehiges TypeScript-Backend
- definierte Projektstruktur fuer Services, Adapter, Konfiguration und HTTP-Einstiegspunkte
- dokumentierte Projekt- und Architekturgrundlage
- mockbasierter End-to-End Ablauf vom Datenbezug bis zur Synchronisationsantwort
- vorbereitete Austauschpunkte fuer reale API-Implementierungen

## Erfolgsindikatoren

Das initiale Projektziel gilt als erreicht, wenn folgende Kriterien erfuellt sind:

- der Service startet reproduzierbar in einer lokalen Entwicklungsumgebung
- Konfigurationswerte werden sauber ueber Umgebungsvariablen geladen
- Geraetedaten koennen ueber definierte Schnittstellen gelesen, normalisiert und weitergereicht werden
- die Integration ist technisch so strukturiert, dass echte API-Clients ohne Umbau der Business-Logik eingebunden werden koennen
- die Dokumentation ist fuer Projektleitung, Entwicklung und spaetere Uebergabe nachvollziehbar

## Aktueller Implementierungsstand

Der Integrationsservice liegt aktuell als `mock-first` Backend-Grundgeruest vor.

Bereits umgesetzt:

- TypeScript-Projektsetup
- zentrale Environment-Konfiguration
- getrennte Adapter-Struktur fuer `ioBroker` und `NinjaOne`
- Mock-Adapter fuer `ioBroker` und `NinjaOne`
- lesender Realadapter fuer `ioBroker` auf Basis von `ioBroker.rest-api`
- schreibender Realadapter fuer `NinjaOne` auf Basis der Public API v2
- separater Business-Service fuer Geraetevorschau und Synchronisation
- minimale HTTP-Endpunkte:
  - `GET /health`
  - `GET /devices`
  - `POST /sync`
- mockbasierter End-to-End Ablauf:
  - Mock-ioBroker liefert `3` Testgeraete
  - `DeviceSyncService` verarbeitet die Daten
  - Mock-NinjaOne bestaetigt `3` erfolgreiche Synchronisationen

Noch nicht umgesetzt:

- produktives Mapping zwischen ioBroker-Datenpunkten und fachlich freigegebenen NinjaOne-Zielattributen
- echte End-to-End Validierung gegen reale Kundensysteme

Teilweise umgesetzt:

- reale lesende HTTP-Anbindung an `ioBroker`
- reale schreibende HTTP-Anbindung an `NinjaOne`
- Synchronisationsstrategie fuer bestehende `NinjaOne`-Devices ueber Match + Update
- technischer Schreibpfad nach `NinjaOne` ueber `userData` und optional `custom-fields`
- technische Validierung des `NinjaOne`-Realadapters gegen einen echten Tenant steht noch aus

Verifikation:

- `npm run check` erfolgreich
- `npm run build` erfolgreich
- Mock-Synchronisation erfolgreich mit `3` verarbeiteten und `3` synchronisierten Geraeten
- lesender `ioBroker`-Realadapter gegen ein reales Kundensystem technisch nachvollzogen
- `NinjaOne`-OAuth- und Schreiblogik im Code implementiert, aber noch nicht gegen reale Zugangsdaten validiert

Hinweis:

Der aktuelle Stand ist bewusst kein fertiger produktiver Connector, sondern ein vorbereiteter Backend-Kern. Die reale Integration kann nun durch Austausch der Adapter in `src/integrations/*` umgesetzt werden, ohne die Business-Logik in `DeviceSyncService` grundlegend zu veraendern.
