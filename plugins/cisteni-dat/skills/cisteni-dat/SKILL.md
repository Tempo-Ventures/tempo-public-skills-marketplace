---
name: cisteni-dat
description: Použij při čištění dat, přípravě dat pro import do jiného systému, deduplikaci, standardizaci formátů, validaci tabulek nebo migraci z Excelu/CSV do nového nástroje. Triggery "vyčisti data", "připrav data k importu", "deduplikuj", "zkontroluj data", "migrace z excelu", "standardizuj formát".
---

# Čištění dat

Postupy a principy pro čištění dat tak, aby se nikdy neztratila a aby byly změny dohledatelné. Čištění dat je typicky jednorázová činnost při zavádění nového systému (migrace z Excelu, přechod na CRM), ale stejné principy platí i pro automatizace.

## Základní princip

**Žádná destruktivní akce bez zálohy a bez záznamu.** Dělat změny vždy na kopii sloupce/tabulky a zachovat originál, dokud nemáš ověřeno, že nová data sedí.

## Než začneš: kontext určuje náročnost

Zeptej se na tyto věci dřív, než sáhneš na data:

1. **Kam data půjdou?**
   - Import do jiného nástroje → musíš znát specifikace cílového systému (formáty, povinná pole, číselníky).
   - Otevírání v Google Sheets nebo Excelu → pozor, sheet/excel si formáty interpretuje po svém (datumy, čísla, vedoucí nuly).
2. **Jaký je formát zdroje?**
   - **CSV** je jistější, je to "texťák" a nic se ti neztratí. Spousta činností se lépe dělá v CSV. Pro macOS je dobrá zkušenost s **Easy CSV Editor**.
   - **Excel/XLSX** může změnit hodnoty při otevření (datumy, vedoucí nuly v telefonech, IČO apod.).
3. **Jaký je objem dat?** Klíčový parametr pro volbu nástroje (viz níže).

> Všechno tohle je **práce navíc** vůči samotnému čištění. Pokud děláš zakázku, počítej s tím v odhadu.

## Evidence dat (souborů)

| Pravidlo | Konkrétně |
|----------|-----------|
| Jasné pojmenování | `export_kontakty_crm-240629_1325` - podtržítko spojuje související informace (datum a čas), spojovník odděluje samostatné části názvu |
| Zdroje uložené stranou | Originální zdrojové tabulky neměnit, pracovat na kopii |
| Log změn | Ideálně existuje záznam všech změn. Ručně je to náročné - osobní praxe: psát si to jako podúkoly v Asaně a postupně odškrtávat |
| Záloha před destruktivní akcí | Buď nová verze tabulky s datem a časem v názvu, nebo nový sloupec (zkopírovat sloupec, originál zachovat, změny dělat na kopii) |

Pokud dojde k doplnění nebo změně zdrojových tabulek, **musí** to být zaznamenané. Bez záznamu nedohledáš, odkud co přišlo.

## Kontrola dat

Před čištěním a po každém větším kroku zkontroluj:

- **Počty řádků** při spojování více tabulek (platí hlavně pro SQL - join může množit řádky).
- **Extrémy a anomálie** - hlavně u číselných hodnot. Min/max/percentily.
- **Porovnání se zdrojem** - kolik kontaktů vidím v CRM a kolik mám v CSV? Mělo by to sedět.
- **Entity v tabulkách** - není potřeba je rozdělit do samostatných tabulek? (Kontakty vs. firmy vs. události.)
- **Unikátnost** - které řádky mají být unikátní? Co je primární klíč?
- **Povinné sloupce** - kde musí být hodnota a kde může chybět? Co dělat, pokud v "povinných" sloupcích hodnoty chybí - ignorovat řádek, reportovat, dohledat?

## Typické čistící činnosti

### 1. Práce s textem

