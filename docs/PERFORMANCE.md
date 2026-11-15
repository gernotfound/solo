# SoLo · Profilazione delle prestazioni

## Scopo e riproducibilità

La suite in `tests/profile_browser.py` misura la build standalone esatta di SoLo
dentro **Chromium headless Playwright**, senza dipendenze runtime, senza servizi
di telemetria e senza usare salvataggi del giocatore. Viene eseguita da GitHub Actions
dopo il build e produce `artifacts/performance/chromium.json` (artifact CI).

Avvio locale: `npm run build && npm run profile:browser`.
Non c'è una soglia rigida di FPS che fallisce la CI: l'hardware dei runner è
variabile. La suite fallisce per errori JS, frame mancanti, memoria della cache
oltre il budget, corsa senza movimento o assenza delle transizioni richieste.

## Metriche

- **FPS da RAF:** frequenza osservata degli eventi `requestAnimationFrame`;
  non include il tempo di composizione GPU dopo il callback.
- **RAF p50 / p95 / massimo:** intervallo temporale tra callback; un p95 elevato
  segnala frame irregolari, ma può dipendere dal runner CI.
- **Callback CPU p50 / p95 / massimo:** durata sincrona del ciclo di gioco
  dentro il callback. Non include il rendering GPU e non identifica da solo
  il singolo sottosistema lento.
- **Frame >33,4 ms / >50 ms:** conteggio degli intervalli lunghi.
- **Cache:** tessere costruite/riutilizzate e bytes stimati; è un budget stimato
  dei buffer Canvas, **non** la memoria complessiva del browser.
- **Heap JS:** `performance.memory` se disponibile, non è misura affidabile
  di memoria grafica, GC o consumi del dispositivo.

## Scenari

| Scenario | Posizione / azione | Scopo |
|---|---|---|
| openCountry | Rifugio Zero, 1280×720 | Riferimento su terreno rurale |
| denseOldCity | Centro storico, 1280×720 | Edifici/oggetti fitti |
| industrialTown | Zona industriale, 1280×720 | Altra maglia di strade |
| sprintOnRoad | Corsa reale con Shift+D, 1280×720 | Caricamento progressivo di tessere e collisioni |
| regionTransitions | Salti di camera fra più macroregioni, 1280×720 | Stress del ricambio di tessere; **teleport diagnostico, non spostamento normale** |
| mobileViewportCity | Città, viewport 390×844 con touch | Costi su viewport mobile **emulato in Chromium desktop** |

Il profiler inserisce un wrapper di RAF e una funzione di posizionamento
**solo nella copia HTML in memoria usata per il test**: il codice pubblicato
non espone comandi di teletrasporto o dati di profiling.

## Interpretazione

Confrontare mediana e p95 sullo stesso ambiente e sullo stesso SHA. Eseguire
più ripetizioni prima di decidere su scostamenti piccoli; i test di CI non
costituiscono un benchmark hardware stabile. L'ultima pubblicazione GitHub
Pages non viene alterata da misurazioni di una PR.

Per misurare realmente un iPhone/Safari servono strumenti di profiling su
un dispositivo fisico. La simulazione mobile via Chromium non dimostra prestazioni
su iOS, né il profiler misura latenza dell'input end-to-end o GPU.

**Criterio di intervento:** correggere un collo di bottiglia se la causa è
riproducibile, preservando geometria, dati salvati, grafica e funzionalità;
ricontrollare le misure sul codice candidato e il gate Canonical Verification.
