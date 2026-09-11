# markdown-to-gdoc

Google Docs z markdownu přes `gws` CLI. Tabulky, vnořené seznamy, kód, citace, odkazy, obrázky, taby a dokumenty ze šablon.

## Skilly

- **markdown-to-gdoc** -- vytvoření dokumentu (Drive import nebo kopie šablony), přepis či doplnění tabu, diff dokumentu proti markdownu před přepisem, správa tabů, výpis komentářů, cílené úpravy přes `batchUpdate`.

## Skripty

`scripts/gdoc.sh <create|write|diff|outline|tab|comments|test>` -- najde node (PATH nebo nvm), při prvním použití nainstaluje `markdown-it`, spustí příslušný `gdoc-*.js`. Knihovny v `scripts/lib/`, testy v `scripts/test/` (`gdoc.sh test`, `gdoc.sh test --live` proti skutečnému API).

## Předpoklady

- `gws` CLI (Google Workspace CLI) přihlášené účtem se scopy `documents` a `drive`.
- Node 20+ (PATH nebo `~/.nvm`), npm pro první instalaci závislosti.
