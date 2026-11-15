# SoLo

Gioco cartoon post-apocalittico **sandbox**, dall’alto, per desktop e smartphone. **Nuovo atlante: 22.400 × 16.400 unità** con 18 luoghi narrativi, senza missioni obbligatorie. Nessuna missione o conclusione obbligatoria: il giocatore esplora, raccoglie, costruisce, coltiva, caccia e sopravvive al proprio ritmo.

**Gioca:** https://ultimo-viandante.califano-ger.workers.dev/ (indirizzo storico, nome in gioco **SoLo**).

## Sviluppo

Richiede Node.js 22+; nessuna dipendenza npm di runtime.

```sh
npm run check     # sintassi di tutti i moduli
npm test          # regole e contratti: Node Test Runner
npm run build     # crea dist/index.html autonomo
npm run test:browser  # Playwright Python 1.57 + Chromium; esegue la build generata
```

Per sviluppo locale servire `index.html` con un server HTTP statico: l'app usa moduli ES nativi. Per la pubblicazione distribuire l’HTML in `dist/`, generato dai moduli versionati.

La repository GitHub `gernotfound/solo` è **l’unica fonte del codice**. Cloudflare ospita la build. I progressi sono salvati esclusivamente in `localStorage` sul dispositivo, senza account o server applicativo.

Vedi [ARCHITECTURE.md](docs/ARCHITECTURE.md) per contratti, struttura, dati persistiti e criterio di estensione.

**Mondo:** [Atlante e regioni](docs/WORLD.md) — undici macroregioni aggiuntive, mappe locali, racconti ambientali e ricerca dei luoghi d'interesse.
