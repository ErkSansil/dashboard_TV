var ESTADO = { config: null, indiceRotacao: 0, timerRotacao: null };

function iniciar() {
  atualizarConfig(function () {
    agendarRotacao();
  });
  setInterval(function () { atualizarConfig(function () {}); }, 15000);
}

function atualizarConfig(callback) {
  fetch(APPS_SCRIPT_URL + '?action=config')
    .then(function (resposta) { return resposta.json(); })
    .then(function (dados) {
      if (dados.ok) {
        ESTADO.config = dados.config;
        aplicarTema(ESTADO.config.tema);
      }
      callback();
    })
    .catch(function () { callback(); });
}

function agendarRotacao() {
  if (!ESTADO.config) {
    if (ESTADO.timerRotacao) clearTimeout(ESTADO.timerRotacao);
    ESTADO.timerRotacao = setTimeout(function () { agendarRotacao(); }, 1000);
    return;
  }
  mostrarSlideAtual();
  if (ESTADO.timerRotacao) clearTimeout(ESTADO.timerRotacao);
  var slideAtual = resolverSlideExibido(ESTADO.config, ESTADO.indiceRotacao);
  var duracaoMs = slideAtual ? slideAtual.duracaoSegundos * 1000 : 20000;
  ESTADO.timerRotacao = setTimeout(function () {
    ESTADO.indiceRotacao = proximoIndiceSlide(ESTADO.indiceRotacao, obterSlidesAtivos(ESTADO.config).length);
    agendarRotacao();
  }, duracaoMs);
}

function mostrarSlideAtual() {
  var slide = resolverSlideExibido(ESTADO.config, ESTADO.indiceRotacao);
  if (!slide) {
    renderizarVazio();
    return;
  }
  fetch(APPS_SCRIPT_URL + '?action=ranking&setor=' + slide.setor + '&periodo=' + slide.periodo)
    .then(function (resposta) { return resposta.json(); })
    .then(function (dados) {
      if (dados.ok) renderizar(slide, dados);
    });
}

function aplicarTema(tema) {
  document.body.classList.remove('tema-claro', 'tema-amo');
  if (tema === 'claro' || tema === 'amo') {
    document.body.classList.add('tema-' + tema);
  }
}

function renderizarVazio() {
  pararAutoScroll();
  document.getElementById('podio').innerHTML = '<p class="mensagem-vazia">Nenhum ranking configurado</p>';
  document.getElementById('lista').innerHTML = '';
}

function renderizar(slide, dados) {
  document.getElementById('rotuloSetor').textContent = slide.setor === 'vendas' ? 'Ranking Vendas' : 'Ranking Qualificação';
  var elPeriodo = document.getElementById('rotuloPeriodo');
  elPeriodo.textContent = nomePeriodo(slide.periodo);
  elPeriodo.className = 'cabecalho__periodo cabecalho__periodo--' + slide.periodo;
  document.getElementById('rotuloData').textContent = dados.rotulo || '';
  var metricas = metricasParaExibir(ESTADO.config);
  renderizarPodio(dados.podio, metricas, ESTADO.config);
  renderizarLista(dados.resto, metricas, ESTADO.config);
}

function nomePeriodo(periodo) {
  var nomes = { dia: 'Hoje', semana: 'Semana', mes: 'Mês', ano: 'Ano' };
  return nomes[periodo] || periodo;
}

function formatarPercentual(numero) {
  return numero.toFixed(2).replace('.', ',') + '%';
}

function formatarNumeroOuTraco(valor) {
  return valor === null || valor === undefined ? '—' : String(valor);
}

var METRICA_INFO = {
  aproveitamento: { rotulo: 'Aproveitamento', formatar: formatarPercentual },
  vendasImediato: { rotulo: 'Imediato', formatar: formatarNumeroOuTraco },
  contratos: { rotulo: 'Contratos', formatar: formatarNumeroOuTraco }
};

function infoMetrica(chave, config) {
  if (chave === 'extra1') {
    return { rotulo: (config && config.rotuloExtra1) || 'Extra 1', formatar: formatarNumeroOuTraco };
  }
  if (chave === 'extra2') {
    return { rotulo: (config && config.rotuloExtra2) || 'Extra 2', formatar: formatarNumeroOuTraco };
  }
  return METRICA_INFO[chave];
}

