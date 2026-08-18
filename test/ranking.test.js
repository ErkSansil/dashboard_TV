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
