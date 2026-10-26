import { auth, db, ref, get, set, update, remove, onValue, serverNow } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const $ = id => document.getElementById(id);
let currentUser = null;
let profile = null;
let instances = {};
let displays = {};
let stopInstances = null;
let stopDisplays = null;

function say(id, message, isError = false) {
  const element = $(id);
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("error", isError);
}

$("authForm").addEventListener("submit", async event => {
  event.preventDefault();
  say("authStatus", "");
  try {
    await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
  } catch (error) {
    say("authStatus", friendlyAuthError(error), true);
  }
});

$("registerButton").addEventListener("click", async () => {
  say("authStatus", "");
  try {
    const credential = await createUserWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
    await set(ref(db, "operatorRequests/" + credential.user.uid), {
      email: credential.user.email || "",
      status: "pending",
      requestedAt: Date.now()
    });
    say("pendingStatus", "Prośba została wysłana. Oczekuj na zatwierdzenie przez administratora.");
  } catch (error) {
    const message = "Nie udało się wysłać prośby: " + friendlyAuthError(error);
    say("authStatus", message, true);
    say("pendingStatus", message, true);
  }
});

$("logoutButton").addEventListener("click", () => signOut(auth));
$("pendingLogout").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async user => {
  currentUser = user;
  profile = null;
  $("authPanel").hidden = !!user;
  $("pendingPanel").hidden = true;
  $("operatorPanel").hidden = true;
  if (stopInstances) stopInstances();
  if (stopDisplays) stopDisplays();
  stopInstances = null;
  stopDisplays = null;
  if (!user) return;

  try {
    const snapshot = await get(ref(db, "users/" + user.uid));
    profile = snapshot.val();
    if (profile?.status !== "approved" || !["operator", "admin"].includes(profile?.role)) {
      $("pendingPanel").hidden = false;
      if (profile?.status === "rejected") {
        say("pendingStatus", "Prośba została odrzucona. Skontaktuj się z administratorem.", true);
      }
      return;
    }

    $("operatorPanel").hidden = false;
    $("accountInfo").textContent = "Zalogowano: " + (user.email || user.uid) + " · rola: " + profile.role;
    $("listHeading").textContent = profile.role === "admin" ? "Wszystkie zegary" : "Twoje zegary";
    stopInstances = onValue(ref(db, "timerInstances"), snapshot => {
      instances = snapshot.val() || {};
      renderTimerList();
    }, error => say("createStatus", "Nie udało się odczytać zegarów: " + error.message, true));
    stopDisplays = onValue(ref(db, "timerDisplays"), snapshot => {
      displays = snapshot.val() || {};
      renderTimerList();
    }, error => say("createStatus", "Nie udało się odczytać ekranów timerów: " + error.message, true));
  } catch (error) {
    say("authStatus", "Nie udało się sprawdzić uprawnień: " + error.message, true);
  }
});

$("createForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (!currentUser || profile?.status !== "approved") return;
  const minutes = Number($("minutes").value);
  const seconds = Number($("seconds").value);
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440 ||
      !Number.isInteger(seconds) || seconds < 0 || seconds > 59 ||
      minutes * 60 + seconds === 0) {
    say("createStatus", "Podaj czas większy od zera (maksymalnie 24 godziny).", true);
    return;
  }

  const id = "timer_" + randomId();
  const durationMs = (minutes * 60 + seconds) * 1000;
  const name = $("timerName").value.trim();
  const state = {
    durationMs, remainingMs: durationMs, endsAt: null, running: false,
    title: name, titleScale: 100, message: "", messageScale: 100,
    messageVisible: false, timerVisible: true, updatedAt: Date.now()
  };
  let metadataCreated = false;
  try {
    await set(ref(db, "timerInstances/" + id), {
      ownerUid: currentUser.uid,
      name,
      createdAt: Date.now()
    });
    metadataCreated = true;
    await set(ref(db, "timerDisplays/" + id), { name, state });
    say("createStatus", "Utworzono zegar: " + new URL("./" + id + "/", location.href).href);
  } catch (error) {
    if (metadataCreated) {
      try { await remove(ref(db, "timerInstances/" + id)); } catch (_) {}
    }
    say("createStatus", "Nie udało się utworzyć zegara: " + error.message, true);
  }
});

