# Tempo Public Skills Marketplace

Veřejný Claude Code plugin marketplace od **Tempo Ventures**. Obsahuje open source skilly a nástroje použitelné kdekoliv, bez vazby na interní systémy Tempo.

## Aktuální pluginy

| Plugin | Popis |
|--------|-------|
| **claude-code-audit** | Bezpečnostní audit konfigurace Claude Code - kontrola oprávnění, MCP serverů, hooků a best practices |
| **cisteni-dat** | Postupy a principy pro čištění dat - evidence, kontrola, deduplikace, standardizace, validace. Volba nástroje podle objemu a cílového systému |

## Instalace

```bash
# Přidej marketplace (jednorázově, bez autentizace)
/plugin marketplace add Tempo-Ventures/tempo-public-skills-marketplace

# Nainstaluj plugin
/plugin install claude-code-audit@tempo-public-skills
```

## Aktualizace

```bash
/plugin marketplace update tempo-public-skills
/plugin update claude-code-audit@tempo-public-skills
```

## Plánované pluginy

Tento marketplace se bude postupně rozšiřovat o další open source nástroje. Kontext: interní pluginy (vázané na Workflow.ooo / Tempo interní systémy) zůstávají v samostatném privátním marketplace.

## Contributing

Issues a pull requests vítány. Dodržuj českou diakritiku, žádné emoji v kódu.

## License

MIT (viz LICENSE v jednotlivých pluginech, pokud relevantní).
