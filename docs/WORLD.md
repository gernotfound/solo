# SoLo · Atlante del mondo

SoLo è un sandbox post-apocalittico **senza missioni obbligatorie**. La storia emerge dalla geografia, dalle testimonianze e dagli oggetti abbandonati. Le regioni sono esplorabili nell'ordine preferito dal giocatore.

## Superficie e struttura
- Nuova mappa: **22.400 × 16.400 unità** = 367.360.000 unità²; precedente: 6.400 × 4.800 = 30.720.000 unità²; ampliamento **11,96×**.
- Vecchia area preservata alle coordinate originarie. Nessun ID, oggetto o animale preesistente spostato.
- 11 nuove regioni, sette aree originali dotate di storia, 18 punti d'interesse in totale.
- Nove arterie aggiuntive, quattro nuclei urbani, acqua e campagna, boschi, centinaia di veicoli.
- Minimap locale (3.100 × 2.350 unità) e atlante globale interattivo.

## Regioni e storia
| Luogo | Memoria del mondo |
| --- | --- |
| Rifugio Zero | Una famiglia lasciò la casa come se fosse dovuta tornare |
| Lago delle Felci | Scomparvero le barche ma restarono le reti |
| Bosco dei Pini | Il guardaboschi smise di contare i giorni |
| Centro abbandonato | La città fu evacuata un quartiere alla volta |
| Commissariato | Una chiamata proveniva da una linea scollegata |
| Campi di Ruggine | I contadini continuarono a seminare dopo il blackout |
| Stazione Radio | Una voce si trasformò in statica |
| Corridoio dell'Esodo | Una strada aperta soltanto in uscita finì in un blocco |
| Porto della Nebbia | Le navi partirono senza equipaggio |
| Sanatorio del Vento | L'ospedale trasmise bollettini meteo invece dei pazienti |
| Fornaci di Ferro | I cancelli furono saldati dall'interno |
| Altipiano delle Antenne | Ripetitori ancora attivi senza ascoltatori |
| Saline Dimenticate | L'acqua invase i campi durante una notte |
| Perimetro Rosso | Nessuna revoca della quarantena fu mai firmata |
| Frutteti del Sud | Qualcuno continuò a potare per mesi |
| Cava delle Ombre | Operai riferirono rumori sotto la roccia |
| Caserma Muta | Un cambio turno non avvenne mai |
| Costa Spezzata | Il faro continua a lampeggiare senza elettricità |

Ogni macroregione nuova possiede un monumento visivo e due testimonianze raccoglibili; la loro scoperta non produce obiettivi da completare.

## Vincoli architetturali
1. La generazione originale avviene **prima** dell'espansione: niente variazioni alla sua sequenza RNG, agli ID e alle coordinate; i progressi già salvati devono rimanere validi.
2. L'espansione usa RNG indipendente, ID stabili con prefisso exp- e geometria descritta in src/world/expansion.js.
3. L'indice spaziale in src/world/spatial.js serve query locali per rendering, collisioni, crafting e interazioni; evita di scorrere l'intero mondo a ogni frame.
4. La vista ravvicinata e l'atlante usano geometrie condivise in src/render/atlas.js. Nuovi oggetti e risorse devono mantenere collisioni, rappresentazione e comportamento coerenti.
5. L'aggiunta di una zona richiede: identità geografica, connessioni praticabili, testimonianze, risorse e test. Non va introdotta una progressione obbligatoria.

## Verifica e limiti
La suite include test di determinismo, ID legacy, note e regioni, collocazione e querying degli oggetti, collisioni, atlante, segnaposti e schermate desktop/mobile.

L'espansione resta **una prima bozza**: edifici non ancora esplorabili all'interno, auto non guidabili, monumenti scenici e narrazione statica. Profiling su Safari/iPhone, misure di memoria, LOD e caricamento a chunk saranno necessari prima di ulteriori aumenti di scala.
