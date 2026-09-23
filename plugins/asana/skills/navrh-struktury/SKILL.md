---
name: navrh-struktury
description: 'Použij, když má organizace dostat strukturu Asany – týmy, projekty v týmech, lidi, viditelnost a členství. Z podkladu (zápis z workshopu, organigram, tabulka, HTML) nebo z rozhovoru navrhne strukturu a předá ji jako dokument pro lidi (Markdown, HTML), nebo jako struktura.json pro agenta. Nic nezakládá. Triggery: "organizační struktura", "struktura Asany", "jaké týmy v Asaně", "navrhni týmy a projekty", "rozvrhni Asanu pro firmu".'
---

# Návrh struktury Asany

Navrhni horní patro Asany: týmy, projekty v týmech, lidi, viditelnost a členství. Výsledek je návrh – nic nezakládáš. Vnitřek jednotlivých projektů je mimo, na ten je skill `vytvoreni-projektu`.

Přečti `references/metodika.md` dřív, než položíš první otázku nebo začneš převádět podklad. Je to rozhodovací model.

Nic nedomýšlej nad rámec podkladu a odpovědí. Co nevíš, je otázka, ne hypotéza.

## Podklad, nebo rozhovor

- **Podklad je:** přečti ho a předvyplň z něj návrh. Ptej se jen na to, co z něj nevyčteš – typické mezery jsou v sekci Co podklad typicky neříká.
- **Podklad není:** vyzpovídej člověka podle kroků níže.
- Podklad může přijít i v průběhu rozhovoru. Předvyplň z něj, co jde, a pokračuj.

## Jak vést rozhovor

- Jedna otázka na zprávu, přes `AskUserQuestion`. Možnosti nabízej z metodiky, volná odpověď je vždy přípustná.
- Neptej se na pojmy z metodiky („je to průřezový proces?"). Ptej se na organizaci a odvoď to.
- Když člověk odpověď nezná, použij výchozí hodnotu z metodiky, zapiš to jako otevřenou otázku a pokračuj.
- Názvy týmů a projektů navrhuj v jazyce, kterým člověk o organizaci mluví.

## Kroky

| Krok | Zjisti | Přeskoč když |
|---|---|---|
| 1 Organizace | Kolik lidí, jaká oddělení, kdo je vede. | podklad to uvádí |
| 2 Průřezová práce | Co jde napříč odděleními a je dost velké na vlastní tým. | – |
| 3 Externisté | S kým mimo firmu se v Asaně pracuje a na čem. | – |
| 4 Citlivá témata | Co nesmí vidět každý – personalistika, mzdy, hodnocení, strategie. | – |
| 5 Projekty | Pro každý tým: co v něm běží kromě to-do listu, jaký je to typ práce, kdo to vlastní. Správa týmu jen když ji vedoucí potřebuje. | – |
| 6 Lidé | Kdo je v kterém týmu, pozice, vedoucí, ambasadoři. | podklad to uvádí |
| 7 Pravidla napříč | Co platí pro celou organizaci. | – |
| 8 Kontrola | Projdi sekce Limity a Viditelnost v metodice. Když něco nesedí, řekni to a navrhni úpravu. | – |

## Souhrn

Ukaž souhrn v chatu: týmy s účelem, viditelností a členy; projekty po týmech s typem, vlastníkem a soukromím; lidé; pravidla napříč; otevřené otázky; kde ses odchýlil od metodiky a proč. Po úpravách ukaž souhrn znovu.

## Výstup

Až člověk souhrn odsouhlasí, zeptej se, pro koho výstup je:

- **Pro lidi** – dokument ke čtení nebo k ručnímu zakládání. Markdown, nebo HTML soubor, podle toho, co člověk chce. Obsah stejný jako souhrn, seřazený v pořadí, v jakém se to v Asaně zakládá: týmy, lidé do týmů, projekty, členové projektů.
- **Pro agenta** – `struktura.json` podle `references/vystup-json.md` a `references/schema.json`. Pro nástroj nebo agenta, který strukturu založí.

Soubor ulož do pracovního adresáře a řekni cestu.
