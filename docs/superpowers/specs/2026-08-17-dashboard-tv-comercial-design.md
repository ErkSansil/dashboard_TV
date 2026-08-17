# Dashboard TV - Comercial — Design

## Contexto

Painel para 3 TVs na sala do setor Comercial da AMO, mostrando o ranking de
resultados dos times de **Vendas** e **Qualificação**, com destaque para o
top 3 (pódio) e lista ordenada dos demais. Períodos: dia, semana, mês e (no
futuro) ano. As 3 TVs ficam sincronizadas, alternando juntas entre as
combinações de setor × período habilitadas.

Existe um modo DEV separado, acessado só pelo desenvolvedor, para mudar a
configuração do rodízio em tempo real sem nunca expor esses controles nas
TVs.

Reaproveita a identidade da marca AMO (logo, ícone) já usada no projeto
irmão **Painel Gerencial AMO**, mas com uma proposta visual própria — tom
híbrido: base editorial/premium, com energia competitiva nos momentos de
destaque (pódio, troca de posição).

## Arquitetura

```
┌──────────────┐    HTTPS/JSON    ┌─────────────────────┐
│ tv.html      │ ◄──────────────► │ Google Apps Script   │
│ (nas 3 TVs)  │   polling         │ (Web App)            │
├──────────────┤                   │        │             │
│ dev.html     │ ◄──────────────► │        ▼             │
│ (PC do DEV,  │   polling         │ Planilha Google      │
│ com login)   │                   │ "DASHBOARD RANKING"  │
└──────────────┘                   └─────────────────────┘
```

- HTML/CSS/JS puro, sem framework e sem build — mesmo padrão do Painel
  Gerencial AMO. Facilita hospedagem estática e é suficiente pro escopo.
- Nenhuma página acessa a planilha diretamente — tudo passa pelo Apps
  Script, que expõe uma API JSON.
- `tv.html` e `dev.html` são páginas separadas (não uma SPA só), pra deixar
  claro e simples o que cada PC/TV carrega.

## Planilha

URL: `https://docs.google.com/spreadsheets/d/1vzWMswfTYTpHWsjM3SEGSqACsjwv4DPpSHX5RiaaEj0`
(nome: "DASHBOARD RANKING")

Abas já criadas:

| Aba | Papel | Lida pelo dashboard? |
|---|---|---|
| `VENDAS` | Resultados por pessoa/período do setor Vendas, já calculados (blocos de 5 linhas: Nome, Porcentagem, Imediato, Contratos) | Sim |
| `QUALIFICACAO` | Resultados por pessoa/período do setor Qualificação, já calculados (blocos de 4 linhas: Nome, Qualificadas geral, Porcentagem) | Sim |
| `EQUIPE` | Nome, Setor, Foto (link/ID do Drive) — fonte única da foto de cada pessoa | Sim |
| `CONFIG` | Configuração do rodízio (ordem, tempo por tela, seções ativas, tema, tamanho do ranking) | Sim (leitura por `tv.html`, escrita por `dev.html`) |
| `CREDENCIAIS DEV` | Usuário/senha para acessar `dev.html` | Sim (só pelo endpoint de login) |
| `BD. CONTRATOS`, `BD. QUALIFICAÇÃO`, `BD. VALIDAÇÃO` | Bases brutas upstream que alimentam os cálculos de `VENDAS`/`QUALIFICACAO` | Não diretamente — o dashboard só lê os blocos já calculados |

**A confirmar no início da implementação**: os nomes exatos das colunas em
`VENDAS` e `QUALIFICACAO` (o usuário vai informar ao criar/revisar os
cabeçalhos). O Apps Script localiza colunas pelo cabeçalho, não por posição
fixa — mesmo padrão do Painel Gerencial — então mudanças de ordem não
quebram a leitura.

## Fotos

Fotos coladas direto na célula (in-cell image) não são confiáveis de
extrair via API — o Google não expõe o blob de imagens coladas de forma
consistente. Abordagem adotada:

1. Uma pasta no Google Drive (ex: "Fotos Equipe"), um arquivo por pessoa,
   com permissão "qualquer pessoa com o link pode ver".
2. A aba `EQUIPE` guarda, por pessoa: Nome, Setor, link/ID do arquivo no
   Drive.
3. O Apps Script converte o ID do Drive numa URL direta de imagem (ex:
   `https://drive.google.com/thumbnail?id=FILE_ID&sz=w500`) e devolve essa
   URL pronta no JSON.
