import { validateAdventure } from "@fellowship/core";
import { describe, expect, it } from "vitest";
import { adventures } from "./index";

describe("aventuras da vitrine", () => {
  for (const a of adventures) it(`${a.titulo} não tem furos`, () => expect(validateAdventure(a)).toEqual([]));
});
