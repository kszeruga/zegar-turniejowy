import { db, ref, onValue, serverNow } from "./firebase.js";
const $ = id => document.getElementById(id);
const pathPart = location.pathname.replace(/\/+$/, "").split("/").pop();
const timerId = window.__ZEGAR_TIMER_ID__ || (/^timer_[a-z0-9]+$/i.test(pathPart || "") ? pathPart : null);
const display = $("display"), home = $("home"), topbar = document.querySelector(".topbar");
if (timerId) {
  if (display) display.hidden = false;
  if (home) home.hidden = true;
  if (topbar) topbar.hidden = true;
  const title=$("eventTitle"), timerRegion=$("timerRegion"), timer=$("timer"), timerStatus=$("timerStatus");
  const messageRegion=$("messageRegion"), message=$("message"), connection=$("connection");
  const footer=$("displayFooter"), footerLogo=$("footerLogo");
  let state=null;
  onValue(ref(db,".info/connected"),s=>{connection.textContent=s.val()===true?"Połączono":"Brak połączenia — oczekiwanie na synchronizację";},()=>{connection.textContent="Nie można połączyć się z Firebase";});
  onValue(ref(db,"timerDisplays/"+timerId),snap=>{
    const item=snap.val();
    if(!item){title.textContent="Nie znaleziono zegara";timer.textContent="--:--";timerStatus.textContent="Sprawdź adres lub poproś operatora o nowy link.";messageRegion.hidden=true;footer.hidden=true;state=null;return;}
    state=item.state||{};
    title.textContent=state.title&&state.title.trim()?state.title:(item.name||"Zegar Turniejowy");
    document.title=title.textContent+" — Zegar Turniejowy";
    document.documentElement.style.setProperty("--title-scale",scaleOf(state.titleScale));
    document.documentElement.style.setProperty("--message-scale",scaleOf(state.messageScale));
    message.textContent=state.message||"";
    messageRegion.hidden=!(state.messageVisible&&state.message&&state.message.trim());
    timerRegion.hidden=state.timerVisible===false;
    const logo=typeof state.footerLogo==="string"&&state.footerLogo.startsWith("data:image/")?state.footerLogo:"";
    footer.hidden=!logo;
    if(logo&&footerLogo.getAttribute("src")!==logo)footerLogo.src=logo;
    if(!logo)footerLogo.removeAttribute("src");
    render();
  },error=>{connection.textContent="Błąd odczytu: "+error.message;});
  function scaleOf(v){const n=Number(v);return Number.isFinite(n)?Math.min(300,Math.max(25,n))/100:1;}
  function remainingMs(){if(!state)return 0;if(state.running&&Number.isFinite(state.endsAt))return Math.max(0,state.endsAt-serverNow());return Math.max(0,Number(state.remainingMs)||0);}
  function render(){if(!state)return;const total=Math.ceil(remainingMs()/1000);timer.textContent=String(Math.floor(total/60)).padStart(2,"0")+":"+String(total%60).padStart(2,"0");timerStatus.textContent=state.running&&total>0?"ODLICZANIE":total===0?"KONIEC CZASU":"PAUZA";}
  setInterval(render,200);
}else{if(home)home.hidden=false;}
