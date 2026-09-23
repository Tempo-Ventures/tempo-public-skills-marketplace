# CSV k importu

Jen pro `work_type` projekt a agenda. U procesu CSV nevytvářej – board, pravidla a typy vlastních polí import neunese; nabídni connector, nebo postup „Ručně" níže.

## Tvar souboru

Hlavička přesně takhle (import Asany páruje sloupce podle názvu):

```
Name,Section/Column,Assignee,Due Date,Notes,Parent Task,<názvy vlastních polí>
```

- Jeden řádek na úkol, v pořadí sekcí a úkolů z `navrh.tasks`.
- `Section/Column` = název sekce. První řádek každé sekce ji založí.
- `Assignee` prázdné. `assignee_role` doplň do `Notes` jako první řádek `Role: <assignee_role>`.
- `Due Date` jen u `due.mode: "fixed"`, formát `YYYY-MM-DD`. Odvozené termíny se do CSV nedávají.
- `Notes` = `notes`; víceřádkový text v uvozovkách.
- Podúkol = vlastní řádek s `Parent Task` = název rodiče. Rodič musí být v souboru dřív.
- Milník: import ho založí jako úkol; do ručních dokroků „označit X jako milník".
- Vlastní pole: sloupec na každé pole z `navrh.custom_fields`; hodnoty dropdownu jako text, import z nich udělá možnosti. Typ `people` a `date` v CSV nevytvářej – do ručních dokroků.
- Kódování UTF-8 s BOM, oddělovač čárka.

Ulož jako `<slug názvu projektu>.csv` do pracovního adresáře a řekni cestu.

## Instrukce k importu

1. V Asaně: založit prázdný projekt v cílovém týmu, název podle `navrh.name`, výchozí view podle `navrh.view`.
2. Menu projektu (šipka u názvu) → Import → CSV → vybrat soubor.
3. V náhledu zkontrolovat, že sloupce sedí na Name, Section, Due Date, Notes, Parent Task a vlastní pole.
4. Import. Po něm smazat prázdnou výchozí sekci, pokud vznikla.

## Ruční dokroky po importu

Stejné jako v `vystup-mcp.md`, sekce „Ruční dokroky", plus:

- označit milníky,
- založit vlastní pole typu people a date,
- u `project_template` uložit projekt jako šablonu a nastavit relativní termíny,
- u `hidden` polí je skrýt.

## Ručně (proces bez connectoru)

Vypiš postup po krocích: založit projekt s view Board, sekce přesně podle `navrh.sections` v jejich pořadí, vlastní pole, dvě pravidla, šablonu úkolu z `repeatability.task_template`, zobrazení podle `show_tasks`. Každý krok jedna věta s cestou v UI.
