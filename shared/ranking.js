if (typeof require !== 'undefined' && typeof toPercentNumber === 'undefined') {
  var _percent = require('./percent.js');
  var toPercentNumber = _percent.toPercentNumber;
  var parseNumberValue = _percent.parseNumberValue;
}

function normalizeVendaRow(nome, aproveitamentoRaw, vendasImediatoRaw, contratosRaw) {
  return {
    nome: String(nome).trim(),
    aproveitamento: toPercentNumber(aproveitamentoRaw),
    vendasImediato: parseNumberValue(vendasImediatoRaw),
    contratos: parseNumberValue(contratosRaw)
  };
}

function montarPessoasDeValores(valoresLinhas) {
  var pessoas = [];
  for (var i = 0; i < valoresLinhas.length; i++) {
    var linha = valoresLinhas[i];
    var nome = linha[0];
    if (!nome || String(nome).trim() === '') continue;
    pessoas.push(normalizeVendaRow(nome, linha[1], linha[2], linha[3]));
  }
  return pessoas;
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

function dividirPodioEResto(ranking, qtdLista) {
  var limite = typeof qtdLista === 'number' ? qtdLista : 7;
  return {
    podio: ranking.slice(0, 3),
    resto: ranking.slice(3, 3 + limite)
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeVendaRow: normalizeVendaRow,
    montarPessoasDeValores: montarPessoasDeValores,
    sortRanking: sortRanking,
    buildRankingComPosicoes: buildRankingComPosicoes,
    montarRanking: montarRanking,
    dividirPodioEResto: dividirPodioEResto
  };
}
