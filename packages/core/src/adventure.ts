// Aventura solo (livro-jogo): cenas ligadas por escolhas e testes. Por trás é JSON; o editor visual e a tela de
// jogar leem e escrevem este formato. O validador encontra as contradições "mecânicas" da história.

export interface AdventureStat {
  key: string;
  nome: string;
  /** Bônus somado ao d20 nos testes. */
  valor: number;
}

export type AdventureEffect = { flag: string } | { item: string } | { tirarItem: string } | { vida: number };

export interface AdventureCheck {
  /** Chave do atributo (em `stats`). */
  stat: string;
  /** Dificuldade: passa com 1d20 + atributo ≥ cd. */
  cd: number;
  sucesso: string;
  falha: string;
  /** Efeitos extras da falha (ex.: { vida: -3 }). */
  efeitosFalha?: AdventureEffect[];
}

export interface AdventureChoice {
  texto: string;
  /** Vai direto para a cena. Uma escolha tem `ir` ou `teste`. */
  ir?: string;
  teste?: AdventureCheck;
  /** Só aparece com estas condições. */
  precisa?: { item?: string; flag?: string; semFlag?: string; semItem?: string };
  efeitos?: AdventureEffect[];
}

export interface AdventureScene {
  titulo: string;
  /** Parágrafos separados por linha em branco. */
  texto: string;
  /** Efeitos ao entrar na cena. */
  efeitos?: AdventureEffect[];
  escolhas?: AdventureChoice[];
  /** Cena final (sem escolhas). */
  fim?: "vitoria" | "parcial" | "derrota";
}

export interface Adventure {
  id: string;
  titulo: string;
  resumo: string;
  autor: string;
  /** Minutos, mais ou menos. */
  duracao: number;
  genero: string;
  inicio: string;
  /** Cena para onde vai quem chega a 0 de vida. */
  derrota: string;
  vida: number;
  stats: AdventureStat[];
  /** Nomes dos itens (chave → nome mostrado). */
  itens: Record<string, string>;
  cenas: Record<string, AdventureScene>;
}

export interface AdventureState {
  cena: string;
  vida: number;
  itens: string[];
  flags: string[];
  /** Cenas por onde passou, em ordem (para o "voltar" e o resumo no fim). */
  caminho: string[];
}

export function startAdventure(a: Adventure): AdventureState {
  return enter(a, { cena: a.inicio, vida: a.vida, itens: [], flags: [], caminho: [] }, a.inicio);
}

function apply(a: Adventure, s: AdventureState, effects: AdventureEffect[] = []): AdventureState {
  let next = { ...s, itens: [...s.itens], flags: [...s.flags] };
  for (const e of effects) {
    if ("flag" in e && !next.flags.includes(e.flag)) next.flags.push(e.flag);
    if ("item" in e && !next.itens.includes(e.item)) next.itens.push(e.item);
    if ("tirarItem" in e) next.itens = next.itens.filter((i) => i !== e.tirarItem);
    if ("vida" in e) next.vida = Math.min(a.vida, next.vida + e.vida);
  }
  return next;
}

function enter(a: Adventure, s: AdventureState, cena: string): AdventureState {
  if (s.vida <= 0 && cena !== a.derrota) return enter(a, s, a.derrota);
  const scene = a.cenas[cena]!;
  const next = apply(a, { ...s, cena, caminho: [...s.caminho, cena] }, scene.efeitos);
  return next.vida <= 0 && cena !== a.derrota ? enter(a, next, a.derrota) : next;
}

/** Escolhas visíveis agora (as condições batem). */
export function visibleChoices(a: Adventure, s: AdventureState): AdventureChoice[] {
  return (a.cenas[s.cena]?.escolhas ?? []).filter((c) => {
    const p = c.precisa;
    if (!p) return true;
    if (p.item && !s.itens.includes(p.item)) return false;
    if (p.semItem && s.itens.includes(p.semItem)) return false;
    if (p.flag && !s.flags.includes(p.flag)) return false;
    if (p.semFlag && s.flags.includes(p.semFlag)) return false;
    return true;
  });
}

