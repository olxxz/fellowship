# App de RPG — Especificação do Projeto

Nov 25, 2026 · @Luiz

## Visão e público

Fellowship (nome provisório) é um app para jogar RPG de mesa online, com tudo no mesmo lugar: chamada de voz com a cara dos personagens, ficha modular, dados, mapa e memória da campanha. Ele substitui a combinação Discord + planilha + rolador de dados + VTT.

**Problema.** Hoje a sessão fica espalhada por várias ferramentas. A identidade do personagem (imagem, cor, ficha) fica longe da conversa, e o que aconteceu em cada sessão se perde com o tempo.

| Estágio | Quem usa | O que isso exige |
| --- | --- | --- |
| 1 | O meu grupo | Convites manuais, sem cobrança, um único ambiente |
| 2 | Grupos conhecidos | Convite por link, limites de uso por campanha |
| 3 | Escala (se fizer sentido) | Planos, moderação, controle de custo de voz e IA por campanha |

**Princípios do produto**

- **Personagem em primeiro plano:** a imagem e a cor do personagem aparecem antes da identidade do jogador.
- **Ingame e outgame sempre separados:** no chat, nas notas, nas transcrições e nas buscas.
- **Modular:** o mestre liga só as ferramentas que a campanha usa.
- **Sem metagame acidental:** o que o personagem não sabe, o app não mostra para ele.
- **Feito para o grupo, pronto para crescer:** os dados ficam isolados por campanha desde o primeiro dia.

## Estrutura do app

O app segue a organização do Discord: uma área social pessoal e **Cenários**, espaços que guardam canais, um compêndio e campanhas. Um Cenário é um universo: todas as campanhas dele acontecem no mesmo mundo, e toda campanha vive dentro de um Cenário. No futuro, um segundo tipo de espaço, a **Comunidade**, poderá reunir um grupo de amigos com vários Cenários.

> _Diagrama: estrutura do app · Início, Fellowship, canais e campanhas (no canvas de conceitos, fora do repositório)._

O Início é pessoal; cada universo de jogo é um Cenário, e cada campanha é uma seção com canais próprios.

**Área social (Início)**

- **Amigos:** adicionar pelo nome de usuário, ver pedidos pendentes e bloqueados.
- **Mensagens diretas** e grupos pequenos fora de um Cenário.
- **Status:** online, ausente ou em sessão ("Jogando: A Maldição de Vel").
- **Perfil:** avatar, banner (imagem ou GIF), bio e personagens em destaque.

**Cenário (o "servidor")**

Tem ícone, banner, tema e descrição, e entra-se por link de convite. Os canais ficam agrupados em categorias, como no Discord.

| Tipo de canal | O que faz |
| --- | --- |
| Texto | Conversa comum, com respostas em tópico e mensagens fixadas |
| Anúncios | Só cargos autorizados escrevem; ex.: data da próxima sessão |
| Voz | Sala fixa para conversar, ver câmeras e compartilhar tela, sem ferramentas de jogo |
| Voz dinâmica | Sempre existe uma sala vazia: quando alguém entra nela, outra sala vazia aparece; salas extras que esvaziam somem depois de 1 minuto |
| Funcional | Uma ferramenta em vez de chat: agenda de sessões, enquete de data, galeria, wiki do mundo |
| Campanha | Uma seção especial com canais e ferramentas próprios (abaixo) |
| Galeria | Mural de imagens em colunas, como o Pinterest; cada imagem abre com descrição, tags e comentários (ex.: "Arte e fichas") |

**Campanha (seção do Cenário)**

- Aparece na lista de canais como uma seção com banner, tema e cor próprios.
- Canais próprios: **Mesa** (voz da sessão com retratos), chat ingame, chat outgame e os módulos ligados (ficha, mapa, talking heads, diário).
- Quem vê cada campanha é definido pelos cargos do Cenário.

**Navegação da campanha:** ao entrar numa campanha, a barra lateral troca para a barra da campanha, sobreposta à do Cenário e com botão de voltar. Ela tem canais e ferramentas próprios: Mesa, ingame, outgame, sussurros, fichas, diário, compêndio da campanha e mapa. A alternativa com as duas barras lado a lado está no canvas para comparação.

**Ícones em vez de #:** cada tipo de canal tem um ícone próprio (conversa, anúncios, regras, agenda, voz, Mesa), sem o "#" do Discord.

**Sala de voz × Mesa:** as salas de voz do Cenário servem para conversar; a Mesa da campanha é onde se joga. As duas abrem na área de conteúdo, com o chat ao lado e um botão de tela cheia.

|  | Sala de voz (Cenário) | Mesa (campanha) |
| --- | --- | --- |
| Para quê | Conversar, ver câmeras, compartilhar tela | Jogar a sessão |
| Controles de todos | Microfone, câmera, compartilhar tela, efeitos sonoros | Os mesmos + rolar dados e abrir a própria ficha |
| Ferramentas do mestre | Nenhuma | Configurar grid e cenário, colocar inimigos e loot, pedir testes, ver e editar fichas, selecionar personagens, controlar cenas e presença |

**Painéis recolhíveis:** como no Discord, cada pessoa mostra ou esconde a lista de membros, o chat da sala de voz e a lista de canais. A escolha fica salva por pessoa.

