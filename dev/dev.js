var SESSAO = { usuario: '', senha: '' };
var CONFIG_ATUAL = null;
var CONFIG_BASE = null;
var SLIDES_EXPANDIDOS = {};

function slideEstaExpandido(indice) {
  return SLIDES_EXPANDIDOS[indice] === true;
}

function atualizarEstadoAtivoSlide(checkboxAtivo) {
  var bloco = checkboxAtivo.closest('.campo-slide');
  if (!bloco) return;
  var ativo = checkboxAtivo.checked;
  bloco.classList.toggle('campo-slide--inativo', !ativo);
  var status = bloco.querySelector('.campo-slide__status');
  if (status) {
    status.textContent = ativo ? 'Ativo' : 'Inativo';
    status.classList.toggle('campo-slide__status--inativo', !ativo);
  }
  bloco.querySelectorAll('.campo-slide__corpo [data-campo]').forEach(function (campo) {
    if (campo.getAttribute('data-campo') === 'ativo') return;
    campo.disabled = !ativo;
  });
  sincronizarCamposRequisito(bloco, ativo);
}

document.getElementById('listaSlides').addEventListener('click', function (evento) {
  var botao = evento.target.closest('[data-toggle-indice]');
  if (!botao) return;
  var indice = Number(botao.getAttribute('data-toggle-indice'));
  var expandido = !slideEstaExpandido(indice);
  SLIDES_EXPANDIDOS[indice] = expandido;
  var bloco = botao.closest('.campo-slide');
  bloco.classList.toggle('campo-slide--expandido', expandido);
  bloco.querySelector('.campo-slide__corpo').hidden = !expandido;
});

document.getElementById('formLogin').addEventListener('submit', function (evento) {
  evento.preventDefault();
  var usuario = document.getElementById('campoUsuario').value.trim();
  var senha = document.getElementById('campoSenha').value;
  fetch(APPS_SCRIPT_URL + '?action=login&usuario=' + encodeURIComponent(usuario) + '&senha=' + encodeURIComponent(senha))
    .then(function (resposta) { return resposta.json(); })
    .then(function (dados) {
      if (dados.ok) {
        SESSAO.usuario = usuario;
        SESSAO.senha = senha;
        document.getElementById('telaLogin').hidden = true;
        document.getElementById('telaConfig').hidden = false;
        carregarConfig();
      } else {
        document.getElementById('mensagemLogin').textContent = dados.erro || 'Credenciais inválidas';
      }
    })
    .catch(function () {
      document.getElementById('mensagemLogin').textContent = 'Falha ao conectar com o servidor';
    });
});

function normalizarCondicao(recebida, padrao, comToggle) {
  var normalizada = {
    metrica: (recebida && recebida.metrica) || padrao.metrica,
    valorMinimo: recebida && typeof recebida.valorMinimo === 'number' ? recebida.valorMinimo : padrao.valorMinimo
  };
  if (comToggle) {
    normalizada.ativo = recebida && typeof recebida.ativo === 'boolean' ? recebida.ativo : padrao.ativo;
  }
  return normalizada;
}

function normalizarRequisito(recebido, padrao) {
  if (!recebido) return JSON.parse(JSON.stringify(padrao));
  var normalizado = { ativo: typeof recebido.ativo === 'boolean' ? recebido.ativo : padrao.ativo, condicoes: [] };
  if (Array.isArray(recebido.condicoes) && recebido.condicoes.length === 3) {
    normalizado.condicoes = [
      normalizarCondicao(recebido.condicoes[0], padrao.condicoes[0], false),
      normalizarCondicao(recebido.condicoes[1], padrao.condicoes[1], true),
      normalizarCondicao(recebido.condicoes[2], padrao.condicoes[2], true)
    ];
  } else if (typeof recebido.metrica === 'string') {
    // config salvo no formato antigo (uma unica condicao, sem lista) - migra pra condicao 1
    normalizado.condicoes = JSON.parse(JSON.stringify(padrao.condicoes));
    normalizado.condicoes[0] = normalizarCondicao(recebido, padrao.condicoes[0], false);
  } else {
    normalizado.condicoes = JSON.parse(JSON.stringify(padrao.condicoes));
  }
  return normalizado;
}