/** Escolhe; com teste, `d20` é o dado rolado (1–20). Devolve o novo estado e, se houve teste, o resultado. */
export function choose(a: Adventure, s: AdventureState, choice: AdventureChoice, d20?: number) {
  let next = apply(a, s, choice.efeitos);
  if (choice.teste) {
    const t = choice.teste;
    const bonus = a.stats.find((x) => x.key === t.stat)?.valor ?? 0;
    const roll = d20 ?? 1 + Math.floor(Math.random() * 20);
    const total = roll + bonus;
    const ok = total >= t.cd;
    if (!ok) next = apply(a, next, t.efeitosFalha);
    return { state: enter(a, next, ok ? t.sucesso : t.falha), check: { roll, bonus, total, cd: t.cd, ok, stat: t.stat } };
  }
  return { state: enter(a, next, choice.ir!), check: null };
}

/** Problemas da história: links quebrados, cenas inalcançáveis, becos sem saída, itens e flags que ninguém dá. */
export function validateAdventure(a: Adventure): string[] {
  const errors: string[] = [];
  const ids = new Set(Object.keys(a.cenas));
  const stats = new Set(a.stats.map((s) => s.key));
  const given = { item: new Set<string>(), flag: new Set<string>() };
  const collect = (effects?: AdventureEffect[]) =>
    effects?.forEach((e) => {
      if ("item" in e) given.item.add(e.item);
      if ("flag" in e) given.flag.add(e.flag);
    });
  for (const scene of Object.values(a.cenas)) {
    collect(scene.efeitos);
    scene.escolhas?.forEach((c) => {
      collect(c.efeitos);
      collect(c.teste?.efeitosFalha);
    });
  }

  if (!ids.has(a.inicio)) errors.push(`Cena inicial "${a.inicio}" não existe.`);
  if (!ids.has(a.derrota)) errors.push(`Cena de derrota "${a.derrota}" não existe.`);
  for (const [id, scene] of Object.entries(a.cenas)) {
    const choices = scene.escolhas ?? [];
    if (scene.fim && choices.length) errors.push(`"${id}" é final mas tem escolhas.`);
    if (!scene.fim && !choices.length) errors.push(`"${id}" não tem saída (sem escolhas e não é final).`);
    choices.forEach((c, i) => {
      const where = `"${id}", escolha ${i + 1} ("${c.texto}")`;
      if (!c.ir === !c.teste) errors.push(`${where}: precisa de "ir" ou de "teste" (só um).`);
      for (const target of [c.ir, c.teste?.sucesso, c.teste?.falha]) if (target && !ids.has(target)) errors.push(`${where}: a cena "${target}" não existe.`);
      if (c.teste && !stats.has(c.teste.stat)) errors.push(`${where}: o atributo "${c.teste.stat}" não existe.`);
      if (c.precisa?.item && !given.item.has(c.precisa.item)) errors.push(`${where}: pede o item "${c.precisa.item}", que nenhuma cena dá.`);
      if (c.precisa?.flag && !given.flag.has(c.precisa.flag)) errors.push(`${where}: pede "${c.precisa.flag}", que nenhuma cena marca.`);
    });
    for (const e of [...(scene.efeitos ?? []), ...choices.flatMap((c) => [...(c.efeitos ?? []), ...(c.teste?.efeitosFalha ?? [])])]) {
      if ("item" in e && !(e.item in a.itens)) errors.push(`"${id}": o item "${e.item}" não tem nome em "itens".`);
    }
    // Cena sem saída depois dos filtros: todas as escolhas com condição.
    if (choices.length && choices.every((c) => c.precisa)) errors.push(`"${id}": todas as escolhas têm condição; pode virar beco sem saída.`);
  }

  // Alcance a partir do início (as condições não contam: é o mapa da história).
  const seen = new Set<string>([a.derrota]);
  const queue = [a.inicio];
  while (queue.length) {
    const id = queue.pop()!;
    if (seen.has(id) && id !== a.derrota) continue;
    seen.add(id);
    for (const c of a.cenas[id]?.escolhas ?? []) for (const t of [c.ir, c.teste?.sucesso, c.teste?.falha]) if (t && !seen.has(t)) queue.push(t);
  }
  for (const id of ids) if (!seen.has(id)) errors.push(`"${id}" não é alcançável a partir do início.`);
  if (![...Object.values(a.cenas)].some((s) => s.fim === "vitoria")) errors.push("A aventura não tem nenhum final de vitória.");
  return errors;
}
