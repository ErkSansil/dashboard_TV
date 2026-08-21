var METRICAS_DISPONIVEIS = ['aproveitamento', 'vendasImediato', 'contratos', 'extra1', 'extra2'];
var TEMAS_DISPONIVEIS = ['escuro', 'claro', 'amo', 'aurora', 'sunset', 'oceano', 'platina', 'fogo', 'meianoite'];
var ESTILOS_FUNDO = ['fosco', 'brilhante'];

function requisitoPadrao(valorMinimoPrimeira) {
  return {
    ativo: false,
    condicoes: [
      { metrica: 'aproveitamento', valorMinimo: valorMinimoPrimeira },
      { ativo: false, metrica: 'aproveitamento', valorMinimo: 0 },
      { ativo: false, metrica: 'aproveitamento', valorMinimo: 0 }
    ]
  };
}

function metaPadrao(minimoContratos) {
  var meta = requisitoPadrao(minimoContratos);
  meta.ativo = true;
  meta.condicoes[0].metrica = 'contratos';
  return meta;
}

function configPadrao() {
  return {
    tema: 'escuro',
    fundoAnimado: true,
    fundoBlur: 10,
    fundoBrilho: 'fosco',
    qtdLista: 7,
    velocidadeScroll: 22,
    duracaoFadeSegundos: 0.6,
    escalaLista: 100,
    alturaPodioVh: 34,
    nomesExcluidos: [],
    metricasVisiveis: ['aproveitamento', 'vendasImediato', 'contratos'],
    rotuloExtra1: '',
    rotuloExtra2: '',
    fixado: null,
    fixarAtePosicao: 0,
    slides: [
      {
        chave: 'vendas-dia', setor: 'vendas', periodo: 'dia', ativo: true, duracaoSegundos: 20,
        modoTroca: 'tempo', voltasScroll: 1,
        linhaInicial: 4,
        colunas: { nome: 'E', aproveitamento: 'F', vendasImediato: 'G', contratos: 'H', extra1: 'I', extra2: 'J' },
        rotuloCelulas: ['F2'], ordenarPor: 'aproveitamento', direcao: 'desc', temaProprio: '',
        requisitoPodio: requisitoPadrao(60), requisitoRanking: requisitoPadrao(0)
      },
      {
        chave: 'vendas-semana', setor: 'vendas', periodo: 'semana', ativo: true, duracaoSegundos: 20,
        modoTroca: 'tempo', voltasScroll: 1,
        linhaInicial: 4,
        colunas: { nome: 'P', aproveitamento: 'Q', vendasImediato: 'R', contratos: 'S', extra1: 'T', extra2: 'U' },
        rotuloCelulas: ['Q2', 'R2'], ordenarPor: 'aproveitamento', direcao: 'desc', temaProprio: '',
        requisitoPodio: requisitoPadrao(60), requisitoRanking: requisitoPadrao(0)
      },
      {
        chave: 'vendas-mes', setor: 'vendas', periodo: 'mes', ativo: true, duracaoSegundos: 20,
        modoTroca: 'tempo', voltasScroll: 1,
        linhaInicial: 4,
        colunas: { nome: 'AA', aproveitamento: 'AB', vendasImediato: 'AC', contratos: 'AD', extra1: 'AE', extra2: 'AF' },
        rotuloCelulas: ['AA2', 'AB2', 'AC2'], ordenarPor: 'aproveitamento', direcao: 'desc', temaProprio: '',
        requisitoPodio: requisitoPadrao(60), requisitoRanking: requisitoPadrao(0)
      },
      {
        chave: 'vendas-ano', setor: 'vendas', periodo: 'ano', ativo: false, duracaoSegundos: 20,
        modoTroca: 'tempo', voltasScroll: 1,
        linhaInicial: 4,
        colunas: { nome: '', aproveitamento: '', vendasImediato: '', contratos: '', extra1: '', extra2: '' },
        rotuloCelulas: [], ordenarPor: 'aproveitamento', direcao: 'desc', temaProprio: '',
        requisitoPodio: requisitoPadrao(60), requisitoRanking: requisitoPadrao(0)
      },
      {
        chave: 'metas-dia', setor: 'metas', periodo: 'dia', ativo: false, duracaoSegundos: 20,
        modoTroca: 'tempo', voltasScroll: 1,
        linhaInicial: 4,
        colunas: { nome: 'E', aproveitamento: 'F', vendasImediato: 'G', contratos: 'H', extra1: 'I', extra2: 'J' },
        rotuloCelulas: ['F2'], ordenarPor: 'aproveitamento', direcao: 'desc', temaProprio: '',
        quantidadeCards: 6, meta: metaPadrao(5)
      }
    ]
  };
}

var CAMPOS_ORDENAVEIS = ['aproveitamento', 'vendasImediato', 'contratos', 'nome'];
var MODOS_TROCA = ['tempo', 'scroll'];

function validarRequisito(requisito, nomeCampo, erros) {
  if (!requisito || typeof requisito !== 'object') {
    erros.push(nomeCampo + ' precisa ser um objeto com ativo e condicoes');
    return;
  }
  if (typeof requisito.ativo !== 'boolean') {
    erros.push(nomeCampo + '.ativo precisa ser true ou false');
  }
  if (!Array.isArray(requisito.condicoes) || requisito.condicoes.length !== 3) {
    erros.push(nomeCampo + '.condicoes precisa ser uma lista com exatamente 3 itens');
    return;
  }
  requisito.condicoes.forEach(function (condicao, indice) {
    if (METRICAS_DISPONIVEIS.indexOf(condicao.metrica) === -1) {
      erros.push(nomeCampo + '.condicoes[' + indice + '].metrica precisa ser uma das: ' + METRICAS_DISPONIVEIS.join(', '));
    }
    if (typeof condicao.valorMinimo !== 'number') {
      erros.push(nomeCampo + '.condicoes[' + indice + '].valorMinimo precisa ser um número');
    }
    if (indice > 0 && typeof condicao.ativo !== 'boolean') {
      erros.push(nomeCampo + '.condicoes[' + indice + '].ativo precisa ser true ou false');
    }
  });
}

