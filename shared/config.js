var METRICAS_DISPONIVEIS = ['aproveitamento', 'vendasImediato', 'contratos', 'extra1', 'extra2'];

function configPadrao() {
  return {
    tema: 'escuro',
    qtdLista: 7,
    velocidadeScroll: 22,
    duracaoFadeSegundos: 0.6,
    escalaLista: 100,
    nomesExcluidos: [],
    metricasVisiveis: ['aproveitamento', 'vendasImediato', 'contratos'],
    rotuloExtra1: '',
    rotuloExtra2: '',
    fixado: null,
    slides: [
      {
        chave: 'vendas-dia', setor: 'vendas', periodo: 'dia', ativo: true, duracaoSegundos: 20,
        modoTroca: 'tempo', voltasScroll: 1,
        linhaInicial: 4,
        colunas: { nome: 'E', aproveitamento: 'F', vendasImediato: 'G', contratos: 'H', extra1: 'I', extra2: 'J' },
        rotuloCelulas: ['F2'], ordenarPor: 'aproveitamento', direcao: 'desc'
      },
      {
        chave: 'vendas-semana', setor: 'vendas', periodo: 'semana', ativo: true, duracaoSegundos: 20,
        modoTroca: 'tempo', voltasScroll: 1,
        linhaInicial: 4,
        colunas: { nome: 'P', aproveitamento: 'Q', vendasImediato: 'R', contratos: 'S', extra1: 'T', extra2: 'U' },
        rotuloCelulas: ['Q2', 'R2'], ordenarPor: 'aproveitamento', direcao: 'desc'
      },
      {
        chave: 'vendas-mes', setor: 'vendas', periodo: 'mes', ativo: true, duracaoSegundos: 20,
        modoTroca: 'tempo', voltasScroll: 1,
        linhaInicial: 4,
        colunas: { nome: 'AA', aproveitamento: 'AB', vendasImediato: 'AC', contratos: 'AD', extra1: 'AE', extra2: 'AF' },
        rotuloCelulas: ['AA2', 'AB2', 'AC2'], ordenarPor: 'aproveitamento', direcao: 'desc'
      },
      {
        chave: 'vendas-ano', setor: 'vendas', periodo: 'ano', ativo: false, duracaoSegundos: 20,
        modoTroca: 'tempo', voltasScroll: 1,
        linhaInicial: 4,
        colunas: { nome: '', aproveitamento: '', vendasImediato: '', contratos: '', extra1: '', extra2: '' },
        rotuloCelulas: [], ordenarPor: 'aproveitamento', direcao: 'desc'
      }
    ]
  };
}

var CAMPOS_ORDENAVEIS = ['aproveitamento', 'vendasImediato', 'contratos', 'nome'];
var MODOS_TROCA = ['tempo', 'scroll'];

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
  if (!Array.isArray(config.nomesExcluidos)) {
    erros.push('nomesExcluidos precisa ser uma lista');
  }
  if (['claro', 'escuro', 'amo'].indexOf(config.tema) === -1) {
    erros.push('tema precisa ser "claro", "escuro" ou "amo"');
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
  return { valido: erros.length === 0, erros: erros };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { configPadrao: configPadrao, validarConfig: validarConfig };
}
