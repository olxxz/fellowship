export type ThemeChoice = "dark" | "light" | "system";
export const THEME_KEY = "fellowship:tema";

/** Roda antes da pintura (no <head>) para não piscar o tema errado. */
export const themeScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

export function applyTheme(choice: ThemeChoice) {
  if (choice === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = choice;
}