function renderTimerList() {
  const host = $("timerList");
  host.replaceChildren();
  const entries = Object.entries(instances)
    .filter(([, instance]) => profile?.role === "admin" || instance.ownerUid === currentUser?.uid)
    .sort((a, b) => String(a[1].name || "").localeCompare(String(b[1].name || ""), "pl"));

  if (!entries.length) {
    host.textContent = "Brak zegarów.";
    return;
  }

  for (const [id, instance] of entries) {
    const state = displays[id]?.state || {};
    const displayName = displays[id]?.name || displayName;
    const panel = document.createElement("article");
    panel.className = "panel";

    const heading = document.createElement("h3");
    heading.textContent = displayName;
    panel.append(heading);

    const link = document.createElement("a");
    link.href = "./" + id + "/";
    link.textContent = new URL(link.href).href;
    link.target = "_blank";
    link.rel = "noopener";
    panel.append(link);

    if (profile?.role === "admin") {
      const owner = document.createElement("p");
      owner.className = "muted small";
      owner.textContent = "Właściciel UID: " + instance.ownerUid;
      panel.append(owner);
    }

    const preview = document.createElement("p");
    preview.className = "muted";
    preview.textContent = state.running ? "Odliczanie aktywne" : "Pauza · " + formatDuration(state.remainingMs);
    panel.append(preview);

    const durationRow = document.createElement("div");
    durationRow.className = "row";
    const minutesInput = numberInput(Math.floor((Number(state.durationMs) || 300000) / 60000), 0, 1440, "Minuty");
    const secondsInput = numberInput(Math.floor(((Number(state.durationMs) || 300000) % 60000) / 1000), 0, 59, "Sekundy");
    durationRow.append(minutesInput, secondsInput);
    panel.append(durationRow);

    const patch = async patchState => {
      try {
        await update(ref(db, "timerDisplays/" + id + "/state"), {
          ...patchState,
          updatedAt: Date.now()
        });
        say("createStatus", "Zapisano zmiany: " + (instance.name || id));
      } catch (error) {
        say("createStatus", "Błąd zapisu: " + error.message, true);
      }
    };

    addButton(panel, "Ustaw czas", "secondary", () => {
      const minutes = Number(minutesInput.value), seconds = Number(secondsInput.value);
      if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440 ||
          !Number.isInteger(seconds) || seconds < 0 || seconds > 59 ||
          minutes * 60 + seconds <= 0) {
        say("createStatus", "Nieprawidłowy czas.", true);
        return;
      }
      const durationMs = (minutes * 60 + seconds) * 1000;
      patch({ durationMs, remainingMs: durationMs, endsAt: null, running: false });
    });

    addButton(panel, "Start / wznów", "primary", () => {
      const remaining = state.running && Number.isFinite(state.endsAt)
        ? Math.max(0, state.endsAt - serverNow())
        : Math.max(0, Number(state.remainingMs) || 0);
      if (remaining <= 0) {
        say("createStatus", "Ustaw czas przed startem.", true);
        return;
      }
      patch({ remainingMs: remaining, endsAt: serverNow() + remaining, running: true });
    });

    addButton(panel, "Pauza", "secondary", () => {
      const remaining = state.running && Number.isFinite(state.endsAt)
        ? Math.max(0, state.endsAt - serverNow())
        : Math.max(0, Number(state.remainingMs) || 0);
      patch({ remainingMs: remaining, endsAt: null, running: false });
    });

    addButton(panel, "Reset", "danger", () => patch({
      remainingMs: Math.max(1000, Number(state.durationMs) || 300000),
      endsAt: null,
      running: false
    }));

    const titleInput = textInput(state.title || instance.name || "", 200, "Tytuł wyświetlany");
    panel.append(makeLabel("Tytuł ekranu", titleInput));
    addButton(panel, "Zapisz tytuł", "secondary", () => patch({ title: titleInput.value }));

    const messageInput = document.createElement("textarea");
    messageInput.maxLength = 500;
    messageInput.rows = 3;
    messageInput.placeholder = "Komunikat dla uczestników";
    messageInput.value = state.message || "";
    panel.append(makeLabel("Komunikat", messageInput));
    addButton(panel, state.messageVisible ? "Zapisz i ukryj komunikat" : "Zapisz i pokaż komunikat", "secondary", () => {
      patch({ message: messageInput.value, messageVisible: !state.messageVisible });
    });

    const settings = document.createElement("section");
    settings.className = "settings-block";
    const titleScale = numberInput(Number(state.titleScale) || 100, 25, 300, "Rozmiar tytułu (%)");
    const messageScale = numberInput(Number(state.messageScale) || 100, 25, 300, "Rozmiar komunikatu (%)");
    settings.append(makeLabel("Rozmiar czcionki tytułu (%)", titleScale));
    settings.append(makeLabel("Rozmiar czcionki komunikatu (%)", messageScale));
    const timerVisible = document.createElement("input");
    timerVisible.type = "checkbox";
    timerVisible.checked = state.timerVisible !== false;
    timerVisible.style.width = "1.15rem";
    const visibilityLabel = document.createElement("label");
    visibilityLabel.className = "checkbox-label";
    visibilityLabel.append(timerVisible, document.createTextNode(" Pokaż timer"));
    settings.append(visibilityLabel);

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.setAttribute("aria-label", "Logo stopki");
    settings.append(makeLabel("Logo na dole ekranu", fileInput));
    if (typeof state.footerLogo === "string" && state.footerLogo.startsWith("data:image/")) {
      const img = document.createElement("img");
      img.src = state.footerLogo;
      img.alt = "Podgląd logo";
      img.className = "logo-preview";
      settings.append(img);
    }
    addButton(settings, "Zapisz wygląd ekranu", "secondary", () => patch({
      titleScale: clampScale(titleScale.value),
      messageScale: clampScale(messageScale.value),
      timerVisible: timerVisible.checked
    }));
    addButton(settings, "Usuń własne logo", "secondary", () => patch({ footerLogo: null }));
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        say("createStatus", "Wybierz plik graficzny.", true);
        fileInput.value = "";
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        say("createStatus", "Logo musi mieć maksymalnie 2 MB.", true);
        fileInput.value = "";
        return;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        await patch({ footerLogo: dataUrl });
      } catch (error) {
        say("createStatus", "Nie udało się wczytać logo: " + error.message, true);
      } finally {
        fileInput.value = "";
      }
    });
    panel.append(settings);
    host.append(panel);
  }
}