function mesclarComPadrao(configCarregado) {
  var mesclado = configPadrao();
  if (!configCarregado) return mesclado;
  // requisitoPodio/requisitoRanking já existiram no nível raiz do config (versão anterior, um requisito global
  // pra todos os períodos) - se um slide ainda não tiver o dele próprio, usa esse como ponto de partida
  var requisitoPodioGlobalAntigo = configCarregado.requisitoPodio;
  var requisitoRankingGlobalAntigo = configCarregado.requisitoRanking;
  for (var chave in configCarregado) {
    mesclado[chave] = configCarregado[chave];
  }
  delete mesclado.requisitoPodio;
  delete mesclado.requisitoRanking;
  mesclado.slides = (mesclado.slides || []).map(function (slide) {
    var copia = {};
    for (var campo in slide) copia[campo] = slide[campo];
    copia.requisitoPodio = normalizarRequisito(slide.requisitoPodio || requisitoPodioGlobalAntigo, requisitoPadrao(60));
    copia.requisitoRanking = normalizarRequisito(slide.requisitoRanking || requisitoRankingGlobalAntigo, requisitoPadrao(0));
    return copia;
  });
  return mesclado;
}

function carregarConfig() {
  fetch(APPS_SCRIPT_URL + '?action=config')
    .then(function (resposta) { return resposta.json(); })
    .then(function (dados) {
      CONFIG_ATUAL = mesclarComPadrao(dados.ok ? dados.config : null);
      CONFIG_BASE = CONFIG_ATUAL;
      preencherFormulario(CONFIG_ATUAL);
      verificarAlteracoes();
    });
}

var METRICAS_CAMPO = [
  { chave: 'aproveitamento', id: 'metricaAproveitamento' },
  { chave: 'vendasImediato', id: 'metricaVendasImediato' },
  { chave: 'contratos', id: 'metricaContratos' },
  { chave: 'extra1', id: 'metricaExtra1' },
  { chave: 'extra2', id: 'metricaExtra2' }
];

var METRICAS_REQUISITO = [
  { valor: 'aproveitamento', rotulo: 'Aproveitamento (%)' },
  { valor: 'vendasImediato', rotulo: 'Vendas Imediato' },
  { valor: 'contratos', rotulo: 'Contratos' },
  { valor: 'extra1', rotulo: 'Extra 1' },
  { valor: 'extra2', rotulo: 'Extra 2' }
];

function opcoesMetricaRequisito(selecionada) {
  return METRICAS_REQUISITO.map(function (m) {
    return '<option value="' + m.valor + '"' + (m.valor === selecionada ? ' selected' : '') + '>' + m.rotulo + '</option>';
  }).join('');
}

function renderizarCondicao(prefixo, indice, condicao, comToggle, rotulo) {
  var idAtivo = prefixo + 'Ativo' + indice;
  var idMetrica = prefixo + 'Metrica' + indice;
  var idValor = prefixo + 'Valor' + indice;
  var inativa = comToggle && !condicao.ativo;
  var desabilitado = inativa ? 'disabled' : '';
  var cabecalho = comToggle
    ? '<label class="campo-requisito__toggle"><input type="checkbox" id="' + idAtivo + '" ' + (condicao.ativo ? 'checked' : '') + ' /> ' + rotulo + '</label>'
    : '<span class="campo-requisito__toggle campo-requisito__toggle--fixo">' + rotulo + '</span>';
  return (
    '<div class="campo-requisito__condicao' + (comToggle ? '' : ' campo-requisito__condicao--fixa') + (inativa ? ' campo-requisito__condicao--inativa' : '') + '">' +
      cabecalho +
      '<label>Métrica considerada<select ' + desabilitado + ' id="' + idMetrica + '">' + opcoesMetricaRequisito(condicao.metrica) + '</select></label>' +
      '<label>Valor mínimo<input type="number" ' + desabilitado + ' id="' + idValor + '" step="0.01" value="' + condicao.valorMinimo + '" /></label>' +
    '</div>'
  );
}

