/**
 * script.js — Lógica da página pública de confirmação de presença
 * Aniversário do Iago 3 Anos 🏗️
 *
 * Responsabilidades deste arquivo:
 *  - Controlar exibição da área de acompanhantes (Sim/Não)
 *  - Gerenciar lista de acompanhantes (adicionar/remover)
 *  - Validar todos os campos do formulário
 *  - Salvar confirmação no LocalStorage
 *  - Exibir mensagem de sucesso animada
 *
 * Estrutura dos dados salvos no LocalStorage:
 *  Chave: "confirmacoes_iago"
 *  Valor: JSON.stringify(Array<Confirmacao>)
 *
 *  Objeto Confirmacao:
 *  {
 *    id:              string  // UUID simples baseado em timestamp
 *    nomeConvidado:   string  // Nome completo do convidado principal
 *    temAcompanhante: boolean // Se marcou "Sim"
 *    acompanhantes:   string[] // Array de nomes dos acompanhantes
 *    totalPessoas:    number  // 1 + acompanhantes.length
 *    dataHora:        string  // ISO string da data/hora da confirmação
 *  }
 */

// ============================================================
// SELEÇÃO DE ELEMENTOS DO DOM
// ============================================================

/** Formulário principal de confirmação */
const formPresenca = document.getElementById('form-presenca');

/** Input do nome do convidado principal */
const inputNome = document.getElementById('nome-convidado');

/** Span de erro do nome do convidado */
const erroNome = document.getElementById('erro-nome');

/** Área que contém os campos de acompanhantes (inicialmente oculta) */
const areaAcompanhantes = document.getElementById('area-acompanhantes');

/** Lista <ul> onde os acompanhantes adicionados são exibidos */
const listaAcompanhantes = document.getElementById('lista-acompanhantes');

/** Input para digitar o nome de um novo acompanhante */
const inputAcompanhante = document.getElementById('input-acompanhante');

/** Botão para adicionar o acompanhante digitado à lista */
const btnAddAcompanhante = document.getElementById('btn-add-acompanhante');

/** Span de erro da área de acompanhantes */
const erroAcompanhante = document.getElementById('erro-acompanhante');

/** Div de mensagem de sucesso (aparece após confirmar) */
const msgSucesso = document.getElementById('msg-sucesso');

/** Labels das opções de rádio (para aplicar classe "selecionado") */
const labelSim = document.getElementById('label-sim');
const labelNao = document.getElementById('label-nao');

/** Todos os inputs de rádio (Sim/Não) */
const radiosAcompanhante = document.querySelectorAll('input[name="acompanhante"]');

// ============================================================
// ESTADO LOCAL (em memória, durante a sessão da página)
// ============================================================

/**
 * Array que mantém os nomes dos acompanhantes adicionados
 * durante o preenchimento do formulário atual.
 * É resetado após cada confirmação bem-sucedida.
 * @type {string[]}
 */
let acompanhantesList = [];

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/**
 * Gera um ID único simples baseado em timestamp + número aleatório.
 * Usado para identificar cada confirmação salva.
 * @returns {string} ID único ex: "1720800000000_4823"
 */
function gerarId() {
  return Date.now() + '_' + Math.floor(Math.random() * 9000 + 1000);
}

/**
 * Valida se um nome tem pelo menos duas palavras.
 * Exigência do projeto para evitar nomes incompletos.
 * @param {string} nome - Nome a validar
 * @returns {boolean} true se válido
 */
function validarNomeCompleto(nome) {
  const partes = nome.trim().split(/\s+/); // divide por qualquer espaço
  return partes.length >= 2 && partes.every(p => p.length >= 1);
}

/**
 * Exibe ou oculta uma mensagem de erro em um span de erro.
 * @param {HTMLElement} spanErro - O elemento <span> de erro
 * @param {string|null} mensagem - Texto do erro (null para limpar)
 */
