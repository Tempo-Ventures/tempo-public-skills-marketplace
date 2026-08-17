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
| **Managed** | macOS: `/Library/Application Support/ClaudeCode/managed-settings.json` | IT vynucené | Enterprise politiky |

Mimo settings soubory drží Claude Code stav v `~/.claude.json` — tam žijí user-level MCP servery (klíč `mcpServers`) a seznam projektů s jejich per-projekt konfigurací (klíč `projects`). Projektové sdílené MCP servery jsou v `<repo>/.mcp.json`.

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
      "mcp__gmail__send_message"
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

- `~/.claude.json` (jen struktura — hodnoty env/headers se nikdy necitují do reportu)
- `~/.claude/settings.json` a `~/.claude/settings.local.json`
- `~/.claude/CLAUDE.md`
- výpisy adresářů `~/.claude/skills/`, `~/.claude/commands/`, `~/.claude/agents/`
- managed settings (pokud existují)
- `<repo>/.mcp.json`
- `<repo>/.claude/settings.json` a `<repo>/.claude/settings.local.json`
- `<repo>/.claude/CLAUDE.md` a `<repo>/CLAUDE.md`
- výpisy `<repo>/.claude/skills|commands|agents`

Skill **nečte** historii konverzací, session transkripty, paměti ani jiná citlivá data. Hodnoty secrets (API klíče, tokeny, env, headers) se v reportu **nikdy neobjeví** — report uvádí jen typ nálezu a soubor.

Skill funguje ve výchozím ask režimu — uživatel schvaluje čtení každého souboru.
