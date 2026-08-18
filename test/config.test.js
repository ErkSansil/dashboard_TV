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

test('validarConfig aceita o tema "amo"', () => {
  const config = configPadrao();
  config.tema = 'amo';
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, true);
});

test('validarConfig rejeita tema desconhecido', () => {
  const config = configPadrao();
  config.tema = 'neon';
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('tema')));
});
