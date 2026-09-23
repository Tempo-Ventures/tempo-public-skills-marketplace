# Technický výstup: struktura.json

Strukturovaný zápis návrhu pro agenta nebo nástroj, který strukturu zakládá. Tvar je daný `schema.json` a kopíruje Asana API – pole beze změny významu, naše pole s prefixem `x-`. `gid` je vždy `null`, doplní se až z Asany.

Kostra:

```json
{
  "client": { "slug": "<slug>", "name": "<Název organizace>", "workspace": { "gid": null, "name": null } },
  "x-rules": [],
  "x-audit": { "disabledRules": [], "thresholds": {} },
  "users": [],
  "custom_fields": [],
  "teams": [],
  "projects": []
}
```

- `client.slug`: krátký slug názvu organizace bez diakritiky, `[a-z0-9-]+`.
- `client.workspace.name`: když ho člověk zná, jinak `null`.
- `x-audit`: vždy výchozí hodnota jako v kostře.
- `x-rules`: pravidla napříč organizací, plochý seznam vět.

## users

```json
{ "gid": null, "x-id": "jana-novakova", "name": "Jana Nováková", "email": null, "x-role": "vedoucí marketingu", "x-invite": false, "x-lead": true, "x-ambassador": false }
```

- `x-id`: slug jména bez diakritiky, unikátní v souboru. Při shodě jmen pořadové číslo (`jan-novak-2`). Týmy a projekty odkazují na lidi přes `x-id`, jméno se nikam nekopíruje.
- `email`: `null`, když ho podklad neuvádí.
- `x-role`: pozice přesně podle podkladu, i s dovětky jako „provizorně".
- `x-lead`, `x-ambassador`: vedoucí, ambasador.
- `x-invite`: vždy `false`. O pozvání do Asany se rozhoduje až při zakládání.

## teams

```json
{ "gid": null, "name": "Marketing", "html_description": "<body>Komunikace značky a akvizice nových zákazníků.</body>", "visibility": "public", "x-notes": "", "memberships": [{ "user": "jana-novakova" }] }
```

- `html_description`: účel týmu jako `<body>…</body>`, bez dalších značek. Odrážky jen když je má podklad: `<body><ul><li>…</li></ul></body>`.
- `visibility`: `public`, `request_to_join`, nebo `secret` podle sekce Viditelnost v metodice.
- `x-notes`: provozní poznámky k týmu, víc bodů oddělených `\n`. Není to rich text.
- `memberships`: členové podle sekce Členství v metodice; vedoucí a ambasador vždy.

## projects

```json
{
  "gid": null,
  "name": "Marketing – To Do List",
  "team": "Marketing",
  "privacy_setting": "public_to_workspace",
  "default_view": "list",
  "notes": "<účel projektu, kdo ho vlastní a jak se do něj zadávají úkoly>",
  "owner": "jana-novakova",
  "sections": ["Nezařazené"],
  "members": [],
  "x-members-from-team": true,
  "x-type": "agenda",
  "custom_field_settings": [],
  "tasks": []
}
```

- `tasks`: vždy `[]`. Úkoly do návrhu struktury nepatří.

- `team`: název týmu.
- `privacy_setting`: `public_to_workspace`, nebo `private` u citlivých projektů.
- `owner`: `x-id` vlastníka, `null` když není známý.
- `x-type`: `agenda`, `projekt`, nebo `proces`.
- `default_view`: agenda `list`, proces `board`, projekt `list` nebo `timeline`.
- `sections`: agenda `["Nezařazené"]`. Proces sekce z podkladu, jinak `["Nezařazené", "Nové", "Rozpracované", "Čeká", "Hotovo"]` – a řekni to v souhrnu. Projekt fáze z podkladu, jinak `["Nezařazené"]`.
- `x-members-from-team: true`: členy jsou všichni z týmu; `members` jsou `x-id` lidí navíc. U soukromého projektu `false` a výčet v `members`.

## custom_fields

Jen pole, která zmiňuje podklad nebo člověk. Žádná výchozí sada. Knihovna je nahoře v `custom_fields`, projekt si pole připíná v `custom_field_settings` názvem.

```json
{ "gid": null, "name": "Priorita", "resource_subtype": "enum", "description": "", "precision": 0,
  "enum_options": [{ "gid": null, "name": "Vysoká", "color": "red" }, { "gid": null, "name": "Nízká", "color": "none" }] }
```

```json
"custom_field_settings": [{ "custom_field": "Priorita", "is_important": true }]
```

`resource_subtype`: `text`, `number` (s `precision`), `enum`, `multi_enum`, `date`, `people`. Barvy podle Asana API. Pole, které organizace už v Asaně má, se jmenuje přesně stejně.

## Kontrola

Před předáním ověř, že soubor odpovídá `schema.json`: všechna povinná pole, `x-id` unikátní, každý odkaz na člověka a tým existuje.
