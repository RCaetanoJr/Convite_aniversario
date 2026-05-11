/**
 * painel.js — Lógica do Painel Administrativo
 * Aniversário do Iago 3 Anos 🏗️
 *
 * Responsabilidades deste arquivo:
 *  - Ler as confirmações salvas no LocalStorage pelo script.js
 *  - Calcular e exibir os totalizadores (cards de resumo)
 *  - Renderizar a tabela de confirmações
 *  - Implementar busca por nome (filtro em tempo real)
 *  - Excluir uma confirmação individual
 *  - Limpar todos os dados (com confirmação)
 *  - Exportar a lista para CSV
 *
 * NOTA: Este arquivo e o script.js compartilham a mesma chave do LocalStorage.
 * Para migrar para API/banco de dados no futuro, substituir as funções
 * obterConfirmacoes() e salvarConfirmacoes() por chamadas fetch/axios.
 */

// ============================================================
// CONSTANTES E CONFIGURAÇÃO
// ============================================================

/**
 * Chave do LocalStorage — deve ser idêntica à usada em script.js.
 * Centralizada aqui para facilitar manutenção e evitar bugs de tipagem.
 * @constant {string}
 */
const CHAVE_STORAGE = 'confirmacoes_iago';

// ============================================================
// SELEÇÃO DE ELEMENTOS DO DOM
// ============================================================

/** Cards de totalizadores */
const elTotalConfirmacoes  = document.getElementById('total-confirmacoes');
const elTotalPrincipais    = document.getElementById('total-principais');
const elTotalAcompanhantes = document.getElementById('total-acompanhantes');
const elTotalPessoas       = document.getElementById('total-pessoas');

/** Input de busca por nome */
const inputBusca = document.getElementById('input-busca');

/** Corpo da tabela onde as linhas são inseridas */
const tabelaBody = document.getElementById('tabela-body');

/** Wrapper da tabela (para mostrar/ocultar) */
const tabelaWrapper = document.getElementById('tabela-wrapper');

/** Div de estado vazio */
const estadoVazio = document.getElementById('estado-vazio');

/** Botões de ação */
const btnExportar   = document.getElementById('btn-exportar');
const btnLimparTudo = document.getElementById('btn-limpar-tudo');

// ============================================================
// FUNÇÕES DO LOCALSTORAGE
// ============================================================

/**
 * Recupera todas as confirmações do LocalStorage.
 * Retorna array vazio se não houver dados ou em caso de erro.
 * @returns {Array<Object>} Lista de confirmações
 */
function obterConfirmacoes() {
  try {
    const dados = localStorage.getItem(CHAVE_STORAGE);
    return dados ? JSON.parse(dados) : [];
  } catch (e) {
    console.error('Erro ao ler confirmações do LocalStorage:', e);
    return [];
  }
}

/**
 * Salva o array completo de confirmações no LocalStorage.
 * Substitua esta função por uma chamada API no futuro.
 * @param {Array<Object>} confirmacoes
 */
function salvarConfirmacoes(confirmacoes) {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(confirmacoes));
  } catch (e) {
    console.error('Erro ao salvar no LocalStorage:', e);
    alert('Erro ao salvar dados. Verifique o armazenamento do navegador.');
  }
}

// ============================================================
// CÁLCULO DOS TOTALIZADORES
// ============================================================

/**
 * Calcula e atualiza os cards de resumo no topo do painel.
 * Recebe o array completo de confirmações (não filtrado).
 * @param {Array<Object>} confirmacoes
 */
function atualizarResumo(confirmacoes) {
  // Total de confirmações = número de grupos (entradas no array)
  const totalConfirmacoes = confirmacoes.length;

  // Total de convidados principais = sempre igual ao total de confirmações
  // (cada confirmação tem exatamente 1 convidado principal)
  const totalPrincipais = confirmacoes.length;

  // Total de acompanhantes = soma do length de cada array de acompanhantes
  const totalAcompanhantes = confirmacoes.reduce((soma, c) => {
    return soma + (c.acompanhantes ? c.acompanhantes.length : 0);
  }, 0);

  // Total geral = soma de totalPessoas de cada confirmação
  const totalPessoas = confirmacoes.reduce((soma, c) => {
    return soma + (c.totalPessoas || 1);
  }, 0);

  // Atualiza os elementos do DOM com animação de contagem simples
  animarNumero(elTotalConfirmacoes, totalConfirmacoes);
  animarNumero(elTotalPrincipais, totalPrincipais);
  animarNumero(elTotalAcompanhantes, totalAcompanhantes);
  animarNumero(elTotalPessoas, totalPessoas);
}

