function configPadrao() {
  return {
    tema: 'escuro',
    qtdLista: 7,
    fixado: null,
    slides: [
      {
        chave: 'vendas-dia', setor: 'vendas', periodo: 'dia', ativo: true, duracaoSegundos: 20,
        linhaInicial: 4,
        colunas: { nome: 'E', aproveitamento: 'F', vendasImediato: 'G', contratos: 'H' },
        rotuloCelulas: ['F2'], ordenarPor: 'aproveitamento', direcao: 'desc'
      },
      {
        chave: 'vendas-semana', setor: 'vendas', periodo: 'semana', ativo: true, duracaoSegundos: 20,
        linhaInicial: 4,
        colunas: { nome: 'P', aproveitamento: 'Q', vendasImediato: 'R', contratos: 'S' },
        rotuloCelulas: ['Q2', 'R2'], ordenarPor: 'aproveitamento', direcao: 'desc'
      },
      {
        chave: 'vendas-mes', setor: 'vendas', periodo: 'mes', ativo: true, duracaoSegundos: 20,
        linhaInicial: 4,
        colunas: { nome: 'AA', aproveitamento: 'AB', vendasImediato: 'AC', contratos: 'AD' },
        rotuloCelulas: ['AA2', 'AB2', 'AC2'], ordenarPor: 'aproveitamento', direcao: 'desc'
      },
      {
        chave: 'vendas-ano', setor: 'vendas', periodo: 'ano', ativo: false, duracaoSegundos: 20,
        linhaInicial: 4,
        colunas: { nome: '', aproveitamento: '', vendasImediato: '', contratos: '' },
        rotuloCelulas: [], ordenarPor: 'aproveitamento', direcao: 'desc'
      }
    ]
  };
}

var CAMPOS_ORDENAVEIS = ['aproveitamento', 'vendasImediato', 'contratos', 'nome'];

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
    });
  }
  if (typeof config.qtdLista !== 'number' || config.qtdLista < 0) {
    erros.push('qtdLista precisa ser um número maior ou igual a 0');
  }
  if (['claro', 'escuro', 'amo'].indexOf(config.tema) === -1) {
    erros.push('tema precisa ser "claro", "escuro" ou "amo"');
  }
  return { valido: erros.length === 0, erros: erros };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { configPadrao: configPadrao, validarConfig: validarConfig };
}