**Modo presencial:** a campanha tem um interruptor para sessões em mesa física. Nesse modo, voz e câmera ficam desligadas, e cada jogador usa o celular para ficha, dados, inventário, notas e talking heads. O mestre usa o painel dele no notebook e pode espelhar mapa, imagens e handouts numa TV para a mesa toda. Rolagens, cenas e presença continuam registradas na memória da campanha. Entra na versão 1 (fase 1).

**Exportar dados:** o mestre e os jogadores podem exportar fichas, compêndio e histórico da campanha em JSON. Entra na versão 1.

**Nome no código:** a entidade se chama `Space` com um campo de tipo (cenário agora, comunidade no futuro), e o rótulo da interface fica num arquivo de textos. Trocar "Cenário" por outro nome depois não exige mexer no banco.

## Compêndio do Cenário

Cada Cenário tem um compêndio, o conhecimento do mundo organizado em coleções. A campanha herda o compêndio do Cenário, cria entradas próprias e pode alterar ou ocultar entradas só para ela. Os jogadores veem apenas o que foi revelado.

| Coleção | Exemplos de entrada | Campos típicos |
| --- | --- | --- |
| Bestiário | Criaturas, monstros, animais | Ficha da criatura, habitat, comportamento |
| Itens | Armas, armaduras, consumíveis, ferramentas, itens mágicos, artefatos | Tipo, raridade, peso, preço, efeitos, rolagens |
| Magias e habilidades | Magias, rituais, poderes, técnicas | Custo, alcance, duração, efeito, rolagem |
| Atlas | Continentes, regiões, cidades, locais | Mapa com marcadores, região "pai", clima |
| Facções | Reinos, guildas, cultos, corporações | Líderes, objetivos, relações |
| Personagens do mundo | NPCs recorrentes, figuras históricas | Retrato, afiliação, onde vive |
| História | Eras, eventos | Data no calendário do mundo |
| Regras da casa | Regras próprias do Cenário | Texto livre e campos |

**Herança entre Cenário e campanha**

- **Canônico:** a entrada criada no Cenário vale para todas as campanhas.
- **Própria:** a entrada criada na campanha existe só nela.
- **Variação:** a campanha sobrescreve campos de uma entrada canônica só para ela (ex.: "nesta campanha, a cidade de Vel foi destruída"). A original continua intacta nas outras.
- **Oculta:** a campanha esconde uma entrada que não existe na sua história.
- **Promover:** o criador do Cenário transforma uma entrada da campanha em canônica.

**Descoberta (sem metagame)**

- Por padrão, toda entrada começa oculta para os jogadores de cada campanha.
- O mestre revela a entrada inteira ou só alguns campos (ex.: nome e aparência do monstro, sem os pontos de vida).
- A revelação vale para o grupo ou para personagens específicos, usando a presença por cena.
- O bestiário e o atlas dos jogadores se preenchem conforme o grupo descobre, e cada revelação entra na memória da campanha.

**Mesmo motor da ficha:** cada coleção é um template editável, com os mesmos tipos de campo, fórmulas e rolagens da ficha modular. Uma criatura do bestiário é uma ficha, e um item vai para o inventário do personagem por referência.

**Genéricas e específicas (herança entre entradas)**

Uma entrada pode apontar para outra mais genérica e herdar os campos dela, formando uma cadeia. Exemplos: Narsil → Espada de mithril → Espada; Bjorn → Homem do Norte → Humano; Frodo → Hobbit das colinas → Hobbit.

- **Herda:** a específica recebe todos os campos e valores da genérica (dano, peso, descrição base).
- **Sobrescreve:** muda só o que é diferente. A Espada de mithril muda o material e o peso; Narsil muda o nome, a história e o bônus.
- **Acrescenta:** campos próprios, como dono e lendas.
- **Cascata:** corrigir o dano de "Espada" corrige todas as espadas que não sobrescreveram esse campo.
- **Todas as coleções:** itens, criaturas, NPCs, magias e lugares. Personagens dos jogadores também podem apontar para uma entrada do compêndio (Kael → Elfo da floresta).
- **Limites no início:** uma genérica direta por entrada (sem herança múltipla), ciclos bloqueados ao salvar e no máximo 5 níveis. Uma entrada da campanha pode apontar para uma do Cenário, nunca o contrário.
- **Revelação:** revelar Narsil mostra só os campos revelados, herdados ou não. O jogador só vê que é uma espada de mithril se o mestre revelar o vínculo.

**Ordem de cálculo dos valores:** cadeia de genéricas (da mais ampla à mais específica) → a própria entrada → variação da campanha. Cada camada só guarda o que mudou.

**Fases:** compêndio básico (coleções, entradas, revelação da entrada inteira) na fase 1; variações por campanha e revelação por campo na fase 2; atlas com mapa interativo na fase 3.

## Cargos e permissões

As permissões funcionam como no Discord: cargos do Cenário carregam permissões, e categorias, canais e campanhas podem ajustá-las. Ser mestre é um papel **dentro da campanha**, separado do cargo no Cenário.

| Cargo padrão | O que pode |
| --- | --- |
| Dono | Tudo, inclusive apagar o Cenário e transferir a posse |
| Administrador | Gerenciar canais, cargos abaixo do seu, convites e tema |
| Narrador | Criar campanhas; dentro das campanhas que mestra, pode tudo |
| Membro | Ver e falar nos canais liberados; entrar nas campanhas para as quais foi convidado |
| Visitante | Ler canais públicos; assistir à Mesa sem falar, se a campanha permitir |

