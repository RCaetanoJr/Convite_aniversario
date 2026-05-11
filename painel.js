/**
 * painel.js — Painel Administrativo
 * Aniversário do Iago 3 Anos 🏗️
 *
 * ── MIGRAÇÃO: LocalStorage → Firebase Firestore ──
 * O painel agora lê os dados diretamente do Firestore.
 * Usa onSnapshot() para atualização em TEMPO REAL:
 * toda vez que alguém confirma presença, o painel
 * atualiza automaticamente sem precisar recarregar a página.
 *
 * Coleção: "confirmacoes"
 */

// ============================================================
// 🔥 CONFIGURAÇÃO DO FIREBASE
// ──────────────────────────────────────────────────────────
// ⚠️ USE AS MESMAS CREDENCIAIS DO script.js
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * ⚠️ SUBSTITUA PELOS SEUS DADOS DO FIREBASE CONSOLE
 * Deve ser idêntico ao firebaseConfig em script.js
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

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

/** Nome da coleção — deve ser igual ao script.js */
const COLECAO = "confirmacoes";

// ============================================================
// SELEÇÃO DE ELEMENTOS DO DOM
// ============================================================

const elTotalConfirmacoes  = document.getElementById('total-confirmacoes');
const elTotalPrincipais    = document.getElementById('total-principais');
const elTotalAcompanhantes = document.getElementById('total-acompanhantes');
const elTotalPessoas       = document.getElementById('total-pessoas');
const inputBusca           = document.getElementById('input-busca');
const tabelaBody           = document.getElementById('tabela-body');
const tabelaWrapper        = document.getElementById('tabela-wrapper');
const estadoVazio          = document.getElementById('estado-vazio');
const btnExportar          = document.getElementById('btn-exportar');
const btnLimparTudo        = document.getElementById('btn-limpar-tudo');

// ============================================================
// CACHE LOCAL — dados recebidos do Firestore
// Mantido em memória para permitir busca e exportação
// sem fazer novas leituras desnecessárias no banco.
// ============================================================

/**
 * Array com todas as confirmações recebidas do Firestore.
 * Cada item inclui o campo `_id` com o ID do documento,
 * necessário para operações de exclusão.
 * @type {Array<Object>}
 */
let cacheConfirmacoes = [];

// ============================================================
// FORMATAÇÃO DE DATA/HORA
// ============================================================

/**
 * Converte um Timestamp do Firestore para string legível em pt-BR.
 * O Firestore retorna objetos Timestamp com método .toDate().
 * @param {import("firebase/firestore").Timestamp|null} timestamp
 * @returns {string}
 */
function formatarDataHora(timestamp) {
  if (!timestamp) return '—';
  try {
    // .toDate() converte Timestamp do Firestore para Date nativo
    const data = timestamp.toDate();
    return data.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return '—';
  }
}

// ============================================================
// TOTALIZADORES
// ============================================================

/**
 * Calcula e anima os cards de resumo.
 * Sempre usa o array completo (sem filtro de busca).
 * @param {Array<Object>} confirmacoes
 */
function atualizarResumo(confirmacoes) {
  const totalConfirmacoes  = confirmacoes.length;
  const totalPrincipais    = confirmacoes.length;
  const totalAcompanhantes = confirmacoes.reduce((s, c) => s + (c.acompanhantes?.length || 0), 0);
  const totalPessoas       = confirmacoes.reduce((s, c) => s + (c.totalPessoas || 1), 0);

  animarNumero(elTotalConfirmacoes,  totalConfirmacoes);
  animarNumero(elTotalPrincipais,    totalPrincipais);
  animarNumero(elTotalAcompanhantes, totalAcompanhantes);
  animarNumero(elTotalPessoas,       totalPessoas);
}

/**
 * Anima contagem de 0 até o valor final num elemento.
 * @param {HTMLElement} el
 * @param {number} valorFinal
 */
