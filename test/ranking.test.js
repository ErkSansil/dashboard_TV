// test/ranking.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeVendaRow,
  montarPessoasDeValores,
  filtrarNomesExcluidos,
  sortRanking,
  buildRankingComPosicoes,
  montarRanking,
  dividirPodioEResto,
  normalizarChaveNome,
  montarMapaFotos,
  anexarFotos
} = require('../shared/ranking.js');

test('normalizeVendaRow converte e limpa os campos de uma linha', () => {
  const pessoa = normalizeVendaRow(' Alice ', 0.3333, 1, 2);
  assert.deepEqual(pessoa, { nome: 'Alice', aproveitamento: 33.33, vendasImediato: 1, contratos: 2, extra1: null, extra2: null });
});

test('normalizeVendaRow converte as colunas extras quando presentes', () => {
  const pessoa = normalizeVendaRow('Alice', 0.3333, 1, 2, 10, 5);
  assert.equal(pessoa.extra1, 10);
  assert.equal(pessoa.extra2, 5);
});

test('normalizeVendaRow trata coluna extra vazia como nula', () => {
  const pessoa = normalizeVendaRow('Alice', 0.3333, 1, 2, '', undefined);
  assert.equal(pessoa.extra1, null);
  assert.equal(pessoa.extra2, null);
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

test('montarPessoasDeValores lê as colunas extras quando a linha tem 6 valores', () => {
  const valores = [['Alice', 0.5, 3, 4, 12, 8]];
  const pessoas = montarPessoasDeValores(valores);
  assert.equal(pessoas[0].extra1, 12);
  assert.equal(pessoas[0].extra2, 8);
});

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

test('filtrarNomesExcluidos remove pessoas cujo nome está na lista de exclusão', () => {
  const pessoas = [{ nome: 'Alice' }, { nome: 'Miranda' }, { nome: 'Fernanda' }];
  const filtradas = filtrarNomesExcluidos(pessoas, ['Miranda']);
  assert.deepEqual(filtradas.map((p) => p.nome), ['Alice', 'Fernanda']);
});

test('filtrarNomesExcluidos ignora maiúsculas/espaços ao comparar', () => {
  const pessoas = [{ nome: ' miranda ' }, { nome: 'Alice' }];
  const filtradas = filtrarNomesExcluidos(pessoas, ['Miranda']);
  assert.deepEqual(filtradas.map((p) => p.nome), ['Alice']);
});

test('filtrarNomesExcluidos retorna a lista original quando não há exclusões', () => {
  const pessoas = [{ nome: 'Alice' }, { nome: 'Fernanda' }];
  assert.deepEqual(filtrarNomesExcluidos(pessoas, []), pessoas);
  assert.deepEqual(filtrarNomesExcluidos(pessoas, null), pessoas);
});
