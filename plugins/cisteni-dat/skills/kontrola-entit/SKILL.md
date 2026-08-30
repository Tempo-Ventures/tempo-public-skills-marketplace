---
name: kontrola-entit
description: Use when checking a meeting transcript against a canonical entity list -- fixes mistranscribed names of people, clients, tools and concepts, and reports entities that are missing from the list. Triggers on "kontrola entit", "zkontroluj entity v přepisu", "oprav jména v transkriptu".
---

# Kontrola entit v přepisu

Opraví zkomolená jména a termíny v přepisu podle kanonického seznamu a vypíše
kandidáty na doplnění seznamu.

**Zdroj entit** je vždy kopie přibalená k pluginu:
`${CLAUDE_PLUGIN_ROOT}/data/core.entities.md`. Nikde jinde glosář nehledej a
tenhle soubor needituj -- vzniká generováním z repa `tempo-entities` a obnovuje
se přes `scripts/publish.py` a novou verzi pluginu.

Bundle obsahuje jen seznam `core` (Workflow + Tempo). Klientské seznamy v něm
nejsou.

## Kroky

### 1. Ověř glosář

```bash
ls -l "${CLAUDE_PLUGIN_ROOT}/data/core.entities.md"
```

Když soubor chybí, **nepokračuj** -- plugin je nekompletní, řekni to uživateli.

### 2. Načti opravy

Glosář je ten soubor. Nic se negeneruje a nic se nespouští.

### 3. Načti přepis

- **Plaud:** `mcp__plaud__get_transcript(file_id)`. U delších schůzek výstup přeteče
  limit a uloží se do souboru, jehož cestu vypíše chybová hláška -- předej ji skriptu.
- **Soubor:** cesta od uživatele. Pokračuj krokem 4a, jen pokud jde o Plaud JSON
  (pole s `data_type: transaction`); jiný formát (holý text/markdown přepisu)
  nemá `plaud_to_md.py` jak zpracovat -- přeskoč rovnou na krok 4b.

### 4. Aplikuj deterministické opravy

**4a. Plaud vstup:**

```bash
cd ~/Dev/tempo/tempo-skills-marketplace/plugins/adamai/skills/zpracuj-transkript-adamai
scripts/plaud_to_md.py \
  --input <plaud.json> --date YYYY-MM-DD --title "<Titulek>" \
  --glossary <glosář vygenerovaný nebo nalezený v kroku 2> \
  --out <cíl>
```

**4b. Jiný souborový vstup:** `plaud_to_md.py` vyžaduje Plaud JSON, takže tenhle
krok přeskoč a nech LLM vrstvu (krok 5) pracovat přímo s neopraveným textem --
při čtení aplikuj páry z `## Opravy` v glosáři z kroku 2 ručně (whole-word,
case-insensitive) a v reportu (krok 6) uveď, že šlo o ruční, ne deterministickou
opravu.

### 5. LLM vrstva

Projdi opravený přepis a označ:

- **Mluvčí** -- namapuj `Speaker N` na jména z kanonických sekcí glosáře. Kde není
  jistota, mluvčího **nepřejmenovávej**.
- **Entity mimo seznam** -- jména, nástroje, klienti a koncepty, které v glosáři
  nejsou.
- **Podezřelé tvary** -- co vypadá jako zkomolenina entity ze seznamu, ale
  deterministická oprava to nechytila (typicky skloňovaný tvar).

### 6. Report

Vypiš tři skupiny: aplikované opravy, kandidáti na nové položky, nezmapovaní mluvčí.

**Kandidáty nezapisuj.** Tenhle skill do seznamu nikdy nepíše -- u `misheard` je
falešné pozitivum drahé, protože přepíše i správný text. Kandidáty jen vypiš a
řekni uživateli, ať je předá někomu s přístupem k repu `tempo-entities`, kdo je
schválí a spustí `scripts/publish.py`.

## Přidání schválené položky

Probíhá v repu `tempo-entities`, ne tady. Formát položky:

```yaml
- id: org.priklad-s-r-o
  canonical: Příklad Solutions s.r.o.
  type: org
  scope: [workflow, tempo]
  aliases: []
  correct_to: Příklad
  misheard:
    - Priklad
    - wrong: Prikladu
      right: Příkladu
  source: manual
```

- `canonical` je vždy úřední/plný tvar (u organizací včetně právní formy).
  `correct_to` je cíl, na který se skutečně opravuje mluvená zkratka (`Priklad`
  výše) -- bez něj by oprava mířila na celý úřední název `Příklad Solutions
  s.r.o.`, což mluvčí v přepisu nikdy neřekne. Přidáváš-li organizaci, **vždy
  nastav `correct_to`** na mluvenou zkratku, ne jen `canonical`.
- Pádové tvary patří do `misheard` jako samostatné položky -- náhrada je
  whole-word a nezná lemma. Obyčejný řetězec (`Priklad` výše) se opraví na
  `correct_to`/`canonical`. Pokud je i špatně přepsaný tvar skloňovaný
  (`Prikladu` = „v Přikladu“, genitiv/lokál), oprava na nominativ by větu
  rozbila -- použij mapping `{wrong, right}` (`Prikladu` výše) a dej mu vlastní,
  taky skloňovaný cíl (`Příkladu`).
- Tvar kratší než 4 znaky vyžaduje `allow_short: true` (absolutní dno jsou 2
  znaky, to `allow_short` nepřekoná).
- Zápis i ověření probíhá v repu `tempo-entities`, ne tady: položka musí projít
  `build.py` bez chyby (`misheard` nesmí kolidovat s cizím `canonical`,
  `correct_to` ani aliasem). Pak se pustí `scripts/publish.py` a commitne se
  nová verze pluginu -- do té doby změnu nikdo v týmu nevidí.
- Do `misheard` patří jen skutečné zkomoleniny -- tvary, které v našem kontextu
  nic neznamenají. Alternativní platný název (obchodní značka vs. úřední název,
  zkratka dceřiné firmy vs. matky, jiný existující produkt stejného znění) tam
  nepatří, i kdyby mířil na správnou entitu -- takový název patří do `aliases`,
  kde ho LLM vrstva vidí, ale deterministická vrstva ho nepřepisuje. Test: může
  tenhle tvar padnout na naší schůzce v jiném významu? Rozhoduje náš kontext --
  klienti, nástroje, projekty a běžná čeština -- ne to, jestli slovo existuje
  někde ve světě.

## Sync z Airtable

Probíhá v repu `tempo-entities`, ne přes tenhle skill. Lidi a organizace
nepřidávej ručně, ty tahá sync:

```bash
cd ~/Dev/tempo/tempo-entities
.venv/bin/python scripts/sync_airtable.py            # dry-run, jen výpis
.venv/bin/python scripts/sync_airtable.py --write
```
