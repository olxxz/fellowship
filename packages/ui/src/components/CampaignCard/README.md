# CampaignCard

Card que representa uma campanha na barra do Cenário. Tocar nele abre a barra da campanha por cima, com botão de voltar.

- **Ao vivo:** fundo `mesa-surface`, borda `mesa-border`, ponto `success` e status em `mesa-text`; mostra os avatares de quem está na Mesa.
- **Fora de sessão:** superfície neutra e a data da próxima sessão em `text-muted`.
- Ícone da campanha (d20 ou o ícone escolhido) num quadrado `radius-md`; no tema de campanha, a cor vem de `mesa-gold`.
- Até 3 avatares sobrepostos; acima disso, "+N".
- Largura total da barra, raio `radius-lg`, padding `space-3`.

## No código

```tsx
<CampaignCard name="A Maldição de Vel" live={{ session: 12, participants }} href="/vel" />
<CampaignCard name="Ecos de Karn" icon="map" color={1} nextSession="sáb 15h" />
<CampaignCard.Skeleton />
```
