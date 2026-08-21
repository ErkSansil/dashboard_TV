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
  const periodos = config.slides.filter((s) => s.setor === 'vendas').map((s) => s.periodo);
  assert.deepEqual(periodos, ['dia', 'semana', 'mes', 'ano']);
});

test('configPadrao tem 1 slide de metas do dia, inativo por padrão', () => {
  const config = configPadrao();
  const metas = config.slides.filter((s) => s.setor === 'metas');
  assert.equal(metas.length, 1);
  assert.equal(metas[0].periodo, 'dia');
  assert.equal(metas[0].ativo, false);
  assert.equal(metas[0].quantidadeCards, 6);
  assert.equal(metas[0].meta.ativo, true);
  assert.deepEqual(metas[0].meta.condicoes[0], { metrica: 'contratos', valorMinimo: 5 });
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

test('configPadrao vem com as 3 métricas visíveis por padrão em cada slide de vendas', () => {
  const config = configPadrao();
  config.slides.filter((s) => s.setor === 'vendas').forEach((slide) => {
    assert.deepEqual(slide.metricasVisiveis, ['aproveitamento', 'vendasImediato', 'contratos']);
  });
});

test('validarConfig aceita apenas 1 métrica visível num slide', () => {
  const config = configPadrao();
  config.slides[0].metricasVisiveis = ['aproveitamento'];
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, true);
});

test('validarConfig rejeita metricasVisiveis vazio num slide', () => {
  const config = configPadrao();
  config.slides[0].metricasVisiveis = [];
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('metricasVisiveis')));
});

test('validarConfig rejeita métrica desconhecida em metricasVisiveis de um slide', () => {
  const config = configPadrao();
  config.slides[0].metricasVisiveis = ['aproveitamento', 'campo-fantasma'];
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('metricasVisiveis')));
});

test('validarConfig permite metricasVisiveis diferentes entre slides', () => {
  const config = configPadrao();
  config.slides[0].metricasVisiveis = ['aproveitamento'];
  config.slides[1].metricasVisiveis = ['contratos', 'vendasImediato'];
  assert.equal(validarConfig(config).valido, true);
  assert.notDeepEqual(config.slides[0].metricasVisiveis, config.slides[1].metricasVisiveis);
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
  config.slides[0].metricasVisiveis = ['aproveitamento', 'extra1', 'extra2'];
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

test('configPadrao vem com duracaoFadeSegundos 0.6 por padrão', () => {
  const config = configPadrao();
  assert.equal(config.duracaoFadeSegundos, 0.6);
});

test('validarConfig aceita duracaoFadeSegundos igual a 0 (sem fade)', () => {
  const config = configPadrao();
  config.duracaoFadeSegundos = 0;
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, true);
});

test('validarConfig rejeita duracaoFadeSegundos negativa', () => {
  const config = configPadrao();
  config.duracaoFadeSegundos = -1;
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('duracaoFadeSegundos')));
});

test('configPadrao vem com escalaLista 100 e nomesExcluidos vazio', () => {
  const config = configPadrao();
  assert.equal(config.escalaLista, 100);
  assert.deepEqual(config.nomesExcluidos, []);
});

test('validarConfig rejeita escalaLista zero ou negativa', () => {
  const config = configPadrao();
  config.escalaLista = 0;
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('escalaLista')));
});

test('validarConfig aceita nomesExcluidos preenchido', () => {
  const config = configPadrao();
  config.nomesExcluidos = ['Miranda', 'Não enviar Fila'];
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, true);
});

test('validarConfig rejeita nomesExcluidos que não seja uma lista', () => {
  const config = configPadrao();
  config.nomesExcluidos = 'Miranda';
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('nomesExcluidos')));
});

test('configPadrao vem com alturaPodioVh 34 por padrão', () => {
  const config = configPadrao();
  assert.equal(config.alturaPodioVh, 34);
});

