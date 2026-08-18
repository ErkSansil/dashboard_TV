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
