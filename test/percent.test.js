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
