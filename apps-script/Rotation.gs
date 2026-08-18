// shared/rotation.js
function obterSlidesAtivos(config) {
  return (config.slides || []).filter(function (slide) {
    return slide.ativo;
  });
}

function proximoIndiceSlide(indiceAtual, totalSlides) {
  if (!totalSlides || totalSlides <= 0) return 0;
  return (indiceAtual + 1) % totalSlides;
}

function resolverSlideExibido(config, indiceAtual) {
  if (config.fixado) {
    var slidesFixaveis = config.slides || [];
    for (var i = 0; i < slidesFixaveis.length; i++) {
      var slide = slidesFixaveis[i];
      if (slide.setor === config.fixado.setor && slide.periodo === config.fixado.periodo) {
        return slide;
      }
    }
  }
  var ativos = obterSlidesAtivos(config);
  if (ativos.length === 0) return null;
  var indice = ((indiceAtual % ativos.length) + ativos.length) % ativos.length;
  return ativos[indice];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    obterSlidesAtivos: obterSlidesAtivos,
    proximoIndiceSlide: proximoIndiceSlide,
    resolverSlideExibido: resolverSlideExibido
  };
}