function addButton(parent, label, cssClass, callback) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = cssClass;
  button.textContent = label;
  button.addEventListener("click", callback);
  parent.append(button);
}
function numberInput(value, min, max, label) {
  const input = document.createElement("input");
  input.type = "number";
  input.value = value;
  input.min = min;
  input.max = max;
  input.setAttribute("aria-label", label);
  return input;
}
function textInput(value, maxLength, label) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.maxLength = maxLength;
  input.setAttribute("aria-label", label);
  return input;
}
function makeLabel(text, input) {
  const wrapper = document.createElement("label");
  wrapper.className = "field-label";
  const caption = document.createElement("span");
  caption.textContent = text;
  wrapper.append(caption, input);
  return wrapper;
}
function clampScale(value) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(300, Math.max(25, n)) : 100;
}
function formatDuration(milliseconds) {
  const total = Math.ceil(Math.max(0, Number(milliseconds) || 0) / 1000);
  return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
}
function randomId() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 4);
}
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Nieprawidłowy format pliku."));
    reader.onerror = () => reject(reader.error || new Error("Błąd odczytu pliku."));
    reader.readAsDataURL(file);
  });
}
function friendlyAuthError(error) {
  return ({
    "auth/email-already-in-use": "Ten adres e-mail ma już konto.",
    "auth/invalid-credential": "Nieprawidłowy e-mail lub hasło.",
    "auth/weak-password": "Hasło jest za krótkie.",
    "auth/operation-not-allowed": "Włącz Email/Password w Firebase Authentication."
  })[error.code] || error.message;
}
