# Pro Plan für alle Benutzer aktivieren (Testzwecke)

Diese Migration aktiviert den Pro Plan für alle Benutzer in der Datenbank.

## ⚠️ WICHTIG: Nur für Testzwecke!

Diese Migration sollte **NUR** in Entwicklung/Test-Umgebungen verwendet werden, nicht in der Produktion!

## Option 1: Über Supabase Dashboard (Empfohlen)

1. **Gehe zu deinem Supabase Dashboard**: https://supabase.com/dashboard
2. **Wähle dein Projekt aus**
3. **Klicke auf "SQL Editor"** (im linken Menü)
4. **Öffne die Datei** `migrations/activate_pro_plan_for_all.sql`
5. **Kopiere den gesamten Inhalt** und füge ihn in den SQL Editor ein
6. **Klicke auf "Run"** (oder drücke Strg+Enter / Cmd+Enter)

## Option 2: Über Node.js Script

```bash
npm run db:activate-pro-plan
```

Oder direkt:
```bash
node scripts/activate-pro-plan.js
```

**Voraussetzungen:**
- `DATABASE_URL` muss in deiner `.env` Datei gesetzt sein
- Node.js muss installiert sein

## Option 3: Über psql (Command Line)

```bash
psql $DATABASE_URL -f migrations/activate_pro_plan_for_all.sql
```

## Was passiert?

Die Migration:
- Setzt `pro_plan = true` für alle Benutzer, die aktuell `pro_plan = false` oder `NULL` haben
- Zeigt Statistiken nach der Ausführung

## Verifikation

Nach der Migration kannst du prüfen:

```sql
-- Prüfe Pro Plan Status aller Benutzer
SELECT 
  id,
  name,
  email,
  pro_plan
FROM users
ORDER BY created_at DESC;

-- Statistiken
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE pro_plan = true) as pro_plan_users,
  COUNT(*) FILTER (WHERE pro_plan = false) as free_plan_users
FROM users;
```

## Rollback (Falls nötig)

Falls du den Pro Plan für alle Benutzer wieder deaktivieren möchtest:

```sql
-- Setzt alle Benutzer zurück auf Free Plan
UPDATE users
SET pro_plan = false;
```

Oder für bestimmte Benutzer:

```sql
-- Setzt nur bestimmte Benutzer zurück
UPDATE users
SET pro_plan = false
WHERE email = 'user@example.com';
```

## Pro Plan Features

Mit aktiviertem Pro Plan haben Benutzer Zugriff auf:
- ✅ Mehr als 5 Runden pro Spiel
- ✅ Alle Musik-Kategorien (nicht nur "Alle")
- ✅ Weitere Premium-Features (falls implementiert)
