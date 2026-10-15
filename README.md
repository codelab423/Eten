# 🍽️ Wat eten we vanavond?

Een simpele webapp voor je gezin om elke dag samen te stemmen op wat er
vanavond gegeten wordt. Werkt op de telefoon, update live, en iedereen
ziet wie op wat gestemd heeft.

- **Frontend:** losse HTML/CSS/JS-bestanden, geen build-stap nodig.
- **Backend:** [Supabase](https://supabase.com) (database + accounts + realtime).
- **Hosting:** gratis op [Netlify](https://netlify.com) of [Vercel](https://vercel.com).

Hieronder staat alles stap voor stap. Je hoeft niets te programmeren —
alleen wat kopiëren/plakken en knopjes klikken.

---

## Stap 1: Supabase-project aanmaken

1. Ga naar [supabase.com](https://supabase.com) en maak een gratis account
   (kan met je Google- of GitHub-account).
2. Klik op **"New project"**.
   - Kies een naam, bijv. `wat-eten-we`.
   - Kies een database-wachtwoord (bewaar dit ergens, maar je hebt het
     verder niet nodig voor deze app).
   - Kies een regio die dicht bij jullie is, bijv. **West EU (Ireland)**.
3. Wacht ongeveer 1-2 minuten tot het project klaar staat.

## Stap 2: De database inrichten

1. Klik in het Supabase-dashboard links op **"SQL Editor"**.
2. Klik op **"New query"**.
3. Open het bestand [`supabase/schema.sql`](supabase/schema.sql) uit dit
   project, kopieer de volledige inhoud, en plak die in de SQL Editor.
4. Klik op **"Run"** (rechtsonder, of `Ctrl/Cmd + Enter`).
5. Je zou onderin "Success" moeten zien. Dit maakt 4 tabellen aan:
   - `profiles` — naam per gebruiker
   - `gerechten` — de lijst met gerechten
   - `stemmen` — wie er vandaag op wat gestemd heeft
   - `gegeten` — geschiedenis van wat jullie echt gegeten hebben
   
   Het schakelt ook meteen **Row Level Security** in, zodat alleen
   ingelogde gezinsleden gegevens kunnen zien, en iedereen alleen zijn
   eigen stem kan aanpassen.

### E-mailbevestiging uitzetten (aanbevolen voor een gezinsapp)

Standaard wil Supabase dat nieuwe gebruikers hun e-mail bevestigen voor
ze kunnen inloggen. Voor een kleine familie-app is dat niet nodig en
maakt het rondsturen aan je familie makkelijker:

1. Ga naar **Authentication** → **Providers** → **Email** (in het linkermenu
   onder Authentication, dan tabblad "Providers" of "Sign In / Up").
2. Zet **"Confirm email"** uit.
3. Klik op **Save**.

(Laat je dit aan staan, dan moet iedereen na het aanmaken van een account
eerst een bevestigingsmail openen voor ze kunnen inloggen — de app werkt
dan ook, alleen met die extra stap.)

## Stap 3: Je API-gegevens invullen in de app

1. Ga in Supabase naar **Project Settings** (tandwiel-icoon linksonder) →
   **API**.
2. Je ziet daar twee dingen die je nodig hebt:
   - **Project URL** (ziet er zo uit: `https://xxxxxxxxxxxx.supabase.co`)
   - **anon public** key (een lange tekst/token onder "Project API keys")

   ⚠️ Gebruik alleen de **"anon" / "public"** key, nooit de
   `service_role` key — die laatste is geheim en mag nooit in deze app
   terechtkomen.

3. Open in dit project het bestand [`js/config.js`](js/config.js) en vul
   jouw eigen waarden in:

   ```js
   const SUPABASE_URL = "https://xxxxxxxxxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "jouw-lange-anon-key-hier";
   ```

4. Sla het bestand op.

## Stap 4: Realtime controleren

De SQL uit stap 2 heeft `gerechten`, `stemmen` en `gegeten` al toegevoegd
aan de Supabase realtime-publicatie. Je kan dit controleren via
**Database** → **Replication** in het Supabase-dashboard: daar zouden
die drie tabellen aan moeten staan. Zo niet, zet ze daar handmatig aan.

## Stap 5: Lokaal testen (optioneel)

Wil je het eerst even op je eigen computer bekijken voor je het online
zet? Omdat het pure HTML/CSS/JS is, kan dat heel simpel met Python (je
kent een beetje Python, dus dit werkt):

```bash
cd Eten
python3 -m http.server 8000
```

Ga dan in je browser naar `http://localhost:8000`. Je kan meteen een
account aanmaken en testen.

## Stap 6: Online zetten (deployen)

### Optie A: Netlify (makkelijkst)

1. Zorg dat deze projectmap in een GitHub-repository staat (als dat al
   zo is, mooi, anders: maak een nieuwe repo aan op GitHub en push deze
   bestanden erheen).
2. Ga naar [app.netlify.com](https://app.netlify.com) en log in (kan met
   je GitHub-account).
3. Klik op **"Add new site"** → **"Import an existing project"**.
4. Kies GitHub en selecteer je repository.
5. Netlify herkent automatisch dat er geen build-stap nodig is dankzij
   het bestand `netlify.toml` in dit project. Laat de instellingen
   verder op standaard staan en klik op **"Deploy site"**.
6. Na ongeveer 30 seconden krijg je een link zoals
   `https://jouw-site-naam.netlify.app`. Dat is je app!
7. Optioneel: ga naar **Site settings** → **Change site name** om een
   leukere naam te kiezen.

### Optie B: Vercel

1. Zorg dat de projectmap op GitHub staat (zie boven).
2. Ga naar [vercel.com](https://vercel.com) en log in met GitHub.
3. Klik op **"Add New..."** → **"Project"**, kies je repository.
4. Vercel ziet dat het een statische site is (geen framework). Laat de
   instellingen op standaard staan en klik op **"Deploy"**.
5. Na een korte tijd krijg je een link zoals
   `https://jouw-project.vercel.app`.

## Stap 7: Delen met je familie

Stuur de link (van Netlify of Vercel) naar je gezin. Iedereen kan op
**"Account maken"** klikken, zijn/haar naam + e-mail + wachtwoord
invullen, en meteen meedoen.

---

## Hoe werkt de app?

- **Gerecht toevoegen:** iedereen kan onderin een gerecht toevoegen met
  een naam en optioneel een emoji.
- **Stemmen:** klik op "Stem" bij een gerecht. Je kan je stem de hele dag
  wijzigen door op een ander gerecht te klikken — je oude stem van
  vandaag wordt dan automatisch vervangen (elke gebruiker heeft maar 1
  stem per dag).
- **Live meekijken:** zodra iemand anders stemt of een gerecht toevoegt,
  zie je dat automatisch verschijnen, zonder de pagina te verversen
  (dankzij Supabase Realtime). Werkt het een keer niet, klik dan op
  "🔄 Vernieuwen".
- **"Dit eten we vandaag":** deze knop toont steeds het gerecht dat op
  dat moment de meeste stemmen heeft. Klik erop om de keuze voor
  vandaag vast te leggen. Dit wordt ook opgeslagen in de geschiedenis
  (`gegeten`), zodat de app weet wanneer een gerecht voor het laatst
  gegeten is.
- **"Laatst gegeten":** bij elk gerecht staat hoe lang geleden het
  gegeten is (bijv. "3 dagen geleden"). Is dat 4 dagen of minder
  geleden, dan zie je een ⚠️-waarschuwing.
- **Nieuwe dag, nieuwe stemming:** de stemmen van "vandaag" worden
  bepaald op basis van de huidige datum. Zodra het middernacht is
  geweest, telt de app automatisch weer vanaf 0 — er is geen reset-knop
  nodig.

## Projectstructuur

```
Eten/
├── index.html          # Inlog- / registratiepagina
├── app.html             # De hoofdapp (stemmen, gerechten, geschiedenis)
├── css/style.css         # Alle styling
├── js/
│   ├── config.js         # JOUW Supabase-gegevens (URL + anon key)
│   ├── supabaseClient.js  # Maakt de Supabase-verbinding
│   ├── helpers.js         # Datum-hulpfuncties
│   ├── auth.js            # Logica voor index.html
│   └── app.js             # Logica voor app.html
├── supabase/schema.sql    # Database-structuur + beveiliging (RLS)
├── netlify.toml            # Netlify-configuratie
└── vercel.json              # Vercel-configuratie
```

## Problemen oplossen

- **"Failed to fetch" of niets laadt:** controleer of `js/config.js` de
  juiste `SUPABASE_URL` en `SUPABASE_ANON_KEY` bevat (geen quotes
  vergeten, geen spaties).
- **Kan geen account aanmaken / krijgt geen bevestiging:** zet
  "Confirm email" uit zoals in Stap 2 beschreven, of check je
  spam-folder voor de bevestigingsmail.
- **Ik zie geen namen bij de stemmen:** controleer in de SQL Editor of
  de trigger `on_auth_user_created` goed is aangemaakt (dit zorgt dat
  elk account automatisch een naam krijgt in `profiles`).
- **Live updates werken niet:** check Stap 4 (Database → Replication).
