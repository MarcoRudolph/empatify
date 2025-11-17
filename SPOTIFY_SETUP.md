# Spotify Integration Setup Guide

Diese Anleitung erklärt, wie du die Spotify-Verbindung für Empatify einrichtest.

## Voraussetzungen

1. **Spotify Developer Account** (kostenlos)
   - Gehe zu https://developer.spotify.com/dashboard
   - Melde dich mit deinem normalen Spotify-Account an (kein spezieller Developer-Account nötig!)

## Schritt 1: Spotify App erstellen

1. Gehe zum [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Klicke auf **"Create an App"**
3. Fülle das Formular aus:
   - **App name**: z.B. "Empatify"
   - **App description**: z.B. "Multiplayer Music Rating Game"
   - **Redirect URI**: 
     - Für Entwicklung: `http://localhost:3000/api/spotify/callback`
     - Für Produktion: `https://yourdomain.com/api/spotify/callback`
   - **Website**: Deine Website-URL (optional)
4. Akzeptiere die Nutzungsbedingungen
5. Klicke auf **"Save"**

## Schritt 2: Client ID und Secret erhalten

1. Nach der Erstellung findest du deine **Client ID** direkt im Dashboard
2. Klicke auf **"Show client secret"** um dein **Client Secret** anzuzeigen
3. **WICHTIG**: Speichere beide Werte sicher - das Client Secret wird nur einmal angezeigt!

## Schritt 3: Environment Variables setzen

Füge folgende Variablen zu deiner `.env` Datei hinzu:

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=deine_client_id_hier
SPOTIFY_CLIENT_SECRET=dein_client_secret_hier
```

## Schritt 4: Datenbank-Migration ausführen

Die Datenbank-Schema wurde bereits erweitert. Führe die Migration aus:

```bash
npm run db:push
```

Oder manuell mit SQL:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_user_id VARCHAR(255);
```

## Schritt 5: Redirect URI konfigurieren

1. Gehe zurück zum Spotify Developer Dashboard
2. Öffne deine App
3. Klicke auf **"Edit Settings"**
4. Füge alle benötigten Redirect URIs hinzu:
   - `http://localhost:3000/api/spotify/callback` (Entwicklung)
   - `https://yourdomain.com/api/spotify/callback` (Produktion)
5. Speichere die Änderungen

## Schritt 6: Testen

1. Starte den Development Server: `npm run dev`
2. Gehe zum Dashboard: `http://localhost:3000/de/dashboard`
3. Klicke auf **"Spotify verknüpfen"**
4. Du wirst zu Spotify weitergeleitet
5. Nach der Autorisierung wirst du zurück zum Dashboard geleitet
6. Der Button sollte jetzt **"Spotify verknüpft"** anzeigen

## Wichtige Hinweise

### Entwicklungsmodus

- Im Entwicklungsmodus können nur Benutzer auf die App zugreifen, die du im Dashboard unter **"User Management"** hinzugefügt hast
- Um die App für alle Spotify-Benutzer zugänglich zu machen, musst du eine **Quota-Erweiterung** beantragen

### Token-Verwaltung

- **Access Token**: Gültig für 1 Stunde, wird automatisch erneuert
- **Refresh Token**: Gültig bis der User die Verbindung trennt
- Tokens werden sicher in der Datenbank gespeichert
- Automatisches Token-Refresh ist implementiert

### Berechtigungen (Scopes)

Die App benötigt folgende Berechtigungen:
- `user-read-email`: E-Mail-Adresse des Spotify-Accounts lesen
- `user-read-private`: Privat-Informationen lesen
- `user-read-playback-state`: Aktuellen Wiedergabestatus lesen
- `user-modify-playback-state`: Wiedergabe steuern
- `user-read-currently-playing`: Aktuell abgespielten Song lesen
- `playlist-read-private`: Private Playlists lesen
- `playlist-read-collaborative`: Kollaborative Playlists lesen
- `streaming`: Musik streamen

## Fehlerbehebung

### "redirect_uri_mismatch"
- Stelle sicher, dass die Redirect URI im Spotify Dashboard exakt mit der in der App verwendeten übereinstimmt
- Prüfe, dass keine zusätzlichen Slashes oder Parameter vorhanden sind

### "invalid_client"
- Überprüfe, dass `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` und `SPOTIFY_CLIENT_SECRET` korrekt gesetzt sind
- Stelle sicher, dass keine Leerzeichen oder Anführungszeichen in den Environment Variables sind

### Token wird nicht gespeichert
- Prüfe die Datenbank-Verbindung
- Stelle sicher, dass die Migration erfolgreich war
- Überprüfe die Logs für Fehlermeldungen

## API-Endpunkte

- `GET /api/spotify/auth` - Startet den OAuth-Flow
- `GET /api/spotify/callback` - Verarbeitet den OAuth-Callback
- `GET /api/spotify/status` - Prüft den Verbindungsstatus

## Nächste Schritte

Nach erfolgreicher Verbindung kannst du:
- Spotify-Songs suchen
- Songs vorschlagen
- Musik abspielen
- Playlists lesen