function exibirErro(spanErro, mensagem) {
  if (mensagem) {
    spanErro.textContent = mensagem;
    spanErro.classList.add('visivel');
  } else {
    spanErro.textContent = '';
    spanErro.classList.remove('visivel');
  }
}

/**
 * Marca ou desmarca visualmente o campo de input como com erro.
 * @param {HTMLInputElement} input
 * @param {boolean} temErro
 */
function marcarErroInput(input, temErro) {
  if (temErro) {
    input.classList.add('erro');
  } else {
    input.classList.remove('erro');
  }
}

// ============================================================
// FUNÇÕES DO LOCALSTORAGE
// ============================================================

/**
 * Chave usada para armazenar as confirmações no LocalStorage.
 * Centralizada aqui para facilitar manutenção futura
 * (ex: mudança de chave ou migração para API).
 * @constant {string}
 */
const CHAVE_STORAGE = 'confirmacoes_iago';

/**
 * Recupera todas as confirmações salvas no LocalStorage.
 * Retorna array vazio se não houver dados ou em caso de erro de parse.
 * @returns {Array<Object>}
 */
function obterConfirmacoes() {
  try {
    const dados = localStorage.getItem(CHAVE_STORAGE);
    return dados ? JSON.parse(dados) : [];
  } catch (e) {
    // Se o JSON estiver corrompido, retorna array vazio
    console.error('Erro ao ler LocalStorage:', e);
    return [];
  }
}

/**
 * Salva o array completo de confirmações no LocalStorage.
 * Toda persistência de dados passa por esta função,
 * facilitando futura migração para API REST.
 * @param {Array<Object>} confirmacoes
 */
function salvarConfirmacoes(confirmacoes) {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(confirmacoes));
  } catch (e) {
    console.error('Erro ao salvar no LocalStorage:', e);
    alert('Erro ao salvar presença. Por favor, tente novamente.');
  }
}

/**
 * Adiciona uma nova confirmação ao LocalStorage.
 * Recupera o array existente, adiciona o novo item e salva.
 * @param {Object} novaConfirmacao - Objeto com os dados da confirmação
 */
function adicionarConfirmacao(novaConfirmacao) {
  const confirmacoes = obterConfirmacoes();
  confirmacoes.push(novaConfirmacao);
  salvarConfirmacoes(confirmacoes);
}

// ============================================================
// LÓGICA DE ACOMPANHANTES (adicionar/remover/renderizar)
// ============================================================

/**
 * Renderiza a lista visual de acompanhantes no <ul> da página.
 * Chamada toda vez que acompanhantesList é alterado.
 * Cada item tem botão de remover vinculado pelo índice.
 */
function renderizarListaAcompanhantes() {
  // Limpa o conteúdo atual da lista
  listaAcompanhantes.innerHTML = '';

  // Se não há acompanhantes, nada a mostrar
  if (acompanhantesList.length === 0) return;

  // Cria um <li> para cada acompanhante
  acompanhantesList.forEach((nome, index) => {
    const li = document.createElement('li');

    // Span com o nome do acompanhante
    const spanNome = document.createElement('span');
    spanNome.textContent = nome;

    // Botão para remover este acompanhante específico
    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.className = 'btn-remover-acompanhante';
    btnRemover.textContent = '🗑️';
    btnRemover.setAttribute('aria-label', `Remover ${nome}`);

    // Ao clicar em remover, remove do array e re-renderiza
    btnRemover.addEventListener('click', () => {
      removerAcompanhante(index);
    });

    li.appendChild(spanNome);
    li.appendChild(btnRemover);
    listaAcompanhantes.appendChild(li);
  });
}

/**
 * Adiciona um novo acompanhante à lista.
 * Valida o nome antes de adicionar (nome completo, 2 palavras).
 */
