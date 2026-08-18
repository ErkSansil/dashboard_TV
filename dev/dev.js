var SESSAO = { usuario: '', senha: '' };
var CONFIG_ATUAL = null;

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

function carregarConfig() {
  fetch(APPS_SCRIPT_URL + '?action=config')
    .then(function (resposta) { return resposta.json(); })
    .then(function (dados) {
      CONFIG_ATUAL = dados.ok ? dados.config : configPadrao();
      preencherFormulario(CONFIG_ATUAL);
    });
}

function preencherFormulario(config) {
  document.getElementById('campoTema').value = config.tema;
  document.getElementById('campoQtdLista').value = config.qtdLista;

  var seletorFixado = document.getElementById('campoFixado');
  seletorFixado.innerHTML = '<option value="">Rodízio normal</option>';
  config.slides.forEach(function (slide) {
    var opcao = document.createElement('option');
    opcao.value = slide.setor + '|' + slide.periodo;
    opcao.textContent = slide.setor + ' - ' + slide.periodo;
    seletorFixado.appendChild(opcao);
  });
  seletorFixado.value = config.fixado ? config.fixado.setor + '|' + config.fixado.periodo : '';

  var container = document.getElementById('listaSlides');
  container.innerHTML = '';
  config.slides.forEach(function (slide, indice) {
    var bloco = document.createElement('fieldset');
    bloco.className = 'campo-slide';
    bloco.innerHTML =
      '<legend>' + slide.setor + ' — ' + slide.periodo + '</legend>' +
      '<label><input type="checkbox" data-indice="' + indice + '" data-campo="ativo" ' + (slide.ativo ? 'checked' : '') + ' /> Ativo</label>' +
      '<label>Duração (segundos) <input type="number" min="1" data-indice="' + indice + '" data-campo="duracaoSegundos" value="' + slide.duracaoSegundos + '" /></label>' +
      '<label>Linha inicial <input type="number" min="1" data-indice="' + indice + '" data-campo="linhaInicial" value="' + slide.linhaInicial + '" /></label>' +
      '<label>Coluna Nome <input type="text" data-indice="' + indice + '" data-campo="colunas.nome" value="' + slide.colunas.nome + '" /></label>' +
      '<label>Coluna Aproveitamento <input type="text" data-indice="' + indice + '" data-campo="colunas.aproveitamento" value="' + slide.colunas.aproveitamento + '" /></label>' +
      '<label>Coluna Vendas Imediato <input type="text" data-indice="' + indice + '" data-campo="colunas.vendasImediato" value="' + slide.colunas.vendasImediato + '" /></label>' +
      '<label>Coluna Contratos <input type="text" data-indice="' + indice + '" data-campo="colunas.contratos" value="' + slide.colunas.contratos + '" /></label>' +
      '<label>Ordenar por' +
        '<select data-indice="' + indice + '" data-campo="ordenarPor">' +
          '<option value="aproveitamento"' + (slide.ordenarPor === 'aproveitamento' ? ' selected' : '') + '>Aproveitamento (%)</option>' +
          '<option value="vendasImediato"' + (slide.ordenarPor === 'vendasImediato' ? ' selected' : '') + '>Vendas Imediato</option>' +
          '<option value="contratos"' + (slide.ordenarPor === 'contratos' ? ' selected' : '') + '>Contratos</option>' +
          '<option value="nome"' + (slide.ordenarPor === 'nome' ? ' selected' : '') + '>Nome</option>' +
        '</select>' +
      '</label>' +
      '<label>Direção' +
        '<select data-indice="' + indice + '" data-campo="direcao">' +
          '<option value="desc"' + (slide.direcao === 'desc' ? ' selected' : '') + '>Maior primeiro</option>' +
          '<option value="asc"' + (slide.direcao === 'asc' ? ' selected' : '') + '>Menor primeiro</option>' +
        '</select>' +
      '</label>';
    container.appendChild(bloco);
  });
}

function lerFormularioParaConfig() {
  var config = JSON.parse(JSON.stringify(CONFIG_ATUAL));
  config.tema = document.getElementById('campoTema').value;
  config.qtdLista = Number(document.getElementById('campoQtdLista').value);

  var fixadoValor = document.getElementById('campoFixado').value;
  config.fixado = fixadoValor ? { setor: fixadoValor.split('|')[0], periodo: fixadoValor.split('|')[1] } : null;

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
        mensagem.textContent = 'Configuração salva. As TVs atualizam em até 15 segundos.';
        recarregarPreview();
      } else {
        mensagem.textContent = 'Erro ao salvar: ' + dados.erro;
      }
    })
    .catch(function () {
      mensagem.textContent = 'Falha ao conectar com o servidor';
    });
});