function animarNumero(el, valorFinal) {
  const duracao = 500;
  const inicio  = Date.now();
  const de      = parseInt(el.textContent) || 0;
  const tick    = () => {
    const p = Math.min((Date.now() - inicio) / duracao, 1);
    el.textContent = Math.floor(de + (valorFinal - de) * p);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ============================================================
// RENDERIZAÇÃO DA TABELA
// ============================================================

/**
 * Renderiza a tabela com o array de confirmações recebido.
 * Pode ser o array completo ou filtrado pela busca.
 * @param {Array<Object>} confirmacoes
 */
function renderizarTabela(confirmacoes) {
  tabelaBody.innerHTML = '';

  if (confirmacoes.length === 0) {
    tabelaWrapper.style.display = 'none';
    estadoVazio.style.display   = 'block';
    return;
  }

  tabelaWrapper.style.display = 'block';
  estadoVazio.style.display   = 'none';

  confirmacoes.forEach((c, index) => {
    const tr = document.createElement('tr');

    // # número sequencial
    const tdNum = document.createElement('td');
    tdNum.textContent = index + 1;
    tr.appendChild(tdNum);

    // Nome do convidado principal
    const tdNome = document.createElement('td');
    tdNome.textContent   = c.nomeConvidado || '—';
    tdNome.style.fontWeight = '700';
    tr.appendChild(tdNome);

    // Lista de acompanhantes
    const tdAcomp = document.createElement('td');
    if (c.acompanhantes?.length > 0) {
      const ul = document.createElement('ul');
      ul.className = 'lista-acomp-tabela';
      c.acompanhantes.forEach(nome => {
        const li = document.createElement('li');
        li.textContent = nome;
        ul.appendChild(li);
      });
      tdAcomp.appendChild(ul);
    } else {
      tdAcomp.textContent      = '—';
      tdAcomp.style.color      = 'var(--cinza-medio)';
    }
    tr.appendChild(tdAcomp);

    // Quantidade de acompanhantes
    const tdQtd = document.createElement('td');
    tdQtd.textContent       = c.acompanhantes?.length || 0;
    tdQtd.style.textAlign   = 'center';
    tdQtd.style.fontWeight  = '700';
    tr.appendChild(tdQtd);

    // Total de pessoas (destaque laranja)
    const tdTotal = document.createElement('td');
    tdTotal.className   = 'td-total';
    tdTotal.textContent = c.totalPessoas || 1;
    tr.appendChild(tdTotal);

    // Data/hora (vem do Timestamp do Firestore)
    const tdData = document.createElement('td');
    tdData.textContent       = formatarDataHora(c.dataHora);
    tdData.style.fontSize    = '0.8rem';
    tdData.style.color       = 'var(--cinza-escuro)';
    tdData.style.whiteSpace  = 'nowrap';
    tr.appendChild(tdData);

    // Botão excluir
    const tdAcao    = document.createElement('td');
    tdAcao.style.textAlign = 'center';
    const btnExcluir = document.createElement('button');
    btnExcluir.className   = 'btn-excluir-linha';
    btnExcluir.textContent = '🗑️ Excluir';
    btnExcluir.setAttribute('aria-label', `Excluir confirmação de ${c.nomeConvidado}`);
    // c._id é o ID do documento no Firestore
    btnExcluir.addEventListener('click', () => excluirConfirmacao(c._id, c.nomeConvidado));
    tdAcao.appendChild(btnExcluir);
    tr.appendChild(tdAcao);

    tabelaBody.appendChild(tr);
  });
}

// ============================================================
// RENDER PRINCIPAL (aplica filtro de busca)
// ============================================================

/**
 * Re-renderiza a tabela aplicando filtro de busca se houver.
 * Sempre atualiza o resumo com os dados completos do cache.
 * @param {string} [termoBusca='']
 */
function renderizarPainel(termoBusca = '') {
  atualizarResumo(cacheConfirmacoes);

  let filtradas = cacheConfirmacoes;
  if (termoBusca.trim()) {
    const t = termoBusca.trim().toLowerCase();
    filtradas = cacheConfirmacoes.filter(c =>
      (c.nomeConvidado || '').toLowerCase().includes(t) ||
      (c.acompanhantes || []).join(' ').toLowerCase().includes(t)
    );
  }

  renderizarTabela(filtradas);
}

// ============================================================
// 🔥 LISTENER EM TEMPO REAL — onSnapshot
// ============================================================

/**
 * onSnapshot() abre uma conexão persistente com o Firestore.
 * Toda vez que um documento é adicionado, alterado ou removido
 * na coleção "confirmacoes", esta função é chamada automaticamente.
 *
 * Isso significa que o painel atualiza INSTANTANEAMENTE
 * quando alguém confirma presença — sem precisar recarregar.
 */
const consultaOrdenada = query(
  collection(db, COLECAO),
  orderBy("dataHora", "asc") // ordena por data de confirmação (mais antigas primeiro)
);

onSnapshot(consultaOrdenada, (snapshot) => {
  // Monta o array local com os dados + o ID de cada documento
  cacheConfirmacoes = snapshot.docs.map(docSnap => ({
    _id: docSnap.id,       // ID único do documento no Firestore
    ...docSnap.data()      // todos os campos: nomeConvidado, acompanhantes, etc.
  }));

  // Re-renderiza mantendo o filtro de busca ativo (se houver)
  renderizarPainel(inputBusca.value);

}, (erro) => {
  // Erro de conexão ou permissão
  console.error('Erro ao ouvir o Firestore:', erro);
  estadoVazio.style.display = 'block';
  estadoVazio.querySelector('p').textContent =
    '❌ Erro ao carregar dados. Verifique sua conexão.';
});

// ============================================================
// EXCLUIR UMA CONFIRMAÇÃO
// ============================================================

/**
 * Exclui um documento do Firestore pelo ID.
 * O onSnapshot() detecta a remoção e atualiza a tabela automaticamente.
 * @param {string} id - ID do documento no Firestore
 * @param {string} nome - Nome do convidado (para exibir na confirmação)
 */
async function excluirConfirmacao(id, nome) {
  if (!confirm(`Deseja excluir a confirmação de "${nome}"?\nEsta ação não pode ser desfeita.`)) return;

  try {
    // doc(db, COLECAO, id) → referência ao documento específico
    await deleteDoc(doc(db, COLECAO, id));
    // O onSnapshot() vai detectar a exclusão e atualizar a tabela automaticamente
  } catch (e) {
    console.error('Erro ao excluir:', e);
    alert('❌ Erro ao excluir. Verifique sua conexão.');
  }
}

// ============================================================
// LIMPAR TODOS OS DADOS
// ============================================================

/**
 * Remove TODOS os documentos da coleção usando writeBatch().
 * writeBatch() é mais eficiente que múltiplos deleteDoc()
 * porque agrupa todas as exclusões em uma única operação.
 */
async function limparTodosDados() {
  if (!confirm('⚠️ Tem certeza que deseja apagar TODAS as confirmações?\nEsta ação não pode ser desfeita!')) return;
  if (!confirm('🔴 ÚLTIMA CHANCE: Confirma a exclusão de TODOS os dados?')) return;

  try {
    // Busca todos os documentos da coleção
    const snapshot = await getDocs(collection(db, COLECAO));

    if (snapshot.empty) {
      alert('Não há confirmações para excluir.');
      return;
    }

    // writeBatch: agrupa até 500 operações numa transação
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit(); // executa todas as exclusões de uma vez

    // O onSnapshot() vai detectar e esvaziar a tabela automaticamente

  } catch (e) {
    console.error('Erro ao limpar dados:', e);
    alert('❌ Erro ao limpar dados. Verifique sua conexão.');
  }
}

// ============================================================
// EXPORTAR CSV
// ============================================================

/**
 * Exporta os dados do cache local para um arquivo CSV.
 * Usa o cacheConfirmacoes para não precisar de nova leitura.
 */
function exportarCSV() {
  if (cacheConfirmacoes.length === 0) {
    alert('Não há confirmações para exportar.');
    return;
  }

  const bom = '\uFEFF'; // BOM UTF-8 para compatibilidade com Excel
  let csv = bom + 'Nº;Convidado Principal;Acompanhantes;Qtd. Acompanhantes;Total Pessoas;Data/Hora\n';

  cacheConfirmacoes.forEach((c, i) => {
    const acompStr = c.acompanhantes?.length > 0
      ? c.acompanhantes.join(' | ')
      : 'Nenhum';

    const nome     = `"${(c.nomeConvidado || '').replace(/"/g, '""')}"`;
    const acomp    = `"${acompStr.replace(/"/g, '""')}"`;
    const dataHora = `"${formatarDataHora(c.dataHora)}"`;

    csv += `${i + 1};${nome};${acomp};${c.acompanhantes?.length || 0};${c.totalPessoas || 1};${dataHora}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = `presencas-iago-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================
// EVENT LISTENERS
// ============================================================

// Busca em tempo real — filtra o cache sem nova leitura no banco
inputBusca.addEventListener('input', () => renderizarPainel(inputBusca.value));

btnExportar.addEventListener('click',   exportarCSV);
btnLimparTudo.addEventListener('click', limparTodosDados);
