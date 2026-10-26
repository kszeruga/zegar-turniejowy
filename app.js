import { db, ref, onValue, serverNow } from "./firebase.js";
const $ = id => document.getElementById(id);
const timerId = window.__ZEGAR_TIMER_ID__ || (() => {const p=location.pathname.replace(/\/+$/,"").split("/").pop();return /^timer_[a-z0-9]+$/i.test(p||"")?p:null;})();
const display=$("display"),home=$("home");
if(timerId){
 if(display)display.hidden=false;if(home)home.hidden=true;
 const title=$("eventTitle"),timer=$("timer"),status=$("timerStatus"),message=$("message"),connection=$("connection");let state=null;
 onValue(ref(db,".info/connected"),s=>{connection.textContent=s.val()===true?"Połączono":"Brak połączenia — oczekiwanie na synchronizację";});
 onValue(ref(db,"timerInstances/"+timerId),s=>{const item=s.val();if(!item){title.textContent="Nie znaleziono zegara";timer.textContent="--:--";status.textContent="Sprawdź adres lub poproś operatora o nowy link.";message.hidden=true;state=null;return;}state=item.state||{};title.textContent=state.title||item.name||"Zegar Turniejowy";message.textContent=state.message||"";message.hidden=!(state.messageVisible&&state.message&&state.message.trim());document.title=title.textContent+" — Zegar Turniejowy";render();},e=>{connection.textContent="Błąd odczytu: "+e.message;});
 function remaining(){if(!state)return 0;if(state.running&&Number.isFinite(state.endsAt))return Math.max(0,state.endsAt-serverNow());return Math.max(0,Number(state.remainingMs)||0);}
 function render(){const n=Math.ceil(remaining()/1000);timer.textContent=String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");status.textContent=state?.running&&n>0?"ODLICZANIE":n===0?"KONIEC CZASU":"PAUZA";display.hidden=state?.timerVisible===false;}
 setInterval(render,200);
}else{if(home)home.hidden=false;}
