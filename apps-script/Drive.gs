// shared/drive.js
function extrairDriveId(valor) {
  if (!valor) return '';
  var texto = String(valor).trim();
  var porCaminho = texto.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (porCaminho) return porCaminho[1];
  var porParametro = texto.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (porParametro) return porParametro[1];
  if (/^[a-zA-Z0-9_-]{15,}$/.test(texto)) return texto;
  return '';
}

function buildDriveImageUrl(valor, tamanho) {
  var id = extrairDriveId(valor);
  if (!id) return '';
  var largura = tamanho || 500;
  return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w' + largura;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extrairDriveId: extrairDriveId, buildDriveImageUrl: buildDriveImageUrl };
}