test('validarConfig rejeita alturaPodioVh fora do intervalo 0-100', () => {
  const config = configPadrao();
  config.alturaPodioVh = 0;
  assert.equal(validarConfig(config).valido, false);
  config.alturaPodioVh = 100;
  assert.equal(validarConfig(config).valido, false);
  config.alturaPodioVh = 150;
  assert.equal(validarConfig(config).valido, false);
});

test('configPadrao vem com fundoAnimado true, fundoBlur 10 e fundoBrilho fosco', () => {
  const config = configPadrao();
  assert.equal(config.fundoAnimado, true);
  assert.equal(config.fundoBlur, 10);
  assert.equal(config.fundoBrilho, 'fosco');
});

test('validarConfig aceita todos os temas de fundo personalizados', () => {
  const config = configPadrao();
  ['escuro', 'claro', 'amo', 'aurora', 'sunset', 'oceano', 'platina', 'fogo', 'meianoite'].forEach((tema) => {
    config.tema = tema;
    assert.equal(validarConfig(config).valido, true, tema);
  });
});

test('validarConfig rejeita fundoAnimado que não seja booleano', () => {
  const config = configPadrao();
  config.fundoAnimado = 'sim';
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('fundoAnimado')));
});

test('validarConfig rejeita fundoBlur negativo', () => {
  const config = configPadrao();
  config.fundoBlur = -1;
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('fundoBlur')));
});

test('validarConfig aceita fundoBlur igual a 0 (sem desfoque)', () => {
  const config = configPadrao();
  config.fundoBlur = 0;
  assert.equal(validarConfig(config).valido, true);
});

test('validarConfig rejeita fundoBrilho desconhecido', () => {
  const config = configPadrao();
  config.fundoBrilho = 'metalico';
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('fundoBrilho')));
});

test('validarConfig aceita fundoBrilho brilhante', () => {
  const config = configPadrao();
  config.fundoBrilho = 'brilhante';
  assert.equal(validarConfig(config).valido, true);
});

test('configPadrao vem com fixarAtePosicao 0 (desligada) e requisitoPodio inativo com 3 condicoes em cada slide de vendas', () => {
  const config = configPadrao();
  assert.equal(config.fixarAtePosicao, 0);
  config.slides.filter((s) => s.setor === 'vendas').forEach((slide) => {
    assert.equal(slide.requisitoPodio.ativo, false);
    assert.equal(slide.requisitoPodio.condicoes.length, 3);
    assert.deepEqual(slide.requisitoPodio.condicoes[0], { metrica: 'aproveitamento', valorMinimo: 60 });
    assert.equal(slide.requisitoPodio.condicoes[1].ativo, false);
    assert.equal(slide.requisitoPodio.condicoes[2].ativo, false);
  });
});

test('configPadrao permite requisitos diferentes por período (dia vs semana)', () => {
  const config = configPadrao();
  const dia = config.slides.find((s) => s.periodo === 'dia');
  const semana = config.slides.find((s) => s.periodo === 'semana');
  dia.requisitoPodio.ativo = true;
  dia.requisitoPodio.condicoes[0] = { metrica: 'vendasImediato', valorMinimo: 2 };
  semana.requisitoPodio.ativo = true;
  semana.requisitoPodio.condicoes[0] = { metrica: 'vendasImediato', valorMinimo: 20 };
  assert.equal(validarConfig(config).valido, true);
  assert.notDeepEqual(dia.requisitoPodio, semana.requisitoPodio);
});

test('validarConfig rejeita fixarAtePosicao negativa ou que não seja número', () => {
  const config = configPadrao();
  config.fixarAtePosicao = -1;
  assert.equal(validarConfig(config).valido, false);
  config.fixarAtePosicao = '4';
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('fixarAtePosicao')));
});

test('validarConfig aceita fixarAtePosicao maior que 0', () => {
  const config = configPadrao();
  config.fixarAtePosicao = 5;
  assert.equal(validarConfig(config).valido, true);
});

