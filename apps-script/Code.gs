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