function validarConfig(config) {
  var erros = [];
  if (!config || typeof config !== 'object') {
    return { valido: false, erros: ['config precisa ser um objeto'] };
  }
  if (!Array.isArray(config.slides) || config.slides.length === 0) {
    erros.push('config.slides precisa ser uma lista com pelo menos 1 item');
  } else {
    config.slides.forEach(function (slide, indice) {
      if (!slide.setor) erros.push('slide ' + indice + ': setor é obrigatório');
      if (!slide.periodo) erros.push('slide ' + indice + ': periodo é obrigatório');
      if (typeof slide.duracaoSegundos !== 'number' || slide.duracaoSegundos <= 0) {
        erros.push('slide ' + indice + ': duracaoSegundos precisa ser maior que 0');
      }
      if (slide.ativo && (!slide.colunas || !slide.colunas.nome)) {
        erros.push('slide ' + indice + ': colunas.nome é obrigatório quando o slide está ativo');
      }
      if (CAMPOS_ORDENAVEIS.indexOf(slide.ordenarPor) === -1) {
        erros.push('slide ' + indice + ': ordenarPor inválido (' + slide.ordenarPor + ')');
      }
      if (['asc', 'desc'].indexOf(slide.direcao) === -1) {
        erros.push('slide ' + indice + ': direcao precisa ser "asc" ou "desc"');
      }
      if (MODOS_TROCA.indexOf(slide.modoTroca) === -1) {
        erros.push('slide ' + indice + ': modoTroca precisa ser "tempo" ou "scroll"');
      }
      if (typeof slide.voltasScroll !== 'number' || slide.voltasScroll < 0) {
        erros.push('slide ' + indice + ': voltasScroll precisa ser um número maior ou igual a 0');
      }
      if (slide.temaProprio && TEMAS_DISPONIVEIS.indexOf(slide.temaProprio) === -1) {
        erros.push('slide ' + indice + ': temaProprio precisa ser vazio (usa o global) ou um dos: ' + TEMAS_DISPONIVEIS.join(', '));
      }
      if (slide.setor === 'metas') {
        if (typeof slide.quantidadeCards !== 'number' || slide.quantidadeCards <= 0) {
          erros.push('slide ' + indice + ': quantidadeCards precisa ser um número maior que 0');
        }
        validarRequisito(slide.meta, 'slides[' + indice + '].meta', erros);
      } else {
        validarRequisito(slide.requisitoPodio, 'slides[' + indice + '].requisitoPodio', erros);
        validarRequisito(slide.requisitoRanking, 'slides[' + indice + '].requisitoRanking', erros);
      }
    });
  }
  if (typeof config.qtdLista !== 'number' || config.qtdLista < 0) {
    erros.push('qtdLista precisa ser um número maior ou igual a 0');
  }
  if (typeof config.velocidadeScroll !== 'number' || config.velocidadeScroll <= 0) {
    erros.push('velocidadeScroll precisa ser um número maior que 0');
  }
  if (typeof config.duracaoFadeSegundos !== 'number' || config.duracaoFadeSegundos < 0) {
    erros.push('duracaoFadeSegundos precisa ser um número maior ou igual a 0');
  }
  if (typeof config.escalaLista !== 'number' || config.escalaLista <= 0) {
    erros.push('escalaLista precisa ser um número maior que 0');
  }
  if (typeof config.alturaPodioVh !== 'number' || config.alturaPodioVh <= 0 || config.alturaPodioVh >= 100) {
    erros.push('alturaPodioVh precisa ser um número entre 0 e 100');
  }
  if (!Array.isArray(config.nomesExcluidos)) {
    erros.push('nomesExcluidos precisa ser uma lista');
  }
  if (TEMAS_DISPONIVEIS.indexOf(config.tema) === -1) {
    erros.push('tema precisa ser um dos: ' + TEMAS_DISPONIVEIS.join(', '));
  }
  if (typeof config.fundoAnimado !== 'boolean') {
    erros.push('fundoAnimado precisa ser true ou false');
  }
  if (typeof config.fundoBlur !== 'number' || config.fundoBlur < 0) {
    erros.push('fundoBlur precisa ser um número maior ou igual a 0');
  }
  if (ESTILOS_FUNDO.indexOf(config.fundoBrilho) === -1) {
    erros.push('fundoBrilho precisa ser "fosco" ou "brilhante"');
  }
  if (!Array.isArray(config.metricasVisiveis) || config.metricasVisiveis.length === 0) {
    erros.push('metricasVisiveis precisa ser uma lista com pelo menos 1 item');
  } else {
    config.metricasVisiveis.forEach(function (metrica) {
      if (METRICAS_DISPONIVEIS.indexOf(metrica) === -1) {
        erros.push('metricasVisiveis contém um valor inválido: ' + metrica);
      }
    });
  }
  if (typeof config.fixarAtePosicao !== 'number' || config.fixarAtePosicao < 0) {
    erros.push('fixarAtePosicao precisa ser um número maior ou igual a 0 (0 = nenhuma fixa)');
  }
  return { valido: erros.length === 0, erros: erros };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    configPadrao: configPadrao,
    requisitoPadrao: requisitoPadrao,
    metaPadrao: metaPadrao,
    validarConfig: validarConfig,
    TEMAS_DISPONIVEIS: TEMAS_DISPONIVEIS,
    ESTILOS_FUNDO: ESTILOS_FUNDO
  };
}