**Permissões granulares:** ver canal, enviar mensagens, falar em voz, publicar anúncios, gerenciar mensagens, criar convites, criar campanhas, gerenciar compêndio, gerenciar canais, gerenciar cargos e gerenciar tema.

**Regras**

- **Ordem de resolução:** cargo base → ajuste da categoria → ajuste do canal ou da campanha. O ajuste mais específico vence, e o dono ignora todos os ajustes.
- **Acesso a campanhas:** um cargo pode dar acesso a uma campanha (ex.: o cargo "Mesa de Quinta" vê só a campanha de quinta). Dentro dela, cada pessoa tem um papel: mestre, jogador ou espectador.
- **Hierarquia:** cargos têm ordem, cor e ícone. Ninguém edita um cargo acima do seu.
- **Implementação:** permissões guardadas como bitmask (um inteiro), checadas no servidor e nas regras de Row Level Security. A regra exata de conflito entre dois cargos vira um ADR antes do código.

## Personalização e temas

A base do app é limpa e neutra. A personalização fica em áreas delimitadas (banners, ícones, cor de destaque e temas prontos) para nunca virar carnaval, a não ser que a campanha seja de carnaval. Tudo é grátis no início; uma assinatura futura cobriria só recursos com custo real, como IA e transcrição, e isso ainda não está decidido.

| Onde | O que personaliza | Fase |
| --- | --- | --- |
| Perfil | Avatar, banner (imagem ou GIF), cor de destaque, bio, personagens em destaque | 0 |
| Cargo | Cor e ícone | 0 |
| Cenário | Ícone, banner (imagem ou GIF), tela de boas-vindas; tema pronto e cor de destaque | 0 (banner), 2 (tema) |
| Personagem | Retrato, imagem do token, cor, card de apresentação | 1 |
| Campanha | Banner, tema pronto (pode diferir do tema do Cenário), cor, ícones dos módulos, fonte dos títulos | 2 |

**Claro, escuro ou sistema:** o app oferece tema escuro, claro ou seguir o sistema. Todo tema pronto de Cenário e de campanha também tem as duas variantes, e a escolha do usuário decide qual aparece.

**O que um tema muda:** cor de destaque e tons das superfícies de conteúdo, dentro de faixas seguras; fonte dos títulos; conjunto de ícones de canais e módulos; um ornamento sutil em cabeçalhos e cartões de rolagem; no futuro, o som dos dados.

**O que um tema nunca muda:** navegação, layout, fonte do texto corrido, ícones de sistema (configurações, fechar, enviar) e o contraste mínimo.

**Temas iniciais sugeridos**

- **Neutro:** o padrão do app.
- **Medieval:** tons terrosos e dourado envelhecido, títulos com serifa, ícones com traço de entalhe.
- **Cyberpunk:** neon ciano e magenta sobre fundo bem escuro, títulos monoespaçados, ícones em linha fina.
- **Horror e investigação:** sépia e vermelho escuro, títulos de máquina de escrever.

**Regras para não virar carnaval**

- A cor do tema ocupa no máximo cerca de 10% da tela: destaques, bordas e ícones ativos, nunca grandes fundos.
- Toda paleta de tema passa pela validação de contraste antes de entrar no app.
- O tema tem escopo: o da campanha vale só dentro da campanha, e a barra de Cenários continua no tema do app.
- GIFs respeitam `prefers-reduced-motion` e a opção "animar só ao passar o mouse", com limite de tamanho de arquivo a definir.

**Como funciona por baixo:** cada tema é um arquivo de tokens aplicado com `data-theme` no contêiner do Cenário ou da campanha. Os ícones são pedidos por nome semântico (`icon.map`, `icon.dice`), e cada tema aponta esses nomes para o seu próprio conjunto de SVGs. Cada tema tem variante clara e escura, escolhida por um segundo atributo (data-mode) que segue a preferência do usuário.

## Configurações

As configurações ficam em três telas separadas, para não lotar quando a pessoa participa de muitos Cenários e campanhas: a do usuário (app, conta e perfil), a do Cenário e a da campanha. Cada uma abre pelo próprio menu e mostra só o que as permissões da pessoa liberam. A tela do usuário tem a lista "Meus Cenários", com atalho para as configurações de cada um.

| Área | O que configura | Quem acessa | Por onde se abre |
| --- | --- | --- | --- |
| App | Aparência (escuro, claro, sistema), idioma, acessibilidade, voz e vídeo, notificações, atalhos | Cada usuário | Engrenagem no painel do usuário |
| Conta e perfil | E-mail, senha, sessões; avatar, banner, cor, bio, personagens em destaque | Cada usuário | Engrenagem no painel do usuário |
| Cenário | Visão geral, banner e ícone, tema, categorias e canais, cargos e permissões, compêndio, convites, membros | Dono e cargos com permissão | Menu no cabeçalho do Cenário |
| Canal | Nome, ícone, tópico, permissões, modo lento | Quem gerencia canais | Engrenagem ao passar o mouse no canal |
| Campanha | Nome, banner, tema, módulos, templates de ficha, jogadores e papéis, cenas, gravação e privacidade | Mestre da campanha | Menu no cabeçalho da campanha |

## Escopo e fases

