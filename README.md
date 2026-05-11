[README.md](https://github.com/user-attachments/files/27608840/README.md)# 🏗️ Aniversário do Iago — Lista de Presença Online

> **"Vamos construir um dia de alegria!"**
> Sistema de confirmação de presença para o aniversário de 3 anos do Iago, com tema de construção/obra.

---

## 📸 Visão Geral

Sistema web completo para gerenciamento de lista de presença de aniversário infantil. Os convidados acessam o link, confirmam presença com nome e acompanhantes, e os organizadores visualizam tudo **em tempo real** pelo painel administrativo — de qualquer dispositivo, em qualquer lugar.

**Banco de dados:** Firebase Firestore (nuvem, gratuito)
**Tema visual:** Construção/Obra — amarelo, laranja, preto e branco

---

## ✨ Funcionalidades

### 🎉 Página Pública (`index.html`)
- **Loading screen animada** com cena SVG de canteiro de obras
- **Mapa interativo** do Google Maps com o local do evento
- **Formulário de confirmação** com validação completa
  - Nome completo obrigatório (mínimo 2 palavras)
  - Toggle Sim/Não para acompanhantes com múltiplos nomes
- **Salva no Firebase Firestore** — disponível para todos os dispositivos imediatamente

### ⚙️ Painel Administrativo (`painel.html`)
- **Atualização em tempo real** via `onSnapshot()` — aparece automaticamente quando alguém confirma
- **Cards de resumo** com animação de contagem
- **Busca por nome** em tempo real (filtra o cache local, sem nova leitura no banco)
- **Excluir** confirmação individual
- **Limpar todos** os dados (com confirmação dupla)
- **Exportar CSV** compatível com Excel

---

## 🗂️ Estrutura de Arquivos

```
/
├── index.html      # Página pública de confirmação
├── painel.html     # Painel administrativo
├── style.css       # Estilos compartilhados
├── script.js       # Lógica do formulário + Firebase (salvar)
├── painel.js       # Lógica do painel + Firebase (ler/excluir)
└── README.md
```

---

## 🔥 Configuração do Firebase (passo a passo)

> Sem isso o projeto não funciona. Siga cada passo com calma — leva menos de 10 minutos.

### Passo 1 — Criar o projeto

1. Acesse [firebase.google.com](https://firebase.google.com) e faça login com sua conta Google
2. Clique em **"Ir para o console"**
3. Clique em **"Adicionar projeto"**
4. Dê um nome (ex: `aniversario-iago`) e clique em **Continuar**
5. Desative o Google Analytics (opcional) e clique em **Criar projeto**

### Passo 2 — Criar o banco de dados (Firestore)

1. No menu lateral, clique em **Firestore Database**
2. Clique em **"Criar banco de dados"**
3. Selecione **"Iniciar no modo de teste"** *(permite leitura e escrita por 30 dias)*
4. Escolha a região mais próxima (ex: `southamerica-east1` — São Paulo)
5. Clique em **Ativar**

> **Depois do evento**, mude as regras de segurança para somente leitura no painel e somente escrita no formulário.

### Passo 3 — Registrar o app Web

1. Na tela inicial do projeto, clique no ícone **`</>`** (Web)
2. Dê um apelido ao app (ex: `lista-presenca`) e clique em **Registrar app**
3. O Firebase vai mostrar um bloco de código parecido com este:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "aniversario-iago.firebaseapp.com",
  projectId: "aniversario-iago",
  storageBucket: "aniversario-iago.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

4. **Copie esse objeto completo**

### Passo 4 — Colar as credenciais nos arquivos JS

Abra **`script.js`** e **`painel.js`** e substitua o bloco `firebaseConfig` pelo que você copiou:

```js
// ANTES (placeholder):
const firebaseConfig = {
  apiKey:            "COLE_SUA_API_KEY_AQUI",
  authDomain:        "COLE_SEU_AUTH_DOMAIN_AQUI",
  projectId:         "COLE_SEU_PROJECT_ID_AQUI",
  ...
};

// DEPOIS (seus dados reais):
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "aniversario-iago.firebaseapp.com",
  projectId: "aniversario-iago",
  ...
};
```

> ⚠️ **Faça isso nos dois arquivos:** `script.js` e `painel.js`

### Passo 5 — Fazer o deploy na Vercel

1. Suba o projeto no GitHub (com as credenciais já preenchidas)
2. Acesse [vercel.com](https://vercel.com) → **Add New Project**
3. Importe o repositório
4. Clique em **Deploy** — pronto!

---

## 🚀 Como Rodar Localmente

> Os imports do Firebase usam ES Modules, então é necessário um servidor local.

```bash
# Com Python 3
python -m http.server 8080

# Com Node.js
npx serve .

# Com VS Code
# Instale "Live Server" e clique em "Go Live"
```

Acesse: `http://localhost:8080`

> ⚠️ Abrir o `index.html` diretamente pelo navegador (sem servidor) não funciona com ES Modules.

---

## 🔐 Acesso ao Painel

O link para o painel **não aparece na página pública**. Acesso direto pela URL:

```
https://seu-dominio.vercel.app/painel.html
```

Compartilhe apenas com os organizadores do evento.

---

## 📡 Como os Dados Fluem

```
Convidado (celular)
    │
    ▼
index.html → script.js
    │
    │  addDoc()  ← salva no Firestore
    ▼
Firebase Firestore ☁️
    │
    │  onSnapshot()  ← escuta mudanças em tempo real
    ▼
painel.html → painel.js
    │
    ▼
Organizador vê instantaneamente 🎉
```

---

## 💾 Estrutura dos Documentos no Firestore

**Coleção:** `confirmacoes`

Cada documento representa uma confirmação:

```json
{
  "nomeConvidado":   "João da Silva",
  "temAcompanhante": true,
  "acompanhantes":   ["Maria da Silva", "Pedro da Silva"],
  "totalPessoas":    3,
  "dataHora":        "Timestamp do Firestore"
}
```

O ID do documento é gerado automaticamente pelo Firestore.

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| **HTML5 semântico** | Estrutura e acessibilidade |
| **CSS3 com variáveis** | Tema, animações, responsividade |
| **JavaScript ES Modules** | Lógica, validação, integração Firebase |
| **Firebase Firestore** | Banco de dados em nuvem, tempo real |
| **Google Maps Embed** | Mapa de localização do evento |
| **SVG animado** | Cena do canteiro no loading screen |
| **Google Fonts** | Bangers + Nunito |

**Sem frameworks, sem build, sem dependências NPM.**

---

## 📱 Responsividade

| Breakpoint | Layout |
|---|---|
| `< 480px` | Mobile — colunas únicas, botões fullwidth |
| `481–767px` | Tablet — layout intermediário |
| `768–1023px` | Desktop médio |
| `> 1024px` | Desktop largo |

---

## 🔧 Personalização

Em `index.html`, altere os dados do evento:
```html
<span class="valor">26/07/2026</span>  <!-- data -->
<span class="valor">16:00h</span>       <!-- horário -->
<span class="valor">Salão Estação Piuí</span>
```

Em `style.css`, altere as cores no `:root`:
```css
:root {
  --amarelo: #FFC107;
  --laranja: #FF6A00;
}
```

---

## 📋 Informações do Evento

| Campo | Dado |
|---|---|
| **Aniversariante** | Iago |
| **Idade** | 3 anos |
| **Data** | 26/07/2026 |
| **Horário** | 16:00h |
| **Local** | Salão Estação Piuí |
| **Endereço** | Rua Pernambuco, 2800, Ipiranga — Divinópolis/MG |

---

## 📄 Licença

Projeto desenvolvido para uso pessoal/familiar. Livre para adaptar para outros eventos.

---

<div align="center">
  <strong>🏗️ Feito com muito amor para o Iago! 🎂</strong><br/>
  <em>"Vamos construir um dia de alegria!"</em>
</div>

[Uploading README.md…]()
# 🏗️ Aniversário do Iago — Lista de Presença Online

> **"Vamos construir um dia de alegria!"**
> Sistema de confirmação de presença para o aniversário de 3 anos do Iago, com tema de construção/obra.

---

## 📸 Visão Geral

Sistema web completo para gerenciamento de lista de presença de aniversário infantil. Os convidados acessam o link, confirmam presença com nome e acompanhantes, e os organizadores visualizam tudo em tempo real pelo painel administrativo.

**Tema visual:** Construção/Obra — amarelo, laranja, preto e branco, com elementos como faixas zebradas, cones, capacete, escavadeira e placas de canteiro.

---

## ✨ Funcionalidades

### 🎉 Página Pública (`index.html`)
- **Loading screen animada** com cena SVG de canteiro de obras, escavadeira com braço animado, fumaça, cones e placa suspensa em correntes
- **Barra de progresso** estilo "construindo a festa"
- **Cabeçalho impactante** com nome do aniversariante e animações
- **Card de informações** do evento (data, horário, local, endereço)
- **Mapa interativo** com iframe do Google Maps responsivo
- **Formulário de confirmação** com validação completa
  - Nome completo obrigatório (mínimo 2 palavras)
  - Toggle Sim/Não para acompanhantes
  - Adicionar múltiplos acompanhantes com botão de remover
- **Mensagem de sucesso animada** após confirmar
- **Salvamento automático** no LocalStorage do navegador

### ⚙️ Painel Administrativo (`painel.html`)
- **Cards de resumo** com animação de contagem: total de confirmações, convidados, acompanhantes e pessoas
- **Tabela completa** com todos os dados de cada grupo
- **Busca em tempo real** por nome
- **Excluir** confirmação individual (com confirmação)
- **Limpar todos os dados** (com confirmação dupla)
- **Exportar CSV** compatível com Excel e Google Sheets (BOM UTF-8)
- **Atualização automática** a cada 30 segundos

---

## 🗂️ Estrutura de Arquivos

```
/
├── index.html      # Página pública de confirmação de presença
├── painel.html     # Painel administrativo (acesso restrito)
├── style.css       # Estilos compartilhados (tema obra + responsivo)
├── script.js       # Lógica do formulário e LocalStorage
├── painel.js       # Lógica do painel (tabela, busca, exportação)
└── README.md
```

---

## 🚀 Como Usar

### Opção 1 — Abrir localmente
1. Baixe ou clone este repositório
2. Abra `index.html` diretamente no navegador

> ⚠️ O iframe do Google Maps pode exigir um servidor local para funcionar corretamente.

### Opção 2 — Servidor local (recomendado)
```bash
# Com Python 3
python -m http.server 8080

# Com Node.js (npx)
npx serve .

# Com VS Code
# Instale a extensão "Live Server" e clique em "Go Live"
```
Acesse: `http://localhost:8080`

### Opção 3 — Hospedagem gratuita
Faça deploy em qualquer serviço de hospedagem estática:

| Serviço | Como fazer deploy |
|---|---|
| **GitHub Pages** | Vá em Settings → Pages → selecione a branch `main` |
| **Netlify** | Arraste a pasta para [app.netlify.com/drop](https://app.netlify.com/drop) |
| **Vercel** | `npx vercel` na pasta do projeto |

---

## 🔐 Acesso ao Painel

O link para o painel **não aparece na página pública** — acesso é feito diretamente pela URL:

```
https://seu-dominio.com/painel.html
```

Compartilhe esse link apenas com os organizadores do evento.

---

## 💾 Armazenamento de Dados

Os dados são salvos no **LocalStorage** do navegador, na chave `confirmacoes_iago`.

**Estrutura de cada confirmação:**
```json
{
  "id": "1720800000000_4823",
  "nomeConvidado": "João da Silva",
  "temAcompanhante": true,
  "acompanhantes": ["Maria da Silva", "Pedro da Silva"],
  "totalPessoas": 3,
  "dataHora": "2026-07-26T16:30:00.000Z"
}
```

> **Importante:** O LocalStorage é específico por navegador e dispositivo. Para uso em produção com múltiplos dispositivos, recomenda-se integrar com uma API/banco de dados (ver seção abaixo).

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Uso |
|---|---|
| **HTML5 semântico** | Estrutura e acessibilidade |
| **CSS3 com variáveis** | Estilização, animações, responsividade |
| **JavaScript puro (ES6+)** | Lógica, validação, LocalStorage |
| **Google Maps Embed API** | Mapa de localização do evento |
| **Google Fonts** | Bangers (títulos) + Nunito (corpo) |
| **SVG animado** | Cena do canteiro de obras no loading |

**Sem frameworks, sem dependências externas, sem build.**

---

## 📱 Responsividade

| Breakpoint | Layout |
|---|---|
| `< 480px` | Mobile — colunas únicas, mapa 70% altura, botões fullwidth |
| `481px – 767px` | Tablet — layout intermediário, mapa 260px |
| `768px – 1023px` | Desktop médio — container 720px, mapa 320px |
| `> 1024px` | Desktop largo — container 740px, mapa 360px |

---

## 🔧 Personalização

Todas as informações do evento estão nos arquivos HTML e são facilmente editáveis:

**Em `index.html`**, altere os dados do evento:
```html
<!-- Data -->
<span class="valor">26/07/2026</span>

<!-- Horário -->
<span class="valor">16:00h</span>

<!-- Local -->
<span class="valor">Salão Estação Piuí</span>

<!-- Endereço -->
Rua Pernambuco, 2800, Ipiranga – Divinópolis/MG
```

**Em `style.css`**, altere as cores no `:root`:
```css
:root {
  --amarelo:  #FFC107;
  --laranja:  #FF6A00;
  --preto:    #111111;
}
```

---

## 🔮 Próximos Passos (Roadmap)

O código foi estruturado para facilitar a evolução. Melhorias planejadas:

- [ ] **Integração com API REST** — substituir LocalStorage por banco de dados (Firebase, Supabase ou backend próprio)
- [ ] **Autenticação do painel** — login com senha para proteger o painel administrativo
- [ ] **Notificação por WhatsApp** — enviar confirmação automática via WhatsApp API
- [ ] **Foto do aniversariante** — adicionar imagem no header
- [ ] **Contador regressivo** — exibir quantos dias faltam para o evento
- [ ] **Limite de vagas** — bloquear confirmações quando atingir capacidade máxima
- [ ] **PWA** — tornar instalável como app no celular

---

## 📋 Informações do Evento

| Campo | Dado |
|---|---|
| **Aniversariante** | Iago |
| **Idade** | 3 anos |
| **Data** | 26/07/2026 |
| **Horário** | 16:00h |
| **Local** | Salão Estação Piuí |
| **Endereço** | Rua Pernambuco, 2800, Ipiranga — Divinópolis/MG |

---

## 📄 Licença

Este projeto foi desenvolvido para uso pessoal/familiar. Sinta-se livre para adaptar para outros eventos.

---

<div align="center">
  <strong>🏗️ Feito com muito amor para o Iago! 🎂</strong><br/>
  <em>"Vamos construir um dia de alegria!"</em>
</div>
