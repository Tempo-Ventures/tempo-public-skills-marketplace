<!-- Kopie docs/prevod-do-asany.md z asana-knowledge-base. Needitovat – aktualizuje se zkopírováním a zvednutím verze pluginu. -->
# Převod práce do Asany

Postup, jak z popisu práce udělat projekt v Asaně. Platí pro jednu jednotku práce: jeden projekt, jeden proces, nebo jednu agendu. Struktura celého workspace je v [nastavení organizace](nastaveni-organizace.md).

## Cíl

Začni cílem, ne nástrojem.

- Čeho má být dosaženo. Jedna věta.
- Výstup a přínos zvlášť. Výstup je to, co po dokončení existuje (web, zalistovaný produkt). Přínos je důvod, proč se to dělá (vyšší podíl online prodejů). Přínos často přijde později než výstup.
- Kdy je hotovo. Pokud to nikdy hotové nebude, popiš, jak poznáš, že to funguje – slovně, nebo metrikou.

Když nejde říct, kdy je hotovo, a zároveň nejde říct, jak poznáš, že to funguje, není jasný cíl. Vrať se k němu, než půjdeš dál.

## Hranice

- Kde to začíná a kde končí. U procesu: co ho spouští a čím jeden průchod končí.
- Co sem nepatří. Sousední práce, která se tváří, že je součástí, ale má jiný cíl nebo jiného vlastníka.

## Vlastník

Jeden člověk, který odpovídá za to, že práce dojde do konce nebo že proces funguje. Není to nutně ten, kdo dělá kroky. Bez vlastníka nezakládej nic.

## Jednotka

Co je jeden řádek nebo karta. Rozhoduje o tom, jestli má assignee smysl, jestli se zobrazují hotové položky a čím se plní sekce.

| Druh | Co to je | Příklad |
|---|---|---|
| Krok | jeden krok práce směřující k výstupu | „Vytvořit wireframes" |
| Průchod | jedna instance, která projde fázemi a po dokončení ztrácí význam | článek, grafický požadavek, influencer |
| Záznam | položka evidence, ke které se vracíš i po dokončení | zakázka, obchodní partner, kontaktní místo |
| Položka | drobnost bez vazby na ostatní | „Objednat merch" |

## Typ práce

Typ určuje tvar: view, čím jsou sekce, kdo nese opakovatelnost. Odvozuje se z cíle, hranic a jednotky, ne z toho, jak tomu člověk říká.

| Typ | Poznáš podle | Jednotka |
|---|---|---|
| Projekt | má datum dokončení a konkrétní výstup, po dokončení se archivuje, tým je často dočasný | krok |
| Proces | opakuje se, nemá konec, tým je stabilní, spouští ho vstup zvenku nebo z kalendáře | průchod nebo záznam |
| Agenda | úkoly bez vzájemné vazby, sdružené tématem nebo vlastníkem | položka |

Typ a jednotka se kontrolují proti sobě. Když nesedí – „proces" s jednotkou krok, „projekt" s jednotkou zakázka – nejde o jednu věc, ale o dvě slepené. Rozděl je a každou převeď zvlášť. V jednom Asana projektu je vždy jen jeden typ práce.

## Průběh

- Projekt: fáze. Každá fáze končí milníkem – stavem, který jde ověřit. Milník může být i uvnitř fáze v důležitém bodě.
- Proces: stavy, kterými jednotka prochází. Pojmenuj je jako stav, ne jako činnost („Ke schválení", ne „Schvalování").
- Agenda: témata, nebo nic.

U každého kroku nebo stavu: co do něj vstupuje a co z něj vychází. Krok bez výstupu není krok, je to poznámka.

## Lidé

- Kdo dělá kroky. Kde se předává odpovědnost – na úkolu, nebo na přechodu mezi fázemi.
- Kdo schvaluje. Schválení je vlastní úkol nebo stav, ne komentář.
- Role místo jmen, když na práci pracují externisté nebo klient, nebo když se lidé střídají.
- Vlastník záznamu není assignee. Když je jednotka záznam a práce se zadává v podúkolech, odpovědnost za záznam je vlastní pole typu People a assignee zůstává prázdný.

## Termíny

- Fixní: termín je daný zvenku.
- Odvozené: první milník má pevný termín, ostatní se od něj počítají. Takhle funguje šablona projektu.
- Žádné: u agend a u procesů, kde termín nese až konkrétní průchod.

