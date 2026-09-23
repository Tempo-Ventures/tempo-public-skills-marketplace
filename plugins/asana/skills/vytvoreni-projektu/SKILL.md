---
name: vytvoreni-projektu
description: 'Použij, když chce člověk dostat svou práci do Asany – projekt, proces, agendu, todo list, tabulku, existující postup – a neví, jak to tam nastavit. Vyzpovídá ho o cíli, vlastníkovi, jednotce a průběhu, navrhne strukturu a po odsouhlasení ji založí přes Asana connector, nebo připraví CSV. Triggery: "chci to dát do Asany", "jak to nastavit v Asaně", "založ mi projekt", "převeď tohle do Asany", "jak udělat proces v Asaně", "todo list do Asany", "jak evidovat X v Asaně".'
---

# Vytvoření projektu v Asaně

Vyzpovídej člověka o jeho práci a navrhni, jak ji nastavit v Asaně. Jedna jednotka práce na jeden průchod: jeden projekt, jeden proces, nebo jedna agenda. Struktura workspace je mimo – jen se zeptej, kam výsledek patří. Návrh týmů a projektů pro celou organizaci je skill `navrh-struktury`.

Nenabízej hotové šablony ani vzory. Když se člověk chce dozvědět víc, dej mu odkaz z `references/zdroje.md`.

## Jak vést rozhovor

- Jedna otázka na jednu zprávu, přes `AskUserQuestion`. Možnosti nabízej z metodiky, volná odpověď je vždy přípustná.
- Neptej se „je to projekt, nebo proces?". Typ odvoď a nech potvrdit.
- Když člověk odpověď nezná, navrhni výchozí hodnotu z metodiky, zapiš ji do `open_questions` a pokračuj. Nezastavuj se.
- Podklad (tabulka, odkaz na existující Asana projekt, prezentace, diagram, popis) může přijít kdykoli. Předvyplň z něj hypotézu a ptej se jen na to, co z něj nevyčteš. Kroky nepřeskakuj. Odkaz na Asana projekt načti přes `mcp__claude_ai_Asana__get_project` a `get_tasks`.
- Piš česky, názvy sekcí a polí navrhuj v jazyce, kterým člověk mluví o své práci.

## Kroky

Přečti `references/metodika.md` dřív, než položíš první otázku. Sekce Jednotka, Typ práce, Mapování na Asanu, Licence a Hranice nástroje jsou rozhodovací model.

| Krok | Zjisti | Přeskoč když |
|---|---|---|
| 0 Licence | Tarif Asany klienta (Personal, Starter, Advanced, Enterprise). Navrhuj jen funkce, které tarif má – tabulka v sekci Licence. Schválení, portfolia a pravidla s vlastními podmínkami jsou až od Advanced. | tarif je známý z kontextu klienta |
| 1 Cíl | Čeho má být dosaženo. Výstup (co po dokončení existuje) a přínos (proč se to dělá) zvlášť. Kdy je hotovo – nebo jak poznáš, že to funguje, když to nekončí. | – |
| 2 Hranice | Kde to začíná a končí. Co sem nepatří. U opakující se práce: co jeden průchod spouští a čím končí. | – |
| 3 Vlastník | Jeden člověk, který odpovídá, že to dojde do konce nebo že to funguje. | – |
| 4 Jednotka | Co je jeden řádek nebo karta. Zařaď do druhu podle tabulky v sekci Jednotka (krok / průchod / záznam / položka). | – |
| 5 Typ práce | Navrhni typ z kroků 1–4 podle sloupce „Poznáš podle" v sekci Typ práce. Řekni, podle čeho jsi ho poznal. Nech potvrdit. | – |
| 6 Křížová kontrola | Sedí druh jednotky k typu (sloupec „Jednotka" v sekci Typ práce)? Když ne, člověk má dvě slepené věci. Nenavrhuj strukturu – pojmenuj obě, nech vybrat, kterou řešíte teď, a začni znovu od kroku 1 pro ni. | sedí |
| 7 Průběh | Projekt: fáze, každá končí ověřitelným milníkem. Proces: stavy, pojmenované jako stav. U každého kroku nebo stavu vstup a výstup. | agenda |
| 8 Lidé | Kdo dělá kroky. Kde se předává odpovědnost. Kdo schvaluje – schválení je úkol nebo stav, ne komentář. Externisté nebo klient → role místo jmen. Jednotka záznam s prací v podúkolech → assignee skrytý, odpovědnost jako pole People. | – |
| 9 Termíny | Fixní / odvozené od prvního milníku / žádné. Termíny milníkům a výstupům, ne každému úkolu. | agenda |
| 10 Data o jednotce | Co si o každé jednotce potřebuješ pamatovat, filtrovat nebo reportovat → vlastní pole, 3–7. Co se jen popisuje → popis úkolu. | – |
| 11 Odkud přichází práce | Zevnitř ručně, nebo zvenku (formulář / veřejný projekt). Zvenku = intake: první sekce „Nové". | projekt, agenda |
| 12 Opakovatelnost | Opakuje se to 3× a víc? Projekt → šablona projektu s odvozenými termíny. Proces → šablona úkolu s podúkoly = jeden průchod. | agenda |
| 13 Kontrola | Projdi sekci Hranice nástroje: limity (Pravidlo deseti, počet polí) a kdy do Asany ne. Zeptej se, do kterého týmu to patří a jestli už podobný projekt neexistuje. | – |

## Sestavení návrhu

1. Vezmi výchozí nastavení typu z tabulky v sekci Mapování na Asanu. Funkce mimo tarif klienta (sekce Licence) nenavrhuj; rozhodnutí bez schválení je běžný úkol.
2. Projdi „Doložené odchylky" pod tabulkou. Každou, jejíž podmínka platí, aplikuj. Odchylku od tabulky, kterou seznam nekryje, zapiš do `deviations` i s důvodem.
3. Projdi sekci Hranice nástroje. Když platí limit (podúkoly, sekce, pole), uprav strukturu a řekni to. Když platí „kdy do Asany ne", zapiš do `rejections` a navrhni, co s tím – jiný nástroj, nebo jen část v Asaně.
4. Milník fáze je poslední úkol sekce s `is_milestone: true`.
5. Vlastník, schvalovatel a lidé z kroku 8 → `assignee_role` u úkolů; pole Role jen když to odchylka vyžaduje.
6. Název: podle konvence firmy; bez ní podstatné jméno. Úkoly začínají slovesem.
7. Overview: účel, vlastník, jak se zadávají úkoly, kde je dokumentace.

Návrh zapiš jako `navrh.json` podle `assets/navrh.schema.json` do pracovního adresáře a ukaž člověku čitelný souhrn: typ a jednotka, view a zobrazení, sekce s milníky, pole, úkoly po sekcích, pravidla, opakovatelnost, otevřené otázky, odchylky, odmítnutí.

## Gate

Bez výslovného „ano" k souhrnu nezakládej nic. Po úpravách ukaž souhrn znovu.

## Založení

Zeptej se, jak chce člověk projekt založit:

- **Přes Asana connector** – postupuj podle `references/vystup-mcp.md`. Vyžaduje připojený Asana connector v claude.ai; když nástroje `mcp__claude_ai_Asana__*` nejsou dostupné, řekni to a nabídni CSV.
- **CSV k importu** – jen pro projekt a agendu, postupuj podle `references/vystup-csv.md`. U procesu CSV nenabízej: board, pravidla a typy polí CSV neunese. Nabídni connector, nebo ruční postup z `vystup-csv.md`.

Po založení vypiš, co zbývá doklikat ručně, v pořadí, v jakém se to v Asaně dělá.