function adicionarAcompanhante() {
  const nome = inputAcompanhante.value.trim();

  // Validação 1: campo não pode ser vazio
  if (!nome) {
    exibirErro(erroAcompanhante, '⚠️ Digite o nome do acompanhante.');
    inputAcompanhante.focus();
    return;
  }

  // Validação 2: nome deve ter pelo menos 2 palavras
  if (!validarNomeCompleto(nome)) {
    exibirErro(erroAcompanhante, '⚠️ O nome do acompanhante deve ter pelo menos duas palavras.');
    marcarErroInput(inputAcompanhante, true);
    inputAcompanhante.focus();
    return;
  }

  // Limpa erros anteriores
  exibirErro(erroAcompanhante, null);
  marcarErroInput(inputAcompanhante, false);

  // Adiciona ao array e re-renderiza
  acompanhantesList.push(nome);
  renderizarListaAcompanhantes();

  // Limpa o campo após adicionar
  inputAcompanhante.value = '';
  inputAcompanhante.focus();
}

/**
 * Remove um acompanhante da lista pelo seu índice no array.
 * @param {number} index - Posição do acompanhante no array
 */
function removerAcompanhante(index) {
  // splice(index, 1) remove exatamente 1 elemento na posição index
  acompanhantesList.splice(index, 1);
  renderizarListaAcompanhantes();
}

// ============================================================
// CONTROLE DO TOGGLE SIM/NÃO (acompanhante)
// ============================================================

/**
 * Atualiza a aparência visual dos rádios (marcado/desmarcado)
 * e exibe/oculta a área de acompanhantes conforme seleção.
 * @param {string} valor - "sim" ou "nao"
 */
function atualizarToggleAcompanhante(valor) {
  // Atualiza classe visual nos labels dos rádios
  if (valor === 'sim') {
    labelSim.classList.add('selecionado');
    labelNao.classList.remove('selecionado');

    // Mostra a área de acompanhantes com animação
    areaAcompanhantes.classList.add('visivel');
    areaAcompanhantes.setAttribute('aria-hidden', 'false');
  } else {
    labelNao.classList.add('selecionado');
    labelSim.classList.remove('selecionado');

    // Oculta e limpa a área de acompanhantes
    areaAcompanhantes.classList.remove('visivel');
    areaAcompanhantes.setAttribute('aria-hidden', 'true');

    // Reseta o array e a lista visual ao selecionar "Não"
    acompanhantesList = [];
    renderizarListaAcompanhantes();
    exibirErro(erroAcompanhante, null);
  }
}

// ============================================================
// VALIDAÇÃO COMPLETA DO FORMULÁRIO
// ============================================================

/**
 * Valida todos os campos do formulário antes de submeter.
 * Retorna true se tudo estiver válido; false se houver erros.
 * @returns {boolean}
 */
function validarFormulario() {
  let valido = true;

  // --- Validação do nome do convidado principal ---
  const nome = inputNome.value.trim();

  if (!nome) {
    exibirErro(erroNome, '⚠️ Por favor, informe seu nome completo.');
    marcarErroInput(inputNome, true);
    valido = false;
  } else if (!validarNomeCompleto(nome)) {
    exibirErro(erroNome, '⚠️ Digite seu nome completo com pelo menos duas palavras.');
    marcarErroInput(inputNome, true);
    valido = false;
  } else {
    exibirErro(erroNome, null);
    marcarErroInput(inputNome, false);
  }

  // --- Validação de acompanhantes ---
  // Verifica qual rádio está selecionado
  const radioSelecionado = document.querySelector('input[name="acompanhante"]:checked');
  const temAcompanhante = radioSelecionado && radioSelecionado.value === 'sim';

  if (temAcompanhante && acompanhantesList.length === 0) {
    exibirErro(erroAcompanhante, '⚠️ Adicione pelo menos um acompanhante ou selecione "Não".');
    valido = false;
  } else if (temAcompanhante) {
    exibirErro(erroAcompanhante, null);
  }

  return valido;
}

// ============================================================
// RESET DO FORMULÁRIO (após confirmação bem-sucedida)
// ============================================================

/**
 * Reseta todos os campos e estado do formulário para o estado inicial.
 * Chamado após salvar a confirmação com sucesso.
 */