O MVP vai da fase 0 à fase 3, e o grupo já consegue jogar no app ao fim da fase 1. Transcrição e IA ficam para as fases 4 a 6.

> _Diagrama: roadmap · 7 fases, MVP nas fases 0 a 3 (no canvas de conceitos, fora do repositório)._

Uma fase só é considerada pronta quando o grupo a usou numa sessão real. O teste técnico do LiveKit entra já na fase 0, porque é a parte de maior risco.

**Fora do MVP:** transcrição e IA, apps nativos de desktop e celular, cobrança, névoa e linha de visão no mapa, e automação de regras na ficha.

## Funcionalidades

Cada funcionalidade tem uma fase de entrada. As fases são detalhadas na seção de escopo; as opcionais funcionam como módulos que o mestre liga por campanha.

| Funcionalidade | O que faz | Fase | Módulo opcional? |
| --- | --- | --- | --- |
| Conta e perfil | Avatar, banner (imagem ou GIF), bio e status | 0 | Não |
| Cenários | Universo compartilhado com ícone, banner, categorias e convite por link | 0 | Não |
| Canais de texto e anúncios | Conversa comum, respostas em tópico, mensagens fixadas, anúncios restritos por cargo | 0 | Não |
| Canal de galeria | Mural de imagens com descrição, tags e comentários (ex.: Arte e fichas) | 1 | Não |
| Cargos e permissões | Cargos com cor e ícone, permissões por canal e por campanha | 0 | Não |
| Campanhas | Seção do Cenário com banner, papéis Mestre e Jogador, cor característica de cada personagem | 1 | Não |
| Chat da campanha | Mensagens marcadas ingame ou outgame, falar como personagem ou como jogador, sussurro entre mestre e jogador | 1 | Não |
| Ficha modular | Fichas montadas a partir de templates editáveis pelo mestre | 1 | Não |
| Dados | Comando `/r 1d20+5` e botões da ficha, resolvidos no servidor, com rolagem oculta do mestre | 1 | Não |
| Busca por palavra | Procura no chat, nas notas e nos talking heads, respeitando a visibilidade | 1 | Não |
| Cenas e presença | O mestre divide a sessão em cenas e marca quais personagens estavam presentes | 1 | Não |
| Compêndio do Cenário | Bestiário, itens, magias, atlas, facções e história, herdados pelas campanhas e revelados aos jogadores | 1–3 | Não |
| Canais de voz | Salas fixas e voz dinâmica no Cenário | 2 | Não |
| Mesa (voz da campanha) | Card do participante com o personagem, a borda acende na cor dele quando fala | 2 | Não |
| Temas prontos | Tema (claro e escuro) e cor de destaque por Cenário e por campanha | 2 | Não |
| Mapa (tabletop) | Grid, imagem de fundo e tokens ligados aos personagens | 3 | Sim |
| Amigos e mensagens diretas | Lista de amigos, pedidos de amizade, mensagens diretas e grupos pequenos | 3 | Não |
| Talking heads | Pensamentos do jogador ou do personagem, com visibilidade escolhida | 4 | Sim |
| Transcrição e resumos | Bot grava a sessão, transcreve por pessoa e gera resumos aprovados pelo mestre | 4 | Sim |
| IA da campanha | Assistente com a memória da campanha: primeiro só para o mestre, depois para os jogadores | 5–6 | Sim |

**Card do participante na chamada**

- **Sem câmera:** imagem do personagem grande, foto de perfil do jogador pequena no canto.
- **Com câmera:** câmera, imagem do personagem e foto de perfil lado a lado.
- **Falando:** a borda acende na cor do personagem naquela campanha.
- **Mestre:** usa a cor e a imagem da campanha, ou do NPC que está interpretando no momento.

**Mensagens no chat**

- **Ingame:** mostra a imagem e o nome do personagem, com estilo de fala.
- **Outgame:** mostra o perfil do jogador, com estilo mais neutro.
- **Rolagem:** aparece como um cartão com fórmula, dados individuais, total e quem rolou.

## Ideias para avaliar nas primeiras versões

São ideias pequenas que fazem o app parecer feito por quem joga RPG. Nenhuma está decidida: marque as que entram e mova para a tabela de funcionalidades.

| Ideia | Por que vale | Fase sugerida | Esforço |
| --- | --- | --- | --- |
| Agenda de sessões com enquete de data e lembrete | Marcar a sessão é a maior dor de todo grupo | 0–1 | Médio |
| Contagem para a próxima sessão no topo do Cenário | Cria expectativa e evita "que dia é mesmo?" | 1 | Baixo |
| Card "Anteriormente em…" no início da sessão | O mestre escreve agora; a IA preenche na fase 4 | 1 | Baixo |
| Biblioteca de NPCs do mestre | Falar como um NPC com retrato no chat e na Mesa | 1 | Médio |
| Trocar o "falar como" com atalho | Alternar jogador, personagem e NPC sem tirar a mão do teclado | 1 | Baixo |
| Handouts | O mestre revela uma imagem ou documento só para quem deve ver | 1 | Médio |
| Ferramentas de segurança (Linhas e Véus, cartão X) | Prática comum nas mesas; o cartão X pode ser anônimo | 1 | Baixo |
| Tracker de iniciativa e turnos | Combate organizado, com destaque de quem joga agora na Mesa | 1–3 | Médio |
| Status públicos no card da Mesa | Vida e condições visíveis; o mestre escolhe o que é público | 2 | Baixo |
| Menção a personagem (`@Kael`) com card ao passar o mouse | Liga o chat à ficha e ao retrato | 1 | Baixo |
| Spoiler no chat (`\|\|texto\|\|`) e emojis próprios do Cenário | Detalhes que o grupo usa todo dia no Discord | 0–1 | Baixo |
| Ambientação sonora controlada pelo mestre | Trilha sincronizada para todos na Mesa | 2 | Médio |
| Pausa com cronômetro na Mesa | "10 minutos de intervalo" visível para todos | 2 | Baixo |
| Wiki da campanha (NPCs, lugares, facções) com visibilidade | Base manual da memória, antes da IA | 1–2 | Médio |
| Paleta de comandos (Ctrl+K) | Navegar e rolar dados sem mouse | 1 | Médio |
| Animação e aparência dos dados | Rolagem com peso visual; aparências extras podem virar item cosmético no futuro | 2 | Médio |

