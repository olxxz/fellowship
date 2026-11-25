# 0006. Base UI para comportamento acessível

- **Status:** Aceita
- **Data:** 2026-11-25

## Contexto

Modais, menus, selects e tooltips têm comportamento de teclado e leitor de tela difícil de acertar, mas o visual precisa ser todo próprio.

## Decisão

Base UI (headless) para Dialog, Popover, Menu, Select, Tabs, Tooltip, Toast, Switch, Checkbox, NumberField e Slider. Os componentes simples (Button, Card, Avatar…) são próprios.

## Consequências

- A dependência entra junto com o primeiro componente que precisar dela.
- O visual continua inteiro nos CSS Modules de `@fellowship/ui`.
