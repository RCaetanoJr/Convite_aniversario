/**
 * script.js — Página pública de confirmação de presença
 * Aniversário do Iago 3 Anos 🏗️
 *
 * ── MIGRAÇÃO: LocalStorage → Firebase Firestore ──
 * Os dados agora são salvos em nuvem e ficam disponíveis
 * para qualquer pessoa que acesse o painel, em qualquer dispositivo.
 *
 * Coleção no Firestore: "confirmacoes"
 * Cada documento representa uma confirmação de presença.
 *
 * Estrutura do documento:
 * {
 *   nomeConvidado:   string    // Nome completo do convidado principal
 *   temAcompanhante: boolean   // Se marcou "Sim"
 *   acompanhantes:   string[]  // Array de nomes dos acompanhantes
 *   totalPessoas:    number    // 1 + acompanhantes.length
 *   dataHora:        Timestamp // Timestamp do Firestore (auto)
 * }
 */

// ============================================================
// 🔥 CONFIGURAÇÃO DO FIREBASE
// ──────────────────────────────────────────────────────────
// INSTRUÇÕES:
//   1. Acesse https://console.firebase.google.com
//   2. Crie um projeto (ex: "aniversario-iago")
//   3. Clique em "Adicionar app" → Web (</>)
//   4. Copie o objeto firebaseConfig e cole abaixo
//   5. No console do Firebase, vá em Firestore Database
//      → Criar banco de dados → Modo de teste → Criar
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * ⚠️ SUBSTITUA PELOS SEUS DADOS DO FIREBASE CONSOLE
 * Acesse: Configurações do Projeto → Seus apps → SDK setup
 */
const firebaseConfig = {
  apiKey: "AIzaSyBD3ICuxLA2aRYDV-ucWb7eygFef-RYDxo",
  authDomain: "guerra-faz-3-anos.firebaseapp.com",
  projectId: "guerra-faz-3-anos",
  storageBucket: "guerra-faz-3-anos.firebasestorage.app",
  messagingSenderId: "232913922587",
  appId: "1:232913922587:web:231f4e02916a7dbc5a26be",
  measurementId: "G-XV9HM3KHDX"
};
// Inicializa o Firebase com as configurações acima
const app = initializeApp(firebaseConfig);

// Obtém a instância do Firestore (banco de dados)
const db = getFirestore(app);

/**
 * Nome da coleção no Firestore onde as confirmações são salvas.
 * Centralizado aqui para fácil manutenção.
 * @constant {string}
 */
const COLECAO = "confirmacoes";

// ============================================================
// SELEÇÃO DE ELEMENTOS DO DOM
// ============================================================

const formPresenca       = document.getElementById('form-presenca');
const inputNome          = document.getElementById('nome-convidado');
const erroNome           = document.getElementById('erro-nome');
const areaAcompanhantes  = document.getElementById('area-acompanhantes');
const listaAcompanhantes = document.getElementById('lista-acompanhantes');
const inputAcompanhante  = document.getElementById('input-acompanhante');
const btnAddAcompanhante = document.getElementById('btn-add-acompanhante');
const erroAcompanhante   = document.getElementById('erro-acompanhante');
const msgSucesso         = document.getElementById('msg-sucesso');
const labelSim           = document.getElementById('label-sim');
const labelNao           = document.getElementById('label-nao');
const radiosAcompanhante = document.querySelectorAll('input[name="acompanhante"]');
const btnConfirmar       = document.querySelector('.btn-confirmar');

// ============================================================
// ESTADO LOCAL
// ============================================================

/** Lista de acompanhantes adicionados no formulário atual */
let acompanhantesList = [];

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/**
 * Valida se um nome tem pelo menos duas palavras.
 * @param {string} nome
 * @returns {boolean}
 */
function validarNomeCompleto(nome) {
  const partes = nome.trim().split(/\s+/);
  return partes.length >= 2 && partes.every(p => p.length >= 1);
}

