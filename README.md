# Zegar Turniejowy

Responsywna, statyczna aplikacja hostowana przez GitHub Pages. Firebase Authentication obsługuje konta; Realtime Database synchronizuje stan zegarów.

## Funkcje
- Osobne linki publiczne dla wielu niezależnych timerów.
- Operatorzy mogą tworzyć i kontrolować swoje zegary.
- Nowe konta operatorów są zatwierdzane automatycznie.
- Operatorzy mogą samodzielnie poprosić o reset hasła e-mailem.
- Administratorzy mogą kontrolować wszystkie zegary.
- Wspólne odliczanie oparte na czasie serwera, pauza, wznowienie i reset.
- Konfigurowalny tytuł, komunikat, skala czcionek, widoczność timera i własne logo.
- W publicznej gałęzi `timerDisplays` znajdują się tylko dane potrzebne ekranom. Metadane właścicieli są oddzielone w `timerInstances`.

## Konfiguracja Firebase
1. W projekcie `zegar-turniejowy` włącz **Authentication → Sign-in method → Email/Password**.
2. Utwórz Realtime Database w regionie europejskim.
3. W Firebase Console → Realtime Database → Rules opublikuj zawartość pliku `database.rules.json`.
4. W Authentication → Users utwórz konto administratora (możesz najpierw zarejestrować je z aplikacji jako operatora).
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
   To jednorazowe ręczne nadanie pierwszej roli administratora. Rejestracja w aplikacji może tworzyć wyłącznie profil operatora; istniejący użytkownik nie może sam zmienić swojej roli na administratora.
6. W repozytorium ustaw **Settings → Pages → Deploy from a branch → main → /(root)**.

Firebase Web config w `firebase-config.js` jest konfiguracją klienta, a nie hasłem. Bezpieczeństwo zapewniają opublikowane reguły bazy i Firebase Authentication. Nie publikuj haseł ani danych prywatnych w repozytorium.

## Reset hasła
Na stronie **Panel operatora** wpisz adres e-mail i kliknij **Resetuj hasło**. Firebase Authentication wyśle wiadomość z linkiem do ustawienia nowego hasła. Dostosuj szablon wiadomości w Firebase Console → Authentication → Templates. Jeśli przy wysyłaniu pojawi się błąd, sprawdź w Firebase Console → Authentication → Settings, czy domena hostująca stronę jest dozwolona.

## Adresy timerów
Linki mają formę:

`https://kszeruga.github.io/zegar-turniejowy/timer_abc123/`

Każdy stworzony timer ma własny identyfikator. GitHub Pages kieruje nieistniejące ścieżki do `404.html`, który renderuje odpowiedni ekran bez zmiany linku.
