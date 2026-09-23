---
name: vytvoreni-ukolu
description: 'Použij, kdykoli zakládáš nebo upravuješ úkoly v Asaně – jeden úkol, víc úkolů z poznámek nebo meetingu, podúkoly, položku do procesu, záznam do evidence. Nejdřív určí, jaký druh jednotky zakládáš (krok, průchod, záznam, položka), a podle toho pojmenuje úkol, napíše popis a vyplní pole. Zakládá až po odsouhlasení náhledu. Na vyžádání najde duplicitní úkoly v projektu a eskaluje je vlastníkovi. Triggery: "založ úkol", "dej to do Asany", "vytvoř úkoly z meetingu", "přidej do projektu", "zadej to Petrovi", "přidej podúkoly", "najdi duplicity", "zkontroluj duplicitní úkoly".'
---

# Vytvoření úkolu v Asaně

Než úkol pojmenuješ, urči, co zakládáš. Úkol v Asaně je jen kontejner – podle typu práce v projektu je to krok, průchod, záznam, nebo položka, a každý druh se pojmenovává a vyplňuje jinak.

Druhy jednotek a typy práce jsou definované v `../vytvoreni-projektu/references/metodika.md`, sekce Jednotka a Typ práce. Přečti je dřív, než založíš první úkol.

## 1. Urči druh jednotky

Druh se odvozuje z cílového projektu, ne z toho, jak člověk úkol popsal.

1. Najdi cílový projekt. Když ho člověk neřekl, zeptej se. Úkol bez projektu nezakládej – výjimkou je osobní úkol v My Tasks, když o něj člověk výslovně řekne.
2. Načti projekt (`get_project`, `get_tasks`) a urči typ práce podle sekcí: fáze projektu → projekt, stavy → proces, témata nebo nic → agenda.
3. Z typu plyne druh jednotky: projekt → krok, proces → průchod nebo záznam, agenda → položka. Průchod po dokončení ztrácí význam, k záznamu se vracíš i po dokončení.
4. Zkontroluj, jestli to, co člověk chce založit, k druhu sedí. Když ne, nezakládej a řekni, kam to patří. Typicky: krok („Připravit nabídku") do procesu se záznamy patří jako podúkol konkrétního záznamu; průchod („Grafika na web") do projektu patří do procesu, který takové požadavky zpracovává.

## 2. Název

| Druh | Název | Příklad |
|---|---|---|
| Krok | sloveso v infinitivu + konkrétní předmět | „Poslat klientovi návrh struktury týmů" |
| Průchod | co vzniká nebo co se zpracovává, bez slovesa | „LinkedIn příspěvek – spuštění akademie" |
| Záznam | jméno entity, případně s upřesněním | „Novák s.r.o. – implementace Asany" |
| Položka | sloveso v infinitivu + konkrétní předmět | „Objednat merch na konferenci" |
| Podúkol | vždy krok | „Schválit text příspěvku" |

- Stav do názvu nepatří – nesou ho sekce nebo pole. Ne „Příspěvek – ke schválení".
- Do názvu nepatří termín, plnitel, projekt, priorita, emoji ani velká písmena pro důraz.
- Krok a položka jsou jedna akce. Když název potřebuje „a", jsou to dva úkoly.
- Název je konkrétní i bez kontextu: ne „Web", ale „Vytvořit mockup homepage".

## 3. Popis

Popis je zadání. Komunikace o úkolu patří do komentářů. Popis je krátký, v `html_notes` s odrážkami `<ul><li>`.

| Druh | Obsah popisu |
|---|---|
| Krok, položka | proč se to dělá; co je výsledek – kdy je hotovo; podklady a odkazy |
| Průchod | brief výstupu: pro koho, kde vyjde nebo k čemu slouží, podklady; kroky jako podúkoly |
| Záznam | kontext entity, který se nevejde do polí; data, podle kterých se filtruje, patří do polí |

- Nepiš, jak úkol vznikl, nerekapituluj konverzaci ani meeting. Jen to, co plnitel potřebuje k práci.
- Nevymýšlej. Co z podkladu nevyplývá, v popisu není – zeptej se, nebo to vynech.
- Novou informaci k existujícímu úkolu přidej komentářem. Popis cizího úkolu nepřepisuj.

## 4. Pole

**Plnitel**

- Vždy jedna osoba. Nevymýšlej ho – když ho neznáš, zeptej se. Úkol bez plnitele je backlog, ne zadaná práce.
- Záznam plnitele nemá. Odpovědnost za záznam nese pole typu People, práci nesou podúkoly s plniteli.
- Nepřiřazuj úkol přímo vedoucímu bez projektu – patří do projektu, odkud si ho vezme.

