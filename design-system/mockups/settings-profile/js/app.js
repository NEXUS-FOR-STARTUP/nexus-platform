// Shared helpers + router for Settings Profile mockup
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const TABS = ["profile", "password", "sessions", "notifications", "spec"];

function initRouter() {
  const p = new URLSearchParams(location.search);
  const tab = TABS.includes(p.get("tab")) ? p.get("tab") : "profile";

  $$(".view").forEach(e => e.classList.toggle("on", e.id === "v-" + tab));
  $$(".nav").forEach(n => {
    n.href = "?tab=" + n.dataset.v;
    n.classList.toggle("on", n.dataset.v === tab);
  });

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
    // Also close delete modal if opened
    const dm = $("#delete-modal");
    if (dm && !dm.hidden && e.key === "Escape") {
      closeDeleteModal();
    }
  });
}
