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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeVendaRow: normalizeVendaRow,
    montarPessoasDeValores: montarPessoasDeValores
  };
}
