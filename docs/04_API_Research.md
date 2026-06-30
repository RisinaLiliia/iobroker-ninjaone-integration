# API Research

## Dokumentinformationen

- Projekt: `ioBroker - NinjaOne Integration`
- Dokumenttyp: `API Research`
- Stand: `29.06.2026`
- Status: `In Progress`

## Ziel des Dokuments

Dieses Dokument dient als technische Arbeitsgrundlage fuer die reale Anbindung von `ioBroker` und `NinjaOne`. Es wird schrittweise erweitert und soll fuer die Implementierung der echten Adapter eine belastbare Referenz sein.

## Research Vorgehen

Pro API werden dokumentiert:

- offizieller Einstiegspunkt
- Authentifizierungsverfahren
- relevante Endpunkte fuer den Integrationsfall
- erste technische Bewertung fuer das Projekt
- offene Fragen vor Implementierung

## Zwischenfazit

Aktuell ist die technische Richtung ausreichend klar, um die Implementierung der Realadapter vorzubereiten:

- fuer `ioBroker` ist `ioBroker.rest-api` der bevorzugte Einstiegspunkt
- fuer `NinjaOne` ist die Public API v2 mit Bearer-Token-Authentifizierung der relevante Einstiegspunkt
- fuer beide Systeme ist die fachliche Definition des finalen Feldmappings noch offen

Gleichzeitig hat sich der Projektstand seit der ersten Research-Fassung veraendert:

- ein erster lesender Realadapter fuer `ioBroker` ist bereits im Code vorhanden
- die Business-Logik verarbeitet reale `ioBroker`-Responses bereits in das interne `NormalizedDevice` Modell
- fuer `NinjaOne` existiert weiterhin noch kein Realadapter

## ioBroker

### Offizieller Einstiegspunkt

Primarer Kandidat fuer die Integration ist der offizielle Adapter `ioBroker.rest-api`.

Technische Hinweise aus den offiziellen Quellen:

- Swagger UI ist standardmaessig unter `http://<host>:8093/` verfuegbar
- der dokumentierte API-`basePath` ist `/v1`
- alternativ kann der Adapter als Web Extension unter `http://<host>:8082/rest-api/` laufen

### Technische Bewertung

Fuer dieses Projekt ist `ioBroker.rest-api` fachlich und technisch der beste Startpunkt, weil:

- States und Objects per HTTP lesbar sind
- es eine dokumentierte Swagger-Definition gibt
- Authentifizierung bereits vorgesehen ist
- Long Polling und URL Hooks fuer spaetere Erweiterungen verfuegbar sind

### Authentifizierung

Laut offizieller Dokumentation werden drei Varianten unterstuetzt:

- Query Credentials: `user` und `pass` in der Query
- Basic Authentication ueber `Authorization: Basic ...`
- OAuth2 Bearer Token ueber `Authorization: Bearer <token>`

Der dokumentierte Token-Endpunkt ist:

```text
/oauth/token?grant_type=password&username=<user>&password=<password>&client_id=ioBroker
```

### Aktueller Implementierungsstand

Der aktuelle Code verwendet fuer `ioBroker` bereits einen lesenden REST-Adapter:

- Implementierung: `src/integrations/iobroker/ioBrokerRestClient.ts`
- Aktivierung: `createIoBrokerClient()` schaltet bei `MOCK_IOBROKER=false` auf den Realadapter um
- Authentifizierung im aktuellen Code: `Basic Authentication`
- Konfiguration ueber Environment:
  - `IOBROKER_BASE_URL`
  - `IOBROKER_USERNAME`
  - `IOBROKER_PASSWORD`
  - `IOBROKER_OBJECT_FILTER`
  - `IOBROKER_OBJECT_TYPE`
  - `IOBROKER_REQUEST_TIMEOUT_MS`

Der Adapter liest aktuell:

1. per `GET /v1/objects?filter=...&type=...` moegliche Geraete
2. pro Geraet per `GET /v1/objects?filter=<deviceId>.*&type=state` die zugehoerigen State-Objekte
3. pro State per `GET /v1/state/{stateId}` den aktuellen Wert

Anschliessend wird ein `NormalizedDevice` mit folgenden Kernfeldern aufgebaut:

- `externalId`
- `name`
- `health`
- `ipAddress`
- `lastSeenAt`
- `metrics[]`
- `raw`

Der aktuelle Realadapter ist bewusst lesend ausgelegt. Schreiboperationen nach `ioBroker` sind derzeit nicht Teil der Implementierung.

### Relevante Endpunkte fuer das Projekt