function atualizarEstadoCondicao(checkboxAtivo) {
  var bloco = checkboxAtivo.closest('.campo-requisito__condicao');
  if (!bloco) return;
  var ativo = checkboxAtivo.checked;
  bloco.classList.toggle('campo-requisito__condicao--inativa', !ativo);
  bloco.querySelectorAll('select, input[type="number"]').forEach(function (campo) {
    campo.disabled = !ativo;
  });
}

function htmlBlocoRequisito(prefixo, titulo, rotuloAtivo, requisito, textoExplicativo) {
  var condicoes = requisito.condicoes;
  return (
    '<fieldset class="campo-slide campo-requisito">' +
      '<legend>' + titulo + '</legend>' +
      '<label><input type="checkbox" id="' + prefixo + 'Ativo" ' + (requisito.ativo ? 'checked' : '') + ' /> ' + rotuloAtivo + '</label>' +
      renderizarCondicao(prefixo, 0, condicoes[0], false, 'Condição 1 — sempre aplicada') +
      renderizarCondicao(prefixo, 1, condicoes[1], true, 'Condição 2 (opcional)') +
      renderizarCondicao(prefixo, 2, condicoes[2], true, 'Condição 3 (opcional)') +
      '<p class="mensagem-status">' + textoExplicativo + '</p>' +
    '</fieldset>'
  );
}

function sincronizarCamposRequisito(blocoSlide, slideAtivo) {
  blocoSlide.querySelectorAll('.campo-requisito').forEach(function (fieldset) {
    var ativoRequisito = fieldset.querySelector(':scope > label > input[type="checkbox"]');
    if (ativoRequisito) ativoRequisito.disabled = !slideAtivo;
    fieldset.querySelectorAll('.campo-requisito__condicao').forEach(function (condicaoEl) {
      var toggle = condicaoEl.querySelector('.campo-requisito__toggle input[type="checkbox"]');
      var condicaoAtiva = toggle ? toggle.checked : true;
      var habilitado = slideAtivo && condicaoAtiva;
      condicaoEl.classList.toggle('campo-requisito__condicao--inativa', !habilitado);
      condicaoEl.querySelectorAll('select, input[type="number"]').forEach(function (campo) {
        campo.disabled = !habilitado;
      });
      if (toggle) toggle.disabled = !slideAtivo;
    });
  });
}

function lerCondicao(prefixo, indice, comToggle) {
  var condicao = {
    metrica: document.getElementById(prefixo + 'Metrica' + indice).value,
    valorMinimo: Number(document.getElementById(prefixo + 'Valor' + indice).value)
  };
  if (comToggle) {
    condicao.ativo = document.getElementById(prefixo + 'Ativo' + indice).checked;
  }
  return condicao;
}

function lerRequisito(prefixo) {
  return {
    ativo: document.getElementById(prefixo + 'Ativo').checked,
    condicoes: [
      lerCondicao(prefixo, 0, false),
      lerCondicao(prefixo, 1, true),
      lerCondicao(prefixo, 2, true)
    ]
  };
}

