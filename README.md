# Zegar Turniejowy

Statyczna aplikacja hostowana przez GitHub Pages, korzystająca z Firebase Authentication i Realtime Database.

## Konfiguracja
1. W projekcie Firebase `zegar-turniejowy` włącz Authentication → Sign-in method → Email/Password.
2. Utwórz Realtime Database w regionie europejskim.
3. Przejrzyj i opublikuj reguły z pliku `database.rules.json` w Firebase Console.
4. Repozytorium można opublikować przez GitHub Pages z gałęzi `main`.

## Pierwszy administrator
Po utworzeniu konta w aplikacji skopiuj jego UID z Firebase Console → Authentication → Users. W Realtime Database dodaj wpis (zastępując UID własnym):
```json
{
  "users": {
    "YOUR_AUTH_UID": {
      "role": "admin",
      "status": "approved"
    }
  }
}
```
Jest to jednorazowe, ręczne nadanie pierwszej roli administratora. Aplikacja nie pozwala użytkownikom samodzielnie przypisać sobie uprawnień.

## Adresy timerów
Linki mają formę `https://kszeruga.github.io/zegar-turniejowy/timer_abc123/`. Obsługę ścieżek timerów zapewnia `404.html`.
