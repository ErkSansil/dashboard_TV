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

function mesclarComPadrao(configCarregado) {
  var mesclado = configPadrao();
  if (!configCarregado) return mesclado;
  for (var chave in configCarregado) {
    mesclado[chave] = configCarregado[chave];
  }
  ['requisitoPodio', 'requisitoRanking'].forEach(function (chaveRequisito) {
    var padrao = configPadrao()[chaveRequisito];
    var recebido = configCarregado[chaveRequisito] || {};
    mesclado[chaveRequisito] = {
      ativo: typeof recebido.ativo === 'boolean' ? recebido.ativo : padrao.ativo,
      metrica: recebido.metrica || padrao.metrica,
      valorMinimo: typeof recebido.valorMinimo === 'number' ? recebido.valorMinimo : padrao.valorMinimo
    };
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

  var requisitoPodio = config.requisitoPodio || { ativo: false, metrica: 'aproveitamento', valorMinimo: 60 };
  document.getElementById('campoRequisitoAtivo').checked = requisitoPodio.ativo === true;
  document.getElementById('campoRequisitoMetrica').value = requisitoPodio.metrica;
  document.getElementById('campoRequisitoValor').value = requisitoPodio.valorMinimo;

  var requisitoRanking = config.requisitoRanking || { ativo: false, metrica: 'aproveitamento', valorMinimo: 0 };
  document.getElementById('campoRequisitoRankingAtivo').checked = requisitoRanking.ativo === true;
  document.getElementById('campoRequisitoRankingMetrica').value = requisitoRanking.metrica;
  document.getElementById('campoRequisitoRankingValor').value = requisitoRanking.valorMinimo;

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
      '</div>';
    container.appendChild(bloco);
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
  config.requisitoPodio = {
    ativo: document.getElementById('campoRequisitoAtivo').checked,
    metrica: document.getElementById('campoRequisitoMetrica').value,
    valorMinimo: Number(document.getElementById('campoRequisitoValor').value)
  };
  config.requisitoRanking = {
    ativo: document.getElementById('campoRequisitoRankingAtivo').checked,
    metrica: document.getElementById('campoRequisitoRankingMetrica').value,
    valorMinimo: Number(document.getElementById('campoRequisitoRankingValor').value)
  };

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

  return config;
}

function recarregarPreview() {
  var iframe = document.querySelector('.preview iframe');
  iframe.src = iframe.src;
}

function formularioEstaSujo() {
  if (!CONFIG_ATUAL) return false;
  return JSON.stringify(lerFormularioParaConfig()) !== JSON.stringify(CONFIG_ATUAL);
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
