# 0016. Upload de imagens

- **Status:** Aceita (2026-11-27)
- **Data:** 2026-11-26

## Contexto

Perfis, Cenários, campanhas, personagens e entradas do compêndio precisam de imagem: avatar, ícone, banner, retrato, token e ilustração. Sem imagem, cada um usa o placeholder gerado pelo id (`GeneratedBanner`, `CharacterPlaceholder`, `CompendiumThumb` e a inicial no avatar). Parte dessas imagens não pode vazar: um retrato de NPC ou a ilustração de um monstro ainda não revelado é metagame.

## Decisão proposta

**Onde guarda:** Supabase Storage, com um bucket por tipo de conteúdo e o caminho começando pelo dono, para o RLS do `storage.objects` decidir pelo primeiro segmento:

| Bucket | Caminho | Quem lê | Quem escreve |
| --- | --- | --- | --- |
| `avatars` | `{user_id}/{uuid}.webp` | público (com link imprevisível) | a própria pessoa |
| `spaces` | `{space_id}/{icone\|banner}/{uuid}.webp` | membros do Cenário | quem gerencia tema |
| `campaigns` | `{space_id}/{campaign_id}/{uuid}.webp` | quem vê a campanha | o mestre |
| `characters` | `{space_id}/{campaign_id}/{character_id}/{uuid}.webp` | quem vê a campanha; NPC só depois de revelado | o dono do personagem ou o mestre |
| `compendium` | `{space_id}/{entry_id}/{uuid}.webp` | quem pode ver a entrada (mesma regra de revelação) | quem gerencia compêndio |

Os buckets privados usam URLs assinadas de curta duração, geradas no servidor depois da checagem de permissão.

**No navegador, antes de subir:**
- recorte com proporção fixa: 1:1 para avatar, ícone e token; 3:2 para retrato; 3:1 para banner;
- redimensionar (avatar 512px, retrato 1200px, banner 1800×600) e converter para WebP com qualidade ~0,85, o que também remove os metadados da foto (EXIF, localização);
- limite de 2 MB depois de comprimir.

Assim o plano gratuito do Supabase (1 GB) aguenta bem um grupo, sem depender de transformação de imagem no servidor, que é paga.

**GIF:** só em avatar e banner, até 4 MB, guardado como está. Com "reduzir movimento" ou a opção "animar só ao passar o mouse", mostra o primeiro quadro.

**No banco:** colunas `*_path` (caminho no Storage) em vez de URL: `profiles.avatar_path`, `spaces.icon_path` e `banner_path`, `campaigns.banner_path`, `characters.portrait_path` e `token_path`, `compendium_entries.image_path`. Vazio = placeholder gerado.

**Trocar e apagar:** subir uma imagem nova grava outro arquivo, aponta a coluna para ele e apaga o anterior. Apagar o Cenário ou a campanha apaga a pasta dela.

## Consequências

- Cada tipo de imagem tem regra de leitura própria, e a revelação do compêndio vale também para as imagens.
- O componente de upload (recorte, compressão, barra de progresso, erro e "tentar de novo") vai para `@fellowship/ui`, para servir a todas as telas.
- Moderação e limites por campanha ficam para o estágio 3.

## Decidido

- Avatares, banners e ícones são **públicos** (buckets `perfis` e `cenarios`, link imprevisível), e as colunas guardam o endereço da imagem (`avatar_url`, `banner_url`, `icon_url`).
- **GIF já agora**: em avatar, banner, figurinhas e anexos (até 4 MB nas imagens públicas, 25 MB nos anexos).
- Anexos de chat ficam no bucket privado `anexos` (`c/<canal>/…` e `d/<a>_<b>/…`), lidos com URL assinada de 1 hora.
- Campanhas, personagens e compêndio (buckets próprios, com revelação) entram na fase 1.