function preencherFormulario(config) {
  document.getElementById('campoTema').value = config.tema;
  document.getElementById('campoFundoAnimado').checked = config.fundoAnimado !== false;
  document.getElementById('campoFundoBlur').value = config.fundoBlur;
  document.getElementById('campoFundoBrilho').value = config.fundoBrilho;
  document.getElementById('campoQtdLista').value = config.qtdLista;
  document.getElementById('campoVelocidadeScroll').value = config.velocidadeScroll;
  document.getElementById('campoDuracaoFade').value = config.duracaoFadeSegundos;
  document.getElementById('campoEscalaLista').value = config.escalaLista;
  document.getElementById('campoAlturaPodio').value = config.alturaPodioVh;
  document.getElementById('campoNomesExcluidos').value = (config.nomesExcluidos || []).join('\n');
  document.getElementById('campoRotuloExtra1').value = config.rotuloExtra1 || '';
  document.getElementById('campoRotuloExtra2').value = config.rotuloExtra2 || '';

  var metricasVisiveis = config.metricasVisiveis || [];
  METRICAS_CAMPO.forEach(function (item) {
    document.getElementById(item.id).checked = metricasVisiveis.indexOf(item.chave) !== -1;
  });

  var seletorFixado = document.getElementById('campoFixado');
  seletorFixado.innerHTML = '<option value="">Rodízio normal</option>';
  config.slides.forEach(function (slide) {
    var opcao = document.createElement('option');
    opcao.value = slide.setor + '|' + slide.periodo;
    opcao.textContent = slide.setor + ' - ' + slide.periodo;
    seletorFixado.appendChild(opcao);
  });
  seletorFixado.value = config.fixado ? config.fixado.setor + '|' + config.fixado.periodo : '';

  document.getElementById('campoFixarAtePosicao').value = typeof config.fixarAtePosicao === 'number' ? config.fixarAtePosicao : 0;

  var container = document.getElementById('listaSlides');
  container.innerHTML = '';
  config.slides.forEach(function (slide, indice) {
    var expandido = slideEstaExpandido(indice);
    var desabilitado = slide.ativo ? '' : 'disabled';
    var bloco = document.createElement('div');
    bloco.className = 'campo-slide campo-slide--colapsavel' +
      (slide.ativo ? '' : ' campo-slide--inativo') +
      (expandido ? ' campo-slide--expandido' : '');
    bloco.innerHTML =
      '<button type="button" class="campo-slide__cabecalho" data-toggle-indice="' + indice + '">' +
        '<span class="campo-slide__seta">▸</span>' +
        '<span class="campo-slide__titulo">' + slide.setor + ' — ' + slide.periodo + '</span>' +
        '<span class="campo-slide__status' + (slide.ativo ? '' : ' campo-slide__status--inativo') + '">' + (slide.ativo ? 'Ativo' : 'Inativo') + '</span>' +
      '</button>' +
      '<div class="campo-slide__corpo"' + (expandido ? '' : ' hidden') + '>' +
        '<label><input type="checkbox" data-indice="' + indice + '" data-campo="ativo" ' + (slide.ativo ? 'checked' : '') + ' /> Ativo</label>' +
        '<label>Duração (segundos) <input type="number" min="1" ' + desabilitado + ' data-indice="' + indice + '" data-campo="duracaoSegundos" value="' + slide.duracaoSegundos + '" /></label>' +
        '<label>Linha inicial <input type="number" min="1" ' + desabilitado + ' data-indice="' + indice + '" data-campo="linhaInicial" value="' + slide.linhaInicial + '" /></label>' +
        '<label>Coluna Nome <input type="text" ' + desabilitado + ' data-indice="' + indice + '" data-campo="colunas.nome" value="' + slide.colunas.nome + '" /></label>' +
        '<label>Coluna Aproveitamento <input type="text" ' + desabilitado + ' data-indice="' + indice + '" data-campo="colunas.aproveitamento" value="' + slide.colunas.aproveitamento + '" /></label>' +
        '<label>Coluna Vendas Imediato <input type="text" ' + desabilitado + ' data-indice="' + indice + '" data-campo="colunas.vendasImediato" value="' + slide.colunas.vendasImediato + '" /></label>' +
        '<label>Coluna Contratos <input type="text" ' + desabilitado + ' data-indice="' + indice + '" data-campo="colunas.contratos" value="' + slide.colunas.contratos + '" /></label>' +
        '<label>Coluna Extra 1 <input type="text" ' + desabilitado + ' data-indice="' + indice + '" data-campo="colunas.extra1" value="' + (slide.colunas.extra1 || '') + '" /></label>' +
        '<label>Coluna Extra 2 <input type="text" ' + desabilitado + ' data-indice="' + indice + '" data-campo="colunas.extra2" value="' + (slide.colunas.extra2 || '') + '" /></label>' +
        '<label>Ordenar por' +
          '<select ' + desabilitado + ' data-indice="' + indice + '" data-campo="ordenarPor">' +
            '<option value="aproveitamento"' + (slide.ordenarPor === 'aproveitamento' ? ' selected' : '') + '>Aproveitamento (%)</option>' +
            '<option value="vendasImediato"' + (slide.ordenarPor === 'vendasImediato' ? ' selected' : '') + '>Vendas Imediato</option>' +
            '<option value="contratos"' + (slide.ordenarPor === 'contratos' ? ' selected' : '') + '>Contratos</option>' +
            '<option value="nome"' + (slide.ordenarPor === 'nome' ? ' selected' : '') + '>Nome</option>' +
          '</select>' +
        '</label>' +
        '<label>Direção' +
          '<select ' + desabilitado + ' data-indice="' + indice + '" data-campo="direcao">' +
            '<option value="desc"' + (slide.direcao === 'desc' ? ' selected' : '') + '>Maior primeiro</option>' +
            '<option value="asc"' + (slide.direcao === 'asc' ? ' selected' : '') + '>Menor primeiro</option>' +
          '</select>' +
        '</label>' +
        '<label>Trocar de período' +
          '<select ' + desabilitado + ' data-indice="' + indice + '" data-campo="modoTroca">' +
            '<option value="tempo"' + (slide.modoTroca === 'tempo' ? ' selected' : '') + '>Por tempo (duração acima)</option>' +
            '<option value="scroll"' + (slide.modoTroca === 'scroll' ? ' selected' : '') + '>Depois da rolagem (ignora a duração)</option>' +
          '</select>' +
        '</label>' +
        '<label>Rolagens antes de trocar — só se "Depois da rolagem" (0 = passar 1x sem voltar, 1 = ida e volta 1x, 2 = ida e volta 2x...) ' +
          '<input type="number" min="0" ' + desabilitado + ' data-indice="' + indice + '" data-campo="voltasScroll" value="' + slide.voltasScroll + '" />' +
        '</label>' +
        htmlBlocoRequisito(
          'campoRequisitoPodio' + indice, 'Requisito mínimo para o pódio',
          'Exigir um mínimo para entrar no top 3', slide.requisitoPodio,
          'Quem não atinge todas as condições ativas não aparece no pódio, mas continua na lista, na posição real dele no ranking.'
        ) +
        htmlBlocoRequisito(
          'campoRequisitoRanking' + indice, 'Requisito mínimo para aparecer no ranking',
          'Exigir um mínimo para aparecer no ranking geral', slide.requisitoRanking,
          'Quem não atinge todas as condições ativas não aparece em lugar nenhum (nem no pódio, nem na lista). É mais restritivo que o requisito do pódio acima.'
        ) +
      '</div>';
    container.appendChild(bloco);
    sincronizarCamposRequisito(bloco, slide.ativo);
  });
}