/**
 * Exibe ou limpa mensagem de erro num span.
 * @param {HTMLElement} spanErro
 * @param {string|null} mensagem
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
 * Marca/desmarca visualmente um input como inválido.
 * @param {HTMLInputElement} input
 * @param {boolean} temErro
 */
function marcarErroInput(input, temErro) {
  input.classList.toggle('erro', temErro);
}

/**
 * Bloqueia ou libera o botão de confirmar durante o envio.
 * Evita duplo clique enquanto o Firestore processa.
 * @param {boolean} carregando
 */
function setCarregando(carregando) {
  btnConfirmar.disabled = carregando;
  btnConfirmar.textContent = carregando
    ? '⏳ Confirmando...'
    : '🏗️ Confirmar Presença';
}

// ============================================================
// FIREBASE — SALVAR CONFIRMAÇÃO
// ============================================================

/**
 * Salva uma confirmação de presença no Firestore.
 * Usa addDoc() que cria um documento com ID automático.
 * O campo dataHora usa serverTimestamp() para garantir
 * que o horário seja o do servidor (não do dispositivo do usuário).
 *
 * @param {Object} confirmacao - Dados da confirmação (sem dataHora)
 * @returns {Promise<void>}
 */
async function salvarNoFirestore(confirmacao) {
  // Adiciona um documento novo na coleção "confirmacoes"
  // O Firestore gera o ID automaticamente
  await addDoc(collection(db, COLECAO), {
    nomeConvidado:   confirmacao.nomeConvidado,
    temAcompanhante: confirmacao.temAcompanhante,
    acompanhantes:   confirmacao.acompanhantes,
    totalPessoas:    confirmacao.totalPessoas,
    dataHora:        serverTimestamp() // ← horário do servidor Firebase
  });
}

// ============================================================
// ACOMPANHANTES — renderizar / adicionar / remover
// ============================================================

/** Renderiza a lista visual de acompanhantes no <ul> */
function renderizarListaAcompanhantes() {
  listaAcompanhantes.innerHTML = '';
  if (acompanhantesList.length === 0) return;

  acompanhantesList.forEach((nome, index) => {
    const li        = document.createElement('li');
    const spanNome  = document.createElement('span');
    const btnRem    = document.createElement('button');

    spanNome.textContent = nome;

    btnRem.type      = 'button';
    btnRem.className = 'btn-remover-acompanhante';
    btnRem.textContent = '🗑️';
    btnRem.setAttribute('aria-label', `Remover ${nome}`);
    btnRem.addEventListener('click', () => removerAcompanhante(index));

    li.appendChild(spanNome);
    li.appendChild(btnRem);
    listaAcompanhantes.appendChild(li);
  });
}

/** Adiciona acompanhante à lista após validação */
function adicionarAcompanhante() {
  const nome = inputAcompanhante.value.trim();

  if (!nome) {
    exibirErro(erroAcompanhante, '⚠️ Digite o nome do acompanhante.');
    inputAcompanhante.focus();
    return;
  }
  if (!validarNomeCompleto(nome)) {
    exibirErro(erroAcompanhante, '⚠️ O nome do acompanhante deve ter pelo menos duas palavras.');
    marcarErroInput(inputAcompanhante, true);
    inputAcompanhante.focus();
    return;
  }

  exibirErro(erroAcompanhante, null);
  marcarErroInput(inputAcompanhante, false);
  acompanhantesList.push(nome);
  renderizarListaAcompanhantes();
  inputAcompanhante.value = '';
  inputAcompanhante.focus();
}

/** Remove acompanhante da lista pelo índice */
function removerAcompanhante(index) {
  acompanhantesList.splice(index, 1);
  renderizarListaAcompanhantes();
}

// ============================================================
// TOGGLE SIM/NÃO
// ============================================================

function atualizarToggleAcompanhante(valor) {
  if (valor === 'sim') {
    labelSim.classList.add('selecionado');
    labelNao.classList.remove('selecionado');
    areaAcompanhantes.classList.add('visivel');
    areaAcompanhantes.setAttribute('aria-hidden', 'false');
  } else {
    labelNao.classList.add('selecionado');
    labelSim.classList.remove('selecionado');
    areaAcompanhantes.classList.remove('visivel');
    areaAcompanhantes.setAttribute('aria-hidden', 'true');
    acompanhantesList = [];
    renderizarListaAcompanhantes();
    exibirErro(erroAcompanhante, null);
  }
}

