# Claude Code Audit — Informace

## Proč dělat audit

Claude Code má přístup k souborovému systému, terminálu, MCP serverům a dalším nástrojům. Nesprávná konfigurace oprávnění může vést k:

- Nechtěné změně nebo smazání souborů
- Odeslání e-mailů nebo zpráv bez vědomí uživatele
- Úniku citlivých dat (API klíče, tokeny)
- Manipulaci s externími službami (Asana, kalendář, Git)

Audit identifikuje rizika a nabídne konkrétní doporučení.

## Jak funguje systém oprávnění Claude Code

### Scopy (od nejnižší k nejvyšší prioritě)

| Scope | Soubor | Sdílený? | Účel |
|-------|--------|----------|------|
| **Globální** | `~/.claude/settings.json` | Ne | Osobní pravidla pro všechny projekty |
| **Projektový sdílený** | `<repo>/.claude/settings.json` | Ano (git) | Týmová pravidla |
| **Projektový lokální** | `<repo>/.claude/settings.local.json` | Ne (gitignored) | Osobní přepisy pro projekt |
| **Managed** | Systémová úroveň | IT vynucené | Enterprise politiky |

### Pravidla oprávnění

Každý scope může definovat tři typy pravidel:

- **allow** — povolí akci bez dotazu
- **ask** — zeptá se uživatele před provedením (výchozí chování)
- **deny** — zakáže akci (nelze přepsat nižším scopem)

Vyhodnocení: **deny > ask > allow**. Deny pravidla mají vždy přednost.

### Formát pravidel

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run build)",
      "Read(/src/**/*.ts)",
      "mcp__server__nazev_nastroje"
    ],
    "deny": [
      "Bash(git push --force *)",
      "mcp__claude_ai_Gmail__gmail_create_draft"
    ]
  }
}
```

## Co tento skill dělá

- Čte konfigurační soubory Claude Code (settings.json, settings.local.json, CLAUDE.md)
- Analyzuje nastavení oprávnění, MCP serverů, hooků a režimů
- Generuje strukturovaný report s nálezy a doporučeními
- Klasifikuje nálezy podle závažnosti (kritické, vysoké, střední, informační)

## Co tento skill NEDĚLÁ

- **Neodesílá žádná data** — žádné síťové požadavky, žádné API volání
- **Neloguje výsledky** — report existuje pouze v konverzaci
- **Nemění konfiguraci** — je čistě read-only
- **Neukládá data** — žádné soubory se nevytváří
- **Nepotřebuje síťový přístup** — funguje kompletně offline

## Jaká data skill čte

Skill přistupuje výhradně k těmto souborům:

- `~/.claude/settings.json` a `~/.claude/settings.local.json`
- `~/.claude/CLAUDE.md`
- `<repo>/.claude/settings.json` a `<repo>/.claude/settings.local.json`
- `<repo>/.claude/CLAUDE.md` a `<repo>/CLAUDE.md`

Skill **nečte** historii konverzací, session transkripty, paměti ani jiná citlivá data.

Skill funguje ve výchozím ask režimu — uživatel schvaluje čtení každého souboru.
