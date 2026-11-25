# 0009. LiveKit para voz e vídeo

- **Status:** Aceita
- **Data:** 2026-11-25

## Contexto

A Mesa precisa de voz, vídeo, detecção de quem fala e, na fase 4, áudio por pessoa para transcrição. É a parte de maior risco técnico.

## Decisão

LiveKit, começando pelo LiveKit Cloud e com a opção de auto-hospedar. O teste técnico (chamada + detecção de quem fala) entra na fase 0.

## Consequências

- O `ParticipantCard` recebe o vídeo como `ReactNode`, sem depender do SDK.
- Custo de voz por campanha precisa ser acompanhado no estágio 3.
