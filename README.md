# SoLo

Gioco cartoon post-apocalittico **sandbox**, dall’alto, per desktop e smartphone. **Nuovo atlante: 22.400 × 16.400 unità** con 18 luoghi narrativi, senza missioni obbligatorie. Nessuna missione o conclusione obbligatoria: il giocatore esplora, raccoglie, costruisce, coltiva, caccia e sopravvive al proprio ritmo.

**Gioca:** https://gernotfound.github.io/solo/ (GitHub Pages; richiede l'attivazione iniziale nelle impostazioni della repository).

## Sviluppo

Richiede Node.js 22+; nessuna dipendenza npm di runtime.

```sh
npm run check     # sintassi di tutti i moduli
npm test          # regole e contratti: Node Test Runner
npm run build     # crea dist/index.html autonomo
npm run test:browser  # Playwright Python 1.57 + Chromium; esegue la build generata
```

Per sviluppo locale servire `index.html` con un server HTTP statico: l'app usa moduli ES nativi. Per la pubblicazione distribuire l’HTML in `dist/`, generato dai moduli versionati.

La repository GitHub `gernotfound/solo` è **l’unica fonte del codice** e GitHub Pages ne pubblica la build, generata dalla CI. I progressi sono salvati soltanto in `localStorage` sul dispositivo, senza account né server applicativo. **Cambiando dominio, i vecchi salvataggi non vengono trasferiti automaticamente**.

Vedi [ARCHITECTURE.md](docs/ARCHITECTURE.md) per contratti, struttura, dati persistiti e criterio di estensione.

**Mondo:** [Atlante e regioni](docs/WORLD.md) — undici macroregioni aggiuntive, mappe locali, racconti ambientali e ricerca dei luoghi d'interesse.

## Pubblicazione

La CI [Verify SoLo](.github/workflows/verify.yml) verifica le modifiche a `main`. Solo dopo una verifica positiva, [Publish SoLo](.github/workflows/pages.yml) compila i sorgenti e distribuisce `dist/index.html` su GitHub Pages. Alla prima attivazione, aprire **Settings → Pages → Build and deployment → Source: GitHub Actions**. È possibile ripetere manualmente la pubblicazione da **Actions → Publish SoLo to GitHub Pages → Run workflow**.