## Modelo de domínio

Todo registro carrega `spaceId` (o Cenário) e, dentro de campanhas, `campaignId`. Três campos atravessam o modelo de RPG: **escopo** (`ingame | outgame`), **visibilidade** e **cena**. Busca, resumos e IA dependem deles, então eles existem desde a fase 1.

| Entidade | Campos principais | Pertence a | Fase |
| --- | --- | --- | --- |
| User | nome de usuário, nome exibido, avatar, banner, cor do perfil, bio, status | — | 0 |
| Space (Cenário) | tipo (cenário ou comunidade), nome, ícone, banner, tema, cor de destaque, dono | — | 0 |
| CompendiumCollection | nome (Bestiário, Itens…), ícone, template de campos (jsonb) | Space | 1 |
| CompendiumEntry | nome, imagem, valores (jsonb); campanha vazia = canônica; entrada genérica (herança); entrada-base preenchida = variação; oculta | Collection (+ Campaign) | 1 (variações na 2) |
| EntryReveal | campos revelados (todos ou lista), alvo (grupo ou personagens), cena | Entry + Campaign | 1 |
| SpaceMember | apelido no Cenário, cargos | User + Space | 0 |
| Role | nome, cor, ícone, ordem, permissões (bitmask) | Space | 0 |
| Category | nome, ordem | Space | 0 |
| Channel | tipo (`texto \| anuncios \| galeria \| voz \| voz_dinamica \| funcional`), nome, ordem | Space (+ Category, + Campaign quando é canal de campanha) | 0 |
| PermissionOverride | alvo (cargo ou membro), permitir, negar | Category, Channel ou Campaign | 0 |
| Message | autor, falando como (personagem opcional), escopo, visibilidade, tipo (`texto \| rolagem \| sistema`), conteúdo | Channel (+ Session, Scene em campanhas) | 0 (campos de RPG na 1) |
| Campaign | nome, banner, tema, cor de destaque, módulos ativos (jsonb), template padrão | Space | 1 |
| CampaignMember | papel (`mestre \| jogador \| espectador`) | User + Campaign | 1 |
| Character | nome, retrato, imagem do token, cor, `templateId`, `values` (jsonb); dono vazio = NPC do mestre | Campaign (+ User dono) | 1 |
| SheetTemplate | nome, sistema, versão, `fields` (jsonb); sem campanha = template pronto global | Campaign ou global | 1 |
| Session | número, data, status, resumo publicado | Campaign | 1 |
| Scene | título, ordem, início e fim | Session | 1 |
| ScenePresence | personagem presente | Scene + Character | 1 |
| Roll | fórmula, dados individuais, total, oculta | Message | 1 |
| Note | autor, personagem opcional, escopo, visibilidade, tipo (`talking head \| nota do mestre`) | Campaign (+ Session, Scene) | 1 (talking heads na 4) |
| MemoryEntry | tipo e id da origem, texto, escopo, visibilidade, cena, índice de busca (`tsvector`), embedding no futuro | Campaign | 1 |
| Theme | tokens (jsonb), conjunto de ícones, fonte dos títulos | Global (temas prontos) | 2 |
| Map / Token | imagem, tamanho do grid / posição, personagem ligado | Campaign / Map | 3 |
| Friendship | estado (`pendente \| aceito \| bloqueado`) | User + User | 3 |
| Conversation | participantes (mensagem direta ou grupo pequeno) | Users | 3 |

**Visibilidade** é um enum com quatro valores: `privado` (só o autor), `mestre` (autor + mestre), `grupo` (todos da campanha) e `personagens` (uma lista específica de personagens).

**Regras que valem para tudo**

- **Isolamento por campanha:** o Row Level Security do Postgres só entrega linhas de Cenários e campanhas que a pessoa pode acessar pelos seus cargos.
- **Usuário ≠ personagem:** quem escreveu (User) e como escreveu (Character) são campos separados. Assim a transcrição e o chat sabem separar pessoa e personagem.
- **MemoryEntry é um índice:** cada mensagem, nota, trecho de transcrição ou resumo gera uma entrada com os mesmos metadados da origem. A busca e a IA leem só essa tabela.

## Ficha modular

A ficha é um **template em JSON** que o mestre edita, e cada personagem guarda só os valores. Os campos são ligados por `id`, nunca pelo rótulo, para que renomear "Força" não quebre nenhuma ficha.

