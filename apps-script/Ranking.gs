if (typeof require !== 'undefined' && typeof toPercentNumber === 'undefined') {
  var _percent = require('./percent.js');
  var toPercentNumber = _percent.toPercentNumber;
  var parseNumberValue = _percent.parseNumberValue;
}

if (typeof require !== 'undefined' && typeof buildDriveImageUrl === 'undefined') {
  var _drive = require('./drive.js');
  var buildDriveImageUrl = _drive.buildDriveImageUrl;
}

function valorExtraOuNulo(valorBruto) {
  if (valorBruto === undefined || valorBruto === null || valorBruto === '') return null;
  return parseNumberValue(valorBruto);
}

function normalizeVendaRow(nome, aproveitamentoRaw, vendasImediatoRaw, contratosRaw, extra1Raw, extra2Raw) {
  return {
    nome: String(nome).trim(),
    aproveitamento: toPercentNumber(aproveitamentoRaw),
    vendasImediato: parseNumberValue(vendasImediatoRaw),
    contratos: parseNumberValue(contratosRaw),
    extra1: valorExtraOuNulo(extra1Raw),
    extra2: valorExtraOuNulo(extra2Raw)
  };
}

function montarPessoasDeValores(valoresLinhas) {
  var pessoas = [];
  for (var i = 0; i < valoresLinhas.length; i++) {
    var linha = valoresLinhas[i];
    var nome = linha[0];
    if (!nome || String(nome).trim() === '') continue;
    pessoas.push(normalizeVendaRow(nome, linha[1], linha[2], linha[3], linha[4], linha[5]));
  }
  return pessoas;
}

function filtrarNomesExcluidos(pessoas, nomesExcluidos) {
  if (!nomesExcluidos || nomesExcluidos.length === 0) return pessoas;
  var excluidos = nomesExcluidos.map(function (nome) { return normalizarChaveNome(nome); });
  return pessoas.filter(function (pessoa) {
    return excluidos.indexOf(normalizarChaveNome(pessoa.nome)) === -1;
  });
}

function filtrarPorRequisitoRanking(pessoas, requisitoRanking) {
  return pessoas.filter(function (pessoa) {
    return pessoaAtendeRequisito(pessoa, requisitoRanking);
  });
}

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

function condicaoAtendida(pessoa, condicao) {
  var valor = pessoa[condicao.metrica];
  if (valor === null || valor === undefined) return false;
  return valor >= condicao.valorMinimo;
}

function pessoaAtendeRequisito(pessoa, requisito) {
  if (!requisito || !requisito.ativo) return true;
  var condicoes = requisito.condicoes || [];
  for (var i = 0; i < condicoes.length; i++) {
    var condicao = condicoes[i];
    if (i > 0 && !condicao.ativo) continue;
    if (!condicaoAtendida(pessoa, condicao)) return false;
  }
  return true;
}

function dividirPodioEResto(ranking, qtdLista, requisitoPodio) {
  var limite = typeof qtdLista === 'number' ? qtdLista : 7;
  var podio = [];
  var resto = [];
  for (var i = 0; i < ranking.length; i++) {
    var pessoa = ranking[i];
    if (podio.length < 3 && pessoaAtendeRequisito(pessoa, requisitoPodio)) {
      podio.push(pessoa);
    } else {
      resto.push(pessoa);
    }
  }
  var reordenado = podio.concat(resto).map(function (pessoa, indice) {
    var copia = {};
    for (var chave in pessoa) copia[chave] = pessoa[chave];
    copia.posicao = indice + 1;
    return copia;
  });
  return {
    podio: reordenado.slice(0, podio.length),
    resto: reordenado.slice(podio.length, podio.length + limite)
  };
}

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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeVendaRow: normalizeVendaRow,
    montarPessoasDeValores: montarPessoasDeValores,
    filtrarNomesExcluidos: filtrarNomesExcluidos,
    filtrarPorRequisitoRanking: filtrarPorRequisitoRanking,
    sortRanking: sortRanking,
    buildRankingComPosicoes: buildRankingComPosicoes,
    montarRanking: montarRanking,
    condicaoAtendida: condicaoAtendida,
    pessoaAtendeRequisito: pessoaAtendeRequisito,
    dividirPodioEResto: dividirPodioEResto,
    normalizarChaveNome: normalizarChaveNome,
    montarMapaFotos: montarMapaFotos,
    anexarFotos: anexarFotos
  };
}