function resetarFormulario() {
  // Limpa o input de nome
  inputNome.value = '';
  marcarErroInput(inputNome, false);
  exibirErro(erroNome, null);

  // Volta rádio para "Não" (padrão)
  const radioNao = document.querySelector('input[name="acompanhante"][value="nao"]');
  if (radioNao) radioNao.checked = true;
  atualizarToggleAcompanhante('nao');

  // Limpa o input de acompanhante e erros
  inputAcompanhante.value = '';
  exibirErro(erroAcompanhante, null);
  marcarErroInput(inputAcompanhante, false);
}

// ============================================================
// EVENT LISTENERS — conexão entre DOM e funções
// ============================================================

/**
 * Ouve mudanças nos rádios de acompanhante (Sim/Não).
 * Quando o valor muda, chama atualizarToggleAcompanhante().
 */
radiosAcompanhante.forEach(radio => {
  radio.addEventListener('change', (e) => {
    atualizarToggleAcompanhante(e.target.value);
  });
});

/**
 * Ao clicar no label, também atualiza o toggle manualmente
 * (garante funcionamento em todos os navegadores/mobile).
 */
labelSim.addEventListener('click', () => atualizarToggleAcompanhante('sim'));
labelNao.addEventListener('click', () => atualizarToggleAcompanhante('nao'));

/**
 * Botão "Adicionar" na área de acompanhantes.
 */
btnAddAcompanhante.addEventListener('click', adicionarAcompanhante);

/**
 * Permite pressionar Enter no input de acompanhante para adicionar.
 */
inputAcompanhante.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); // Evita submit do form
    adicionarAcompanhante();
  }
});

/**
 * Remove o estado de erro do input de nome ao digitar.
 * Melhora a experiência do usuário (feedback imediato).
 */
inputNome.addEventListener('input', () => {
  if (inputNome.value.trim()) {
    marcarErroInput(inputNome, false);
    exibirErro(erroNome, null);
  }
});

/**
 * Remove o estado de erro do input de acompanhante ao digitar.
 */
inputAcompanhante.addEventListener('input', () => {
  marcarErroInput(inputAcompanhante, false);
  exibirErro(erroAcompanhante, null);
});

/**
 * Submit do formulário principal.
 * Valida, monta o objeto de confirmação e salva no LocalStorage.
 */
formPresenca.addEventListener('submit', (e) => {
  // Previne o comportamento padrão do HTML (envio/reload)
  e.preventDefault();

  // Executa validação completa
  if (!validarFormulario()) {
    // Scrolla até o primeiro erro visível para o usuário
    const primeiroErro = document.querySelector('.msg-erro.visivel');
    if (primeiroErro) {
      primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  // --- Monta o objeto de confirmação ---
  const radioSelecionado = document.querySelector('input[name="acompanhante"]:checked');
  const temAcompanhante  = radioSelecionado.value === 'sim';

  /**
   * Objeto que representa uma confirmação de presença.
   * Estrutura pensada para futura migração para API/banco de dados.
   */
  const confirmacao = {
    id:              gerarId(),
    nomeConvidado:   inputNome.value.trim(),
    temAcompanhante: temAcompanhante,
    acompanhantes:   temAcompanhante ? [...acompanhantesList] : [],
    totalPessoas:    1 + (temAcompanhante ? acompanhantesList.length : 0),
    dataHora:        new Date().toISOString() // Formato ISO para fácil conversão
  };

  // --- Salva no LocalStorage ---
  adicionarConfirmacao(confirmacao);

  // --- Feedback visual de sucesso ---
  msgSucesso.classList.add('visivel');

  // Scrolla para a mensagem de sucesso
  msgSucesso.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // --- Reseta o formulário ---
  resetarFormulario();

  // --- Oculta a mensagem de sucesso após 6 segundos ---
  setTimeout(() => {
    msgSucesso.classList.remove('visivel');
  }, 6000);
});
