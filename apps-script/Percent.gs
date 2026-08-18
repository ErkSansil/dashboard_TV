function parseNumberValue(raw) {
  if (typeof raw === 'number') {
    return raw;
  }
  if (typeof raw === 'string') {
    var limpo = raw.replace('%', '').trim().replace(',', '.');
    var numero = parseFloat(limpo);
    return isNaN(numero) ? 0 : numero;
  }
  return 0;
}

function toPercentNumber(raw) {
  var valor = parseNumberValue(raw);
  var percentual = valor <= 1 ? valor * 100 : valor;
  return Math.round(percentual * 100) / 100;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseNumberValue: parseNumberValue, toPercentNumber: toPercentNumber };
}
