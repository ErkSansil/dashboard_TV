// apps-script/Code.gs
var ID_PLANILHA = '1vzWMswfTYTpHWsjM3SEGSqACsjwv4DPpSHX5RiaaEj0';
var ABA_VENDAS = 'VENDAS';
var ABA_EQUIPE = 'EQUIPE';
var ABA_CONFIG = 'CONFIG';
var ABA_CREDENCIAIS = 'CREDENCIAIS DEV';
var CELULA_CONFIG_JSON = 'B2';
var VERSAO_BACKEND = '2026-08-20-3';

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
  return { ok: true, config: lerConfigAtual(), versaoBackend: VERSAO_BACKEND };
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

function acaoRanking(setor, periodo) {
  var config = lerConfigAtual();
  var slide = encontrarSlide(config, setor, periodo);
  if (!slide) {
    return { ok: false, erro: 'Nenhum slide configurado para ' + setor + '/' + periodo };
  }
  var planilha = getPlanilha();
  var abaVendas = planilha.getSheetByName(ABA_VENDAS);
  var pessoas = lerRankingVendas(abaVendas, slide);
  pessoas = filtrarNomesExcluidos(pessoas, config.nomesExcluidos);
  pessoas = filtrarPorRequisitoRanking(pessoas, config.requisitoRanking);
  var ranking = montarRanking(pessoas, slide.ordenarPor, slide.direcao);
  var abaEquipe = planilha.getSheetByName(ABA_EQUIPE);
  var linhasEquipe = abaEquipe.getDataRange().getValues().slice(1);
  var mapaFotos = montarMapaFotos(linhasEquipe);
  var rankingComFotos = anexarFotos(ranking, mapaFotos);
  var dividido = dividirPodioEResto(rankingComFotos, config.qtdLista, config.requisitoPodio);
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

function ultimaColunaSlide(slide) {
  if (slide.colunas.extra2) return slide.colunas.extra2;
  if (slide.colunas.extra1) return slide.colunas.extra1;
  return slide.colunas.contratos;
}

function lerRankingVendas(aba, slide) {
  var ultimaLinha = aba.getLastRow();
  if (ultimaLinha < slide.linhaInicial) return [];
  var ultimaColuna = ultimaColunaSlide(slide);
  var intervalo = slide.colunas.nome + slide.linhaInicial + ':' + ultimaColuna + ultimaLinha;
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