- Ovládat funkce pro práci s textem: `LEFT/RIGHT/MID`, `LEN`, `FIND` vs `SEARCH`, `SUBSTITUTE/REPLACE`, `TRIM`.
- Každý nástroj má funkce trochu jinak - **vždy si ověř v dokumentaci, co funkce vrací**. Např. `FIND` může vracet `true`/`false` nebo pozici - liší se napříč nástroji.
- **Airtable** je výborný na sjednocování single/multi selectů (konverze textu na select, rozdělení do tabulek a zpět).
- **Regex** pro složitější pravidla. Bez AI to moc nejde. Testovat lze na [Regex101](https://regex101.com/). Make.com a n8n staví na JavaScriptu, takže používají JS standard regexů.

### 2. Formátování datumů

- Datumy jsou v podstatě texty. Když ti nefungují datumové funkce (odečítání dnů apod.), je to text - musíš ho **parsovat** na datum.
- Každý nástroj má vlastní funkce pro parsování (text → datum) a formátování (datum → text).
- **AI dává typicky nejlepší řešení parsovacích výrazů**, hlavně u nestandardních formátů.
- Pokud pracuješ s CSV, pamatuj: po otevření v Excelu se ti datumy můžou změnit. Pokud možno, neotvírej CSV v Excelu.

### 3. Deduplikace

| Úkol | Lepší nástroj |
|------|---------------|
| Smazat duplicitní záznamy podle vzorce | Google Sheets |
| Spojit duplicity a vybrat, které informace zachovat | Airtable |

### 4. Standardizace, kategorizace, normalizace

- **Formáty telefonních čísel, adres** - dohodnout předem, ideálně s cílovým systémem.
- **Veřejné číselníky** u obecně dostupných a neměnných informací - seznam obcí, zemí (ISO standardy). **Nemá to být pocitovka**, mělo by to být řízené konkrétním využitím.
- **Velká vs. malá písmena** - sjednotit (typicky `PROPER`, `LOWER`, `UPPER`).
- **Měrné jednotky** - Kč vs. tisíce Kč, hodiny vs. dny, hodiny jako desetinné číslo (3,25 hod.) vs. čas (3:15).
- Kategorizace podle principu **MECE** - Mutually Exclusive, Collectively Exhaustive (vzájemně se vylučující, společně vyčerpávající).

### 5. Validace dat

- **Chybějící hodnoty** - dohodnout, co s nimi: ignorovat, doplnit z externího zdroje (např. ARES), dopočítat (průměr, medián).
- **Validace metrik** podle významu - věk nemůže být záporný, datum narození a věk musí sedět.
- **Validace přes třetí strany**:
  - **E-maily**: existují služby, které ověří, jestli je e-mail funkční.
  - **ARES**: validace názvu, adresy, IČO firmy.

### 6. Složitější / vícekrokové operace

Pro pipeline nebo opakující se operace použij:

- **n8n** - vizuální workflow, dobré na čistící pipeline.
- **Make.com** - obdobně.
- **Apps Script** (Google Sheets), **VBA** (Excel) - pokud chceš logiku přímo v sheetu.
- **Python** (pandas), **R** - na velké datasety a komplexní logiku.
- **OpenRefine** - klasika na čištění, deduplikaci, standardizaci.
- **Luminal** ([getluminal.com](https://getluminal.com/)) - novější AI-asistovaný nástroj na čištění.

## Volba nástroje podle objemu

| Objem | Vhodné nástroje |
|-------|-----------------|
| Stovky až jednotky tisíc řádků | Google Sheets, Airtable |
| ~50 000 řádků | Hranice Airtablu (Team tarif) i Google Sheets |
| Stovky tisíc+ | CSV (Easy CSV Editor, textový editor), SQL (SQLite, MySQL, PostgreSQL, BigQuery), Python/pandas |

**Víc dat = víc anomálií.** Jakmile něco potřebuješ čistit ručně, náročnost prudce roste - počítej s tím při odhadu.

## Časté chyby

- **Otevření CSV v Excelu** bez kontroly. Excel ti tiše změní datumy, telefonní čísla s vedoucí nulou, IČO. Pokud možno otvírej v textovém editoru nebo specializovaném CSV editoru.
- **Destruktivní akce na originálu.** Vždy kopie - sloupce nebo celé tabulky.
- **Žádný log změn.** Po týdnu už nevíš, proč v datech chybí 200 řádků.
- **Nespecifikovaný cílový formát.** Vyčistíš data jinak, než cílový systém očekává - import selže nebo data padnou jinam, než mají.
- **Pocitová kategorizace.** Místo veřejného číselníku nebo dohodnuté typologie používáš ad-hoc kategorie - pak je nelze sjednotit napříč zdroji.
- **Neověření počtu řádků po join/merge.** SQL join může množit řádky tiše, anomálie zjistíš až později při analýze.

## Rychlý checklist

Před začátkem:
- [ ] Kam data půjdou? Znám specifikace cílového systému?
- [ ] Jaký je formát zdroje? (CSV vs. Excel)
- [ ] Jaký je objem? Mám správný nástroj?

Během práce:
- [ ] Originál uložen stranou, pracuju na kopii
- [ ] Nové sloupce/verze místo přepisu
- [ ] Vedu si log změn (Asana, poznámky, cokoli)

Po dokončení:
- [ ] Počty řádků sedí na zdroj
- [ ] Povinné sloupce vyplněné (nebo zdokumentováno proč ne)
- [ ] Anomálie prověřené (min/max, extrémy)
- [ ] Duplicity vyřešené podle dohody
- [ ] Výstup odpovídá formátu cílového systému

## Když něco nefunguje

Neobcházej to vlastním postupem a **needituj nic v `~/.claude/plugins/cache`** --
při updatu pluginu se to přepíše. Diagnostiku a nahlášení řeší skill
`podpora-nastroju` (plugin `podpora`): chyby i návrhy na změnu se zakládají jako
úkol v Asaně, projekt [Digital Support](https://app.asana.com/1/14933110711900/project/1217984236915577).
