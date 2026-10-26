# Zegar Turniejowy

Responsywna, statyczna aplikacja hostowana przez GitHub Pages. Firebase Authentication obsługuje konta; Realtime Database synchronizuje stan zegarów.

## Funkcje
- Osobne linki publiczne dla wielu niezależnych timerów.
- Operatorzy mogą tworzyć i kontrolować swoje zegary.
- Administratorzy zatwierdzają konta i mogą kontrolować wszystkie zegary.
- Wspólne odliczanie oparte na czasie serwera, pauza, wznowienie i reset.
- Konfigurowalny tytuł, komunikat, skala czcionek, widoczność timera i własne logo.
- W publicznej gałęzi `timerDisplays` znajdują się tylko dane potrzebne ekranom. Metadane właścicieli są oddzielone w `timerInstances`.

## Konfiguracja Firebase
1. W projekcie `zegar-turniejowy` włącz **Authentication → Sign-in method → Email/Password**.
2. Utwórz Realtime Database w regionie europejskim.
3. W Firebase Console → Realtime Database → Rules opublikuj zawartość pliku `database.rules.json`.
4. W Authentication → Users utwórz konto administratora (możesz najpierw zarejestrować je z aplikacji).
5. Skopiuj UID tego konta. W Realtime Database dodaj następujący węzeł, zastępując `YOUR_AUTH_UID` własnym UID:
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
   To jednorazowe ręczne nadanie pierwszej roli administratora. Aplikacja celowo nie pozwala użytkownikom samodzielnie nadać sobie roli.
6. W repozytorium ustaw **Settings → Pages → Deploy from a branch → main → /(root)**.

Firebase Web config w `firebase-config.js` jest konfiguracją klienta, a nie hasłem. Bezpieczeństwo zapewniają opublikowane reguły bazy i Firebase Authentication. Nie publikuj haseł ani danych prywatnych w repozytorium.

## Adresy timerów
Linki mają formę:

`https://kszeruga.github.io/zegar-turniejowy/timer_abc123/`

Każdy stworzony timer ma własny identyfikator. GitHub Pages kieruje nieistniejące ścieżki do `404.html`, który renderuje odpowiedni ekran bez zmiany linku.