/**
 * Anima a contagem de um número do 0 até o valor final.
 * Usado nos cards de resumo para dar vida ao painel.
 * @param {HTMLElement} elemento - Elemento que exibe o número
 * @param {number} valorFinal
 */
function animarNumero(elemento, valorFinal) {
  const duracao = 600; // ms
  const inicio  = Date.now();
  const valorInicial = parseInt(elemento.textContent) || 0;

  function passo() {
    const progresso = Math.min((Date.now() - inicio) / duracao, 1);
    const valorAtual = Math.floor(valorInicial + (valorFinal - valorInicial) * progresso);
    elemento.textContent = valorAtual;
    if (progresso < 1) requestAnimationFrame(passo);
  }

  requestAnimationFrame(passo);
}

// ============================================================
// FORMATAÇÃO DE DATA/HORA
// ============================================================

/**
 * Formata uma string ISO de data para exibição amigável em pt-BR.
 * Ex: "2026-07-26T16:00:00.000Z" → "26/07/2026 13:00"
 * @param {string} isoString - Data no formato ISO 8601
 * @returns {string} Data formatada
 */
function formatarDataHora(isoString) {
  try {
    const data = new Date(isoString);
    return data.toLocaleString('pt-BR', {
      day:    '2-digit',
      month:  '2-digit',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString || '—';
  }
}

// ============================================================
// RENDERIZAÇÃO DA TABELA
// ============================================================

/**
 * Renderiza as linhas da tabela com base no array de confirmações.
 * Chamada na inicialização e toda vez que os dados mudam.
 * @param {Array<Object>} confirmacoes - Dados a exibir (pode ser filtrado)
 */
function renderizarTabela(confirmacoes) {
  // Limpa o corpo da tabela antes de renderizar
  tabelaBody.innerHTML = '';

  // --- Estado vazio ---
  if (confirmacoes.length === 0) {
    // Oculta tabela e mostra mensagem de estado vazio
    tabelaWrapper.style.display = 'none';
    estadoVazio.style.display = 'block';
    return;
  }

  // Dados existentes: mostra tabela e oculta estado vazio
  tabelaWrapper.style.display = 'block';
  estadoVazio.style.display = 'none';

  // Cria uma linha (<tr>) para cada confirmação
  confirmacoes.forEach((confirmacao, index) => {

    const tr = document.createElement('tr');

    // Coluna 1: Número sequencial (#)
    const tdNumero = document.createElement('td');
    tdNumero.textContent = index + 1;
    tr.appendChild(tdNumero);

    // Coluna 2: Nome do convidado principal
    const tdNome = document.createElement('td');
    tdNome.textContent = confirmacao.nomeConvidado || '—';
    tdNome.style.fontWeight = '700';
    tr.appendChild(tdNome);

    // Coluna 3: Lista de acompanhantes
    const tdAcomp = document.createElement('td');
    if (confirmacao.acompanhantes && confirmacao.acompanhantes.length > 0) {
      // Cria uma lista com os nomes dos acompanhantes
      const ul = document.createElement('ul');
      ul.className = 'lista-acomp-tabela';
      confirmacao.acompanhantes.forEach(nome => {
        const li = document.createElement('li');
        li.textContent = nome;
        ul.appendChild(li);
      });
      tdAcomp.appendChild(ul);
    } else {
      // Exibe traço quando não há acompanhantes
      tdAcomp.textContent = '—';
      tdAcomp.style.color = 'var(--cinza-medio)';
    }
    tr.appendChild(tdAcomp);

    // Coluna 4: Quantidade de acompanhantes
    const tdQtdAcomp = document.createElement('td');
    tdQtdAcomp.textContent = confirmacao.acompanhantes ? confirmacao.acompanhantes.length : 0;
    tdQtdAcomp.style.textAlign = 'center';
    tdQtdAcomp.style.fontWeight = '700';
    tr.appendChild(tdQtdAcomp);

    // Coluna 5: Total de pessoas no grupo (destaque laranja)
    const tdTotal = document.createElement('td');
    tdTotal.className = 'td-total';
    tdTotal.textContent = confirmacao.totalPessoas || 1;
    tr.appendChild(tdTotal);

    // Coluna 6: Data/hora da confirmação
    const tdData = document.createElement('td');
    tdData.textContent = formatarDataHora(confirmacao.dataHora);
    tdData.style.fontSize = '0.8rem';
    tdData.style.color = 'var(--cinza-escuro)';
    tdData.style.whiteSpace = 'nowrap';
    tr.appendChild(tdData);

    // Coluna 7: Botão de excluir esta confirmação
    const tdAcao = document.createElement('td');
    tdAcao.style.textAlign = 'center';

    const btnExcluir = document.createElement('button');
    btnExcluir.className = 'btn-excluir-linha';
    btnExcluir.textContent = '🗑️ Excluir';
    btnExcluir.setAttribute('aria-label', `Excluir confirmação de ${confirmacao.nomeConvidado}`);

    // Ao clicar em excluir, chama a função com o ID desta confirmação
    btnExcluir.addEventListener('click', () => {
      excluirConfirmacao(confirmacao.id);
    });

    tdAcao.appendChild(btnExcluir);
    tr.appendChild(tdAcao);

    // Adiciona a linha ao corpo da tabela
    tabelaBody.appendChild(tr);
  });
}

// ============================================================
// FUNÇÃO PRINCIPAL: renderizar painel completo
// ============================================================

/**
 * Função principal chamada para (re)renderizar todo o painel.
 * Lê os dados, aplica filtro de busca, atualiza resumo e tabela.
 * @param {string} [termoBusca=''] - Texto para filtrar por nome
 */
function renderizarPainel(termoBusca = '') {
  // Obtém todas as confirmações do LocalStorage
  const todasConfirmacoes = obterConfirmacoes();

  // Sempre calcula o resumo com os dados completos (sem filtro)
  atualizarResumo(todasConfirmacoes);

  // Aplica filtro de busca se houver termo digitado
  let confirmacoesFiltradas = todasConfirmacoes;

  if (termoBusca.trim()) {
    const termo = termoBusca.trim().toLowerCase();

    // Filtra confirmações onde o nome do convidado ou dos acompanhantes contém o termo
    confirmacoesFiltradas = todasConfirmacoes.filter(c => {
      const nomeConvidado = (c.nomeConvidado || '').toLowerCase();
      const nomesAcomp    = (c.acompanhantes || []).join(' ').toLowerCase();
      return nomeConvidado.includes(termo) || nomesAcomp.includes(termo);
    });
  }

  // Renderiza a tabela com os dados filtrados
  renderizarTabela(confirmacoesFiltradas);
}

// ============================================================
// EXCLUIR UMA CONFIRMAÇÃO
// ============================================================

/**
 * Exclui uma confirmação específica pelo seu ID.
 * Pede confirmação antes de excluir (segurança).
 * @param {string} id - ID da confirmação a excluir
 */
function excluirConfirmacao(id) {
  // Confirmação via dialog nativo do navegador
  const confirmar = window.confirm('Deseja excluir esta confirmação? Esta ação não pode ser desfeita.');

  if (!confirmar) return;

  // Filtra o array removendo o item com o ID correspondente
  const confirmacoes = obterConfirmacoes();
  const novasConfirmacoes = confirmacoes.filter(c => c.id !== id);

  // Salva o array atualizado
  salvarConfirmacoes(novasConfirmacoes);

  // Re-renderiza o painel com os dados atualizados
  renderizarPainel(inputBusca.value);
}

// ============================================================
// LIMPAR TODOS OS DADOS
// ============================================================

/**
 * Remove todas as confirmações do LocalStorage.
 * Solicita confirmação dupla para evitar acidentes.
 */
function limparTodosDados() {
  // Primeira confirmação
  const primeiraConfirmacao = window.confirm(
    '⚠️ Tem certeza que deseja apagar TODAS as confirmações?\n\nEsta ação não pode ser desfeita!'
  );

  if (!primeiraConfirmacao) return;

  // Segunda confirmação (extra de segurança)
  const segundaConfirmacao = window.confirm(
    '🔴 ÚLTIMA CHANCE: Confirma a exclusão de TODOS os dados?'
  );

  if (!segundaConfirmacao) return;

  // Remove a chave do LocalStorage
  localStorage.removeItem(CHAVE_STORAGE);

  // Re-renderiza o painel (ficará vazio)
  renderizarPainel();
}

// ============================================================
// EXPORTAR PARA CSV
// ============================================================

/**
 * Exporta todas as confirmações para um arquivo CSV.
 * CSV (Comma-Separated Values) pode ser aberto no Excel, Google Sheets, etc.
 * O arquivo é gerado no lado do cliente e baixado via link temporário.
 */
function exportarCSV() {
  const confirmacoes = obterConfirmacoes();

  if (confirmacoes.length === 0) {
    alert('Não há confirmações para exportar.');
    return;
  }

  // --- Monta o conteúdo do CSV ---

  // Cabeçalho das colunas (BOM UTF-8 para compatibilidade com Excel)
  const bom = '\uFEFF'; // Byte Order Mark — necessário para acentos no Excel
  let csv = bom + 'Nº;Convidado Principal;Acompanhantes;Qtd. Acompanhantes;Total Pessoas;Data/Hora\n';

  // Uma linha por confirmação
  confirmacoes.forEach((c, index) => {
    // Junta os nomes dos acompanhantes com " | " como separador dentro da célula
    const acompanhantesStr = c.acompanhantes && c.acompanhantes.length > 0
      ? c.acompanhantes.join(' | ')
      : 'Nenhum';

    // Escapa aspas duplas para não quebrar o CSV
    const nome     = `"${(c.nomeConvidado || '').replace(/"/g, '""')}"`;
    const acomp    = `"${acompanhantesStr.replace(/"/g, '""')}"`;
    const dataHora = `"${formatarDataHora(c.dataHora)}"`;

    csv += `${index + 1};${nome};${acomp};${c.acompanhantes ? c.acompanhantes.length : 0};${c.totalPessoas || 1};${dataHora}\n`;
  });

  // --- Cria e dispara o download ---

  // Cria um Blob com o conteúdo CSV e tipo MIME correto
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  // Cria um URL temporário para o Blob
  const url = URL.createObjectURL(blob);

  // Cria um link invisível e simula o clique para baixar
  const link = document.createElement('a');
  link.href     = url;
  link.download = `presencas-iago-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
  document.body.appendChild(link);
  link.click();

  // Remove o link e libera o URL após o download
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================
// EVENT LISTENERS
// ============================================================

/**
 * Filtro de busca em tempo real.
 * A cada tecla digitada, re-renderiza a tabela filtrada.
 */
inputBusca.addEventListener('input', () => {
  renderizarPainel(inputBusca.value);
});

/**
 * Botão de exportar CSV.
 */
btnExportar.addEventListener('click', exportarCSV);

/**
 * Botão de limpar todos os dados.
 */
btnLimparTudo.addEventListener('click', limparTodosDados);

// ============================================================
// INICIALIZAÇÃO — executa ao carregar a página
// ============================================================

/**
 * Inicializa o painel renderizando os dados existentes.
 * Chamada automaticamente quando o script é carregado.
 */
renderizarPainel();

/**
 * Atualiza o painel automaticamente a cada 30 segundos.
 * Útil quando múltiplas pessoas confirmam presença e o
 * administrador está com o painel aberto.
 * (No futuro, substituir por WebSocket ou Server-Sent Events)
 */
setInterval(() => {
  // Só atualiza se não houver termo de busca ativo
  if (!inputBusca.value.trim()) {
    renderizarPainel();
  }
}, 30000);
