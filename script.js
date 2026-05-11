/**
 * script.js — Confirmação de presença
 * Aniversário do Iago 3 Anos 🏗️
 *
 * IMPORTANTE: Este projeto é HTML puro (sem Vite/Webpack/bundler).
 * Por isso usamos o Firebase via CDN (gstatic.com), que funciona
 * diretamente no navegador sem precisar de npm install.
 *
 * O "npm install firebase" é para projetos com bundler (React, Vue, etc).
 * Para HTML puro, o CDN é a abordagem correta e oficial do Firebase.
 */

// ============================================================
// 🔥 IMPORTS DO FIREBASE VIA CDN
// Versão fixa para garantir estabilidade
// ============================================================
import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================================
// 🔥 CONFIGURAÇÃO DO FIREBASE
// Suas credenciais reais do projeto guerra-faz-3-anos
// ============================================================
const firebaseConfig = {
  apiKey:            "AIzaSyBD3ICuxLA2aRYDV-ucWb7eygFef-RYDxo",
  authDomain:        "guerra-faz-3-anos.firebaseapp.com",
  projectId:         "guerra-faz-3-anos",
  storageBucket:     "guerra-faz-3-anos.firebasestorage.app",
  messagingSenderId: "232913922587",
  appId:             "1:232913922587:web:231f4e02916a7dbc5a26be",
  measurementId:     "G-XV9HM3KHDX"
};

// Inicializa o app Firebase
const app = initializeApp(firebaseConfig);

// Obtém a instância do Firestore
const db = getFirestore(app);

// Nome da coleção no Firestore
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
let acompanhantesList = [];

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/** Valida nome com pelo menos 2 palavras */
function validarNomeCompleto(nome) {
  const partes = nome.trim().split(/\s+/);
  return partes.length >= 2 && partes.every(p => p.length >= 1);
}

/** Exibe ou limpa erro em um span */
function exibirErro(spanErro, mensagem) {
  if (mensagem) {
    spanErro.textContent = mensagem;
    spanErro.classList.add('visivel');
  } else {
    spanErro.textContent = '';
    spanErro.classList.remove('visivel');
  }
}

/** Marca/desmarca input como inválido */
function marcarErroInput(input, temErro) {
  input.classList.toggle('erro', temErro);
}

/** Bloqueia ou libera o botão durante o envio ao Firestore */
function setCarregando(carregando) {
  btnConfirmar.disabled    = carregando;
  btnConfirmar.textContent = carregando
    ? '⏳ Confirmando...'
    : '🏗️ Confirmar Presença';
}

// ============================================================
// FIREBASE — SALVAR NO FIRESTORE
// ============================================================

/**
 * Grava a confirmação na coleção "confirmacoes" do Firestore.
 * addDoc() cria um documento com ID gerado automaticamente.
 * serverTimestamp() usa o relógio do servidor Firebase.
 */
async function salvarNoFirestore(confirmacao) {
  await addDoc(collection(db, COLECAO), {
    nomeConvidado:   confirmacao.nomeConvidado,
    temAcompanhante: confirmacao.temAcompanhante,
    acompanhantes:   confirmacao.acompanhantes,
    totalPessoas:    confirmacao.totalPessoas,
    dataHora:        serverTimestamp()
  });
}

// ============================================================
// ACOMPANHANTES
// ============================================================

function renderizarListaAcompanhantes() {
  listaAcompanhantes.innerHTML = '';
  if (acompanhantesList.length === 0) return;

  acompanhantesList.forEach((nome, index) => {
    const li       = document.createElement('li');
    const spanNome = document.createElement('span');
    const btnRem   = document.createElement('button');

    spanNome.textContent = nome;

    btnRem.type        = 'button';
    btnRem.className   = 'btn-remover-acompanhante';
    btnRem.textContent = '🗑️';
    btnRem.setAttribute('aria-label', `Remover ${nome}`);
    btnRem.addEventListener('click', () => removerAcompanhante(index));

    li.appendChild(spanNome);
    li.appendChild(btnRem);
    listaAcompanhantes.appendChild(li);
  });
}

function adicionarAcompanhante() {
  const nome = inputAcompanhante.value.trim();

  if (!nome) {
    exibirErro(erroAcompanhante, '⚠️ Digite o nome do acompanhante.');
    inputAcompanhante.focus();
    return;
  }
  if (!validarNomeCompleto(nome)) {
    exibirErro(erroAcompanhante, '⚠️ O nome deve ter pelo menos duas palavras.');
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

function removerAcompanhante(index) {
  acompanhantesList.splice(index, 1);
  renderizarListaAcompanhantes();
}

// ============================================================
// TOGGLE SIM / NÃO
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
// VALIDAÇÃO
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
// RESET
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

radiosAcompanhante.forEach(r =>
  r.addEventListener('change', e => atualizarToggleAcompanhante(e.target.value))
);

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
// SUBMIT — grava no Firestore
// ============================================================

formPresenca.addEventListener('submit', async (e) => {
  e.preventDefault();

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
  };

  try {
    setCarregando(true);
    await salvarNoFirestore(confirmacao);

    // ✅ Sucesso
    msgSucesso.classList.add('visivel');
    msgSucesso.scrollIntoView({ behavior: 'smooth', block: 'center' });
    resetarFormulario();
    setTimeout(() => msgSucesso.classList.remove('visivel'), 6000);

  } catch (erro) {
    // ❌ Erro — mostra detalhes no console para depuração
    console.error('Código do erro Firebase:', erro.code);
    console.error('Mensagem:', erro.message);

    // Mensagens amigáveis por tipo de erro
    let msgErro = '❌ Erro ao confirmar presença. Tente novamente.';
    if (erro.code === 'permission-denied') {
      msgErro = '❌ Permissão negada pelo banco de dados. Verifique as regras do Firestore.';
    } else if (erro.code === 'unavailable') {
      msgErro = '❌ Sem conexão com o servidor. Verifique sua internet.';
    }

    alert(msgErro);
  } finally {
    setCarregando(false);
  }
});
