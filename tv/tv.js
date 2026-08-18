var ESTADO = { config: null, indiceRotacao: 0, timerRotacao: null, timerFade: null, primeiraExibicao: true };

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
        aplicarEscalaLista(ESTADO.config.escalaLista);
      }
      callback();
    })
    .catch(function () { callback(); });
}

function aplicarEscalaLista(escalaLista) {
  var valor = typeof escalaLista === 'number' && escalaLista > 0 ? escalaLista / 100 : 1;
  document.documentElement.style.setProperty('--lista-escala', String(valor));
}

function agendarRotacao() {
  if (!ESTADO.config) {
    if (ESTADO.timerRotacao) clearTimeout(ESTADO.timerRotacao);
    ESTADO.timerRotacao = setTimeout(function () { agendarRotacao(); }, 1000);
    return;
  }
  if (ESTADO.timerRotacao) clearTimeout(ESTADO.timerRotacao);
  var slideAtual = resolverSlideExibido(ESTADO.config, ESTADO.indiceRotacao);
  mostrarSlideAtual(slideAtual);
  if (!slideAtual || slideAtual.modoTroca !== 'scroll') {
    var duracaoMs = slideAtual ? slideAtual.duracaoSegundos * 1000 : 20000;
    ESTADO.timerRotacao = setTimeout(avancarSlide, duracaoMs);
  }
}

function avancarSlide() {
  ESTADO.indiceRotacao = proximoIndiceSlide(ESTADO.indiceRotacao, obterSlidesAtivos(ESTADO.config).length);
  agendarRotacao();
}

function mostrarSlideAtual(slide) {
  if (!slide) {
    renderizarVazio();
    return;
  }
  fetch(APPS_SCRIPT_URL + '?action=ranking&setor=' + slide.setor + '&periodo=' + slide.periodo)
    .then(function (resposta) { return resposta.json(); })
    .then(function (dados) {
      if (dados.ok) {
        transicionarPara(function () { renderizar(slide, dados); });
      } else if (slide.modoTroca === 'scroll') {
        agendarAvancoFallback(slide);
      }
    })
    .catch(function () {
      if (slide.modoTroca === 'scroll') agendarAvancoFallback(slide);
    });
}

function elementosTransicao() {
  return [
    document.getElementById('rotuloSetor').parentElement,
    document.getElementById('rotuloData'),
    document.querySelector('.conteudo')
  ];
}

function duracaoFadeMs(config) {
  var valor = config && config.duracaoFadeSegundos;
  return typeof valor === 'number' && valor >= 0 ? valor * 1000 : 600;
}

function transicionarPara(atualizarConteudo) {
  var duracaoMs = duracaoFadeMs(ESTADO.config);
  if (ESTADO.timerFade) {
    clearTimeout(ESTADO.timerFade);
    ESTADO.timerFade = null;
  }
  if (ESTADO.primeiraExibicao || duracaoMs <= 0) {
    ESTADO.primeiraExibicao = false;
    atualizarConteudo();
    return;
  }
  var elementos = elementosTransicao();
  elementos.forEach(function (el) {
    el.style.transition = 'opacity ' + duracaoMs + 'ms ease';
    el.style.opacity = '0';
  });
  ESTADO.timerFade = setTimeout(function () {
    atualizarConteudo();
    elementos.forEach(function (el) { void el.offsetHeight; });
    elementos.forEach(function (el) { el.style.opacity = '1'; });
  }, duracaoMs);
}

function agendarAvancoFallback(slide) {
  if (ESTADO.timerRotacao) clearTimeout(ESTADO.timerRotacao);
  ESTADO.timerRotacao = setTimeout(avancarSlide, slide.duracaoSegundos * 1000);
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
  renderizarLista(dados.resto, metricas, ESTADO.config, slide);
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

function renderizarLista(resto, metricas, config, slide) {
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

  var pxPorSegundo = velocidadeScroll(config);
  if (slide && slide.modoTroca === 'scroll') {
    iniciarAutoScroll(container, calcularMeiosCiclos(slide.voltasScroll), avancarSlide, pxPorSegundo);
  } else {
    iniciarAutoScroll(container, null, null, pxPorSegundo);
  }
}

function velocidadeScroll(config) {
  var valor = config && config.velocidadeScroll;
  return typeof valor === 'number' && valor > 0 ? valor : 22;
}

function calcularMeiosCiclos(voltasScroll) {
  var voltas = typeof voltasScroll === 'number' && voltasScroll >= 0 ? voltasScroll : 1;
  return voltas === 0 ? 1 : voltas * 2;
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

function iniciarAutoScroll(container, metaMeiosCiclos, aoCompletar, pxPorSegundo) {
  pararAutoScroll();
  var distancia = container.scrollHeight - container.clientHeight;
  if (distancia <= 4) {
    container.scrollTop = 0;
    if (aoCompletar) {
      AUTOSCROLL.timeoutId = setTimeout(aoCompletar, 4000);
    }
    return;
  }
  var velocidade = pxPorSegundo > 0 ? pxPorSegundo : 22;
  var duracao = (distancia / velocidade) * 1000;
  var pausa = 2200;
  var meiosCiclosFeitos = 0;

  function animarCiclo(indoParaBaixo) {
    var inicio = null;
    function passo(agora) {
      if (inicio === null) inicio = agora;
      var progresso = Math.min(1, (agora - inicio) / duracao);
      container.scrollTop = indoParaBaixo ? distancia * progresso : distancia * (1 - progresso);
      if (progresso < 1) {
        AUTOSCROLL.frameId = requestAnimationFrame(passo);
        return;
      }
      meiosCiclosFeitos += 1;
      if (metaMeiosCiclos && meiosCiclosFeitos >= metaMeiosCiclos) {
        if (aoCompletar) aoCompletar();
        return;
      }
      AUTOSCROLL.timeoutId = setTimeout(function () { animarCiclo(!indoParaBaixo); }, pausa);
    }
    AUTOSCROLL.frameId = requestAnimationFrame(passo);
  }

  animarCiclo(true);
}

iniciar();