| Tipo de campo | Exemplo | Quem edita o valor |
| --- | --- | --- |
| `number` | Força 16, Nível 3 | Jogador (ou só o mestre, se o campo estiver travado) |
| `formula` | Mod. de Força = `floor((@for - 10) / 2)` | Ninguém: é calculado |
| `bar` | Vida 22/30, Sanidade, Mana | Jogador e mestre |
| `text` / `longtext` | Nome, Origem, História | Jogador |
| `select` | Classe, Raça | Jogador, entre opções do template |
| `checkbox` | Inspiração, Treinado em Furtividade | Jogador |
| `list` | Inventário, Perícias, Magias (itens com subcampos) | Jogador |
| `roll` | Ataque = `1d20 + @for_mod + @prof` | Ninguém: vira um botão de rolar |

```json
{
  "id": "tpl_exemplo", "name": "Exemplo (valores ilustrativos)", "version": 3,
  "layout": [{ "section": "Atributos", "columns": 5, "fields": ["agi", "for", "int", "pre", "vig"] }],
  "fields": [
    { "id": "for", "type": "number", "label": "Força", "default": 1, "min": 0, "max": 5 },
    { "id": "pv", "type": "bar", "label": "Vida", "max": "12 + @vig * 3", "color": "danger" },
    { "id": "luta", "type": "roll", "label": "Luta", "dice": "(@for)d20kh1 + @luta_bonus" }
  ]
}
```

**Regras de funcionamento**

- **Fórmulas seguras:** um interpretador próprio de expressões com referências `@id` e funções permitidas (`floor`, `ceil`, `min`, `max`). Nunca `eval`. Referências circulares são detectadas ao salvar o template.
- **Dados no servidor:** a notação é interpretada por biblioteca pronta (ex.: `@dice-roller/rpg-dice-roller`), e o resultado é gerado no servidor e gravado como Roll.
- **Versionamento:** cada alteração do template gera uma nova versão. Campo novo entra com o `default`; campo removido fica arquivado nos valores, sem apagar dados.
- **Papéis:** só o mestre edita o template; o jogador edita os valores da própria ficha; o mestre pode travar campos.
- **Templates prontos:** sistemas conhecidos entram como templates globais que o mestre duplica e adapta.
- **Futuro (automação):** testes contra dificuldade, aplicar dano direto na barra de vida a partir de uma rolagem e efeitos temporários (buffs). O tipo `roll` já prepara esse caminho.

## Memória, presença por cena e IA

A regra central: **o filtro de permissão acontece antes de qualquer busca ou IA, nunca dentro do prompt.** O que uma pessoa não pode ver nem chega a ser carregado. Transcrição e LLM ficam para depois (fases 4 a 6), mas o modelo de dados já nasce preparado.

**Presença por cena** separa a memória do jogador da memória do personagem:

- O mestre abre uma cena e marca quais personagens estão nela. Por padrão, todos os presentes na sessão.
- O que é dito ingame numa cena entra na memória **só dos personagens presentes**.
- O jogador pode ter ouvido tudo (estava na chamada), mas a busca e a IA "como personagem" mostram apenas as cenas em que o personagem estava.
- Outgame e notas do próprio jogador continuam visíveis para ele, porque são memória do jogador, não do personagem.

| Modo da IA (por campanha) | Quem usa | Quando | Fase |
| --- | --- | --- | --- |
| Desligada | — | — | Padrão |
| Só para o mestre | Mestre, com acesso total | Sempre | 5 |
| Jogadores fora da sessão | Jogadores, filtrado pela presença por cena | Entre sessões; durante, só se o mestre liberar | 6 |
| Teste de memória | Jogador pergunta, o app pede uma rolagem | Quando o mestre ativar | 6 |

**Teste de memória:** o resultado da rolagem define o nível de detalhe da resposta. Falha devolve algo vago, sucesso devolve nome e contexto, e a dificuldade é definida pelo mestre.

**Resumos de sessão (fase 4):** o fluxo é rascunho gerado → mestre revisa e edita → publica. Os formatos previstos são lore, mecânico (loot, XP, vida) e ganchos pendentes. Um glossário de nomes da campanha alimenta a transcrição e o resumo.

**Privacidade (LGPD):** a gravação exige consentimento explícito de cada participante. O consentimento é registrado por campanha e um aviso fica visível enquanto a sessão estiver sendo gravada.

## Design system

Componentes próprios, estilizados em **Sass (sintaxe indentada) + CSS Modules**. O comportamento acessível de modais, menus e selects vem do **Base UI** (headless). Os tokens são variáveis CSS geradas pelo Sass, para que a cor da campanha e a do personagem mudem em tempo de execução.

**Princípios visuais**

- **A mesa é o palco:** a interface fica neutra e quieta; cor forte só para personagens, campanha e estados importantes.
- **Uma ênfase por vez:** quem está falando, a rolagem nova, a vez do jogador.
- **Ingame tem textura, outgame é neutro:** a diferença aparece logo no primeiro olhar.
- **Densidade confortável:** a ficha e o chat ficam abertos por horas, então o espaçamento precisa ser generoso e a leitura fácil.