// ============================================================
// VALIDAÇÃO DO FORMULÁRIO
// ============================================================

function validarFormulario() {
  let valido = true;
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

  const radioSelecionado = document.querySelector('input[name="acompanhante"]:checked');
  const temAcompanhante  = radioSelecionado && radioSelecionado.value === 'sim';

  if (temAcompanhante && acompanhantesList.length === 0) {
    exibirErro(erroAcompanhante, '⚠️ Adicione pelo menos um acompanhante ou selecione "Não".');
    valido = false;
  } else if (temAcompanhante) {
    exibirErro(erroAcompanhante, null);
  }

  return valido;
}

// ============================================================
// RESET DO FORMULÁRIO
// ============================================================

function resetarFormulario() {
  inputNome.value = '';
  marcarErroInput(inputNome, false);
  exibirErro(erroNome, null);

  const radioNao = document.querySelector('input[name="acompanhante"][value="nao"]');
  if (radioNao) radioNao.checked = true;
  atualizarToggleAcompanhante('nao');

  inputAcompanhante.value = '';
  exibirErro(erroAcompanhante, null);
  marcarErroInput(inputAcompanhante, false);
}

// ============================================================
// EVENT LISTENERS
// ============================================================

radiosAcompanhante.forEach(radio => {
  radio.addEventListener('change', e => atualizarToggleAcompanhante(e.target.value));
});

labelSim.addEventListener('click', () => atualizarToggleAcompanhante('sim'));
labelNao.addEventListener('click', () => atualizarToggleAcompanhante('nao'));

btnAddAcompanhante.addEventListener('click', adicionarAcompanhante);

inputAcompanhante.addEventListener('keypress', e => {
  if (e.key === 'Enter') { e.preventDefault(); adicionarAcompanhante(); }
});

inputNome.addEventListener('input', () => {
  if (inputNome.value.trim()) {
    marcarErroInput(inputNome, false);
    exibirErro(erroNome, null);
  }
});

inputAcompanhante.addEventListener('input', () => {
  marcarErroInput(inputAcompanhante, false);
  exibirErro(erroAcompanhante, null);
});

// ============================================================
// SUBMIT DO FORMULÁRIO — salva no Firestore
// ============================================================

formPresenca.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Valida antes de tentar salvar
  if (!validarFormulario()) {
    const primeiroErro = document.querySelector('.msg-erro.visivel');
    if (primeiroErro) primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const radioSelecionado = document.querySelector('input[name="acompanhante"]:checked');
  const temAcompanhante  = radioSelecionado.value === 'sim';

  const confirmacao = {
    nomeConvidado:   inputNome.value.trim(),
    temAcompanhante: temAcompanhante,
    acompanhantes:   temAcompanhante ? [...acompanhantesList] : [],
    totalPessoas:    1 + (temAcompanhante ? acompanhantesList.length : 0)
    // dataHora é adicionado pelo serverTimestamp() dentro de salvarNoFirestore()
  };

  try {
    // Bloqueia o botão para evitar duplo envio
    setCarregando(true);

    // ── Salva no Firestore ──
    await salvarNoFirestore(confirmacao);

    // Sucesso: exibe mensagem e limpa formulário
    msgSucesso.classList.add('visivel');
    msgSucesso.scrollIntoView({ behavior: 'smooth', block: 'center' });
    resetarFormulario();

    setTimeout(() => msgSucesso.classList.remove('visivel'), 6000);

  } catch (erro) {
    // Erro de rede ou permissão do Firestore
    console.error('Erro ao salvar no Firestore:', erro);
    alert('❌ Erro ao confirmar presença. Verifique sua conexão e tente novamente.');
  } finally {
    // Sempre reativa o botão ao final (sucesso ou erro)
    setCarregando(false);
  }
});
