# Architettura di SoLo

## Regole di prodotto

- Esperienza libera: **niente missioni, vittoria o progressione obbligatoria**. Racconti/luoghi opzionali possono essere scoperti, mai necessari per giocare.
- Il survival crea vincoli di risorse e conseguenze, non una condizione di completamento. Dopo una morte si può tornare nel mondo senza perdere tutte le scoperte.
- Il ciclo di luce segue l’orologio locale del dispositivo e l’andamento stagionale modellato per l’area di Salerno. Non esiste una simulazione accelerata dell’ora solare.
- Il gameplay deve funzionare offline dopo che i file sono disponibili nel browser (non è ancora una PWA con cache offline garantita). Nessun account o API di gioco.

## Layer e responsabilità

| Percorso | Contratto |
| --- | --- |
| `src/domain/catalog.js` | Definizioni degli oggetti, slot e ricette; niente DOM. |
| `src/domain/state.js` | Stato iniziale, schema v2 e sanitizzazione dati recuperati. |
| `src/domain/inventory.js` | Peso, trasferimento oggetti, consumo, crafting ed equipaggiamento. |
| `src/domain/vitals.js` | Fame, sete, energia, freddo e salute. |
| `src/domain/time.js` | Luce stagionale e testo dell’ora. Nessun uso implicito del frame time. |
| `src/domain/persistence.js` | Salva/carica con chiave `solo-save-v1` e migrazione non distruttiva dalle due chiavi precedenti. |
| `src/world/world.js` | Generatore originale preservato, integrazione espansione, collisioni, indice spaziale e API di query. |
| `src/world/expansion.js` | Nuova geografia e 11 regioni narrative con RNG e ID indipendenti dal mondo legacy. |
| `src/world/spatial.js` | Griglia per query rettangolari e culling degli oggetti vicini. |
| `src/render/scenery.js` | Disegno cartoon Canvas di macrobiomi, monumenti, paesaggi e dettagli ambientali. |
| `src/render/atlas.js` | Atlante globale e minimappa locale, con contratti geografici condivisi. |
| `src/app/game.js` | Orchestratore Canvas, input e interazioni col mondo. È il prossimo perimetro da scomporre ulteriormente in sistemi di gameplay, controlli e UI. |
| `scripts/build.mjs` | Converte i moduli ES in un HTML statico autonomo con import map e URL data senza modificare le sorgenti. |

**Flusso dipendenze:** `app` → `domain`/`world`/`render`; `render` → `domain` e dati `world`; `world` → `domain`. Il dominio non conosce né DOM né Canvas né la piattaforma di hosting.

## Contratti di gameplay

- Peso e quantità: un oggetto è acquisito soltanto se c’è capacità disponibile; fallimenti non devono consumare materiali o creare oggetti.
- Ricette: ogni ingrediente deve esistere e avere quantità positiva; un crafting può richiedere una postazione reale.
- Equipaggiamento: un oggetto può essere equipaggiato soltanto se presente nell’inventario; rimuoverne l’ultima unità rimuove anche l’equipaggiamento.
- Mondo: l’ordine di generazione e gli ID devono restare deterministici. Modificare la sequenza RNG può invalidare lo stato persistito di animali, auto, raccolti e edifici; serve un piano esplicito di migrazione.
- Salvataggi: snapshot JSON in locale. Schema `version:2` preservato dalla prima versione survival; la nuova chiave è distinta dai salvataggi precedenti. Non cancellare le chiavi legacy durante una migrazione.
- Rendering: la simulazione usa `dt` limitato per non causare danni istantanei al ritorno da una scheda sospesa. La crescita delle colture e la durata dei fuochi sono invece basate su timestamp reali.

## Qualità e incremento

1. Per un **nuovo oggetto** aggiornare il catalogo, le eventuali ricette e i test di peso/uso/equipaggiamento.
2. Per una **nuova zona** aggiornare generazione, regole di collisione e minimappa, poi controllare seed, ID e prestazioni.
3. Per un **nuovo sistema** introdurre moduli con input/output testabili anziché estendere indiscriminatamente `app/game.js`.
4. Verificare invarianti con `npm test`, startup e flussi reali con `npm run test:browser`, e generare la build con `npm run build`.
5. La CI GitHub è un gate per il codice, ma **non dimostra** correttezza su Safari reale, configurazione GitHub Pages, prestazioni di dispositivi economici o comportamento dopo deploy: servono prove distinte.

## Lavoro successivo (non ancora implementato)

- Interni delle case navigabili; deposito e costruzione di basi; contenitori fisici, ricette avanzate.
- Rifinire il modello di danno/ferite, fisiologia, fauna, equipaggiamenti durevoli e bilanciamento delle risorse.
- Separazione ulteriore dell’orchestratore in `movement`, `interaction`, `combat`, `farming`, `menus` ed eventi tipizzati.
- L'indice spaziale e le query di prossimità sono disponibili. Restano da aggiungere streaming dei chunk, LOD e misurazioni p95 FPS, latenza input e memoria su smartphone.
- Automazione di backup/export del salvataggio e versioning per future aggiunte allo schema.

Nessuna di queste funzioni è dichiarata pronta: SoLo rimane una prima bozza con fondamenta testabili.

## Espansione geografica v2
La mappa è 22.400 × 16.400 unità (11,96 volte l'area iniziale). La generazione del mondo originale è intenzionalmente invariata e precede quella delle nuove regioni: regressioni sugli ID persistiti sono bloccanti. I biomi, le testimonianze e i monumenti sono facoltativi. Vedere [WORLD.md](WORLD.md) per atlante e contratti.

## Hosting

La build statica autonoma viene generata da `npm run build` ed è distribuita tramite GitHub Pages. La verifica automatica del progetto deve essere positiva prima della pubblicazione. Non sono richiesti Worker, database, API né servizi esterni per eseguire il gioco; il salvataggio rimane locale e dipende dall'origine del browser.