function lerFormularioParaConfig() {
  var config = JSON.parse(JSON.stringify(CONFIG_BASE));
  config.tema = document.getElementById('campoTema').value;
  config.fundoAnimado = document.getElementById('campoFundoAnimado').checked;
  config.fundoBlur = Number(document.getElementById('campoFundoBlur').value);
  config.fundoBrilho = document.getElementById('campoFundoBrilho').value;
  config.qtdLista = Number(document.getElementById('campoQtdLista').value);
  config.velocidadeScroll = Number(document.getElementById('campoVelocidadeScroll').value);
  config.duracaoFadeSegundos = Number(document.getElementById('campoDuracaoFade').value);
  config.escalaLista = Number(document.getElementById('campoEscalaLista').value);
  config.alturaPodioVh = Number(document.getElementById('campoAlturaPodio').value);
  config.nomesExcluidos = document.getElementById('campoNomesExcluidos').value
    .split('\n')
    .map(function (linha) { return linha.trim(); })
    .filter(function (linha) { return linha.length > 0; });

  var fixadoValor = document.getElementById('campoFixado').value;
  config.fixado = fixadoValor ? { setor: fixadoValor.split('|')[0], periodo: fixadoValor.split('|')[1] } : null;

  config.fixarAtePosicao = Number(document.getElementById('campoFixarAtePosicao').value);

  config.metricasVisiveis = METRICAS_CAMPO
    .filter(function (item) { return document.getElementById(item.id).checked; })
    .map(function (item) { return item.chave; });
  config.rotuloExtra1 = document.getElementById('campoRotuloExtra1').value.trim();
  config.rotuloExtra2 = document.getElementById('campoRotuloExtra2').value.trim();

  document.querySelectorAll('#listaSlides [data-indice]').forEach(function (campo) {
    var indice = Number(campo.getAttribute('data-indice'));
    var nomeCampo = campo.getAttribute('data-campo');
    var slide = config.slides[indice];
    var valor;
    if (campo.type === 'checkbox') {
      valor = campo.checked;
    } else if (campo.type === 'number') {
      valor = Number(campo.value);
    } else {
      valor = campo.value;
    }
    if (nomeCampo.indexOf('colunas.') === 0) {
      slide.colunas[nomeCampo.split('.')[1]] = valor;
    } else {
      slide[nomeCampo] = valor;
    }
  });

  config.slides.forEach(function (slide, indice) {
    slide.requisitoPodio = lerRequisito('campoRequisitoPodio' + indice);
    slide.requisitoRanking = lerRequisito('campoRequisitoRanking' + indice);
  });

  return config;
}

