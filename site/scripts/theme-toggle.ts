const storageKey = "learn-scientific-writing-theme";
const root = document.documentElement;
const media = window.matchMedia("(prefers-color-scheme: dark)");

function getStoredTheme() {
  try {
    const theme = window.localStorage.getItem(storageKey);

    return theme === "dark" || theme === "light" ? theme : undefined;
  } catch {
    return undefined;
  }
}

function getPreferredTheme() {
  return getStoredTheme() || (media.matches ? "dark" : "light");
}

function applyTheme(theme: string) {
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  document.querySelectorAll("[data-theme-toggle]").forEach((toggle) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const label = `Switch to ${nextTheme} mode`;

    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("aria-pressed", String(theme === "dark"));
    toggle.setAttribute("title", label);
    toggle.querySelector("[data-theme-label]")?.replaceChildren(label);
  });
}

function persistTheme(theme: string) {
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // Ignore blocked storage. The selected theme still applies for this page.
  }
}

function setupThemeToggle() {
  applyTheme(getPreferredTheme());

  document.querySelectorAll("[data-theme-toggle]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const nextTheme = root.classList.contains("dark") ? "light" : "dark";

      persistTheme(nextTheme);
      applyTheme(nextTheme);
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupThemeToggle, { once: true });
} else {
  setupThemeToggle();
}

const handleSystemThemeChange = (event: MediaQueryListEvent) => {
  if (!getStoredTheme()) {
    applyTheme(event.matches ? "dark" : "light");
  }
};

if (typeof media.addEventListener === "function") {
  media.addEventListener("change", handleSystemThemeChange);
} else {
  media.addListener(handleSystemThemeChange);
}