| Camada de token | Exemplos | Onde vive |
| --- | --- | --- |
| Primitivos | `gray-50…950`, `violet-500`, `space-1…12` (passos de 4 px), `radius-sm/md/lg` | Mapas Sass (compilação) |
| Semânticos | `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-danger`, `--color-success` | Variáveis CSS em `:root` e `[data-theme]` |
| Contextuais (runtime) | `--campaign-accent`, `--player-color`, `--player-color-contrast` | Injetados por campanha e por personagem |
| Componente | `--button-bg`, `--card-padding`, `--ring-width` | No módulo do componente |

```
styles/
  tokens/_colors.sass  _space.sass  _type.sass  _radius.sass  _motion.sass
  _themes.sass       // gera :root e [data-theme='light'] a partir dos mapas
  _mixins.sass       // focus-ring, breakpoint, visually-hidden, truncate
  globals.sass
components/
  Button/Button.tsx  Button.module.sass  Button.stories.tsx
```

**Inventário de componentes**

- **Próprios do zero:** Button, IconButton, Input, Textarea, Card, Avatar, Badge, Tag, Divider, Skeleton.
- **Sobre Base UI:** Dialog, Popover, Menu, Select, Tabs, Tooltip, Toast, Switch, Checkbox, NumberField, Slider.
- **De domínio:** ParticipantCard, CharacterPortrait, ChatMessage (ingame e outgame), RollCard, ResourceBar, SheetField (um renderizador por tipo de campo), DiceTray, MapToken.
- **Documentação viva:** Storybook com cada componente, nos dois temas, em todos os estados.

**Acessibilidade (WCAG 2.2)**

- Texto com contraste mínimo de 4,5:1; bordas e indicadores, como o anel de quem fala, com 3:1.
- A cor do jogador é validada ao ser escolhida, e o app calcula `--player-color-contrast` para o texto sobre ela.
- Nunca só cor: quem fala também ganha um ícone de onda sonora e um rótulo para leitores de tela.
- Foco sempre visível, tudo operável pelo teclado e animações respeitando `prefers-reduced-motion`.

**Estados de todo componente**

Cada componente é documentado no Storybook em oito estados: padrão, hover, foco, ativo, desabilitado, **carregando**, vazio e erro.

- **Esqueleto:** todo componente exporta uma versão `Componente.Skeleton` com as mesmas dimensões do conteúdo real, para a tela não pular quando os dados chegam.
- **Sem piscar:** o esqueleto só aparece depois de cerca de 200 ms. O brilho animado é sutil e desliga com `prefers-reduced-motion`. Linhas de texto falsas têm larguras variadas.
- **Carregamento por região:** `loading.tsx` e `Suspense` do Next.js em cada área (lista de canais, mensagens, membros), que carregam de forma independente.
- **Vazio:** ilustração do mascote + uma ação clara ("Nenhuma campanha ainda — criar campanha").
- **Erro:** mensagem em linguagem humana + botão de tentar de novo.
- **Otimista:** a mensagem enviada aparece na hora, em estado "enviando", e é confirmada depois.

**Referências de padrão**

- **Discord:** layout em quatro colunas (Cenários, canais, conteúdo, membros), mensagens agrupadas por autor, card ao passar o mouse sobre um perfil, atalhos de teclado.
- **Apple (Human Interface Guidelines):** hierarquia visual clara, alvos de toque de pelo menos 44 pt no celular, movimento com propósito e resposta imediata a cada ação.
- **Temas:** um tema pronto só sobrescreve tokens semânticos de conteúdo e os contextuais; os tokens de navegação ficam sempre no tema do app.

## Fluxos e telas

São 14 telas e 4 fluxos para desenhar em wireframe antes do código. A tela mais importante é a **Mesa**, onde a sessão acontece, e ela deve ser desenhada primeiro.

| Tela | O que tem | Fase |
| --- | --- | --- |
| Login e cadastro | E-mail ou login social | 0 |
| Início (social) | Convites pendentes e Cenários; amigos e mensagens diretas na fase 3 | 0 |
| Perfil | Avatar, banner, bio, personagens em destaque; card ao passar o mouse | 0 |
| Criar Cenário | Nome, ícone, banner, modelo inicial de canais | 0 |
| Cenário: canal de texto | Lista de canais e campanhas, mensagens, membros | 0 |
| Configurações do Cenário | Canais, categorias, cargos, permissões, convites, tema | 0 |
| Configurações do usuário | Perfil, áudio, tema do app, acessibilidade | 0 |
| Criar campanha | Nome, banner, cor, tema, módulos, template, quem tem acesso | 1 |
| Entrar na campanha | Criar ou escolher personagem | 1 |
| **Mesa** | Participantes, chat da campanha, ficha em painel, bandeja de dados; depois voz e mapa | 1–3 |
| Ficha do personagem | Versão em tela cheia e versão em painel lateral | 1 |
| Editor de template | Campos, seções, fórmulas, pré-visualização ao vivo (só o mestre) | 1 |
| Painel do mestre | Cenas e presença, NPCs, rolagens ocultas, controles da sessão | 1 |
| Canal de voz | Salas, participantes, voz dinâmica | 2 |
| Canal de galeria | Mural de imagens em colunas; imagem aberta com comentários ao lado | 1 |
| Configurações da campanha | Geral, tema, módulos, templates de ficha, jogadores, cenas, gravação | 1 |

**Layout do app**

