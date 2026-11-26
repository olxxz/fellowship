# 0014. Conflito de permissões entre cargos

- **Status:** Aceita
- **Data:** 2026-11-26

## Contexto

Uma pessoa pode ter vários cargos, e categorias e canais podem ajustar permissões por cargo ou por pessoa. A especificação pedia uma regra exata de conflito antes do schema.

## Decisão

A mesma regra do Discord, com permissões em bitmask (um inteiro):

1. **Dono** do Cenário tem todas as permissões.
2. **Base:** soma (OU) das permissões de todos os cargos da pessoa, incluindo o cargo padrão (Visitante), que vale para todo membro.
3. **Categoria, depois canal.** Em cada nível:
   1. aplica o que os cargos da pessoa **negam** (soma dos `deny`);
   2. aplica o que os cargos dela **liberam** (soma dos `allow`): no mesmo nível, liberar vence negar;
   3. aplica o ajuste **da própria pessoa**, que vence os dos cargos.
4. Sem **ver canal**, nenhuma outra permissão vale naquele canal.

Anúncios exigem, além de enviar mensagens, **publicar anúncios**.

## Consequências

- A regra está em dois lugares, com um teste que confere que batem: `packages/core/src/permissions.ts` (para a interface) e `private.channel_permissions` no banco (para o RLS, que é quem decide de verdade).
- Cargos padrão de um Cenário novo: Administrador (tudo), Narrador (escrever, publicar anúncios, convites, campanhas, compêndio), Membro (escrever, falar, convidar) e Visitante (só ver). O criador vira dono e recebe Membro.
- A hierarquia de cargos (ninguém edita cargo acima do seu) entra junto com a tela de cargos.