Termíny dávej milníkům a hlavním výstupům. Termíny dílčích úkolů až ve chvíli, kdy jsou známé všechny informace.

## Data o jednotce

Co si o každé jednotce potřebuješ pamatovat, filtrovat nebo reportovat, je vlastní pole. Co se jen popisuje, patří do popisu úkolu.

- Tři až sedm polí. Nad sedm zredukuj, nebo přesuň do popisu.
- Pole, které řídí průchod procesem, je dropdown se stavy – jen když sekce nesou něco jiného (odchylka seskupení podle pole). Jinak stav nesou sekce.
- Pole, které nese odpovědnost bez assignee, je typu People.

## Odkud přichází práce

- Zevnitř: vlastník nebo tým přidává úkoly ručně.
- Zvenku: lidé mimo tým zadávají požadavky. Pak je první sekce „Nové" a vstupem je formulář, nebo veřejný projekt, kam se úkoly zadávají přímo. To je intake – parametr procesu, ne samostatný typ.

## Opakovatelnost

Když se to opakuje třikrát a víc:

- Projekt → šablona projektu s relativními termíny od prvního milníku.
- Proces → šablona úkolu s podúkoly, která popisuje jeden průchod.
- Agenda → nic.

## Mapování na Asanu

| | Agenda | Projekt | Proces |
|---|---|---|---|
| View | List | List, Timeline pro plánování | Board |
| Zobrazení | jen nehotové | všechny | jen nehotové |
| Řazení | libovolné | podle termínu v sekcích | podle termínu |
| Sekce | podle tématu | fáze projektu | stav úkolu |
| Nositel opakovatelnosti | žádný | šablona projektu | šablona úkolu |

Tabulka platí ve většině případů. Odchylka je přípustná, když má důvod. Doložené odchylky:

- Proces s jednotkou záznam zobrazuje všechny položky – k ukončeným záznamům se vracíš.
- Šest a víc vlastních polí → List i u procesu, seskupení podle vlastního pole místo sekcí, třídění v sekcích vypnuté.
- Jednotka záznam s prací v podúkolech → assignee skrytý, odpovědnost jako pole typu People.
- Projekt s externisty nebo klientem → pole Role místo vazby na jména.
- Proces má od začátku dvě pravidla: splněný úkol se přesune do Hotovo; den před termínem se úkol přesune z Čeká do Běží.
- První sekce je „Nezařazené" – nové úkoly padají do první sekce.

## Licence

Co jde v Asaně použít, určuje tarif organizace klienta. Zjisti ho dřív, než navrhneš strukturu, a navrhuj jen z toho, co tarif má. Návrh s funkcí, kterou klient nemá, spadne až při zakládání.

| Funkce | Personal | Starter | Advanced a výš |
|---|---|---|---|
| Sekce, podúkoly, závislosti, šablony úkolů a projektů | ano | ano | ano |
| Vlastní pole, milníky, formuláře, timeline, pravidla | ne | ano | ano |
| Schválení (`approval`), portfolia, cíle, workload, pravidla s vlastními podmínkami, větvení formulářů | ne | ne | ano |

Starší názvy: Premium je Starter, Business je Advanced. Když tarif klient nezná, je to otevřená otázka a návrh počítá se Starterem; rozhodnutí bez schválení je běžný úkol se slovem „Rozhodnout" v názvu.

## Hranice nástroje

Kdy do Asany ne, nebo ne takhle:

- Evidence typu CRM nad zhruba 50 případů, nebo když je potřeba posílat e-maily ze systému a dělat složitější reporting.
- Víc než 10 podúkolů na úkol → udělej z nich sekci.
- Víc než 10 sekcí v projektu → rozděl na víc projektů.
- Víc než 10 projektů v týmu → tým je na rozdělení; to už je věc struktury workspace.
- Víc než 7 vlastních polí → zredukuj.

## Před založením

- Název podle konvence, kterou firma používá. Když žádnou nemá: název projektu je podstatné jméno, název úkolu začíná slovesem.
- Do Overview: účel, vlastník, jak se zadávají úkoly, kde je související dokumentace.
- Kam to patří: který tým. Existuje už podobný projekt? Pak doplň ten, nezakládej nový.
- Projekt sdílej, až když je připravený. Členům vypni upozornění na nové úkoly.