- **Desktop:** quatro colunas como no Discord: barra de Cenários (ícones) à esquerda, lista de canais e campanhas, conteúdo e lista de membros (recolhível). O Início usa a mesma estrutura, com amigos e mensagens diretas no lugar dos canais.
- **Mesa no desktop:** o conteúdo vira o palco dos participantes, ou o mapa quando o módulo está ligado, com o chat da campanha ao lado; a ficha abre como gaveta.
- **Celular:** barra de Cenários e canais numa gaveta que desliza da esquerda; dentro da Mesa, abas Mesa, Chat e Ficha, com a bandeja de dados sempre acessível.

**Fluxo A — mestre prepara a campanha**

1. Cria a conta.
2. Cria o Cenário e, dentro dele, a campanha: nome, banner, cor, tema e módulos.
3. Escolhe um template pronto ou monta o seu.
4. Gera o link de convite.
5. Agenda ou abre a primeira sessão.

**Fluxo B — jogador entra**

1. Abre o link do convite.
2. Cria a conta ou faz login.
3. Cria o personagem: retrato, cor e ficha a partir do template da campanha.
4. Entra na Mesa.

**Fluxo C — durante a sessão**

1. O mestre abre a sessão e a primeira cena; todos os presentes são marcados.
2. O grupo conversa e usa o chat ingame e outgame.
3. As rolagens saem pela ficha ou pelo comando e aparecem no chat.
4. O mestre troca de cena e ajusta a presença quando o grupo se separa.
5. O mestre encerra a sessão.

**Fluxo D — depois da sessão**

1. Qualquer membro consulta o histórico e a busca, filtrados pela visibilidade.
2. Na fase 4: o mestre recebe o rascunho do resumo, edita e publica.

## Stack e decisões técnicas

TypeScript de ponta a ponta, web primeiro, com serviços prontos para voz e banco de dados. Cada linha abaixo vira um ADR curto (registro de decisão) na pasta `docs/adr` do repositório.

| Decisão | Escolha | Por quê | Situação |
| --- | --- | --- | --- |
| Linguagem | TypeScript | É a linguagem de maior fluência; tipos compartilhados entre front e back | Decidido |
| Estrutura do repositório | Monorepo com pnpm + Turborepo (`apps/web`, `packages/ui`, `packages/core`, `packages/db`) | Ficha, dados e tipos reaproveitados no desktop e no mobile depois | Decidido |
| Web | Next.js | Já dominado; SSR para páginas públicas e convites | Decidido |
| Banco, login, tempo real e arquivos | Supabase (Postgres, Auth, Realtime, Storage) | Row Level Security por campanha, busca textual em português e pgvector para o futuro | Decidido |
| Estilo | Sass indentado + CSS Modules + variáveis CSS | Preferência pessoal; tokens trocados em tempo de execução | Decidido |
| Componentes acessíveis | Base UI (headless) | Acessibilidade pronta sem impor visual | Decidido |
| Validação | Zod | Mesmo schema para templates, formulários e API | Decidido |
| Dados de RPG | Biblioteca pronta de notação de dados, resolvida no servidor | Evita trapaça e reimplementar parser | Decidido |
| Voz e vídeo | LiveKit (Cloud no início, auto-hospedado se precisar) | Detecção de quem fala, faixa de áudio por pessoa, open source | Decidido |
| Mapa | Canvas com react-konva ou PixiJS | Decidir na fase 3 com um teste rápido | Em aberto |
| Desktop | Tauri 2 ou Electron | Depende de testar o WebRTC do Tauri (webview do sistema) | Em aberto |
| Mobile | PWA primeiro; Expo depois | PWA sai de graça com a web | Decidido |
| Transcrição e LLM | Interfaces `Transcriber` e `Summarizer`; Whisper local + comparar LLM local com API | Trocar de fornecedor sem reescrever | Adiado (fase 4) |
| Testes | Vitest (unidade) + Playwright (fluxos) | Padrão do ecossistema | Decidido |
| Hospedagem | Vercel (web) + Supabase Cloud + LiveKit Cloud, nos planos gratuitos | Custo zero para um grupo | Decidido |

**Higiene do repositório:** README com como rodar, Conventional Commits, ESLint, CI rodando testes a cada pull request. Lembrete: o Prettier não formata arquivos `.sass`.

## Questões em aberto e próximos passos

Antes do código, faltam a identidade visual e o wireframe da Mesa; o resto já tem direção.

**Questões em aberto**

- Direção visual da base do app: neutra e moderna como o Discord, com qual personalidade (tipografia, forma dos ícones)?
- Tema escuro como padrão, com tema claro opcional?
- Qual sistema o grupo joga hoje, para ser o primeiro template pronto?
- Nome definitivo do app, logo e mascote: ver o canvas de conceitos.
- O mestre pode aparecer na chamada como mais de um NPC ao mesmo tempo?
- Terá papel de espectador (assiste, mas não joga)?
- Talking heads só em texto, ou também em áudio curto?

**Próximos passos**

- [ ] Responder as questões em aberto
- [ ] Definir nome, paleta, tipografia e tokens
- [ ] Wireframe da Mesa no desktop e no celular
- [ ] Wireframes das outras telas da fase 0–1
- [ ] Teste técnico do LiveKit num fim de semana (chamada + detecção de quem fala)
- [ ] Criar o monorepo, o README e os primeiros ADRs
- [ ] Escrever o schema do banco com as regras de Row Level Security