**Termín**

- Nevymýšlej ho. Když ho z podkladu neznáš, zeptej se.
- Krok: termín dokončení. Průchod: termín výstupu (vydání, předání). Záznam: bez termínu, termíny nesou podúkoly. Položka: jen když existuje.
- V projektu mají termín hlavně milníky a výstupy; dílčí krok dostane termín, až je známé celé zadání.

**Ostatní**

- Sekce: podle stavu nebo fáze, do které úkol patří. Nový průchod patří do první sekce.
- Vlastní pole projektu vyplň, když hodnotu znáš. Nová pole nezakládej.
- Spolupracovníky ani @zmínky nepřidávej plošně – jen lidi, kteří o úkolu musí vědět.

## 5. Struktura

- Jedno téma, jeden úkol.
- Podúkoly jen v jedné úrovni a jen tam, kde jsou dílčí kroky nebo checklist. Podúkol checklistu nemá plnitele ani termín.
- Víc než 10 podúkolů → patří do sekce, ne pod jeden úkol.
- Schválení je samostatný krok („Schválit …"), na tarifu Advanced a výš úkol typu `approval`. Ne komentář.
- Neuzavírej cizí úkoly a nic nemaž. Úkol uzavírá jeho plnitel.

## Postup

1. Urči projekt a druh jednotky (sekce 1).
2. Hledej duplicitu v cílovém projektu podle kritérií ze sekce Kontrola duplicit: `search_tasks` podle klíčových slov, na tarifu bez vyhledávání `get_tasks` s nehotovými úkoly. Když podobný úkol existuje, navrhni doplnění nebo komentář místo nového úkolu. Když stejná práce žije v jiném projektu, navrhni přidat existující úkol i do cílového projektu místo založení kopie.
3. Ukaž náhled: druh jednotky, název, projekt a sekce, plnitel, termín, popis, podúkoly. U víc úkolů tabulka. Chybějící plnitele a termíny vypiš jako otázky.
4. Bez výslovného „ano" nic nezakládej. Po úpravách ukaž náhled znovu.
5. Založ přes Asana connector (`create_tasks`) úkol celý v jednom volání – název, popis i plnitel najednou, ať plnitel dostane notifikaci s kompletním zadáním. Podúkoly až potom, s `parent`.
6. Vypiš odkazy na založené úkoly. Co connector nezvládl, vypiš jako ruční dokrok.

Když nástroje `mcp__claude_ai_Asana__*` nejsou dostupné, řekni to a nic nezakládej.

## Kontrola duplicit na vyžádání

Když člověk řekne „najdi duplicity" nebo „zkontroluj duplicitní úkoly", projdi existující úkoly a najdi kandidáty. Duplicity neřešíš – eskaluješ je. O sloučení rozhoduje vlastník projektu nebo plnitelé dotčených úkolů, ne agent.

1. Rozsah: jeden projekt, nebo My Tasks člověka. Když ho neřekl, zeptej se. Víc projektů najednou jen na výslovné přání.
2. Načti nehotové úkoly včetně podúkolů (`get_tasks`). Hotové jen na přání.
3. Urči druh jednotky projektu (sekce 1) a porovnávej podle něj:
   - krok, položka: stejná akce nad stejným předmětem, i jinak formulovaná;
   - průchod: stejný výstup pro stejný účel;
   - záznam: stejná entita – stejný klient, firma, zakázka – i s jinak napsaným jménem;
   - podúkol, který opakuje samostatný úkol nebo podúkol jiného úkolu.
4. Duplicita není:
   - víc instancí téže práce – tři workshopy, osm rozhovorů, opakující se úkol;
   - stejný krok pro jiný průchod nebo záznam;
   - úkol, který je záměrně ve dvou projektech – je to jeden úkol, ne dva.
5. Ukaž skupiny kandidátů v tabulce: úkoly s odkazy, plnitelé, proč jde o duplicitu, jistota (jistá / možná). U každé skupiny uveď, komu rozhodnutí patří: plnitel, když mají všechny úkoly stejného; jinak vlastník projektu.
6. Eskalace: nabídni, že na každou skupinu upozorníš v Asaně. Po souhlasu přidej do každého úkolu skupiny komentář s @zmínkou toho, komu rozhodnutí patří: „Možná duplicita s <odkaz>. Rozhodni, jestli sloučit (Mark as duplicate), a který ponechat." Nic dalšího.
7. Úkoly neslučuj, neuzavírej, nepřesouvej, neměň jim popis ani nemaž – ani když o to člověk požádá, pokud sám není vlastník projektu.
