# Zegar Turniejowy

Aplikacja do obsługi zegarów turniejowych. Każdy zegar ma własny link, a jego stan synchronizuje się na bieżąco między panelem operatora a ekranem widocznym dla uczestników.

## Instrukcja dla operatora

### 1. Otwórz panel operatora

Przejdź na stronę:

**https://kszeruga.github.io/zegar-turniejowy/control.html**

### 2. Zaloguj się lub utwórz konto

Możesz wybrać jedną z dwóch metod:

- **Zaloguj przez Google** — otworzy się okno, w którym wybierzesz konto Google.
- **Adres e-mail i hasło** — wpisz dane i kliknij **Zaloguj**. Przy pierwszej wizycie kliknij **Utwórz konto**.

Nowe konta otrzymują automatycznie uprawnienia operatora; nie trzeba czekać na zatwierdzenie przez administratora.

Jeśli logowanie Google zgłasza błąd o niedozwolonej domenie, administrator techniczny musi dodać `kszeruga.github.io` w Firebase Console → **Authentication → Settings → Authorized domains**. Dostawca Google musi też być włączony w **Authentication → Sign-in method**.

### 3. Utwórz zegar

W sekcji **Utwórz zegar**:

1. Wpisz nazwę, np. „Stolik 1”, „Finał” albo „Runda 3”.
2. Ustaw początkowy czas w minutach i sekundach.
3. Kliknij **Utwórz zegar**.

Nowy zegar pojawi się na liście. Każdy zegar działa niezależnie od pozostałych.

### 4. Otwórz i udostępnij ekran

Pod nazwą zegara znajdziesz jego publiczny link, np.:

`https://kszeruga.github.io/zegar-turniejowy/timer_abc123/`

Otwórz ten adres na komputerze podłączonym do projektora albo na ekranie widocznym dla uczestników. Link można też skopiować i udostępnić. Ekran jest publiczny — każdy, kto ma link, może go oglądać, ale sterowanie wymaga zalogowania i uprawnień.

### 5. Steruj odliczaniem

Przy wybranym zegarze dostępne są przyciski:

- **Ustaw czas** — ustawia wartość z pól minut i sekund oraz zatrzymuje zegar.
- **Start / wznów** — rozpoczyna odliczanie lub wznawia je po pauzie.
- **Pauza** — zatrzymuje odliczanie i zachowuje pozostały czas.
- **Reset** — przywraca zegar do ustawionej długości.

Odliczanie jest synchronizowane za pomocą czasu serwera. Odświeżenie publicznego ekranu nie rozpoczyna go od nowa.

### 6. Zmień wygląd ekranu

Przy każdym zegarze możesz zmienić:

- **Tytuł ekranu** — tekst wyświetlany nad czasem.
- **Komunikat** — wiadomość dla uczestników, którą można pokazywać lub ukrywać.
- **Rozmiar czcionki tytułu i komunikatu** — dopasowanie tekstu do projektora.
- **Pokaż timer** — ukrycie lub ponowne pokazanie odliczania.
- **Logo na dole ekranu** — własny plik graficzny o rozmiarze do 2 MB.
- **Usuń własne logo** — usuwa wgrane logo.

Po zapisaniu zmiany są widoczne na otwartych ekranach. Sprawdź efekt na docelowym projektorze.

### 7. Zresetuj zapomniane hasło

Jeśli korzystasz z konta e-mail/hasło:

1. Na stronie panelu operatora wpisz adres e-mail.
2. Kliknij **Resetuj hasło**.
3. Otwórz wiadomość od Firebase i postępuj zgodnie z linkiem. Sprawdź również folder spam.

Nie trzeba prosić administratora o reset hasła. Ta funkcja dotyczy kont e-mail/hasło; w przypadku logowania przez Google hasło zmieniasz w ustawieniach swojego konta Google.

### 8. Wyloguj się

Po zakończeniu pracy kliknij **Wyloguj**. Publiczne ekrany nadal będą pokazywać zapisany stan zegarów.

## Panel administratora

Administrator może otworzyć stronę:

**https://kszeruga.github.io/zegar-turniejowy/admin.html**

Administrator może przeglądać wszystkie zegary. W panelu operatora może też sterować zegarami innych operatorów. Zwykły operator widzi i kontroluje tylko zegary, których jest właścicielem.

## Konfiguracja Firebase (dla administratora technicznego)

1. W projekcie Firebase `zegar-turniejowy` włącz potrzebne metody logowania w **Authentication → Sign-in method**: Email/Password oraz Google.
2. W **Authentication → Settings → Authorized domains** sprawdź, czy znajduje się `kszeruga.github.io`. Jeśli nie, dodaj tę domenę.
3. Utwórz Realtime Database w regionie europejskim.
4. W **Realtime Database → Rules** opublikuj zawartość pliku [`database.rules.json`](https://github.com/kszeruga/zegar-turniejowy/blob/main/database.rules.json).
5. Aby nadać pierwszą rolę administratora, zarejestruj konto w aplikacji, skopiuj jego UID z **Authentication → Users**, a następnie dodaj w **Realtime Database → Data** węzeł poniżej. Zastąp `YOUR_AUTH_UID` własnym UID:

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

   To jednorazowe, ręczne nadanie uprawnień. Rejestracja publiczna może utworzyć wyłącznie profil operatora; użytkownik nie może sam przyznać sobie roli administratora.
6. W GitHub ustaw **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root)**.

Konfiguracja klienta w `firebase-config.js` nie jest hasłem. Nie umieszczaj w repozytorium haseł ani prywatnych danych.

## Rozwiązywanie problemów

- **Google zgłasza „unauthorized domain”** — dodaj `kszeruga.github.io` w Firebase Authentication → Settings → Authorized domains.
- **Nie można się zalogować lub utworzyć konta e-mail** — sprawdź, czy włączono Email/Password.
- **Reset hasła nie przychodzi** — sprawdź adres e-mail, folder spam i dozwoloną domenę.
- **Ekran pokazuje „Nie znaleziono zegara”** — sprawdź link i upewnij się, że zegar nadal znajduje się na liście panelu.
- **Zmiany nie pojawiają się na ekranie** — sprawdź status połączenia z Firebase, a następnie odśwież ekran.
