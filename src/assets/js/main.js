// Mobile navigation drawer. Without JS the nav renders as a plain wrapped list (see .no-js CSS).
const DESKTOP_QUERY = "(min-width: 1100px)";

const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");
const backdrop = document.querySelector(".nav-backdrop");

function setOpen(open) {
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
  backdrop.hidden = !open;
  document.body.classList.toggle("nav-open", open);
}

if (toggle && nav && backdrop) {
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  backdrop.addEventListener("click", () => setOpen(false));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia(DESKTOP_QUERY).addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
}