function metricasParaExibir(config) {
  var metricas = config && Array.isArray(config.metricasVisiveis) ? config.metricasVisiveis : null;
  return metricas && metricas.length > 0 ? metricas : ['aproveitamento'];
}

function renderizarPodio(podio, metricas, config) {
  var container = document.getElementById('podio');
  container.innerHTML = '';
  var principal = metricas[0];
  var secundarias = metricas.slice(1);
  [1, 0, 2].forEach(function (indice) {
    var pessoa = podio[indice];
    if (!pessoa) return;
    var item = document.createElement('div');
    item.className = 'podio__item podio__item--pos' + pessoa.posicao;
    var chips = secundarias.map(function (chave) {
      var info = infoMetrica(chave, config);
      return '<span class="podio__chip"><span class="podio__chip-rotulo">' + info.rotulo + '</span><span class="podio__chip-valor">' + info.formatar(pessoa[chave]) + '</span></span>';
    }).join('');
    item.innerHTML =
      '<div class="podio__foto" style="background-image:url(' + (pessoa.foto || '') + ')"></div>' +
      '<div class="podio__posicao">' + pessoa.posicao + 'º</div>' +
      '<div class="podio__nome">' + pessoa.nome + '</div>' +
      '<div class="podio__metrica">' + infoMetrica(principal, config).formatar(pessoa[principal]) + '</div>' +
      (chips ? '<div class="podio__secundarias">' + chips + '</div>' : '');
    container.appendChild(item);
  });
}

function renderizarLista(resto, metricas, config) {
  var container = document.getElementById('lista');
  container.innerHTML = '';
  resto.forEach(function (pessoa) {
    var linha = document.createElement('div');
    linha.className = 'lista__linha';
    var htmlMetricas = metricas.map(function (chave) {
      var info = infoMetrica(chave, config);
      return '<span class="lista__metrica"><span class="lista__metrica-rotulo">' + info.rotulo + '</span>' + info.formatar(pessoa[chave]) + '</span>';
    }).join('');
    linha.innerHTML =
      '<span class="lista__posicao">' + pessoa.posicao + 'º</span>' +
      '<span class="lista__foto" style="background-image:url(' + (pessoa.foto || '') + ')"></span>' +
      '<span class="lista__nome">' + pessoa.nome + '</span>' +
      '<span class="lista__metricas">' + htmlMetricas + '</span>';
    container.appendChild(linha);
  });
  iniciarAutoScroll(container);
}

var AUTOSCROLL = { frameId: null, timeoutId: null };

function pararAutoScroll() {
  if (AUTOSCROLL.frameId) {
    cancelAnimationFrame(AUTOSCROLL.frameId);
    AUTOSCROLL.frameId = null;
  }
  if (AUTOSCROLL.timeoutId) {
    clearTimeout(AUTOSCROLL.timeoutId);
    AUTOSCROLL.timeoutId = null;
  }
}

function suavizarAutoScroll(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function iniciarAutoScroll(container) {
  pararAutoScroll();
  var distancia = container.scrollHeight - container.clientHeight;
  if (distancia <= 4) {
    container.scrollTop = 0;
    return;
  }
  var pxPorSegundo = 22;
  var duracao = Math.max(4000, (distancia / pxPorSegundo) * 1000);
  var pausa = 2200;

  function animarCiclo(indoParaBaixo) {
    var inicio = null;
    function passo(agora) {
      if (inicio === null) inicio = agora;
      var progresso = Math.min(1, (agora - inicio) / duracao);
      var valor = suavizarAutoScroll(progresso);
      container.scrollTop = indoParaBaixo ? distancia * valor : distancia * (1 - valor);
      if (progresso < 1) {
        AUTOSCROLL.frameId = requestAnimationFrame(passo);
      } else {
        AUTOSCROLL.timeoutId = setTimeout(function () { animarCiclo(!indoParaBaixo); }, pausa);
      }
    }
    AUTOSCROLL.frameId = requestAnimationFrame(passo);
  }

  animarCiclo(true);
}

iniciar();
