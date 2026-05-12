---
name: asana-mcp-setup
description: Použij když Asana MCP server v Claude Code nefunguje, nelze ho autentikovat, vyžaduje znovu autorizaci, nebo když se nastavuje úplně poprvé. Triggery "asana mcp nefunguje", "asana se nepřihlásí", "needs authentication asana", "ofid error", "redirect_uri does not match", "nastavit asanu v claude code", "OAuth Asana".
---

# Asana MCP Setup pro Claude Code

Postup pro nastavení nebo obnovu Asana MCP V2 serveru v Claude Code. Vychází z reálných peripetiích — Asana V2 má specifická omezení, která dělají autentikaci křehkou.

## Kontext: proč to bývá rozbité

1. **V1 SSE server (`mcp.asana.com/sse`) byl vypnutý 11. května 2026.** Cokoli, co používalo `https://mcp.asana.com/sse`, přestalo fungovat.
2. **V2 server (`mcp.asana.com/v2/mcp`) NEPODPORUJE Dynamic Client Registration (RFC 7591).** Claude Code se v default `claude.ai Asana` integraci pokouší o dynamickou registraci → Asana ji odmítne → autentikace selže s chybou typu `ofid_...`. Tahle integrace je v Claude Code aktuálně nefunkční pro Asanu.
3. **Personal Access Token (PAT) pro V2 NEFUNGUJE.** Asana to explicitně neumožňuje, OAuth s pre-registrovaným appem je jediná cesta.
4. **Známý Claude Code bug ([#55067](https://github.com/anthropics/claude-code/issues/55067))**: při re-auth někdy volí náhodný port místo configured callback portu. Mitigace níže.

Jediná funkční cesta: **lokální `asana` MCP server s vlastní OAuth aplikací registrovanou v Asana developer console**.

## Krok 1: Vytvoř (nebo ověř) OAuth app v Asaně

1. Otevři https://app.asana.com/0/my-apps
2. Pokud aplikaci nemáš:
   - **Create new app** → název např. `Claude Code MCP`
   - **App type: MCP app** (NE Standard API app)
   - **Create**
3. V detailu aplikace:
   - **OAuth tab** → zkopíruj **Client ID** (číslo, např. 16 číslic), uchovej někde **Client Secret** (zobrazí se jen jednou — pokud ho nemáš, klikni **Reset client secret**)
   - **Redirect URLs** musí obsahovat přesně: `http://localhost:8080/callback`
     - Pozor na trailing slash a `/callback` — Asana porovnává exact-match
     - Doporučeno přidat i `http://localhost:33418/callback` jako pojistku proti Claude Code bug #55067
4. **Manage distribution tab**:
   - Vyber buď **"Any workspace"** (nejjednodušší) nebo **"Specific workspaces"** + přidej svůj workspace
   - Pokud zvolíš Specific a žádný neuvedeš, Asana vrátí `"This app is not available to your workspace"`

## Krok 2: Přidej server do Claude Code

**KRITICKÉ:** Příkaz `claude mcp add` musíš spustit v **normálním terminálu** (Terminal.app, iTerm, ...), NIKDY ne přes `!` prefix v Claude Code. Důvod: prompt na client secret potřebuje TTY. Bez TTY ho Claude Code přeskočí a secret se neuloží.

V terminálu (mimo Claude Code):

```
claude mcp remove asana -s user 2>/dev/null
claude mcp add --transport http \
  --client-id YOUR_CLIENT_ID \
  --client-secret \
  --callback-port 8080 \
  -s user \
  asana https://mcp.asana.com/v2/mcp
```

Po Enter se objeví **interaktivní hidden prompt** `Enter client secret:` → vlepi secret → Enter.

> Pokud místo promptu vyskočí `No TTY available to prompt for client secret. Set MCP_CLIENT_SECRET env var instead.`, jsi pravděpodobně v Claude Code přes `!` prefix nebo v jiném non-TTY prostředí. Otevři skutečný Terminal a zopakuj. Cesta přes `MCP_CLIENT_SECRET=... claude mcp add ...` může v některých verzích Claude Code secret neuložit korektně.

## Krok 3: Ověř konfiguraci

```
claude mcp get asana
```

Výstup MUSÍ obsahovat obě věty:

```
OAuth: client_id configured, client_secret configured, callback_port 8080
```

Pokud chybí `client_secret configured`, secret se neuložil. Zopakuj Krok 2 v opravdovém terminálu.

## Krok 4: Autentikuj přes /mcp

V Claude Code:

1. Napiš `/mcp`
2. Vyber **asana** v seznamu
3. Klikni / vyber **Authenticate**
4. **DIALOG NEZAVÍREJ** dokud OAuth flow neskončí. Claude Code během autentikace poslouchá na lokálním portu (8080) a čeká na callback z prohlížeče. Zavřením dialogu shodíš lokální server, callback selže, autentikace se zruší.
5. Otevře se prohlížeč → přihlas se do Asany (pokud nejsi) → **Allow**
6. Prohlížeč redirectne na `localhost:8080/callback`, Claude Code zachytí code, vymění ho za token, status se přepne na `✓ Connected`
7. **Pak teprve** zavři `/mcp` dialog

## Ověření že to funguje

V Claude Code by mělo být dostupné `mcp__asana__get_me` a další `mcp__asana__*` nástroje. Pokud test selže, použij Diagnostiku.

## Diagnostika když to nejde

### Symptom: `claude.ai Asana: ... Needs authentication` zůstává

Tu integraci **neopravíš** — používá Dynamic Client Registration, kterou V2 neumí. Můžeš ji nechat být (visí v listu) nebo smazat:

```
claude mcp remove "claude.ai Asana" -s user
```

Fungovat bude jen lokální `asana` server, ne tahle hosted integrace.

### Symptom: `redirect_uri parameter does not match a valid url`

V Asana developer console (https://app.asana.com/0/my-apps) → tvoje app → OAuth tab → Redirect URLs. Musí tam být **přesně** `http://localhost:8080/callback`. Žádné trailing slash navíc, žádné jiné porty.

Pokud Claude Code volí náhodný port (bug #55067), v chybové URL uvidíš `redirect_uri=http://localhost:NÁHODNÝ_PORT/callback`. Workaround: přidat ten port jako další redirect URL v Asaně (často 33418).

### Symptom: `client_id and secret` chybová hláška

`claude mcp get asana` neukazuje `client_secret configured`. Secret není uložený. Vrať se ke Kroku 2 — spusť v opravdovém terminálu, ne přes `!` v Claude Code.

### Symptom: Browser otevře callback URL ale localhost vrátí connection error

`/mcp` dialog byl zavřený předčasně, lokální server neběží. Otevři znovu `/mcp` → asana → Authenticate a tentokrát dialog nech otevřený.

### Symptom: `This app is not available to your workspace`

V Asana developer console → tvoje app → Manage distribution → přidej workspace, nebo přepni na "Any workspace".

### Manuální OAuth (fallback když /mcp dialog selhává opakovaně)

Pokud `/mcp` selhává a chceš to ověřit ručně, můžeš volat `mcp__asana__authenticate` přímo (vrátí autorizační URL) a po Allow v prohlížeči použít `mcp__asana__complete_authentication` s celou callback URL.

**Pozor**: OAuth state se v některých verzích Claude Code ztrácí mezi tahy konverzace. `authenticate` a `complete_authentication` se musí volat v rychlém sledu, jinak `complete_authentication` vrátí `No OAuth flow is in progress`. Pokud se to stane, je `/mcp` interaktivní cesta spolehlivější.

## Co NEDĚLAT

- **Nemazat `asana` user-scoped server jen proto, že je v "Needs authentication"** — autentikace často jen vyexpirovala, stačí re-auth. Smazáním ztratíš client_id config a začneš od Kroku 2.
- **Nepoužívat `claude.ai Asana` integraci** pro reálnou práci — je rozbitá kvůli dynamic registration.
- **Nespouštět `claude mcp add` přes `!` prefix** v Claude Code — non-TTY mód neuloží secret korektně.
- **Nezavírat `/mcp` dialog během autentikace** — shodí lokální callback server.

## Reference

- [Asana MCP V2 integration guide](https://developers.asana.com/docs/integrating-with-asanas-mcp-server)
- [Asana → Claude Code setup](https://developers.asana.com/docs/connecting-mcp-clients-to-asanas-v2-server#claude-code)
- [Bug #55067 — random port on re-auth](https://github.com/anthropics/claude-code/issues/55067)
- [Bug #58091 — redirect_uri mismatch](https://github.com/anthropics/claude-code/issues/58091)
- [V1 → V2 migration GitHub issue](https://github.com/anthropics/claude-plugins-official/issues/998)
