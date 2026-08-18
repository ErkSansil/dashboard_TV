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

test('configPadrao vem com as 3 métricas visíveis por padrão', () => {
  const config = configPadrao();
  assert.deepEqual(config.metricasVisiveis, ['aproveitamento', 'vendasImediato', 'contratos']);
});

test('validarConfig aceita apenas 1 métrica visível', () => {
  const config = configPadrao();
  config.metricasVisiveis = ['aproveitamento'];
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, true);
});

test('validarConfig rejeita metricasVisiveis vazio', () => {
  const config = configPadrao();
  config.metricasVisiveis = [];
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('metricasVisiveis')));
});

test('validarConfig rejeita métrica desconhecida em metricasVisiveis', () => {
  const config = configPadrao();
  config.metricasVisiveis = ['aproveitamento', 'campo-fantasma'];
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('metricasVisiveis')));
});

test('configPadrao já reserva colunas extra1/extra2 para dia, semana e mes', () => {
  const config = configPadrao();
  const [dia, semana, mes] = config.slides;
  assert.deepEqual([dia.colunas.extra1, dia.colunas.extra2], ['I', 'J']);
  assert.deepEqual([semana.colunas.extra1, semana.colunas.extra2], ['T', 'U']);
  assert.deepEqual([mes.colunas.extra1, mes.colunas.extra2], ['AE', 'AF']);
});

test('configPadrao vem com rótulos de extra vazios (ainda não usados)', () => {
  const config = configPadrao();
  assert.equal(config.rotuloExtra1, '');
  assert.equal(config.rotuloExtra2, '');
});

test('validarConfig aceita extra1/extra2 em metricasVisiveis', () => {
  const config = configPadrao();
  config.metricasVisiveis = ['aproveitamento', 'extra1', 'extra2'];
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, true);
});

test('configPadrao vem com modoTroca "tempo" e voltasScroll 1 por padrão', () => {
  const config = configPadrao();
  config.slides.forEach((slide) => {
    assert.equal(slide.modoTroca, 'tempo');
    assert.equal(slide.voltasScroll, 1);
  });
});

test('validarConfig aceita modoTroca "scroll"', () => {
  const config = configPadrao();
  config.slides[0].modoTroca = 'scroll';
  config.slides[0].voltasScroll = 0;
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, true);
});

test('validarConfig rejeita modoTroca desconhecido', () => {
  const config = configPadrao();
  config.slides[0].modoTroca = 'nunca';
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('modoTroca')));
});

test('validarConfig rejeita voltasScroll negativo', () => {
  const config = configPadrao();
  config.slides[0].voltasScroll = -1;
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('voltasScroll')));
});

test('configPadrao vem com velocidadeScroll 22 por padrão', () => {
  const config = configPadrao();
  assert.equal(config.velocidadeScroll, 22);
});

test('validarConfig rejeita velocidadeScroll zero ou negativa', () => {
  const config = configPadrao();
  config.velocidadeScroll = 0;
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('velocidadeScroll')));
});
