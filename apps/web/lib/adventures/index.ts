import type { Adventure } from "@fellowship/core";
import { farol } from "./farol";

/** Aventuras da vitrine. Por enquanto, as nossas de teste; depois, as publicadas pela comunidade. */
export const adventures: Adventure[] = [farol];
export const adventureById = (id: string) => adventures.find((a) => a.id === id);