4. `VENDAS`/`QUALIFICACAO` não precisam mais carregar foto — o front-end
   casa o resultado com a foto pelo nome, usando a aba `EQUIPE`.

Trocar a foto de alguém = substituir o arquivo no Drive (mesmo nome/ID).

## Backend (Google Apps Script)

Endpoints JSON via `GET` em `/exec` (mesmo padrão do Painel Gerencial):

| Ação | Parâmetros | Retorna |
|---|---|---|
| `ranking` | `setor` (vendas/qualificacao), `periodo` (dia/semana/mes/ano) | Lista ordenada de pessoas com métricas + foto (via `EQUIPE`) |
| `config` | — | Configuração atual do rodízio (leitura pública, sem senha — necessário pra TV funcionar sem autenticação) |
| `salvarconfig` | `usuario`, `senha`, config (JSON) | Salva nova configuração na aba `CONFIG`. Exige credencial válida em `CREDENCIAIS DEV` |
| `login` | `usuario`, `senha` | Valida acesso ao `dev.html` |

Detecção de mudanças e cache seguem o mesmo princípio do Painel Gerencial
(hash pra saber se algo mudou, refresh silencioso no front).

## `tv.html` — tela da TV

- Pódio: top 3 em destaque (1º maior que 2º/3º), foto grande, nome, número.
- Lista ordenada abaixo com os demais colocados (posição, foto pequena,
  nome, número).
- Rodízio client-side: percorre as combinações setor × período habilitadas
  em `CONFIG`, com transição suave (sem "piscar" ao trocar dado ou tela).
- Polling: dados a cada ~30–60s, config a cada ~15s (mudança feita no modo
  DEV chega nas 3 TVs em segundos).
- Tela cheia, sem nenhum controle ou indicação visual de que existe um modo
  DEV.
- Visual: tom híbrido — base editorial/premium (tipografia grande, grid
  limpo, cores sólidas da marca AMO, fundo escuro por padrão) com energia
  competitiva nos momentos de destaque (troca de 1º lugar, entrada no
  pódio). Reaproveita logo/ícone AMO já usados no Painel Gerencial, mas com
  layout e conceito próprios — não é uma cópia do dashboard gerencial.

## `dev.html` — modo DEV

- Login com usuário/senha (aba `CREDENCIAIS DEV`).
- Preview ao vivo mostrando exatamente o que está passando nas TVs agora.
- Controles:
  - Ordem e tempo (segundos) de cada tela no rodízio.
  - Pausar rodízio e fixar uma combinação específica (ex: reunião,
    apresentação).
  - Liga/desliga de setor ou período inteiro (ex: tirar "Ano" enquanto não
    houver dado suficiente).
  - Tema (claro/escuro) e quantidade de pessoas exibidas na lista abaixo do
    pódio.
- Nunca é aberto nas TVs — só no computador do desenvolvedor.

## Hospedagem e execução remota nas TVs

- Hospedagem estática externa (GitHub Pages), mesmo modelo do Painel
  Gerencial — HTTPS grátis, sem servidor próprio.
- TVs: Samsung Smart TV (Tizen) 43" Crystal UHD U8600F — sem PC nem
  aparelho externo. Abordagem: instalar um app gratuito de
  "kiosk/signage browser" pela loja da própria TV (Samsung Apps),
  configurado para abrir `tv.html` automaticamente ao ligar, com
  auto-reload e sem protetor de tela / modo ambiente cobrindo a tela. O
  README vai trazer o passo a passo completo, incluindo as configurações
  da TV que precisam ser desligadas (economia de energia / sensor de
  ausência de sinal, "Ambient Mode").
- `dev.html` é acessado só pelo computador do desenvolvedor, pela mesma URL
  do GitHub Pages (rota separada, ex: `/dev.html`), nunca nas TVs.

## Fora de escopo (por ora)

- Destaque anual: a aba/config já prevê o período "ano", mas fica
  desligado até haver histórico suficiente — ligar depois é só uma mudança
  de config, sem alterar código.
- Cálculo de agregações (dia/semana/mês/ano) pelo dashboard: os números já
  chegam prontos das abas `VENDAS`/`QUALIFICACAO`.
- Autenticação de usuários da equipe/TV: a TV não tem login, só o modo DEV.