test('configPadrao vem com requisitoRanking inativo e condicao 1 com valorMinimo 0 em cada slide de vendas', () => {
  const config = configPadrao();
  config.slides.filter((s) => s.setor === 'vendas').forEach((slide) => {
    assert.equal(slide.requisitoRanking.ativo, false);
    assert.deepEqual(slide.requisitoRanking.condicoes[0], { metrica: 'aproveitamento', valorMinimo: 0 });
  });
});

test('validarConfig aceita requisitoRanking ativo com as 3 condicoes válidas', () => {
  const config = configPadrao();
  config.slides[0].requisitoRanking.ativo = true;
  config.slides[0].requisitoRanking.condicoes[0] = { metrica: 'aproveitamento', valorMinimo: 30 };
  assert.equal(validarConfig(config).valido, true);
});

test('validarConfig rejeita requisitoRanking ausente em um slide', () => {
  const config = configPadrao();
  delete config.slides[0].requisitoRanking;
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('slides[0].requisitoRanking')));
});

test('validarConfig rejeita condicao com metrica desconhecida', () => {
  const config = configPadrao();
  config.slides[0].requisitoRanking.condicoes[0].metrica = 'campo-fantasma';
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('slides[0].requisitoRanking.condicoes[0].metrica')));
});

test('validarConfig aceita requisitoPodio ativo com condicao extra ligada', () => {
  const config = configPadrao();
  config.slides[0].requisitoPodio.ativo = true;
  config.slides[0].requisitoPodio.condicoes[1] = { ativo: true, metrica: 'contratos', valorMinimo: 3 };
  assert.equal(validarConfig(config).valido, true);
});

test('validarConfig rejeita requisitoPodio ausente em um slide', () => {
  const config = configPadrao();
  delete config.slides[0].requisitoPodio;
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('slides[0].requisitoPodio')));
});

test('validarConfig rejeita requisitoPodio sem exatamente 3 condicoes', () => {
  const config = configPadrao();
  config.slides[0].requisitoPodio.condicoes = [{ metrica: 'aproveitamento', valorMinimo: 60 }];
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('slides[0].requisitoPodio.condicoes')));
});

test('validarConfig rejeita condicao extra sem "ativo" booleano', () => {
  const config = configPadrao();
  config.slides[0].requisitoPodio.condicoes[1] = { metrica: 'contratos', valorMinimo: 3 };
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('slides[0].requisitoPodio.condicoes[1].ativo')));
});

test('validarConfig rejeita condicao com valorMinimo que não seja número', () => {
  const config = configPadrao();
  config.slides[0].requisitoPodio.condicoes[0].valorMinimo = '60';
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('slides[0].requisitoPodio.condicoes[0].valorMinimo')));
});

test('validarConfig rejeita slide de metas sem quantidadeCards válido', () => {
  const config = configPadrao();
  const metas = config.slides.find((s) => s.setor === 'metas');
  metas.quantidadeCards = 0;
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('quantidadeCards')));
});

test('validarConfig rejeita slide de metas sem meta válida', () => {
  const config = configPadrao();
  const metas = config.slides.find((s) => s.setor === 'metas');
  delete metas.meta;
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('.meta')));
});

test('validarConfig não exige requisitoPodio/requisitoRanking no slide de metas', () => {
  const config = configPadrao();
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, true);
});

test('validarConfig aceita temaProprio vazio (usa o global) em qualquer slide', () => {
  const config = configPadrao();
  assert.equal(config.slides[0].temaProprio, '');
  assert.equal(validarConfig(config).valido, true);
});

test('validarConfig aceita temaProprio com um tema válido', () => {
  const config = configPadrao();
  config.slides[0].temaProprio = 'amo';
  assert.equal(validarConfig(config).valido, true);
});

test('validarConfig rejeita temaProprio com tema desconhecido', () => {
  const config = configPadrao();
  config.slides[0].temaProprio = 'neon';
  const resultado = validarConfig(config);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.includes('temaProprio')));
});
