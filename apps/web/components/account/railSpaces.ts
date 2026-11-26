import type { Space } from "@fellowship/db";
import type { RailSpace } from "@/components/shell/Rail";
import { appSpaceHref } from "@/lib/routes";

export const toRailSpaces = (spaces: Space[]): RailSpace[] =>
  spaces.map((s) => ({ id: s.id, name: s.name, short: s.short, color: s.color, href: appSpaceHref(s.id) }));
