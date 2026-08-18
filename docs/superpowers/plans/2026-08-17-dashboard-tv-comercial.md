# Dashboard TV - Comercial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o dashboard de ranking de Vendas para as 3 TVs do comercial, com dados lidos em tempo real da planilha "DASHBOARD RANKING" via Google Apps Script, e um modo DEV que muda a configuração do rodízio sem nunca aparecer nas TVs.

**Architecture:** HTML/CSS/JS puro, sem build. Toda a lógica que não depende de `SpreadsheetApp`/DOM (parsing de linhas, ordenação, pódio, config, rodízio) vive em `shared/*.js`, testável via `node --test`. Esses mesmos arquivos são colados sem alteração no projeto Apps Script (que vira a única porta de acesso à planilha) e carregados via `<script>` em `tv.html`/`dev.html`. Cada arquivo `shared/*.js` termina com um guard `if (typeof module !== 'undefined')` que só exporta em Node — em Apps Script/navegador essas funções ficam disponíveis no escopo global normalmente.

**Tech Stack:** HTML/CSS/JS vanilla, Google Apps Script (Web App), Node.js `node --test` para lógica pura, GitHub Pages para hospedagem.

**Spec:** [docs/superpowers/specs/2026-08-17-dashboard-tv-comercial-design.md](../specs/2026-08-17-dashboard-tv-comercial-design.md)

## Global Constraints

- Sem framework front-end e sem etapa de build.
- Front-end nunca acessa a planilha diretamente — tudo passa pelo Apps Script.
- Fotos vêm da aba `EQUIPE` (link/ID do Drive), nunca de imagem colada em célula.
- As 3 TVs sempre sincronizadas: mesmo config, mesmo slide ativo.
- `dev.html` só é aberto no computador do desenvolvedor, nunca nas TVs.
- Este plano cobre somente o setor **Vendas** — Qualificação fica para um plano futuro (layout ainda não compartilhado pelo usuário).
- Planilha: `https://docs.google.com/spreadsheets/d/1vzWMswfTYTpHWsjM3SEGSqACsjwv4DPpSHX5RiaaEj0`. Abas usadas: `VENDAS`, `EQUIPE`, `CONFIG`, `CREDENCIAIS DEV`.
- Layout real de `VENDAS` (confirmado pelo usuário, cabeçalhos na linha 1, dados a partir da linha 4, colunas sempre contíguas na ordem Nome/Aproveitamento/Vendas Imediato/Contratos):
  - Diário: `E4:H` (rótulo da data em `F2`)
  - Semanal: `P4:S` (rótulo do intervalo em `Q2` e `R2`)
  - Mensal: `AA4:AD` (rótulo em `AA2`, `AB2`, `AC2`)
  - Nunca fixar a última linha — cada bloco pode crescer de forma independente.

## Nota sobre testes

Os módulos em `shared/*.js` são funções puras (sem `SpreadsheetApp`, sem DOM) e recebem testes automatizados via `node --test` em cada task. O código que depende do Google Apps Script (leitura da planilha, deploy) ou do DOM (`tv.html`/`dev.html`) não roda em Node — essas tasks trazem passos de **verificação manual** explícitos (rodar função no editor do Apps Script e checar o log, abrir a página no navegador e checar visualmente) em vez de um teste automatizado. Essa mistura é intencional e seguida por todas as tasks marcadas como "manual".

---

