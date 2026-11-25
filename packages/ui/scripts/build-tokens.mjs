// Gera os arquivos de tokens a partir de tokens/tokens.json (a fonte da verdade).
//
//   node scripts/build-tokens.mjs           escreve os arquivos
//   node scripts/build-tokens.mjs --check   falha se algum arquivo estiver desatualizado
//
// Saídas:
//   src/styles/_tokens.sass      variáveis CSS (importar uma única vez, no CSS global)
//   src/styles/_typography.sass  mixins de texto (podem ser usados em qualquer CSS Module)
//   tokens.css                   as mesmas variáveis em CSS puro, para quem não usa Sass
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(join(root, "tokens/tokens.json"), "utf8"));

const HEADER = "Gerado por scripts/build-tokens.mjs a partir de tokens/tokens.json. Não edite à mão: rode `pnpm tokens`.";

/** Tokens que mudam por tema (cor e sombra), como pares [nome, {dark, light}]. */
const themed = [...tokens.color.tokens, ...tokens.shadow.tokens].map((t) => [t.name, t.value]);

/** Tokens iguais nos dois temas. */
const families = Object.entries(tokens.type.families).map(([name, value]) => [`font-${name}`, value]);
const fixed = [
  ...tokens.spacing.tokens.map((t) => [t.name, t.value]),
  ...tokens.radius.tokens.map((t) => [t.name, t.value]),
  ...tokens.size.tokens.map((t) => [t.name, t.value]),
  ...families,
];

const decls = (pairs, pick) => pairs.map(([name, value]) => [name, pick ? value[pick] : value]);

/** Monta as regras uma vez e serializa em CSS ou Sass indentado. */
function rules() {
  return [
    { selector: ':root, [data-theme="dark"]', decls: decls(themed, "dark") },
    { selector: '[data-theme="light"]', decls: decls(themed, "light") },
    { selector: ":root", decls: fixed },
    // Sem data-theme, o app segue o sistema operacional.
    { media: "(prefers-color-scheme: light)", selector: ":root:not([data-theme])", decls: decls(themed, "light") },
  ];
}

function toSass() {
  const out = [`// ${HEADER}`, "// Tema escuro em :root (padrão); claro em [data-theme=\"light\"]; sem data-theme, segue o sistema.", ""];
  for (const r of rules()) {
    const indent = r.media ? "  " : "";
    if (r.media) out.push(`@media ${r.media}`);
    out.push(`${indent}${r.selector}`);
    for (const [name, value] of r.decls) out.push(`${indent}  --${name}: ${value}`);
    out.push("");
  }
  return out.join("\n");
}

function toCss() {
  const out = [`/* ${HEADER} */`, ""];
  for (const r of rules()) {
    const indent = r.media ? "  " : "";
    if (r.media) out.push(`@media ${r.media} {`);
    out.push(`${indent}${r.selector} {`);
    for (const [name, value] of r.decls) out.push(`${indent}  --${name}: ${value};`);
    out.push(`${indent}}`);
    if (r.media) out.push("}");
    out.push("");
  }
  return out.join("\n");
}

function toTypography() {
  const out = [`// ${HEADER}`, "// Estilos de texto como mixins: @use \"../../styles/typography\" as *  →  @include text-body", ""];
  for (const group of tokens.type.groups) {
    for (const style of group.styles) {
      out.push(`// ${style.usage}`);
      out.push(`@mixin text-${style.name}`);
      out.push(`  font-family: var(--font-${group.family})`);
      out.push(`  font-size: ${style.fontSize}`);
      out.push(`  line-height: ${style.lineHeight}`);
      out.push(`  font-weight: ${style.fontWeight}`);
      if (style.letterSpacing) out.push(`  letter-spacing: ${style.letterSpacing}`);
      out.push("");
    }
  }
  return out.join("\n");
}

const outputs = {
  "src/styles/_tokens.sass": toSass(),
  "src/styles/_typography.sass": toTypography(),
  "tokens.css": toCss(),
};

const check = process.argv.includes("--check");
let stale = 0;
for (const [file, content] of Object.entries(outputs)) {
  const path = join(root, file);
  if (check) {
    let current = "";
    try {
      current = readFileSync(path, "utf8");
    } catch {
      // arquivo ausente conta como desatualizado
    }
    if (current !== content) {
      console.error(`desatualizado: ${file}`);
      stale++;
    }
  } else {
    writeFileSync(path, content);
    console.log(`gerado: ${file}`);
  }
}
if (stale) {
  console.error("Rode `pnpm tokens` e faça commit dos arquivos gerados.");
  process.exit(1);
}