| Endpoint | Zweck | Status | Implementiert |
|---|---|---|---|
| `GET /v1/state/{stateId}` | einzelnen State lesen | recherchiert | `Ja` |
| `PATCH /v1/state/{stateId}` | State schreiben oder aktualisieren | recherchiert | `Nein` |
| `GET /v1/state/{stateId}/plain` | reinen State-Wert lesen | recherchiert | `Ja` |
| `GET /v1/state/{stateId}/subscribe` | State-Aenderungen abonnieren | recherchiert | `Nein` |
| `GET /v1/object/{objectId}` | einzelnes Object lesen | recherchiert | `Ja` |
| `POST /v1/object/{objectId}` | Object neu anlegen | recherchiert | `Nein` |
| `PUT /v1/object/{objectId}` | Object aktualisieren oder anlegen | recherchiert | `Nein` |
| `GET /v1/objects?filter=...` | Liste von Objects per Pattern abrufen | recherchiert | `Ja` |
| `POST /v1/objects/subscribe` | Object-Updates abonnieren | recherchiert | `Nein` |
| `GET /v1/command/getStates` | States ueber Socket-Command abrufen | recherchiert | `Nein` |
| `GET /v1/command/getObject` | Object ueber Socket-Command abrufen | recherchiert | `Nein` |
| `GET /v1/command/getObjectView` | Object-View gezielt abfragen | recherchiert | `Nein` |
| `GET /v1/sendto/{instance}` | Nachricht an Adapter/Instanz senden | recherchiert | `Nein` |

### Fuer das Projekt besonders relevante Beobachtungen

- `ioBroker` bietet kein offensichtliches einzelnes REST-Konzept "Device" wie ein klassisches RMM.
- Fachlich wird ein "Geraet" sehr wahrscheinlich aus einer Kombination von `object`-Struktur, `state`-Werten und Namenskonventionen abgeleitet.
- Die Endpunkte `GET /v1/objects` und `GET /v1/object/{objectId}` sind voraussichtlich der wichtigste Einstieg fuer die Geraetedefinition.
- Die Endpunkte `GET /v1/state/{stateId}` und ggf. `GET /v1/state/{stateId}/plain` sind fuer Status-, Wert- und Telemetriedaten relevant.
- Long Polling und Web Hooks sind vorhanden, fuer die erste Projektphase aber nicht zwingend noetig.
- Der aktuelle Code setzt voraus, dass relevante Geraete ueber `object.type=device` oder einen vergleichbaren Filter identifizierbar sind.
- Die reale Struktur im Kundensystem ist noch nicht validiert. Der aktuell gesetzte Filter kann je nach Namespace auch `0` Treffer liefern.

### Erste Integrationsstrategie fuer ioBroker

Empfohlener Start fuer den ersten Realadapter:

1. per `GET /v1/objects?filter=...` relevante Geraetestrukturen identifizieren
2. pro Geraet die benoetigten States bestimmen
3. per `GET /v1/state/{stateId}` die fachlich relevanten Werte lesen
4. in das interne `NormalizedDevice` Modell ueberfuehren

### Beispielhafte Requests

```http
GET /v1/state/system.adapter.rest-api.0.memHeapTotal
Authorization: Bearer <token>
```

```http
GET /v1/objects?filter=modbus.0.*&type=device
Authorization: Bearer <token>
```

### Validierte Namenspaces und State-Konverntionen

### Getestete Namenspaces 

- zigbee.*
- shelly.*
- deconz.*
- lovelace.*
- sourceanalitix.*

### Verwendete State-Suffixe

Health

- alive
- connented
- reachable
- online

IP-Address

- ip
- ipAddrese
- localIp

LastSeen

- lastSeen
- last_seen
- heartbeat

Metriken 

- power
- energy
- voltage 
- current
- temperature
- humidity
- link_quality

### Offene Punkte fuer ioBroker

- Welcher Adapter bzw. Namensraum repraesentiert im Zielsystem tatsaechlich die zu synchronisierenden Geraete?
- Welche `object.type` Werte sind relevant: `device`, `channel`, `state` oder eine Kombination?
- Welche konkreten State-IDs liefern `health`, `displayName`, `ipAddress` und `lastSeenAt`?
- Reicht Polling fuer Phase 1 oder wird spaeter Subscription benoetigt?
- Muss fuer bestimmte Kundensysteme statt `type=device` auf `channel` oder direkte `state`-Strukturen gewechselt werden?

## NinjaOne

### Offizieller Einstiegspunkt

