# Založení přes Asana connector

Čti `navrh.json`. Nic z něj nedomýšlej – co v návrhu není, se nezakládá.

## Pořadí

1. `get_me` → workspace. Když je workspace víc, zeptej se jménem.
2. Tým: `search_objects` s `resource_type: "team"` a `navrh.team`. Když tým nenajdeš, zeptej se; tým nezakládej.
3. Kontrola duplicity: `search_objects` s `resource_type: "project"` a `navrh.name`. Když existuje projekt se stejným nebo velmi podobným názvem, zastav se a zeptej se, jestli doplnit ten, nebo založit nový.
4. Projekt: `create_project` s `name`, `team`, `notes` = `navrh.overview`, `default_view` podle `navrh.view` (`list` | `board` | `timeline` | `calendar`). Když nástroj `default_view` nepřijme, přidej do ručních dokroků. `owner` = `navrh.owner` – když je to člověk, který skill spouští, `"me"`; jinak ho najdi přes `search_objects` s `resource_type: "user"` a při nejednoznačnosti se zeptej.
5. Sekce a úkoly: obojí předej už v `create_project` jako `sections[]` s `sectionName` a vnořeným `tasks[]` v pořadí z `navrh.sections` a `navrh.tasks`. První sekce („Nezařazené", u intake „Nové") je už v návrhu – nic nepřidávej.
6. Vlastní pole: connector pole nezakládá. Pro každé pole z `navrh.custom_fields` zkus `search_objects` s `resource_type: "custom_field"` a názvem pole. Když existující pole sedí typem i možnostmi, zeptej se, jestli ho sdílet, a přidej ho přes `update_project.add_custom_fields`. Jinak do ručních dokroků „založit pole X (typ, možnosti) v nastavení polí projektu". Pole s `hidden: true` navíc do ručních dokroků „skrýt pole X". Hodnoty polí na úkolech nenastavuj.
7. Podúkoly: až po založení, `create_tasks` s `parent` = gid rodiče z odpovědi `create_project`. `is_milestone: true` → `resource_subtype: "milestone"` (už v kroku 5). `due.mode: "fixed"` → `due_on`; `due.mode: "offset"` → termín nezadávej, do ručních dokroků „nastavit relativní termíny od milníku <due.from> v šabloně".
8. Assignee nezadávej podle role – `assignee_role` je popis, ne člověk. Do popisu úkolu doplň řádek `Role: <assignee_role>`. Když `hide_assignee: true`, do ručních dokroků „skrýt sloupec Assignee".
9. Šablona úkolu (`repeatability.kind: "task_template"`): založ jeden úkol s názvem podle `name_pattern` a podúkoly z `task_template.subtasks` do první sekce; do ručních dokroků „uložit úkol jako šablonu úkolu a smazat vzorový úkol".
10. Šablona projektu (`repeatability.kind: "project_template"`): do ručních dokroků „uložit projekt jako šablonu, nastavit relativní termíny od prvního milníku".

## Ruční dokroky

Vypiš číslovaně, v pořadí, jak se dělají v Asaně. Vždy:

- Zobrazení úkolů: `show_tasks: "incomplete"` → filtr „Nehotové", `"all"` → bez filtru.
- Řazení: `sort` → nastavení řazení v projektu; `grouping: "custom_field"` → seskupit podle `grouping_field` a vypnout třídění v sekcích.
- Pravidla z `navrh.rules`, názvy sekcí dosaď z `navrh.sections`: `completed_to_done` → „když je úkol splněn, přesuň do poslední sekce"; `day_before_due_to_running` → „den před termínem přesuň z čekací sekce do pracovní" – když proces takovou dvojici sekcí nemá, pravidlo vynech.
- Intake `form` → vytvořit formulář s otázkami odpovídajícími vlastním polím.
- Členům projektu vypnout upozornění na nové úkoly.
- Status update: u projektu nastavit připomínku podle domluvené frekvence.

Když connector něco nezvládne (chyba, chybějící nástroj), nezkoušej obcházet – zapiš to jako ruční dokrok a pokračuj dalším krokem.
