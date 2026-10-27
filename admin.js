import { auth, db, ref, get, onValue } from "./firebase.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const $ = id => document.getElementById(id);
let currentUser = null;
let stopTimers = null;
let stopDisplays = null;
let timers = {};
let displays = {};

function say(id, message, isError = false) {
  $(id).textContent = message;
  $(id).classList.toggle("error", isError);
}

$("adminLoginForm").addEventListener("submit", async event => {
  event.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
  } catch (error) {
    say("loginStatus", "Nie udało się zalogować. Sprawdź dane logowania.", true);
  }
});
$("logoutButton").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, user => {
  currentUser = user;
  $("adminLogin").hidden = !!user;
  $("adminPanel").hidden = true;
  if (stopTimers) stopTimers();
  if (stopDisplays) stopDisplays();
  stopTimers = stopDisplays = null;
  timers = {};
  displays = {};
  if (!user) return;

  get(ref(db, "users/" + user.uid)).then(snapshot => {
    const profile = snapshot.val();
    if (profile?.role !== "admin" || profile?.status !== "approved") {
      say("loginStatus", "To konto nie ma uprawnień administratora.", true);
      signOut(auth);
      return;
    }
    $("adminPanel").hidden = false;
    stopTimers = onValue(ref(db, "timerInstances"), snap => {
      timers = snap.val() || {};
      renderTimers();
    }, error => say("adminStatus", "Nie udało się odczytać zegarów: " + error.message, true));
    stopDisplays = onValue(ref(db, "timerDisplays"), snap => {
      displays = snap.val() || {};
      renderTimers();
    }, error => say("adminStatus", "Nie udało się odczytać danych ekranów: " + error.message, true));
  }).catch(error => say("loginStatus", "Nie udało się sprawdzić uprawnień: " + error.message, true));
});

function renderTimers() {
  const host = $("timers");
  host.replaceChildren();
  const entries = Object.entries(timers).filter(([id]) => displays[id]);
  if (!entries.length) {
    host.textContent = "Brak zegarów.";
    return;
  }
  for (const [id, meta] of entries.sort((a,b) => String(a[1].name || "").localeCompare(String(b[1].name || ""), "pl"))) {
    const display = displays[id] || {};
    const panel = document.createElement("article");
    panel.className = "panel";
    const heading = document.createElement("h3");
    heading.textContent = display.name || meta.name || id;
    panel.append(heading);
    const link = document.createElement("a");
    link.href = "./" + id + "/";
    link.textContent = new URL(link.href).href;
    link.target = "_blank";
    link.rel = "noopener";
    panel.append(link);
    const owner = document.createElement("p");
    owner.className = "muted small";
    owner.textContent = "Właściciel UID: " + meta.ownerUid;
    panel.append(owner);
    const control = document.createElement("p");
    control.innerHTML = '<a href="./control.html">Steruj zegarem w panelu operatora</a>';
    panel.append(control);
    host.append(panel);
  }
}
