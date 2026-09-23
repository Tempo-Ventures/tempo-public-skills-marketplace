# Návrh struktury Asany

Rozhodovací model pro horní patro Asany: týmy, projekty v týmech, lidé, viditelnost a členství. Vnitřek projektu – sekce, pole, úkoly, pravidla – řeší `../vytvoreni-projektu/references/metodika.md`.

## Rozsah

Do návrhu patří:

- týmy: název, účel, správce, viditelnost, členové;
- projekty v týmech: název, typ práce, vlastník, soukromí, členové;
- lidé: jméno, pozice, kdo je vedoucí, kdo ambasador;
- pravidla, která platí napříč organizací.

Nepatří:

- sekce, úkoly a pole jednotlivých projektů – na každý projekt zvlášť `vytvoreni-projektu`;
- konkrétní klientské zakázky nebo jiné instance – vznikají za provozu, ne v návrhu struktury.

## Týmy

Tým je kontejner na projekty. Zakládá se z jednoho ze čtyř důvodů:

| Důvod | Kdy | Pozor na |
|---|---|---|
| Oddělení | firma má jasná oddělení a většina práce běží uvnitř nich | průřezová práce se mapuje hůř |
| Průřezový proces | proces jde napříč odděleními a je dost velký na vlastní tým | víc týmů je složitější struktura |
| Rozdělení velkého oddělení | oddělení má desítky lidí a přes 10 projektů | přílišné dělení vyrábí sila |
| Práce s externisty | projekty sdílené s klienty nebo externisty | projekt, který by patřil do obou týmů |

Výchozí struktura je hybrid: týmy podle oddělení, průřezové týmy jen pro velké procesy a jeden celofiremní tým pro všechny (oznámení, firemní akce, celofiremní agenda).

- Začni s minimem týmů. Dělí se, až když se ztrácí přehled.
- Název týmu kopíruje oddělení, nebo popisuje účel. Bez zkratek, které firma sama nepoužívá.
- Účel týmu je jedna až dvě věty: proč tým existuje. Nevyjmenovává klienty, projekty ani procesy – obsah se mění, účel ne.
- Správce týmu je vedoucí oddělení, pokud podklad neurčí jinak.

## Projekty v týmu

Každý tým má výchozí projekty:

| Projekt | Typ | Členové | Soukromí |
|---|---|---|---|
| Týmový to-do list (`<Tým> – To Do List`) | agenda | stejní jako tým | veřejný |
| Správa týmu | agenda | vedoucí a jeho nadřízený | soukromý |

Správu týmu navrhni, jen když vedoucí potřebuje prostor mimo tým (hodnocení, personální věci, plánování). Když to podklad neříká, zeptej se.

Další projekty z podkladu:

- Typ práce (projekt, proces, agenda) urči podle `../vytvoreni-projektu/references/metodika.md`, sekce Typ práce. V jednom projektu je jen jeden typ práce.
- Projekt patří do týmu toho, kdo ho vlastní.
- Proces, který tým přijímá zvenku, je v týmu, který ho zpracovává, ne v týmu zadavatele.
- Vlastník projektu je jeden člověk. Když ho podklad neuvádí, zeptej se.

## Viditelnost

- Tým je veřejný. Tým s žádostí o členství, když je potřeba hlídat, kdo je členem, ale tým má být vidět.
- Tajný tým je výjimka – jen když podklad nebo člověk výslovně řekne, že celé oddělení má být skryté.
- Citlivé téma (personalistika, mzdy, hodnocení, strategie před oznámením) se řeší soukromým projektem ve veřejném týmu, ne tajným týmem.
- Když není jasné, jestli má být něco soukromé, je to veřejné.

## Členství

Členství znamená notifikace, ne viditelnost. Veřejné týmy a projekty vidí všichni i bez členství.

- Členem týmu nebo projektu je jen ten, kdo na něm aktivně pracuje.
- Vedoucí a ambasador jsou vždy členy svého týmu.
- Týmový to-do list má stejné členy jako tým.
- Nepřidávej lidi všude, „aby viděli".
- Externisty přidávej jen do projektů, ne do týmů. Když s nimi tým sdílí víc projektů, navrhni pro sdílené projekty samostatný tým.

## Lidé

- Každý člověk je v návrhu jednou, i když je ve víc týmech.
- Pozice je taková, jakou uvádí podklad. Jedna na osobu.
- Vedoucí a ambasador jsou atributy člověka, ne pozice. Člověk může být obojí.
- E-maily podklad obvykle nemá. Chybějící e-mail není chyba – doplní se při zakládání.

## Pravidla napříč organizací

Věty, které platí pro celou organizaci a ne pro jeden tým („každé oddělení má týmový to-do list", „projekt patří do týmu toho, kdo zakázku vlastní"), zapiš jako plochý seznam pravidel. Nepiš je k jednotlivým týmům.

## Limity

- Víc než 10 projektů v týmu → navrhni rozdělení týmu.
- Víc než 10 týmů na malou firmu → pravděpodobně příliš granulární, zkus sloučit.
- Tým s jedním člověkem → pravděpodobně patří do jiného týmu jako projekt.

Limity jsou doporučení, ne pevná pravidla. Když je překročíš, řekni proč.

## Co podklad typicky neříká

- Kdo je vlastník projektů, které podklad jen jmenuje.
- Výjimky ve viditelnosti a soukromí nad rámec toho, co je výslovně napsané.
- Kdo z lidí je externista.
- Jestli vedoucí potřebují správu týmu.