function recarregarPreview() {
  var iframe = document.querySelector('.preview iframe');
  iframe.src = iframe.src;
}

function igualProfundo(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null || typeof a !== 'object') return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (!igualProfundo(a[i], b[i])) return false;
    }
    return true;
  }
  var chavesA = Object.keys(a);
  var chavesB = Object.keys(b);
  if (chavesA.length !== chavesB.length) return false;
  for (var j = 0; j < chavesA.length; j++) {
    var chave = chavesA[j];
    if (!Object.prototype.hasOwnProperty.call(b, chave)) return false;
    if (!igualProfundo(a[chave], b[chave])) return false;
  }
  return true;
}

function formularioEstaSujo() {
  if (!CONFIG_ATUAL) return false;
  return !igualProfundo(lerFormularioParaConfig(), CONFIG_ATUAL);
}

function verificarAlteracoes() {
  document.getElementById('barraSalvar').hidden = !formularioEstaSujo();
}

document.getElementById('telaConfig').addEventListener('input', function () {
  verificarAlteracoes();
  document.getElementById('mensagemSalvar').textContent = '';
});
document.getElementById('telaConfig').addEventListener('change', function (evento) {
  verificarAlteracoes();
  document.getElementById('mensagemSalvar').textContent = '';
  if (evento.target.matches('[data-campo="ativo"]')) {
    atualizarEstadoAtivoSlide(evento.target);
  }
  if (evento.target.matches('.campo-requisito__toggle input[type="checkbox"]')) {
    atualizarEstadoCondicao(evento.target);
  }
});

document.getElementById('botaoDescartar').addEventListener('click', function () {
  CONFIG_BASE = CONFIG_ATUAL;
  preencherFormulario(CONFIG_ATUAL);
  document.getElementById('mensagemSalvar').textContent = '';
  verificarAlteracoes();
});

document.getElementById('botaoPadrao').addEventListener('click', function () {
  if (!confirm('Isso vai preencher o formulário com todas as configurações padrão de fábrica. Nada é salvo até você clicar em "Salvar alterações". Continuar?')) {
    return;
  }
  CONFIG_BASE = configPadrao();
  preencherFormulario(CONFIG_BASE);
  document.getElementById('mensagemSalvar').textContent = '';
  verificarAlteracoes();
});

document.getElementById('botaoSalvar').addEventListener('click', function () {
  var config = lerFormularioParaConfig();
  var validacao = validarConfig(config);
  var mensagem = document.getElementById('mensagemSalvar');
  if (!validacao.valido) {
    mensagem.textContent = 'Erro: ' + validacao.erros.join('; ');
    return;
  }
  mensagem.textContent = 'Salvando...';
  fetch(
    APPS_SCRIPT_URL +
      '?action=salvarconfig' +
      '&usuario=' + encodeURIComponent(SESSAO.usuario) +
      '&senha=' + encodeURIComponent(SESSAO.senha) +
      '&config=' + encodeURIComponent(JSON.stringify(config))
  )
    .then(function (resposta) { return resposta.json(); })
    .then(function (dados) {
      if (dados.ok) {
        CONFIG_ATUAL = config;
        CONFIG_BASE = CONFIG_ATUAL;
        mensagem.textContent = 'Configuração salva. As TVs atualizam em até 15 segundos.';
        verificarAlteracoes();
        recarregarPreview();
      } else {
        mensagem.textContent = 'Erro ao salvar: ' + dados.erro;
      }
    })
    .catch(function () {
      mensagem.textContent = 'Falha ao conectar com o servidor';
    });
});