### Task 1: Estrutura do projeto e ambiente de testes

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `test/sanity.test.js`
- Create: `assets/logo-amo.png`, `assets/icone-amo.png` (copiados de `C:\Users\erick.s\Documents\Sites\Painel Gerencial AMO\`)

- [ ] **Step 1: Criar `package.json`**

```json
{
  "name": "dashboard-tv-comercial",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Criar `.gitignore`**

```
node_modules/
.DS_Store
```

- [ ] **Step 3: Criar pastas vazias `shared/`, `apps-script/`, `tv/`, `dev/`**

- [ ] **Step 4: Copiar os assets de marca**

Copiar `logo-amo.png` e `icone-amo.png` de `C:\Users\erick.s\Documents\Sites\Painel Gerencial AMO\` para `assets/` nesta pasta.

- [ ] **Step 5: Escrever o teste de sanidade**

```javascript
// test/sanity.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

test('ambiente de testes está funcionando', () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 6: Rodar os testes**

Run: `npm test`
Expected: 1 teste passando.

- [ ] **Step 7: Commit**

```bash
git add package.json .gitignore test/sanity.test.js assets/
git commit -m "chore: estrutura inicial do projeto e assets de marca"
```

---

### Task 2: `shared/percent.js` — números e percentuais

**Files:**
- Create: `shared/percent.js`
- Test: `test/percent.test.js`

**Interfaces:**
- Produces: `parseNumberValue(raw)` — converte número ou string (`"33,33%"`) em `number`. `toPercentNumber(raw)` — sempre retorna a porcentagem como número (ex.: `0.3333` ou `"33,33%"` → `33.33`).

- [ ] **Step 1: Escrever o teste (falhando)**

```javascript
// test/percent.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseNumberValue, toPercentNumber } = require('../shared/percent.js');

test('parseNumberValue aceita número direto', () => {
  assert.equal(parseNumberValue(5), 5);
});

test('parseNumberValue converte string com vírgula e %', () => {
  assert.equal(parseNumberValue('33,33%'), 33.33);
});

test('parseNumberValue retorna 0 para valor inválido', () => {
  assert.equal(parseNumberValue('abc'), 0);
});

test('toPercentNumber converte fração decimal em porcentagem', () => {
  assert.equal(toPercentNumber(0.3333), 33.33);
});

test('toPercentNumber mantém número já em formato percentual', () => {
  assert.equal(toPercentNumber(50), 50);
});

test('toPercentNumber trata string formatada em pt-BR', () => {
  assert.equal(toPercentNumber('66,67%'), 66.67);
});

test('toPercentNumber trata 0,00%', () => {
  assert.equal(toPercentNumber('0,00%'), 0);
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `node --test test/percent.test.js`
Expected: FAIL — `Cannot find module '../shared/percent.js'`

- [ ] **Step 3: Implementar**

```javascript
// shared/percent.js
function parseNumberValue(raw) {
  if (typeof raw === 'number') {
    return raw;
  }
  if (typeof raw === 'string') {
    var limpo = raw.replace('%', '').trim().replace(',', '.');
    var numero = parseFloat(limpo);
    return isNaN(numero) ? 0 : numero;
  }
  return 0;
}

function toPercentNumber(raw) {
  var valor = parseNumberValue(raw);
  var percentual = valor <= 1 ? valor * 100 : valor;
  return Math.round(percentual * 100) / 100;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseNumberValue: parseNumberValue, toPercentNumber: toPercentNumber };
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `node --test test/percent.test.js`
Expected: 7 testes passando.

- [ ] **Step 5: Commit**

```bash
git add shared/percent.js test/percent.test.js
git commit -m "feat: parsing de números e percentuais pt-BR"
```

---

### Task 3: `shared/drive.js` — URL de foto a partir do Drive

**Files:**
- Create: `shared/drive.js`
- Test: `test/drive.test.js`

**Interfaces:**
- Produces: `extrairDriveId(valor)`, `buildDriveImageUrl(valor, tamanho)`.

- [ ] **Step 1: Escrever o teste (falhando)**

```javascript
// test/drive.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { extrairDriveId, buildDriveImageUrl } = require('../shared/drive.js');

test('extrai ID de um link de compartilhamento do Drive', () => {
  assert.equal(
    extrairDriveId('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrSt/view?usp=sharing'),
    '1AbCdEfGhIjKlMnOpQrSt'
  );
});

test('extrai ID de um link com parâmetro id=', () => {
  assert.equal(
    extrairDriveId('https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrSt'),
    '1AbCdEfGhIjKlMnOpQrSt'
  );
});

test('aceita o ID puro, sem link', () => {
  assert.equal(extrairDriveId('1AbCdEfGhIjKlMnOpQrSt'), '1AbCdEfGhIjKlMnOpQrSt');
});

test('retorna vazio para valor vazio ou nulo', () => {
  assert.equal(extrairDriveId(''), '');
  assert.equal(extrairDriveId(null), '');
});

test('buildDriveImageUrl monta URL de thumbnail', () => {
  assert.equal(
    buildDriveImageUrl('1AbCdEfGhIjKlMnOpQrSt'),
    'https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOpQrSt&sz=w500'
  );
});

test('buildDriveImageUrl aceita tamanho customizado', () => {
  assert.equal(
    buildDriveImageUrl('1AbCdEfGhIjKlMnOpQrSt', 200),
    'https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOpQrSt&sz=w200'
  );
});

test('buildDriveImageUrl retorna vazio sem ID válido', () => {
  assert.equal(buildDriveImageUrl(''), '');
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `node --test test/drive.test.js`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

```javascript
// shared/drive.js
function extrairDriveId(valor) {
  if (!valor) return '';
  var texto = String(valor).trim();
  var porCaminho = texto.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (porCaminho) return porCaminho[1];
  var porParametro = texto.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (porParametro) return porParametro[1];
  if (/^[a-zA-Z0-9_-]{15,}$/.test(texto)) return texto;
  return '';
}

function buildDriveImageUrl(valor, tamanho) {
  var id = extrairDriveId(valor);
  if (!id) return '';
  var largura = tamanho || 500;
  return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w' + largura;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extrairDriveId: extrairDriveId, buildDriveImageUrl: buildDriveImageUrl };
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `node --test test/drive.test.js`
Expected: 7 testes passando.

- [ ] **Step 5: Commit**

```bash
git add shared/drive.js test/drive.test.js
git commit -m "feat: extracao de ID e URL de foto do Google Drive"
```

---

### Task 4: `shared/ranking.js` parte 1 — normalização das linhas de Vendas

**Files:**
- Create: `shared/ranking.js`
- Test: `test/ranking.test.js`

**Interfaces:**
- Consumes: `parseNumberValue`, `toPercentNumber` (Task 2).
- Produces: `normalizeVendaRow(nome, aproveitamentoRaw, vendasImediatoRaw, contratosRaw)` → `{nome, aproveitamento, vendasImediato, contratos}`. `montarPessoasDeValores(valoresLinhas)` → array dessas pessoas, pulando linhas sem nome.

- [ ] **Step 1: Escrever o teste (falhando)**

```javascript
// test/ranking.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeVendaRow, montarPessoasDeValores } = require('../shared/ranking.js');

test('normalizeVendaRow converte e limpa os campos de uma linha', () => {
  const pessoa = normalizeVendaRow(' Alice ', 0.3333, 1, 2);
  assert.deepEqual(pessoa, { nome: 'Alice', aproveitamento: 33.33, vendasImediato: 1, contratos: 2 });
});

test('montarPessoasDeValores ignora linhas sem nome', () => {
  const valores = [
    ['Alice', 0.3333, 1, 2],
    ['', '', '', ''],
    ['Fernanda', 0.6667, 2, 0]
  ];
  const pessoas = montarPessoasDeValores(valores);
  assert.equal(pessoas.length, 2);
  assert.equal(pessoas[0].nome, 'Alice');
  assert.equal(pessoas[1].nome, 'Fernanda');
});

test('montarPessoasDeValores mantém pessoas com resultado zerado', () => {
  const valores = [['Larissa', 0, 0, 0]];
  const pessoas = montarPessoasDeValores(valores);
  assert.equal(pessoas.length, 1);
  assert.equal(pessoas[0].aproveitamento, 0);
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `node --test test/ranking.test.js`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

```javascript
// shared/ranking.js
if (typeof require !== 'undefined' && typeof toPercentNumber === 'undefined') {
  var _percent = require('./percent.js');
  var toPercentNumber = _percent.toPercentNumber;
  var parseNumberValue = _percent.parseNumberValue;
}

function normalizeVendaRow(nome, aproveitamentoRaw, vendasImediatoRaw, contratosRaw) {
  return {
    nome: String(nome).trim(),
    aproveitamento: toPercentNumber(aproveitamentoRaw),
    vendasImediato: parseNumberValue(vendasImediatoRaw),
    contratos: parseNumberValue(contratosRaw)
  };
}

function montarPessoasDeValores(valoresLinhas) {
  var pessoas = [];
  for (var i = 0; i < valoresLinhas.length; i++) {
    var linha = valoresLinhas[i];
    var nome = linha[0];
    if (!nome || String(nome).trim() === '') continue;
    pessoas.push(normalizeVendaRow(nome, linha[1], linha[2], linha[3]));
  }
  return pessoas;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeVendaRow: normalizeVendaRow,
    montarPessoasDeValores: montarPessoasDeValores
  };
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `node --test test/ranking.test.js`
Expected: 3 testes passando.

- [ ] **Step 5: Commit**

```bash
git add shared/ranking.js test/ranking.test.js
git commit -m "feat: normalizacao das linhas de vendas da planilha"
```

---

### Task 5: `shared/ranking.js` parte 2 — ordenação, posições e pódio/resto

**Files:**
- Modify: `shared/ranking.js`
- Modify: `test/ranking.test.js`

**Interfaces:**
- Produces: `sortRanking(pessoas, ordenarPor, direcao)`, `buildRankingComPosicoes(pessoasOrdenadas)`, `montarRanking(pessoas, ordenarPor, direcao)`, `dividirPodioEResto(ranking, qtdLista)`.

- [ ] **Step 1: Adicionar os testes (falhando)**

Adicionar ao final de `test/ranking.test.js` (atualizar o `require` do topo para incluir os novos nomes):

```javascript
const {
  normalizeVendaRow,
  montarPessoasDeValores,
  sortRanking,
  buildRankingComPosicoes,
  montarRanking,
  dividirPodioEResto
} = require('../shared/ranking.js');

test('sortRanking ordena por aproveitamento decrescente por padrão', () => {
  const pessoas = [
    { nome: 'Alice', aproveitamento: 33.33, vendasImediato: 1, contratos: 2 },
    { nome: 'Fernanda', aproveitamento: 66.67, vendasImediato: 2, contratos: 0 }
  ];
  const ordenado = sortRanking(pessoas, 'aproveitamento');
  assert.equal(ordenado[0].nome, 'Fernanda');
});

test('sortRanking ordena por nome crescente quando pedido', () => {
  const pessoas = [{ nome: 'Wesley' }, { nome: 'Alice' }];
  const ordenado = sortRanking(pessoas, 'nome');
  assert.equal(ordenado[0].nome, 'Alice');
});

test('sortRanking respeita direção explícita', () => {
  const pessoas = [
    { nome: 'Alice', contratos: 2 },
    { nome: 'Fernanda', contratos: 5 }
  ];
  const ordenado = sortRanking(pessoas, 'contratos', 'asc');
  assert.equal(ordenado[0].nome, 'Alice');
});

test('buildRankingComPosicoes numera a partir de 1', () => {
  const pessoas = [{ nome: 'Fernanda' }, { nome: 'Alice' }];
  const comPosicoes = buildRankingComPosicoes(pessoas);
  assert.equal(comPosicoes[0].posicao, 1);
  assert.equal(comPosicoes[1].posicao, 2);
});

test('montarRanking ordena e numera de uma vez', () => {
  const pessoas = [
    { nome: 'Alice', aproveitamento: 33.33 },
    { nome: 'Fernanda', aproveitamento: 66.67 }
  ];
  const ranking = montarRanking(pessoas, 'aproveitamento');
  assert.equal(ranking[0].nome, 'Fernanda');
  assert.equal(ranking[0].posicao, 1);
});

test('dividirPodioEResto separa top 3 do restante limitado', () => {
  const ranking = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ posicao: n }));
  const { podio, resto } = dividirPodioEResto(ranking, 3);
  assert.equal(podio.length, 3);
  assert.deepEqual(resto.map((p) => p.posicao), [4, 5, 6]);
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `node --test test/ranking.test.js`
Expected: FAIL — funções não exportadas.

- [ ] **Step 3: Implementar**

Adicionar ao final de `shared/ranking.js` (antes do bloco `module.exports`):

```javascript
function sortRanking(pessoas, ordenarPor, direcao) {
  var campo = ordenarPor || 'aproveitamento';
  var direcaoPadrao = campo === 'nome' ? 'asc' : 'desc';
  var direcaoFinal = direcao || direcaoPadrao;
  var multiplicador = direcaoFinal === 'asc' ? 1 : -1;
  var copia = pessoas.slice();
  copia.sort(function (a, b) {
    if (campo === 'nome') {
      return multiplicador * a.nome.localeCompare(b.nome, 'pt-BR');
    }
    return multiplicador * (a[campo] - b[campo]);
  });
  return copia;
}

function buildRankingComPosicoes(pessoasOrdenadas) {
  return pessoasOrdenadas.map(function (pessoa, indice) {
    var copia = {};
    for (var chave in pessoa) {
      copia[chave] = pessoa[chave];
    }
    copia.posicao = indice + 1;
    return copia;
  });
}

function montarRanking(pessoas, ordenarPor, direcao) {
  return buildRankingComPosicoes(sortRanking(pessoas, ordenarPor, direcao));
}

function dividirPodioEResto(ranking, qtdLista) {
  var limite = typeof qtdLista === 'number' ? qtdLista : 7;
  return {
    podio: ranking.slice(0, 3),
    resto: ranking.slice(3, 3 + limite)
  };
}
```

E atualizar o `module.exports` no final do arquivo para incluir as 4 novas funções junto das já existentes.

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `node --test test/ranking.test.js`
Expected: 9 testes passando.

- [ ] **Step 5: Commit**

```bash
git add shared/ranking.js test/ranking.test.js
git commit -m "feat: ordenacao, posicoes e divisao em podio/resto"
```

---

### Task 6: `shared/ranking.js` parte 3 — fotos por nome (aba EQUIPE)

**Files:**
- Modify: `shared/ranking.js`
- Modify: `test/ranking.test.js`

**Interfaces:**
- Consumes: `buildDriveImageUrl` (Task 3).
- Produces: `normalizarChaveNome(nome)`, `montarMapaFotos(linhasEquipe)`, `anexarFotos(ranking, mapaFotos)`.

- [ ] **Step 1: Adicionar os testes (falhando)**

```javascript
const {
  normalizeVendaRow,
  montarPessoasDeValores,
  sortRanking,
  buildRankingComPosicoes,
  montarRanking,
  dividirPodioEResto,
  normalizarChaveNome,
  montarMapaFotos,
  anexarFotos
} = require('../shared/ranking.js');

test('montarMapaFotos monta o mapa nome -> URL da foto', () => {
  const linhas = [
    ['Alice', 'vendas', '1AbCdEfGhIjKlMnOpQrSt'],
    ['', '', '']
  ];
  const mapa = montarMapaFotos(linhas);
  assert.equal(mapa['alice'], 'https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOpQrSt&sz=w500');
});

test('anexarFotos casa pelo nome ignorando maiúsculas/espaços', () => {
  const ranking = [{ nome: ' Alice ', posicao: 1 }];
  const mapa = { alice: 'https://exemplo.com/alice.jpg' };
  const comFoto = anexarFotos(ranking, mapa);
  assert.equal(comFoto[0].foto, 'https://exemplo.com/alice.jpg');
});

test('anexarFotos retorna string vazia quando não encontra a pessoa', () => {
  const ranking = [{ nome: 'Sem Foto', posicao: 1 }];
  const comFoto = anexarFotos(ranking, {});
  assert.equal(comFoto[0].foto, '');
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `node --test test/ranking.test.js`
Expected: FAIL — funções não exportadas.

- [ ] **Step 3: Implementar**

Adicionar ao topo de `shared/ranking.js`, junto do bloco de `require` já existente:

```javascript
if (typeof require !== 'undefined' && typeof buildDriveImageUrl === 'undefined') {
  var _drive = require('./drive.js');
  var buildDriveImageUrl = _drive.buildDriveImageUrl;
}
```

Adicionar ao final (antes do `module.exports`):

```javascript
function normalizarChaveNome(nome) {
  return String(nome).trim().toLowerCase();
}

function montarMapaFotos(linhasEquipe) {
  var mapa = {};
  for (var i = 0; i < linhasEquipe.length; i++) {
    var linha = linhasEquipe[i];
    var nome = linha[0];
    var fotoRef = linha[2];
    if (!nome) continue;
    mapa[normalizarChaveNome(nome)] = buildDriveImageUrl(fotoRef);
  }
  return mapa;
}

function anexarFotos(ranking, mapaFotos) {
  return ranking.map(function (pessoa) {
    var copia = {};
    for (var chave in pessoa) {
      copia[chave] = pessoa[chave];
    }
    copia.foto = mapaFotos[normalizarChaveNome(pessoa.nome)] || '';
    return copia;
  });
}
```

E incluir `normalizarChaveNome`, `montarMapaFotos`, `anexarFotos` no `module.exports`.

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `node --test test/ranking.test.js`
Expected: 12 testes passando.

- [ ] **Step 5: Commit**

```bash
git add shared/ranking.js test/ranking.test.js
git commit -m "feat: casamento de fotos da aba EQUIPE por nome"
```

---

### Task 7: `shared/config.js` — configuração padrão e validação

**Files:**
- Create: `shared/config.js`
- Test: `test/config.test.js`

**Interfaces:**
- Produces: `configPadrao()` → objeto de configuração com 4 slides de Vendas (dia/semana/mes/ano). `validarConfig(config)` → `{valido, erros}`.
- Formato de um slide: `{chave, setor, periodo, ativo, duracaoSegundos, linhaInicial, colunas: {nome, aproveitamento, vendasImediato, contratos}, rotuloCelulas: [...], ordenarPor, direcao}`.

- [ ] **Step 1: Escrever o teste (falhando)**

```javascript
// test/config.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { configPadrao, validarConfig } = require('../shared/config.js');

test('configPadrao retorna um config válido', () => {
  const config = configPadrao();
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, true);
  assert.deepEqual(resultado.erros, []);
});

test('configPadrao tem 4 slides de vendas (dia, semana, mes, ano)', () => {
  const config = configPadrao();
  const periodos = config.slides.map((s) => s.periodo);
  assert.deepEqual(periodos, ['dia', 'semana', 'mes', 'ano']);
});

test('validarConfig rejeita config sem slides', () => {
  const resultado = validarConfig({ tema: 'escuro', qtdLista: 5, slides: [] });
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.length > 0);
});

test('validarConfig rejeita duracaoSegundos inválida', () => {
  const config = configPadrao();
  config.slides[0].duracaoSegundos = 0;
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('duracaoSegundos')));
});

test('validarConfig rejeita ordenarPor inválido', () => {
  const config = configPadrao();
  config.slides[0].ordenarPor = 'campo-invalido';
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
});

test('validarConfig aceita slide inativo sem colunas preenchidas', () => {
  const config = configPadrao();
  config.slides[3].ativo = false;
  config.slides[3].colunas = { nome: '', aproveitamento: '', vendasImediato: '', contratos: '' };
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, true);
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `node --test test/config.test.js`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

```javascript
// shared/config.js
function configPadrao() {
  return {
    tema: 'escuro',
    qtdLista: 7,
    fixado: null,
    slides: [
      {
        chave: 'vendas-dia', setor: 'vendas', periodo: 'dia', ativo: true, duracaoSegundos: 20,
        linhaInicial: 4,
        colunas: { nome: 'E', aproveitamento: 'F', vendasImediato: 'G', contratos: 'H' },
        rotuloCelulas: ['F2'], ordenarPor: 'aproveitamento', direcao: 'desc'
      },
      {
        chave: 'vendas-semana', setor: 'vendas', periodo: 'semana', ativo: true, duracaoSegundos: 20,
        linhaInicial: 4,
        colunas: { nome: 'P', aproveitamento: 'Q', vendasImediato: 'R', contratos: 'S' },
        rotuloCelulas: ['Q2', 'R2'], ordenarPor: 'aproveitamento', direcao: 'desc'
      },
      {
        chave: 'vendas-mes', setor: 'vendas', periodo: 'mes', ativo: true, duracaoSegundos: 20,
        linhaInicial: 4,
        colunas: { nome: 'AA', aproveitamento: 'AB', vendasImediato: 'AC', contratos: 'AD' },
        rotuloCelulas: ['AA2', 'AB2', 'AC2'], ordenarPor: 'aproveitamento', direcao: 'desc'
      },
      {
        chave: 'vendas-ano', setor: 'vendas', periodo: 'ano', ativo: false, duracaoSegundos: 20,
        linhaInicial: 4,
        colunas: { nome: '', aproveitamento: '', vendasImediato: '', contratos: '' },
        rotuloCelulas: [], ordenarPor: 'aproveitamento', direcao: 'desc'
      }
    ]
  };
}

var CAMPOS_ORDENAVEIS = ['aproveitamento', 'vendasImediato', 'contratos', 'nome'];

function validarConfig(config) {
  var erros = [];
  if (!config || typeof config !== 'object') {
    return { valido: false, erros: ['config precisa ser um objeto'] };
  }
  if (!Array.isArray(config.slides) || config.slides.length === 0) {
    erros.push('config.slides precisa ser uma lista com pelo menos 1 item');
  } else {
    config.slides.forEach(function (slide, indice) {
      if (!slide.setor) erros.push('slide ' + indice + ': setor é obrigatório');
      if (!slide.periodo) erros.push('slide ' + indice + ': periodo é obrigatório');
      if (typeof slide.duracaoSegundos !== 'number' || slide.duracaoSegundos <= 0) {
        erros.push('slide ' + indice + ': duracaoSegundos precisa ser maior que 0');
      }
      if (slide.ativo && (!slide.colunas || !slide.colunas.nome)) {
        erros.push('slide ' + indice + ': colunas.nome é obrigatório quando o slide está ativo');
      }
      if (CAMPOS_ORDENAVEIS.indexOf(slide.ordenarPor) === -1) {
        erros.push('slide ' + indice + ': ordenarPor inválido (' + slide.ordenarPor + ')');
      }
      if (['asc', 'desc'].indexOf(slide.direcao) === -1) {
        erros.push('slide ' + indice + ': direcao precisa ser "asc" ou "desc"');
      }
    });
  }
  if (typeof config.qtdLista !== 'number' || config.qtdLista < 0) {
    erros.push('qtdLista precisa ser um número maior ou igual a 0');
  }
  if (['claro', 'escuro'].indexOf(config.tema) === -1) {
    erros.push('tema precisa ser "claro" ou "escuro"');
  }
  return { valido: erros.length === 0, erros: erros };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { configPadrao: configPadrao, validarConfig: validarConfig };
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `node --test test/config.test.js`
Expected: 6 testes passando.

- [ ] **Step 5: Commit**

```bash
git add shared/config.js test/config.test.js
git commit -m "feat: config padrao do rodizio e validacao"
```

---

### Task 8: `shared/rotation.js` — qual slide exibir

**Files:**
- Create: `shared/rotation.js`
- Test: `test/rotation.test.js`

**Interfaces:**
- Consumes: formato de config/slide (Task 7).
- Produces: `obterSlidesAtivos(config)`, `proximoIndiceSlide(indiceAtual, totalSlides)`, `resolverSlideExibido(config, indiceAtual)`.

- [ ] **Step 1: Escrever o teste (falhando)**

```javascript
// test/rotation.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { obterSlidesAtivos, proximoIndiceSlide, resolverSlideExibido } = require('../shared/rotation.js');
const { configPadrao } = require('../shared/config.js');

test('obterSlidesAtivos filtra só os slides com ativo=true', () => {
  const config = configPadrao();
  const ativos = obterSlidesAtivos(config);
  assert.equal(ativos.length, 3);
  assert.ok(ativos.every((s) => s.ativo));
});

test('proximoIndiceSlide roda em círculo', () => {
  assert.equal(proximoIndiceSlide(0, 3), 1);
  assert.equal(proximoIndiceSlide(2, 3), 0);
});

test('proximoIndiceSlide retorna 0 quando não há slides', () => {
  assert.equal(proximoIndiceSlide(0, 0), 0);
});

test('resolverSlideExibido retorna o slide ativo pelo índice', () => {
  const config = configPadrao();
  const slide = resolverSlideExibido(config, 1);
  assert.equal(slide.periodo, 'semana');
});

test('resolverSlideExibido respeita o fixado, ignorando o índice', () => {
  const config = configPadrao();
  config.fixado = { setor: 'vendas', periodo: 'mes' };
  const slide = resolverSlideExibido(config, 0);
  assert.equal(slide.periodo, 'mes');
});

test('resolverSlideExibido retorna null quando não há slides ativos nem fixado', () => {
  const config = configPadrao();
  config.slides.forEach((s) => { s.ativo = false; });
  const slide = resolverSlideExibido(config, 0);
  assert.equal(slide, null);
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `node --test test/rotation.test.js`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

```javascript
// shared/rotation.js
function obterSlidesAtivos(config) {
  return (config.slides || []).filter(function (slide) {
    return slide.ativo;
  });
}

function proximoIndiceSlide(indiceAtual, totalSlides) {
  if (!totalSlides || totalSlides <= 0) return 0;
  return (indiceAtual + 1) % totalSlides;
}

function resolverSlideExibido(config, indiceAtual) {
  if (config.fixado) {
    var slidesFixaveis = config.slides || [];
    for (var i = 0; i < slidesFixaveis.length; i++) {
      var slide = slidesFixaveis[i];
      if (slide.setor === config.fixado.setor && slide.periodo === config.fixado.periodo) {
        return slide;
      }
    }
  }
  var ativos = obterSlidesAtivos(config);
  if (ativos.length === 0) return null;
  var indice = ((indiceAtual % ativos.length) + ativos.length) % ativos.length;
  return ativos[indice];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    obterSlidesAtivos: obterSlidesAtivos,
    proximoIndiceSlide: proximoIndiceSlide,
    resolverSlideExibido: resolverSlideExibido
  };
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `node --test test/rotation.test.js`
Expected: 6 testes passando.

- [ ] **Step 5: Commit**

```bash
git add shared/rotation.js test/rotation.test.js
git commit -m "feat: logica de rodizio entre slides"
```

---

### Task 9: Apps Script — login e configuração (`Code.gs`)

**Files:**
- Create: `apps-script/Percent.gs`, `apps-script/Drive.gs`, `apps-script/Ranking.gs`, `apps-script/Config.gs`, `apps-script/Rotation.gs` (cópias idênticas de `shared/percent.js`, `shared/drive.js`, `shared/ranking.js`, `shared/config.js`, `shared/rotation.js` — mesmo conteúdo das Tasks 2 a 8, sem alteração)
- Create: `apps-script/Code.gs`

**Interfaces:**
- Consumes: `configPadrao()`, `validarConfig()` (Task 7, copiadas para `Config.gs`).
- Produces: endpoint `doGet(e)`; funções `acaoConfig()`, `acaoSalvarConfig(usuario, senha, configTexto)`, `acaoLogin(usuario, senha)`, `validarCredencial(usuario, senha)`, `lerConfigAtual()` — usadas pela Task 10.

- [ ] **Step 1: Copiar os módulos puros para `apps-script/`**

Criar `apps-script/Percent.gs`, `apps-script/Drive.gs`, `apps-script/Ranking.gs`, `apps-script/Config.gs`, `apps-script/Rotation.gs` com exatamente o mesmo conteúdo de `shared/percent.js`, `shared/drive.js`, `shared/ranking.js`, `shared/config.js` e `shared/rotation.js` (Tasks 2–8). Não alterar nada — o guard `if (typeof module !== 'undefined')` não executa em Apps Script, então o conteúdo funciona sem mudanças.

- [ ] **Step 2: Escrever `apps-script/Code.gs`**

```javascript
// apps-script/Code.gs
var ID_PLANILHA = '1vzWMswfTYTpHWsjM3SEGSqACsjwv4DPpSHX5RiaaEj0';
var ABA_VENDAS = 'VENDAS';
var ABA_EQUIPE = 'EQUIPE';
var ABA_CONFIG = 'CONFIG';
var ABA_CREDENCIAIS = 'CREDENCIAIS DEV';
var CELULA_CONFIG_JSON = 'B2';

function doGet(e) {
  var acao = e.parameter.action;
  var resposta;
  if (acao === 'ranking') {
    resposta = acaoRanking(e.parameter.setor, e.parameter.periodo);
  } else if (acao === 'config') {
    resposta = acaoConfig();
  } else if (acao === 'salvarconfig') {
    resposta = acaoSalvarConfig(e.parameter.usuario, e.parameter.senha, e.parameter.config);
  } else if (acao === 'login') {
    resposta = acaoLogin(e.parameter.usuario, e.parameter.senha);
  } else {
    resposta = { ok: false, erro: 'Ação inválida' };
  }
  return ContentService.createTextOutput(JSON.stringify(resposta)).setMimeType(ContentService.MimeType.JSON);
}

function getPlanilha() {
  return SpreadsheetApp.openById(ID_PLANILHA);
}

function lerConfigAtual() {
  var aba = getPlanilha().getSheetByName(ABA_CONFIG);
  var textoJson = aba.getRange(CELULA_CONFIG_JSON).getValue();
  if (!textoJson) return configPadrao();
  try {
    return JSON.parse(textoJson);
  } catch (erro) {
    return configPadrao();
  }
}

function acaoConfig() {
  return { ok: true, config: lerConfigAtual() };
}

function acaoSalvarConfig(usuario, senha, configTexto) {
  var credencialValida = validarCredencial(usuario, senha);
  if (!credencialValida) {
    return { ok: false, erro: 'Credenciais inválidas' };
  }
  var config;
  try {
    config = JSON.parse(configTexto);
  } catch (erro) {
    return { ok: false, erro: 'JSON de configuração inválido' };
  }
  var validacao = validarConfig(config);
  if (!validacao.valido) {
    return { ok: false, erro: validacao.erros.join('; ') };
  }
  var aba = getPlanilha().getSheetByName(ABA_CONFIG);
  aba.getRange(CELULA_CONFIG_JSON).setValue(JSON.stringify(config));
  return { ok: true };
}

function validarCredencial(usuario, senha) {
  if (!usuario || !senha) return false;
  var aba = getPlanilha().getSheetByName(ABA_CREDENCIAIS);
  var valores = aba.getDataRange().getValues();
  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (linha[0] === usuario && linha[1] === senha) {
      return linha[2] === 'Ativo';
    }
  }
  return false;
}

function acaoLogin(usuario, senha) {
  var valido = validarCredencial(usuario, senha);
  return valido ? { ok: true } : { ok: false, erro: 'Credenciais inválidas' };
}
```

- [ ] **Step 3: Preparar as abas da planilha (manual, na planilha real)**

Na aba `CONFIG`: `A1` = `CHAVE`, `B1` = `VALOR`, `A2` = `CONFIG_JSON`, deixar `B2` vazio por enquanto.

Na aba `CREDENCIAIS DEV`: `A1` = `USUARIO`, `B1` = `SENHA`, `C1` = `STATUS`. Adicionar uma linha de teste, ex.: `A2` = `dev`, `B2` = uma senha forte à sua escolha, `C2` = `Ativo`.

- [ ] **Step 4: Colar no editor do Apps Script (manual)**

Na planilha: Extensões → Apps Script. Criar um arquivo de script para cada um dos 6 arquivos (`Percent.gs`, `Drive.gs`, `Ranking.gs`, `Config.gs`, `Rotation.gs`, `Code.gs`) e colar o conteúdo correspondente. Salvar.

- [ ] **Step 5: Testar `acaoConfig` no editor (manual)**

Selecionar a função `acaoConfig` na barra de funções do editor e clicar em Executar. Abrir Ver → Registros de execução e confirmar que o log mostra `{ ok: true, config: {...} }` com os 4 slides padrão de vendas.

- [ ] **Step 6: Testar `acaoLogin` no editor (manual)**

Criar uma função temporária:

```javascript
function testarLogin() {
  Logger.log(acaoLogin('dev', 'SENHA_QUE_VOCE_CADASTROU'));
}
```

Executar `testarLogin` e confirmar no log `{ ok: true }`. Depois apagar essa função temporária.

- [ ] **Step 7: Implantar como Web App (manual)**

Implantar → Nova implantação → Tipo "App da Web" → Executar como "Eu" → Quem pode acessar "Qualquer pessoa" → Implantar. Copiar a URL terminada em `/exec`.

- [ ] **Step 8: Testar via navegador (manual)**

Abrir `URL/exec?action=config` no navegador e confirmar que retorna o JSON de configuração padrão.

- [ ] **Step 9: Commit**

```bash
git add apps-script/
git commit -m "feat: apps script com login e leitura/gravacao de config"
```

---

### Task 10: Apps Script — ranking de Vendas

**Files:**
- Modify: `apps-script/Code.gs`

**Interfaces:**
- Consumes: `montarPessoasDeValores`, `montarRanking`, `dividirPodioEResto`, `montarMapaFotos`, `anexarFotos` (copiadas em `Ranking.gs`, Task 9); `lerConfigAtual()` (Task 9).
- Produces: `acaoRanking(setor, periodo)` → `{ok, setor, periodo, rotulo, atualizadoEm, podio, resto}`, usada pelo `doGet` já existente.

- [ ] **Step 1: Adicionar ao final de `apps-script/Code.gs`**

```javascript
function acaoRanking(setor, periodo) {
  var config = lerConfigAtual();
  var slide = encontrarSlide(config, setor, periodo);
  if (!slide) {
    return { ok: false, erro: 'Nenhum slide configurado para ' + setor + '/' + periodo };
  }
  var planilha = getPlanilha();
  var abaVendas = planilha.getSheetByName(ABA_VENDAS);
  var pessoas = lerRankingVendas(abaVendas, slide);
  var ranking = montarRanking(pessoas, slide.ordenarPor, slide.direcao);
  var abaEquipe = planilha.getSheetByName(ABA_EQUIPE);
  var linhasEquipe = abaEquipe.getDataRange().getValues().slice(1);
  var mapaFotos = montarMapaFotos(linhasEquipe);
  var rankingComFotos = anexarFotos(ranking, mapaFotos);
  var dividido = dividirPodioEResto(rankingComFotos, config.qtdLista);
  return {
    ok: true,
    setor: setor,
    periodo: periodo,
    rotulo: lerRotulo(abaVendas, slide.rotuloCelulas),
    atualizadoEm: new Date().toISOString(),
    podio: dividido.podio,
    resto: dividido.resto
  };
}

function encontrarSlide(config, setor, periodo) {
  var slides = config.slides || [];
  for (var i = 0; i < slides.length; i++) {
    if (slides[i].setor === setor && slides[i].periodo === periodo) {
      return slides[i];
    }
  }
  return null;
}

function lerRankingVendas(aba, slide) {
  var ultimaLinha = aba.getLastRow();
  if (ultimaLinha < slide.linhaInicial) return [];
  var intervalo = slide.colunas.nome + slide.linhaInicial + ':' + slide.colunas.contratos + ultimaLinha;
  var valores = aba.getRange(intervalo).getValues();
  return montarPessoasDeValores(valores);
}

function lerRotulo(aba, celulas) {
  if (!celulas || celulas.length === 0) return '';
  var partes = celulas.map(function (celula) {
    return aba.getRange(celula).getDisplayValue();
  });
  return partes.join(' a ');
}
```

- [ ] **Step 2: Preparar a aba EQUIPE com um registro real (manual)**

Na aba `EQUIPE`: `A1` = `NOME`, `B1` = `SETOR`, `C1` = `FOTO_DRIVE`. Adicionar ao menos uma linha real com o nome de um vendedor que já existe em `VENDAS` (ex.: `Alice`) e o ID ou link de uma foto dele no Google Drive (pasta com permissão "qualquer pessoa com o link pode ver").

- [ ] **Step 3: Colar a atualização no editor do Apps Script (manual)**

Colar o conteúdo do Step 1 no final do arquivo `Code.gs` no editor do Apps Script. Salvar.

- [ ] **Step 4: Testar `acaoRanking` no editor (manual)**

Criar uma função temporária:

```javascript
function testarRanking() {
  Logger.log(JSON.stringify(acaoRanking('vendas', 'dia')));
}
```

Executar e conferir no log um JSON com `podio` (até 3 pessoas) e `resto`, ordenado por `aproveitamento` decrescente, batendo com os dados reais da aba `VENDAS` (colunas `E:H`). Repetir trocando `periodo` para `'semana'` (colunas `P:S`) e `'mes'` (colunas `AA:AD`). Apagar a função temporária depois.

- [ ] **Step 5: Nova implantação e teste via navegador (manual)**

Implantar → Gerenciar implantações → editar → Nova versão → Implantar. Abrir `URL/exec?action=ranking&setor=vendas&periodo=dia` no navegador e confirmar o JSON, incluindo a URL de foto da pessoa cadastrada em `EQUIPE`.

- [ ] **Step 6: Commit**

```bash
git add apps-script/Code.gs
git commit -m "feat: endpoint de ranking de vendas com fotos"
```

---

### Task 11: Deploy config compartilhada (`shared/apiConfig.js`)

**Files:**
- Create: `shared/apiConfig.js`

**Interfaces:**
- Produces: constante global `APPS_SCRIPT_URL`, consumida por `tv.js` (Task 12) e `dev.js` (Task 13).

- [ ] **Step 1: Criar o arquivo**

```javascript
// shared/apiConfig.js
var APPS_SCRIPT_URL = 'COLE_AQUI_A_URL_DO_APPS_SCRIPT_TERMINADA_EM_/exec';

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APPS_SCRIPT_URL: APPS_SCRIPT_URL };
}
```

- [ ] **Step 2: Substituir pelo valor real (manual)**

Trocar o texto `COLE_AQUI_A_URL_DO_APPS_SCRIPT_TERMINADA_EM_/exec` pela URL copiada na Task 9 (Step 7). Confirmar abrindo `APPS_SCRIPT_URL + '?action=config'` diretamente no navegador — deve devolver o mesmo JSON validado na Task 9.

- [ ] **Step 3: Commit**

```bash
git add shared/apiConfig.js
git commit -m "chore: url do apps script implantado"
```

---

### Task 12: `tv.html` — tela da TV

**Files:**
- Create: `tv/tv.html`, `tv/tv.css`, `tv/tv.js`

**Interfaces:**
- Consumes: `resolverSlideExibido`, `proximoIndiceSlide`, `obterSlidesAtivos` (Task 8); `APPS_SCRIPT_URL` (Task 11). Endpoints `?action=config` e `?action=ranking&setor=&periodo=` (Task 9/10), que já devolvem `podio`/`resto` prontos.

- [ ] **Step 1: Criar `tv/tv.html`**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Dashboard Comercial AMO</title>
  <link rel="icon" href="../assets/icone-amo.png" />
  <link rel="stylesheet" href="tv.css" />
</head>
<body>
  <div class="tela">
    <header class="cabecalho">
      <img class="cabecalho__logo" src="../assets/logo-amo.png" alt="AMO" />
      <div class="cabecalho__titulo">
        <span class="cabecalho__setor" id="rotuloSetor">Vendas</span>
        <span class="cabecalho__periodo" id="rotuloPeriodo">Hoje</span>
      </div>
    </header>
    <main class="conteudo">
      <section class="podio" id="podio"></section>
      <section class="lista" id="lista"></section>
    </main>
  </div>

  <script src="../shared/percent.js"></script>
  <script src="../shared/drive.js"></script>
  <script src="../shared/ranking.js"></script>
  <script src="../shared/config.js"></script>
  <script src="../shared/rotation.js"></script>
  <script src="../shared/apiConfig.js"></script>
  <script src="tv.js"></script>
</body>
</html>
```

- [ ] **Step 2: Criar `tv/tv.css`**

```css
:root {
  --bg: #0b0d12;
  --bg-elevado: #14171f;
  --texto: #f5f6f8;
  --texto-sub: #9aa0ac;
  --ouro: #f5c451;
  --prata: #c7cdd6;
  --bronze: #d99a63;
  --acento: #3b82f6;
  --borda: #232733;
  --fonte: 'Segoe UI', Arial, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--texto);
  font-family: var(--fonte);
  height: 100vh;
  overflow: hidden;
}

body.tema-claro {
  --bg: #f5f6f8;
  --bg-elevado: #ffffff;
  --texto: #14171f;
  --texto-sub: #5b6270;
  --borda: #e2e5ea;
}

.tela {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 2.5vh 3vw;
}

.cabecalho {
  display: flex;
  align-items: center;
  gap: 1.5vw;
  margin-bottom: 2vh;
}

.cabecalho__logo { height: 6vh; }

.cabecalho__titulo { display: flex; flex-direction: column; }

.cabecalho__setor {
  font-size: 2.2vw;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.cabecalho__periodo {
  font-size: 1.1vw;
  color: var(--texto-sub);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.conteudo {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3vh;
}

.podio {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2vw;
  min-height: 40vh;
}

.podio__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-elevado);
  border: 1px solid var(--borda);
  border-radius: 1.2vw;
  padding: 2vh 1.5vw;
  transition: transform 0.6s ease, box-shadow 0.6s ease;
}

.podio__item--pos1 {
  order: 2;
  transform: scale(1.15) translateY(-2vh);
  border-color: var(--ouro);
  box-shadow: 0 0 4vh rgba(245, 196, 81, 0.35);
}

.podio__item--pos2 { order: 1; border-color: var(--prata); }
.podio__item--pos3 { order: 3; border-color: var(--bronze); }

.podio__foto {
  width: 9vw;
  height: 9vw;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-color: var(--borda);
  margin-bottom: 1.2vh;
}

.podio__posicao { font-size: 1vw; color: var(--texto-sub); font-weight: 700; }
.podio__nome { font-size: 1.6vw; font-weight: 700; margin: 0.4vh 0; text-align: center; }
.podio__metrica { font-size: 2vw; font-weight: 800; color: var(--acento); }

.lista {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.6vh;
}

.lista__linha {
  display: grid;
  grid-template-columns: 3vw 4vw 1fr auto;
  align-items: center;
  gap: 1vw;
  background: var(--bg-elevado);
  border: 1px solid var(--borda);
  border-radius: 0.8vw;
  padding: 1vh 1.2vw;
}

.lista__posicao { font-weight: 700; color: var(--texto-sub); }

.lista__foto {
  width: 3vw;
  height: 3vw;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-color: var(--borda);
}

.lista__nome { font-size: 1.3vw; font-weight: 600; }
.lista__metrica { font-size: 1.4vw; font-weight: 700; color: var(--acento); }
.mensagem-vazia { text-align: center; color: var(--texto-sub); font-size: 1.4vw; }
```

- [ ] **Step 3: Criar `tv/tv.js`**

```javascript
var ESTADO = { config: null, indiceRotacao: 0, timerRotacao: null };

function iniciar() {
  atualizarConfig(function () {
    agendarRotacao();
    setInterval(function () { atualizarConfig(function () {}); }, 15000);
  });
}

function atualizarConfig(callback) {
  fetch(APPS_SCRIPT_URL + '?action=config')
    .then(function (resposta) { return resposta.json(); })
    .then(function (dados) {
      if (dados.ok) {
        ESTADO.config = dados.config;
        aplicarTema(ESTADO.config.tema);
      }
      callback();
    })
    .catch(function () { callback(); });
}

function agendarRotacao() {
  mostrarSlideAtual();
  if (ESTADO.timerRotacao) clearTimeout(ESTADO.timerRotacao);
  var slideAtual = resolverSlideExibido(ESTADO.config, ESTADO.indiceRotacao);
  var duracaoMs = slideAtual ? slideAtual.duracaoSegundos * 1000 : 20000;
  ESTADO.timerRotacao = setTimeout(function () {
    ESTADO.indiceRotacao = proximoIndiceSlide(ESTADO.indiceRotacao, obterSlidesAtivos(ESTADO.config).length);
    agendarRotacao();
  }, duracaoMs);
}

function mostrarSlideAtual() {
  var slide = resolverSlideExibido(ESTADO.config, ESTADO.indiceRotacao);
  if (!slide) {
    renderizarVazio();
    return;
  }
  fetch(APPS_SCRIPT_URL + '?action=ranking&setor=' + slide.setor + '&periodo=' + slide.periodo)
    .then(function (resposta) { return resposta.json(); })
    .then(function (dados) {
      if (dados.ok) renderizar(slide, dados);
    });
}

function aplicarTema(tema) {
  document.body.classList.toggle('tema-claro', tema === 'claro');
}

function renderizarVazio() {
  document.getElementById('podio').innerHTML = '<p class="mensagem-vazia">Nenhum ranking configurado</p>';
  document.getElementById('lista').innerHTML = '';
}

function renderizar(slide, dados) {
  document.getElementById('rotuloSetor').textContent = slide.setor === 'vendas' ? 'Vendas' : 'Qualificação';
  document.getElementById('rotuloPeriodo').textContent = rotuloPeriodo(slide.periodo, dados.rotulo);
  renderizarPodio(dados.podio);
  renderizarLista(dados.resto);
}

function rotuloPeriodo(periodo, rotulo) {
  var nomes = { dia: 'Hoje', semana: 'Semana', mes: 'Mês', ano: 'Ano' };
  var nome = nomes[periodo] || periodo;
  return rotulo ? nome + ' · ' + rotulo : nome;
}

function formatarPercentual(numero) {
  return numero.toFixed(2).replace('.', ',') + '%';
}

function renderizarPodio(podio) {
  var container = document.getElementById('podio');
  container.innerHTML = '';
  [1, 0, 2].forEach(function (indice) {
    var pessoa = podio[indice];
    if (!pessoa) return;
    var item = document.createElement('div');
    item.className = 'podio__item podio__item--pos' + pessoa.posicao;
    item.innerHTML =
      '<div class="podio__foto" style="background-image:url(' + (pessoa.foto || '') + ')"></div>' +
      '<div class="podio__posicao">' + pessoa.posicao + 'º</div>' +
      '<div class="podio__nome">' + pessoa.nome + '</div>' +
      '<div class="podio__metrica">' + formatarPercentual(pessoa.aproveitamento) + '</div>';
    container.appendChild(item);
  });
}

function renderizarLista(resto) {
  var container = document.getElementById('lista');
  container.innerHTML = '';
  resto.forEach(function (pessoa) {
    var linha = document.createElement('div');
    linha.className = 'lista__linha';
    linha.innerHTML =
      '<span class="lista__posicao">' + pessoa.posicao + 'º</span>' +
      '<span class="lista__foto" style="background-image:url(' + (pessoa.foto || '') + ')"></span>' +
      '<span class="lista__nome">' + pessoa.nome + '</span>' +
      '<span class="lista__metrica">' + formatarPercentual(pessoa.aproveitamento) + '</span>';
    container.appendChild(linha);
  });
}

iniciar();
```

- [ ] **Step 4: Verificar no navegador (manual)**

Abrir `tv/tv.html` diretamente no navegador (arquivo local). Confirmar: pódio com até 3 pessoas (1º maior, ao centro), lista abaixo com o restante, dados batendo com o `?action=ranking&setor=vendas&periodo=dia` testado na Task 10, e a troca automática entre dia/semana/mês respeitando `duracaoSegundos` do config padrão (20s cada).

- [ ] **Step 5: Commit**

```bash
git add tv/
git commit -m "feat: tela da tv com podio, lista e rodizio"
```

---

### Task 13: `dev.html` — modo DEV

**Files:**
- Create: `dev/dev.html`, `dev/dev.css`, `dev/dev.js`

**Interfaces:**
- Consumes: `configPadrao`, `validarConfig` (Task 7); `APPS_SCRIPT_URL` (Task 11); endpoints `?action=login`, `?action=config`, `?action=salvarconfig` (Task 9).

- [ ] **Step 1: Criar `dev/dev.html`**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Dashboard Comercial — DEV</title>
  <link rel="icon" href="../assets/icone-amo.png" />
  <link rel="stylesheet" href="dev.css" />
</head>
<body>
  <div id="telaLogin" class="tela-login">
    <form id="formLogin">
      <img src="../assets/logo-amo.png" alt="AMO" class="tela-login__logo" />
      <h1>Acesso DEV</h1>
      <input type="text" id="campoUsuario" placeholder="Usuário" required />
      <input type="password" id="campoSenha" placeholder="Senha" required />
      <button type="submit">Entrar</button>
      <p id="mensagemLogin" class="mensagem-erro"></p>
    </form>
  </div>

  <div id="telaConfig" class="tela-config" hidden>
    <aside class="painel-controles">
      <h1>Configuração do rodízio</h1>
      <div class="campo">
        <label>Tema</label>
        <select id="campoTema">
          <option value="escuro">Escuro</option>
          <option value="claro">Claro</option>
        </select>
      </div>
      <div class="campo">
        <label>Qtd. na lista (além do pódio)</label>
        <input type="number" id="campoQtdLista" min="0" />
      </div>
      <div class="campo">
        <label>Fixar uma tela (opcional)</label>
        <select id="campoFixado"></select>
      </div>
      <div id="listaSlides"></div>
      <button id="botaoSalvar">Salvar configuração</button>
      <p id="mensagemSalvar" class="mensagem-status"></p>
    </aside>
    <main class="preview">
      <h2>Preview ao vivo (o que está passando nas TVs)</h2>
      <iframe src="../tv/tv.html" title="Preview da TV"></iframe>
    </main>
  </div>

  <script src="../shared/percent.js"></script>
  <script src="../shared/drive.js"></script>
  <script src="../shared/ranking.js"></script>
  <script src="../shared/config.js"></script>
  <script src="../shared/rotation.js"></script>
  <script src="../shared/apiConfig.js"></script>
  <script src="dev.js"></script>
</body>
</html>
```

- [ ] **Step 2: Criar `dev/dev.css`**

```css
:root {
  --bg: #f5f6f8;
  --bg-elevado: #ffffff;
  --texto: #14171f;
  --texto-sub: #5b6270;
  --acento: #3b82f6;
  --borda: #e2e5ea;
  --erro: #dc2626;
  --fonte: 'Segoe UI', Arial, sans-serif;
}

* { box-sizing: border-box; }

body { margin: 0; font-family: var(--fonte); background: var(--bg); color: var(--texto); }

.tela-login { height: 100vh; display: flex; align-items: center; justify-content: center; }

.tela-login form {
  background: var(--bg-elevado);
  border: 1px solid var(--borda);
  border-radius: 12px;
  padding: 2rem;
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.tela-login__logo { height: 40px; align-self: center; }
.tela-login input, .tela-login button { padding: 0.6rem; border-radius: 8px; border: 1px solid var(--borda); font-size: 1rem; }
.tela-login button { background: var(--acento); color: #fff; border: none; cursor: pointer; }
.mensagem-erro { color: var(--erro); font-size: 0.85rem; min-height: 1em; }
.mensagem-status { color: var(--texto-sub); font-size: 0.85rem; }

.tela-config { display: grid; grid-template-columns: 380px 1fr; height: 100vh; }

.painel-controles { overflow-y: auto; padding: 1.5rem; border-right: 1px solid var(--borda); background: var(--bg-elevado); }

.campo { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.3rem; }
.campo select, .campo input { padding: 0.4rem; border-radius: 6px; border: 1px solid var(--borda); }

.campo-slide { border: 1px solid var(--borda); border-radius: 8px; padding: 0.8rem; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.campo-slide label { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.85rem; }
.campo-slide input, .campo-slide select { padding: 0.35rem; border-radius: 6px; border: 1px solid var(--borda); }

#botaoSalvar { width: 100%; padding: 0.7rem; background: var(--acento); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; }

.preview { padding: 1.5rem; display: flex; flex-direction: column; }
.preview iframe { flex: 1; border: 1px solid var(--borda); border-radius: 12px; margin-top: 1rem; }
```

- [ ] **Step 3: Criar `dev/dev.js`**

```javascript
var SESSAO = { usuario: '', senha: '' };
var CONFIG_ATUAL = null;

document.getElementById('formLogin').addEventListener('submit', function (evento) {
  evento.preventDefault();
  var usuario = document.getElementById('campoUsuario').value.trim();
  var senha = document.getElementById('campoSenha').value;
  fetch(APPS_SCRIPT_URL + '?action=login&usuario=' + encodeURIComponent(usuario) + '&senha=' + encodeURIComponent(senha))
    .then(function (resposta) { return resposta.json(); })
    .then(function (dados) {
      if (dados.ok) {
        SESSAO.usuario = usuario;
        SESSAO.senha = senha;
        document.getElementById('telaLogin').hidden = true;
        document.getElementById('telaConfig').hidden = false;
        carregarConfig();
      } else {
        document.getElementById('mensagemLogin').textContent = dados.erro || 'Credenciais inválidas';
      }
    })
    .catch(function () {
      document.getElementById('mensagemLogin').textContent = 'Falha ao conectar com o servidor';
    });
});

function carregarConfig() {
  fetch(APPS_SCRIPT_URL + '?action=config')
    .then(function (resposta) { return resposta.json(); })
    .then(function (dados) {
      CONFIG_ATUAL = dados.ok ? dados.config : configPadrao();
      preencherFormulario(CONFIG_ATUAL);
    });
}

function preencherFormulario(config) {
  document.getElementById('campoTema').value = config.tema;
  document.getElementById('campoQtdLista').value = config.qtdLista;

  var seletorFixado = document.getElementById('campoFixado');
  seletorFixado.innerHTML = '<option value="">Rodízio normal</option>';
  config.slides.forEach(function (slide) {
    var opcao = document.createElement('option');
    opcao.value = slide.setor + '|' + slide.periodo;
    opcao.textContent = slide.setor + ' - ' + slide.periodo;
    seletorFixado.appendChild(opcao);
  });
  seletorFixado.value = config.fixado ? config.fixado.setor + '|' + config.fixado.periodo : '';

  var container = document.getElementById('listaSlides');
  container.innerHTML = '';
  config.slides.forEach(function (slide, indice) {
    var bloco = document.createElement('fieldset');
    bloco.className = 'campo-slide';
    bloco.innerHTML =
      '<legend>' + slide.setor + ' — ' + slide.periodo + '</legend>' +
      '<label><input type="checkbox" data-indice="' + indice + '" data-campo="ativo" ' + (slide.ativo ? 'checked' : '') + ' /> Ativo</label>' +
      '<label>Duração (segundos) <input type="number" min="1" data-indice="' + indice + '" data-campo="duracaoSegundos" value="' + slide.duracaoSegundos + '" /></label>' +
      '<label>Linha inicial <input type="number" min="1" data-indice="' + indice + '" data-campo="linhaInicial" value="' + slide.linhaInicial + '" /></label>' +
      '<label>Coluna Nome <input type="text" data-indice="' + indice + '" data-campo="colunas.nome" value="' + slide.colunas.nome + '" /></label>' +
      '<label>Coluna Aproveitamento <input type="text" data-indice="' + indice + '" data-campo="colunas.aproveitamento" value="' + slide.colunas.aproveitamento + '" /></label>' +
      '<label>Coluna Vendas Imediato <input type="text" data-indice="' + indice + '" data-campo="colunas.vendasImediato" value="' + slide.colunas.vendasImediato + '" /></label>' +
      '<label>Coluna Contratos <input type="text" data-indice="' + indice + '" data-campo="colunas.contratos" value="' + slide.colunas.contratos + '" /></label>' +
      '<label>Ordenar por' +
        '<select data-indice="' + indice + '" data-campo="ordenarPor">' +
          '<option value="aproveitamento"' + (slide.ordenarPor === 'aproveitamento' ? ' selected' : '') + '>Aproveitamento (%)</option>' +
          '<option value="vendasImediato"' + (slide.ordenarPor === 'vendasImediato' ? ' selected' : '') + '>Vendas Imediato</option>' +
          '<option value="contratos"' + (slide.ordenarPor === 'contratos' ? ' selected' : '') + '>Contratos</option>' +
          '<option value="nome"' + (slide.ordenarPor === 'nome' ? ' selected' : '') + '>Nome</option>' +
        '</select>' +
      '</label>' +
      '<label>Direção' +
        '<select data-indice="' + indice + '" data-campo="direcao">' +
          '<option value="desc"' + (slide.direcao === 'desc' ? ' selected' : '') + '>Maior primeiro</option>' +
          '<option value="asc"' + (slide.direcao === 'asc' ? ' selected' : '') + '>Menor primeiro</option>' +
        '</select>' +
      '</label>';
    container.appendChild(bloco);
  });
}

function lerFormularioParaConfig() {
  var config = JSON.parse(JSON.stringify(CONFIG_ATUAL));
  config.tema = document.getElementById('campoTema').value;
  config.qtdLista = Number(document.getElementById('campoQtdLista').value);

  var fixadoValor = document.getElementById('campoFixado').value;
  config.fixado = fixadoValor ? { setor: fixadoValor.split('|')[0], periodo: fixadoValor.split('|')[1] } : null;

  document.querySelectorAll('#listaSlides [data-indice]').forEach(function (campo) {
    var indice = Number(campo.getAttribute('data-indice'));
    var nomeCampo = campo.getAttribute('data-campo');
    var slide = config.slides[indice];
    var valor;
    if (campo.type === 'checkbox') {
      valor = campo.checked;
    } else if (campo.type === 'number') {
      valor = Number(campo.value);
    } else {
      valor = campo.value;
    }
    if (nomeCampo.indexOf('colunas.') === 0) {
      slide.colunas[nomeCampo.split('.')[1]] = valor;
    } else {
      slide[nomeCampo] = valor;
    }
  });

  return config;
}

document.getElementById('botaoSalvar').addEventListener('click', function () {
  var config = lerFormularioParaConfig();
  var validacao = validarConfig(config);
  var mensagem = document.getElementById('mensagemSalvar');
  if (!validacao.valido) {
    mensagem.textContent = 'Erro: ' + validacao.erros.join('; ');
    return;
  }
  mensagem.textContent = 'Salvando...';
  fetch(
    APPS_SCRIPT_URL +
      '?action=salvarconfig' +
      '&usuario=' + encodeURIComponent(SESSAO.usuario) +
      '&senha=' + encodeURIComponent(SESSAO.senha) +
      '&config=' + encodeURIComponent(JSON.stringify(config))
  )
    .then(function (resposta) { return resposta.json(); })
    .then(function (dados) {
      if (dados.ok) {
        CONFIG_ATUAL = config;
        mensagem.textContent = 'Configuração salva. As TVs atualizam em até 15 segundos.';
      } else {
        mensagem.textContent = 'Erro ao salvar: ' + dados.erro;
      }
    })
    .catch(function () {
      mensagem.textContent = 'Falha ao conectar com o servidor';
    });
});
```

- [ ] **Step 4: Verificar no navegador (manual)**

Abrir `dev/dev.html` localmente, logar com o usuário DEV cadastrado na Task 9, confirmar que o formulário carrega os 4 slides. Desativar o slide "mes", salvar, e confirmar que o iframe de preview (que carrega `tv/tv.html`) para de exibir o mês dentro de ~15s. Reativar depois.

- [ ] **Step 5: Commit**

```bash
git add dev/
git commit -m "feat: painel dev com login, editor de config e preview ao vivo"
```

---

### Task 14: Hospedagem no GitHub Pages e instruções de TV (Samsung Tizen)

**Files:**
- Create: `README.md`
- Create: `index.html` (redirect simples para `tv/tv.html`)

- [ ] **Step 1: Criar `index.html` na raiz**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; url=tv/tv.html" />
  <title>Dashboard Comercial AMO</title>
</head>
<body></body>
</html>
```

- [ ] **Step 2: Escrever `README.md`**

```markdown
# Dashboard TV - Comercial

Painel de ranking (Vendas) para as 3 TVs do setor Comercial da AMO, com dados
lidos em tempo real de uma planilha do Google Sheets via Google Apps Script.

## Estrutura

- `tv/` — tela que roda nas 3 TVs (`tv.html`).
- `dev/` — painel de configuração, só para o desenvolvedor (`dev.html`).
- `shared/` — lógica compartilhada entre as duas telas e o Apps Script.
- `apps-script/` — cópia do que deve estar colado no editor do Google Apps Script.

## Rodar os testes

\`\`\`bash
npm test
\`\`\`

## Publicar no GitHub Pages

1. Criar um repositório no GitHub e enviar este projeto (`git push`).
2. Nas configurações do repositório → Pages → Source: branch `main`, pasta `/ (root)`.
3. A URL pública fica em `https://SEU_USUARIO.github.io/NOME_DO_REPO/`.
   - TV: `.../tv/tv.html`
   - DEV: `.../dev/dev.html` (nunca abrir nas TVs)

## Colocar para rodar nas 3 TVs (Samsung Smart TV, sem PC)

1. Na TV, abrir a **Samsung Apps Store** e instalar um app gratuito de
   "kiosk browser" / "signage browser" (existem várias opções gratuitas na
   loja da própria TV).
2. Configurar nele a URL pública do GitHub Pages (`.../tv/tv.html`).
3. Ativar, dentro do app: iniciar automaticamente ao ligar a TV e recarregar
   a página periodicamente (ex.: a cada algumas horas, como proteção contra
   qualquer instabilidade de rede).
4. Nas configurações da própria TV (Tizen):
   - Geral → Modo Ambiente: desligado.
   - Geral → Gerenciamento de Energia: desligar qualquer "modo economia"
     que apague a tela por inatividade.
   - Suporte → Atualização de Software: evitar updates automáticos durante
     o horário comercial, para não interromper a exibição.
5. Repetir a configuração nas outras 2 TVs, todas apontando para a mesma
   URL — como o rodízio é sincronizado pelo Apps Script, as 3 ficam
   idênticas automaticamente.

## Acessar o modo DEV

Abrir `.../dev/dev.html` **somente no seu computador**, nunca nas TVs.
Login com o usuário/senha cadastrados na aba `CREDENCIAIS DEV` da planilha.
```

- [ ] **Step 3: Publicar (ação com confirmação do usuário)**

Confirmar com o usuário antes de criar o repositório remoto e fazer push — isso publica o código fora da máquina local. Depois de confirmado:

```bash
git add index.html README.md
git commit -m "docs: instrucoes de deploy e configuracao das tvs"
```

Criar o repositório no GitHub (`gh repo create` ou pela interface), adicionar o remoto e dar push, então habilitar GitHub Pages nas configurações do repositório.

---

## Self-Review

**Cobertura da spec:** Arquitetura (Tasks 1, 9–14), leitura da planilha (Tasks 4, 10), fotos via Drive (Tasks 3, 6, 10), config em tempo real (Tasks 7, 9, 13), rodízio sincronizado (Tasks 8, 12), modo DEV oculto (Task 13), hospedagem + TV remota (Task 14). Qualificação fica documentada como fora de escopo (Global Constraints).

**Placeholders:** o único texto substituível é o valor da URL em `shared/apiConfig.js` (Task 11) — dado específico do deploy de cada usuário, preenchido em um passo manual explícito, não uma lacuna de código.

**Consistência de tipos:** `parseNumberValue`/`toPercentNumber` (Task 2) → usados em `ranking.js` (Task 4). `extrairDriveId`/`buildDriveImageUrl` (Task 3) → usados em `ranking.js` (Task 6) e no Apps Script (Task 10, via `Drive.gs`). `montarPessoasDeValores`, `montarRanking`, `dividirPodioEResto`, `montarMapaFotos`, `anexarFotos` (Tasks 4–6) → usados em `acaoRanking` no Apps Script (Task 10) com os mesmos nomes e assinaturas. `configPadrao`/`validarConfig` (Task 7) → usados em `Code.gs` (Task 9) e `dev.js` (Task 13). `resolverSlideExibido`/`proximoIndiceSlide`/`obterSlidesAtivos` (Task 8) → usados em `tv.js` (Task 12). A resposta de `acaoRanking` (`podio`/`resto`, Task 10) casa exatamente com o que `tv.js` espera renderizar (Task 12).