Die offizielle Dokumentation liegt unter `NinjaOne Public API` und stellt JSON-Spezifikationen fuer:

- `authorization.json`
- `NinjaRMM-API-v2.json`

bereit.

### Authentifizierung

Die Public API dokumentiert einen OAuth2-basierten Einstieg ueber:

- `GET /ws/oauth/authorize`
- `POST /ws/oauth/token`

Relevante Parameter fuer `authorize`:

- `response_type`
- `client_id`
- `redirect_uri`
- `state`
- `scope`
- optional `client_secret`
- optional PKCE-Felder `code_challenge` und `code_challenge_method`

Der Token-Response enthaelt laut offizieller Spezifikation:

- `access_token`
- `expires_in`
- `token_type`
- optional `refresh_token`
- `scope`

### Wichtige Beobachtung zur Authentifizierung

Die Authorization-Spezifikation beschreibt explizit `authorization code` und `implicit` als unterstuetzte Flows. Gleichzeitig enthaelt das Token-Request-Schema auch `client_credentials` und `refresh_token` als erlaubte `grant_type` Werte.

Fuer dieses Projekt bedeutet das:

- Bearer Token sind der richtige technische Zielpfad
- der exakte Flow fuer eine serverseitige Integration muss vor Implementierung noch verifiziert werden
- `sessionKey` per Cookie ist in der Core-Spezifikation vorhanden, wirkt fuer dieses Backend-Projekt aber nicht wie die bevorzugte Integrationsstrategie

### Security Model laut Core Spec

Die Core API v2 nennt zwei Sicherheitsmechanismen:

- `oauth2` als Bearer-Authentifizierung
- `sessionKey` als Cookie-basierter API-Key

Fuer den Integrationsservice wird vorlaeufig `oauth2` als Zielmodell angesetzt.

### Aktueller Implementierungsstand

Fuer `NinjaOne` existiert derzeit noch kein Realadapter.

- bei `MOCK_NINJAONE=true` wird `MockNinjaOneClient` verwendet
- bei `MOCK_NINJAONE=false` wird aktuell `UnsupportedNinjaOneClient` instanziiert
- ein realer OAuth-Flow und echte HTTP-Requests gegen `NinjaOne` sind noch nicht im Code vorhanden

Das bedeutet:

- die Public API ist fachlich vorrecherchiert
- die technische Zielrichtung ist bekannt
- die echte Implementierung ist weiterhin ein naechster Projektschritt

### Relevante Endpunkte fuer den Integrationsfall

| Endpoint | Zweck | Status | Implementiert |
|---|---|---|---|
| `GET /v2/devices` | Liste von Devices mit Basisdaten | recherchiert | `Nein` |
| `GET /v2/devices-detailed` | Liste von Devices mit erweiterten Daten | recherchiert | `Nein` |
| `GET /v2/device/{id}` | Device-Details lesen | recherchiert | `Nein` |
| `PATCH /v2/device/{id}` | Device-Informationen aktualisieren | recherchiert | `Nein` |
| `GET /v2/device/{id}/custom-fields` | Device Custom Fields lesen | recherchiert | `Nein` |
| `PATCH /v2/device/{id}/custom-fields` | Device Custom Fields aktualisieren | recherchiert | `Nein` |
| `GET /v2/devices/search` | Devices suchen | recherchiert | `Nein` |
| `GET /v2/organization/{id}/devices` | Devices einer Organization abrufen | recherchiert | `Nein` |
| `GET /v2/organizations` | Organization-Liste lesen | recherchiert | `Nein` |
| `GET /v2/organizations-detailed` | erweiterte Organization-Liste lesen | recherchiert | `Nein` |
| `GET /v2/groups` | gespeicherte Suchgruppen lesen | recherchiert | `Nein` |
| `GET /v2/device-custom-fields` | verfuegbare Device-Felddefinitionen lesen | recherchiert | `Nein` |

### Fuer das Projekt besonders relevante Beobachtungen

Die offizielle Spezifikation von `GET /v2/devices` nennt bereits viele Felder, die fuer das interne Modell relevant sind, unter anderem:

- `id`
- `uid`
- `organizationId`
- `locationId`
- `offline`
- `displayName`
- `systemName`
- `dnsName`
- `lastContact`
- `lastUpdate`
- `tags`

Zusatzbeobachtungen:

- `GET /v2/devices` unterstuetzt `df`, `pageSize` und `after` fuer Filterung und Pagination
- `GET /v2/devices-detailed` ist wahrscheinlich fuer spaeteres erweitertes Mapping relevant
- `PATCH /v2/device/{id}` und `PATCH /v2/device/{id}/custom-fields` sind die naheliegendsten Kandidaten fuer eine spaetere Schreibintegration
- `GET /v2/device-custom-fields` ist wichtig, um Schreibziele fuer benutzerdefinierte Felder vorab zu verstehen

