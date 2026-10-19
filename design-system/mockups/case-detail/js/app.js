// Shared helpers + router. Each js/views/*.js fills its own <section id="v-...">.
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

function segs(el,items,cb){
  el.innerHTML=items.map(([k,l],i)=>'<button data-f="'+k+'" aria-pressed="'+(i?"false":"true")+'"'+(i?'':' class="on"')+'>'+l+'</button>').join('');
  el.onclick=e=>{const b=e.target.closest("button");if(!b)return;
    el.querySelectorAll("button").forEach(x=>{x.classList.toggle("on",x===b);x.setAttribute("aria-pressed",x===b)});cb(b.dataset.f)};
}

// Long lists fold on phones (<=820px) and stay open on desktop. A [data-keep] fold stays open everywhere.
const phone=matchMedia("(max-width:820px)");
function folds(root=document){root.querySelectorAll("details.fold").forEach(d=>{d.open=!phone.matches||d.hasAttribute("data-keep")})}
phone.addEventListener("change",()=>folds());

// Same URL contract as web-1: ?tab=<overview|journey|billing|timeline|settings>&stage=<slug>&view=<draft|files|results>.
// Every navigation is a plain link or a [data-to] button that rewrites the query, so any state can be opened or shared by URL.
const TABS=["overview","journey","billing","timeline","settings","spec"]; // "spec" exists only in this mockup
const VIEWS=["draft","files","results"];
function initRouter(){
  const p=new URLSearchParams(location.search);
  const tab=TABS.includes(p.get("tab"))?p.get("tab"):"overview";
  const view=VIEWS.includes(p.get("view"))?p.get("view"):"draft";
  $$(".view").forEach(e=>e.classList.toggle("on",e.id==="v-"+tab));
  $$(".nav").forEach(n=>{n.href="?tab="+n.dataset.v;n.classList.toggle("on",n.dataset.v===tab)});
  $$("a[data-to]").forEach(a=>a.href="?"+a.dataset.to);
  document.addEventListener("click",e=>{const b=e.target.closest("button[data-to]");if(b)location.search=b.dataset.to});
  if(tab==="journey")showStage(p.get("stage")||"",view);
  const side=$("#side"),burger=$("#burger"),narrow=matchMedia("(max-width:820px)");
  const setNav=(open,refocus=true)=>{document.body.classList.toggle("nav-open",open);burger.setAttribute("aria-expanded",open);if(refocus)(open?$("#side-x"):burger).focus()};
  burger.onclick=()=>setNav(true);
  $("#scrim").onclick=()=>setNav(false);
  $("#side-x").onclick=()=>setNav(false);
  addEventListener("resize",()=>{if(!narrow.matches&&document.body.classList.contains("nav-open"))setNav(false,false)}); // leaving the phone layout must not leave the drawer open for the next time it shrinks
  document.addEventListener("keydown",e=>{
    if(!document.body.classList.contains("nav-open"))return;
    if(e.key==="Escape")return setNav(false);
    if(e.key!=="Tab")return;
    const f=[...side.querySelectorAll("a,button")],first=f[0],last=f[f.length-1]; // keep Tab inside the drawer
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  });
  folds();
}
