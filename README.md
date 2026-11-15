# SoLo

Gioco cartoon post-apocalittico **sandbox**, dall’alto, per desktop e smartphone. **Nuovo atlante: 22.400 × 16.400 unità** con 18 punti d'interesse ambientali, senza missioni obbligatorie. Nessuna missione o conclusione obbligatoria: il giocatore esplora, raccoglie, costruisce, coltiva, caccia e sopravvive al proprio ritmo.

**Gioca:** https://gernotfound.github.io/solo/ (GitHub Pages).

## Sviluppo

Richiede Node.js 22+; nessuna dipendenza npm di runtime.

```sh
npm run check     # sintassi di tutti i moduli
npm test          # regole e contratti: Node Test Runner
npm run build     # crea dist/index.html autonomo
npm run test:browser  # Playwright Python 1.57 + Chromium; esegue la build generata
npm run benchmark     # confronto CPU su geometria, non FPS del browser
```

Per sviluppo locale servire `index.html` con un server HTTP statico: l'app usa moduli ES nativi. Per la pubblicazione distribuire l’HTML in `dist/`, generato dai moduli versionati.

La repository GitHub `gernotfound/solo` è **l’unica fonte del codice** e GitHub Pages ne pubblica la build, generata dalla CI. I progressi sono salvati soltanto in `localStorage` sul dispositivo, senza account né server applicativo. **Cambiando dominio, i vecchi salvataggi non vengono trasferiti automaticamente**.

Vedi [ARCHITECTURE.md](docs/ARCHITECTURE.md) per contratti, struttura, dati persistiti e criterio di estensione.

**Mondo:** [Atlante e regioni](docs/WORLD.md) — undici macroregioni aggiuntive, mappe locali, biomi differenziati e ricerca dei luoghi d'interesse.

## Pubblicazione

La CI [Verify SoLo](.github/workflows/verify.yml) verifica le modifiche a `main`. Solo dopo una verifica positiva, [Publish SoLo](.github/workflows/pages.yml) compila i sorgenti e distribuisce `dist/index.html` su GitHub Pages. Pages è già attivo. È possibile ripetere manualmente la pubblicazione da **Actions → Publish SoLo to GitHub Pages → Run workflow**.

## Mondo reattivo

Gli oggetti lasciati dall'inventario compaiono sul terreno e possono essere raccolti anche dopo un riavvio. Auto, edifici, casse, cespugli e alberi mostrano visivamente se sono già stati perquisiti o raccolti. La figura del personaggio è ridisegnata in vista zenitale; il terreno ha dettagli coerenti con i biomi. Nessun sistema di ricordi collezionabili.

## Prestazioni

Il terreno statico viene riutilizzato tramite tessere Canvas LRU (budget massimo di 24 MiB). Le strade fuori dalla visuale sono escluse dal disegno; le interrogazioni di vicinanza usano un indice di segmenti. La luce naturale viene calcolata al massimo una volta al secondo, e durante l'apertura dei menu il mondo è ridisegnato meno frequentemente. Il salvataggio automatico è temporizzato, ma ogni interazione continua a salvarsi subito. I benchmark Node confrontano la nuova geometria con quella precedente; per verificare gli FPS reali sono necessarie prove su dispositivi reali.

**Profilazione browser:** dopo `npm run build`, eseguire `npm run profile:browser`. Il profilo salva un JSON in `artifacts/performance/chromium.json` e viene eseguito anche da GitHub Actions con artifact scaricabile. Vedere [PERFORMANCE.md](docs/PERFORMANCE.md) per scenari, interpretazione delle misure e limiti.
