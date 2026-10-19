// Shared helpers + router for Wallet mockup
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const TABS = ["wallet", "spec"];
const VIEWS = ["history", "proofs"];

function initRouter() {
  const p = new URLSearchParams(location.search);
  const tab = TABS.includes(p.get("tab")) ? p.get("tab") : "wallet";
  const view = VIEWS.includes(p.get("view")) ? p.get("view") : "history";

  $$(".view").forEach(e => e.classList.toggle("on", e.id === "v-" + tab));
  $$(".nav").forEach(n => {
    n.href = "?tab=" + n.dataset.v;
    n.classList.toggle("on", n.dataset.v === tab);
  });

  if (tab === "wallet") {
    switchView(view, false);
  }

  // Handle URL query for topup modal: ?topup=open or ?amount=79000
  const topupParam = p.get("topup");
  const amountParam = p.get("amount");
  if (topupParam === "open" || amountParam) {
    const amt = amountParam ? parseInt(amountParam, 10) : undefined;
    openTopupModal(amt);
  }

  const side = $("#side"), burger = $("#burger"), narrow = matchMedia("(max-width:820px)");
  const setNav = (open, refocus = true) => {
    document.body.classList.toggle("nav-open", open);
    burger.setAttribute("aria-expanded", open);
    if (refocus) (open ? $("#side-x") : burger).focus();
  };

  burger.onclick = () => setNav(true);
  $("#scrim").onclick = () => setNav(false);
  $("#side-x").onclick = () => setNav(false);

  addEventListener("resize", () => {
    if (!narrow.matches && document.body.classList.contains("nav-open")) setNav(false, false);
  });

  document.addEventListener("keydown", e => {
    if (document.body.classList.contains("nav-open")) {
      if (e.key === "Escape") return setNav(false);
      if (e.key === "Tab") {
        const f = [...side.querySelectorAll("a,button")];
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    if (e.key === "Escape") {
      closeTopupModal();
      closeTxDetailModal();
    }
  });
}

function switchView(view, updateUrl = true) {
  $$(".tab-btn").forEach(b => {
    const on = b.dataset.view === view;
    b.classList.toggle("on", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
  $$(".wallet-panel").forEach(p => {
    p.classList.toggle("on", p.id === "panel-" + view);
  });
  if (updateUrl) {
    const u = new URL(location.href);
    u.searchParams.set("view", view);
    history.replaceState(null, "", u.toString());
  }
}
