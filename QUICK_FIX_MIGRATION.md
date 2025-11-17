# ⚠️ WICHTIG: Datenbank-Migration ausführen

Der Fehler tritt auf, weil die Spotify-Spalten noch nicht in der Datenbank existieren.

## 🚀 Schnelle Lösung (Supabase Dashboard)

1. **Gehe zu deinem Supabase Dashboard**: https://supabase.com/dashboard
2. **Wähle dein Projekt aus**
3. **Klicke auf "SQL Editor"** (im linken Menü)
4. **Füge folgendes SQL ein**:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS spotify_access_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS spotify_user_id VARCHAR(255);
```

5. **Klicke auf "Run"** (oder drücke Strg+Enter / Cmd+Enter)

## ✅ Verifikation

Nach der Migration kannst du prüfen, ob es funktioniert hat:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'spotify%';
```

Du solltest 4 Spalten sehen:
- `spotify_access_token`
- `spotify_refresh_token`
- `spotify_token_expires_at`
- `spotify_user_id`

## 🔄 Nach der Migration

1. **Starte den Dev-Server neu**: `npm run dev`
2. **Lade die Seite neu**: Der Fehler sollte verschwinden
3. **Teste die Spotify-Verbindung**: Klicke auf "Spotify verknüpfen"

## 📝 Alternative: Über Supabase CLI

Falls du die Supabase CLI installiert hast:

```bash
supabase db execute --file migrations/add_spotify_columns.sql
```

---

**Hinweis**: Ich habe eine temporäre Fehlerbehandlung hinzugefügt, die den Fehler abfängt, aber die Migration muss trotzdem ausgeführt werden, damit die Spotify-Funktionalität vollständig funktioniert.