### Erste Integrationsstrategie fuer NinjaOne

Empfohlener Start fuer den ersten Realadapter:

1. Authentifizierungsflow technisch verifizieren
2. per `GET /v2/devices` pruefen, ob bestaetigte Zielgeraete bereits existieren
3. per `GET /v2/device-custom-fields` die verfuegbaren Zielfelder analysieren
4. entscheiden, ob Synchronisation ueber:
   - `PATCH /v2/device/{id}`
   - `PATCH /v2/device/{id}/custom-fields`
   - oder eine Kombination
   erfolgen soll

### Beispielhafte Requests

```http
GET /v2/devices?pageSize=100
Authorization: Bearer <access_token>
```

```http
GET /v2/device/12345/custom-fields
Authorization: Bearer <access_token>
```

```http
PATCH /v2/device/12345/custom-fields
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Offene Punkte fuer NinjaOne

- Ist fuer dieses Projekt `authorization_code` oder `client_credentials` der korrekte Flow?
- Sollen Daten in Standard-Device-Felder oder in `custom-fields` geschrieben werden?
- Welche NinjaOne-ID wird als Referenz gegen `ioBroker` verwendet: `id`, `uid` oder ein Custom Field?
- Muss die Zuordnung ueber `organizationId` bzw. `locationId` erfolgen?

## Mapping Research

### Vorlaeufiges internes Modell

| Internes Feld | ioBroker Quelle | NinjaOne Ziel | Status |
|---|---|---|---|
| `externalId` | offen, wahrscheinlich Object-ID oder technische Geraete-ID | `uid`, `id` oder Custom Field | offen |
| `name` | Object-Name oder State-Metadaten | `displayName` oder Custom Field | teilgeklaert |
| `health` | State-Werte oder Connectivity-Zustand | `offline` invertiert oder Custom Field | offen |
| `site` | ioBroker-Struktur, Raum oder Gruppierung | `organization` / `location` / Custom Field | offen |
| `ipAddress` | State oder Object-Native-Daten | moeglich als Device-Feld oder Custom Field | offen |
| `lastSeenAt` | State-Timestamp oder Last-Update-Feld | `lastContact` / `lastUpdate` oder Custom Field | teilgeklaert |
| `metrics[]` | mehrere States pro Geraet | sehr wahrscheinlich Custom Fields oder kein 1:1 Mapping | offen |

### Aktuelle Mapping-Einschaetzung

- `ioBroker` ist strukturell flexibler als `NinjaOne`.
- Ein direktes 1:1 Mapping ist unwahrscheinlich.
- Das interne `NormalizedDevice` Modell bleibt deshalb notwendig.
- Fuer Phase 1 ist es sinnvoll, nur ein minimales Feldset produktiv zu uebertragen.

## Empfohlene naechste technische Schritte

1. Den vorhandenen `IoBrokerRestClient` gegen ein echtes Kundensystem validieren.
2. Relevante Namespaces, `object.type` Werte und State-IDs im Zielsystem dokumentieren.
3. Einen technischen Spike fuer den `NinjaOne`-Auth-Flow bauen.
4. Testen, ob `PATCH /v2/device/{id}/custom-fields` der praktikabelste Schreibpfad ist.
5. Erst danach das produktive Feldmapping finalisieren.

## Offene Fragen

- Welche konkrete ioBroker-Datenquelle repraesentiert im Kundensystem ein "Device"?
- Welche Mindestfelder muessen in Phase 1 wirklich nach NinjaOne uebertragen werden?
- Darf die Integration neue Zielobjekte anlegen oder nur bestehende aktualisieren?
- Welche Fehler duerfen zu einem Retry fuehren und welche muessen hart abbrechen?

## Offizielle Quellen

- ioBroker REST API Adapter README: `https://github.com/ioBroker/ioBroker.rest-api`
- ioBroker REST API Swagger: `https://raw.githubusercontent.com/ioBroker/ioBroker.rest-api/master/src/lib/api/swagger/swagger.yaml`
- NinjaOne Public API UI: `https://app.ninjaone.com/apidocs/`
- NinjaOne Authorization Spec: `https://app.ninjaone.com/apidocs/authorization.json`
- NinjaOne Core API v2 Spec: `https://app.ninjaone.com/apidocs/NinjaRMM-API-v2.json`
