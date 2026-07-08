// ── STORAGE ──
const DB = {
  doadores: () => JSON.parse(localStorage.getItem('ong_doadores') || '[]'),
  doacoes:  () => JSON.parse(localStorage.getItem('ong_doacoes')  || '[]'),
  salvarDoadores: d => localStorage.setItem('ong_doadores', JSON.stringify(d)),
  salvarDoacoes:  d => localStorage.setItem('ong_doacoes',  JSON.stringify(d)),
};

// ── DADOS DE EXEMPLO ──
function carregarExemplos() {
  if (DB.doadores().length > 0) return;
  const hoje = new Date().toISOString().split('T')[0];
  DB.salvarDoadores([
    { id: 1, nome: 'Maria Silva',       tipo: 'Pessoa Física',          tel: '(11) 98765-4321', email: 'maria@email.com',    obs: '' },
    { id: 2, nome: 'Padaria Pão Quente',tipo: 'Empresa',                tel: '(11) 3333-4444',  email: 'padaria@email.com',  obs: 'Doa toda sexta-feira' },
    { id: 3, nome: 'Igreja São José',   tipo: 'Igreja / Instituição',   tel: '(11) 2222-1111',  email: '',                   obs: 'Campanha mensal de roupas' },
  ]);
  DB.salvarDoacoes([
    { id: 1, doadorId: 1, doador: 'Maria Silva',        tipo: 'Alimento', item: 'Arroz 5kg',       qtd: '10 pacotes',  data: hoje, obs: '' },
    { id: 2, doadorId: 2, doador: 'Padaria Pão Quente', tipo: 'Alimento', item: 'Pão de forma',    qtd: '20 unidades', data: hoje, obs: 'Produto do dia' },
    { id: 3, doadorId: 3, doador: 'Igreja São José',    tipo: 'Roupa',    item: 'Roupas infantis', qtd: '2 sacolas',   data: hoje, obs: 'Tamanhos 4 ao 10' },
  ]);
}

// ── NAVEGAÇÃO ──
function irPara(pagina) {
  document.querySelectorAll('.pagina').forEach(p => p.classList.remove('ativa'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('ativo'));
  document.getElementById(pagina).classList.add('ativa');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.getAttribute('onclick').includes(pagina)) n.classList.add('ativo');
  });
  if (pagina === 'painel')    renderPainel();
  if (pagina === 'doadores')  renderDoadores();
  if (pagina === 'doacoes')   renderDoacoes();
  if (pagina === 'relatorio') { iniciarRelatorio(); gerarRelatorio(); }
}

// ── UTILS ──
function formatarData(d) {
  if (!d) return '—';
  const [y, m, dia] = d.split('-');
  return `${dia}/${m}/${y}`;
}

function badgeTipoDoador(t) {
  if (t === 'Empresa') return 'badge-azul';
  if (t === 'Igreja / Instituição') return 'badge-laranja';
  if (t === 'Anônimo') return 'badge-cinza';
  return 'badge-principal';
}

function badgeTipoItem(t) {
  const mapa = {
    'Alimento':         'badge-verde',
    'Roupa':            'badge-azul',
    'Higiene':          'badge-laranja',
    'Medicamento':      'badge-cinza',
    'Brinquedo':        'badge-principal',
    'Móvel / Utensílio':'badge-cinza',
  };
  return mapa[t] || 'badge-cinza';
}

// ── TOAST ──
function mostrarToast(msg, erro) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = erro ? 'var(--vermelho)' : 'var(--principal)';
  t.classList.add('visivel');
  setTimeout(() => t.classList.remove('visivel'), 2800);
}

// ── MODAIS ──
function fecharModal(id) {
  document.getElementById(id).classList.remove('aberto');
}

// ── PAINEL ──
function renderPainel() {
  const doadores = DB.doadores();
  const doacoes  = DB.doacoes();
  const hoje     = new Date();

  const mesAtual = doacoes.filter(d => {
    const dt = new Date(d.data + 'T12:00:00');
    return dt.getMonth() === hoje.getMonth() && dt.getFullYear() === hoje.getFullYear();
  });

  const tipos = {};
  doacoes.forEach(d => tipos[d.tipo] = (tipos[d.tipo] || 0) + 1);
  const tipoTop = Object.entries(tipos).sort((a, b) => b[1] - a[1])[0];

  document.getElementById('cards-painel').innerHTML = `
    <div class="card">
      <div class="card-label">Total de Doadores</div>
      <div class="card-valor">${doadores.length}</div>
      <div class="card-detalhe">cadastrados</div>
    </div>
    <div class="card">
      <div class="card-label">Total de Doações</div>
      <div class="card-valor">${doacoes.length}</div>
      <div class="card-detalhe">registradas</div>
    </div>
    <div class="card">
      <div class="card-label">Doações este mês</div>
      <div class="card-valor">${mesAtual.length}</div>
      <div class="card-detalhe">${hoje.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</div>
    </div>
    <div class="card">
      <div class="card-label">Item mais doado</div>
      <div class="card-valor" style="font-size:20px">${tipoTop ? tipoTop[0] : '—'}</div>
      <div class="card-detalhe">${tipoTop ? tipoTop[1] + ' registros' : 'sem dados'}</div>
    </div>
  `;

  const ultimas = [...doacoes].sort((a, b) => b.id - a.id).slice(0, 5);
  const tbody = document.getElementById('tabela-ultimas');
  tbody.innerHTML = ultimas.length === 0
    ? `<tr><td colspan="4" class="sem-dados"><div class="ico-grande">📦</div>Nenhuma doação registrada ainda</td></tr>`
    : ultimas.map(d => `
        <tr>
          <td><strong>${d.doador}</strong></td>
          <td>${d.item}</td>
          <td>${d.qtd}</td>
          <td>${formatarData(d.data)}</td>
        </tr>`).join('');
}

// ── DOADORES ──
let termoBuscaDoador = '';

function renderDoadores() {
  const todos = DB.doadores();
  const doacoes = DB.doacoes();
  const lista = todos.filter(d =>
    d.nome.toLowerCase().includes(termoBuscaDoador.toLowerCase())
  );

  document.getElementById('contagem-doadores').textContent =
    `${lista.length} doador${lista.length !== 1 ? 'es' : ''}`;

  const tbody = document.getElementById('tabela-doadores');
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="sem-dados">
      <div class="ico-grande">👥</div>
      ${termoBuscaDoador ? 'Nenhum resultado encontrado' : 'Nenhum doador cadastrado ainda'}
    </td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(d => {
    const qtd = doacoes.filter(x => x.doadorId === d.id).length;
    return `
      <tr>
        <td>
          <strong>${d.nome}</strong>
          ${d.obs ? `<br><span style="font-size:11px;color:var(--cinza-3)">${d.obs}</span>` : ''}
        </td>
        <td><span class="badge ${badgeTipoDoador(d.tipo)}">${d.tipo}</span></td>
        <td>
          <span style="font-size:13px">${d.tel || '—'}</span>
          ${d.email ? `<br><span style="font-size:11px;color:var(--cinza-3)">${d.email}</span>` : ''}
        </td>
        <td><span class="badge badge-principal">${qtd} doação${qtd !== 1 ? 'ões' : ''}</span></td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="editarDoador(${d.id})">✏️</button>
          <button class="btn btn-perigo btn-sm" onclick="excluirDoador(${d.id})" style="margin-left:4px">🗑️</button>
        </td>
      </tr>`;
  }).join('');
}

function filtrarDoadores(v) {
  termoBuscaDoador = v;
  renderDoadores();
}

let editandoDoador = null;

function abrirModalDoador(id) {
  editandoDoador = id || null;
  document.getElementById('titulo-modal-doador').textContent = id ? 'Editar Doador' : 'Novo Doador';

  if (id) {
    const d = DB.doadores().find(x => x.id === id);
    document.getElementById('d-nome').value  = d.nome;
    document.getElementById('d-tipo').value  = d.tipo;
    document.getElementById('d-tel').value   = d.tel;
    document.getElementById('d-email').value = d.email;
    document.getElementById('d-obs').value   = d.obs;
  } else {
    ['d-nome', 'd-tel', 'd-email', 'd-obs'].forEach(f => document.getElementById(f).value = '');
    document.getElementById('d-tipo').value = 'Pessoa Física';
  }

  document.getElementById('modal-doador').classList.add('aberto');
}

function editarDoador(id) { abrirModalDoador(id); }

function salvarDoador() {
  const nome = document.getElementById('d-nome').value.trim();
  if (!nome) { mostrarToast('Informe o nome do doador', true); return; }

  const doadores = DB.doadores();
  const doador = {
    id:    editandoDoador || Date.now(),
    nome,
    tipo:  document.getElementById('d-tipo').value,
    tel:   document.getElementById('d-tel').value.trim(),
    email: document.getElementById('d-email').value.trim(),
    obs:   document.getElementById('d-obs').value.trim(),
  };

  if (editandoDoador) {
    doadores[doadores.findIndex(d => d.id === editandoDoador)] = doador;
    mostrarToast('Doador atualizado!');
  } else {
    doadores.push(doador);
    mostrarToast('Doador cadastrado!');
  }

  DB.salvarDoadores(doadores);
  fecharModal('modal-doador');
  renderDoadores();
}

function excluirDoador(id) {
  if (!confirm('Excluir este doador? As doações vinculadas não serão removidas.')) return;
  DB.salvarDoadores(DB.doadores().filter(d => d.id !== id));
  mostrarToast('Doador removido.');
  renderDoadores();
}

// ── DOAÇÕES ──
function renderDoacoes() {
  const busca = (document.getElementById('busca-doacoes')?.value || '').toLowerCase();
  const tipo  = document.getElementById('filtro-tipo')?.value || '';

  const lista = DB.doacoes().filter(d =>
    (d.doador.toLowerCase().includes(busca) || d.item.toLowerCase().includes(busca)) &&
    (tipo === '' || d.tipo === tipo)
  );

  document.getElementById('contagem-doacoes').textContent =
    `${lista.length} doação${lista.length !== 1 ? 'ões' : ''}`;

  const tbody = document.getElementById('tabela-doacoes');
  const sorted = [...lista].sort((a, b) => b.id - a.id);

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="sem-dados"><div class="ico-grande">📦</div>Nenhuma doação encontrada</td></tr>`;
    return;
  }

  tbody.innerHTML = sorted.map(d => `
    <tr>
      <td><strong>${d.doador}</strong></td>
      <td>${d.item}</td>
      <td><span class="badge ${badgeTipoItem(d.tipo)}">${d.tipo}</span></td>
      <td>${d.qtd}</td>
      <td>${formatarData(d.data)}</td>
      <td style="font-size:12px;color:var(--cinza-3)">${d.obs || '—'}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editarDoacao(${d.id})">✏️</button>
        <button class="btn btn-perigo btn-sm" onclick="excluirDoacao(${d.id})" style="margin-left:4px">🗑️</button>
      </td>
    </tr>`).join('');
}

function filtrarDoacoes() { renderDoacoes(); }

let editandoDoacao = null;

function abrirModalDoacao(id) {
  editandoDoacao = id || null;
  document.getElementById('titulo-modal-doacao').textContent = id ? 'Editar Doação' : 'Nova Doação';

  const doadores = DB.doadores();
  const sel = document.getElementById('dc-doador');
  sel.innerHTML = doadores.length === 0
    ? '<option value="">— Cadastre um doador primeiro —</option>'
    : doadores.map(d => `<option value="${d.id}">${d.nome}</option>`).join('');

  if (id) {
    const d = DB.doacoes().find(x => x.id === id);
    sel.value = d.doadorId;
    document.getElementById('dc-tipo').value = d.tipo;
    document.getElementById('dc-data').value = d.data;
    document.getElementById('dc-item').value = d.item;
    document.getElementById('dc-qtd').value  = d.qtd;
    document.getElementById('dc-obs').value  = d.obs;
  } else {
    document.getElementById('dc-tipo').value = 'Alimento';
    document.getElementById('dc-data').value = new Date().toISOString().split('T')[0];
    ['dc-item', 'dc-qtd', 'dc-obs'].forEach(f => document.getElementById(f).value = '');
  }

  document.getElementById('modal-doacao').classList.add('aberto');
}

function editarDoacao(id) { abrirModalDoacao(id); }

function salvarDoacao() {
  const doadorId = parseInt(document.getElementById('dc-doador').value);
  const item = document.getElementById('dc-item').value.trim();
  const qtd  = document.getElementById('dc-qtd').value.trim();
  const data = document.getElementById('dc-data').value;

  if (!doadorId || !item || !qtd || !data) {
    mostrarToast('Preencha todos os campos obrigatórios', true);
    return;
  }

  const doador  = DB.doadores().find(d => d.id === doadorId);
  const doacoes = DB.doacoes();
  const doacao  = {
    id:       editandoDoacao || Date.now(),
    doadorId,
    doador:   doador.nome,
    tipo:     document.getElementById('dc-tipo').value,
    item,
    qtd,
    data,
    obs:      document.getElementById('dc-obs').value.trim(),
  };

  if (editandoDoacao) {
    doacoes[doacoes.findIndex(d => d.id === editandoDoacao)] = doacao;
    mostrarToast('Doação atualizada!');
  } else {
    doacoes.push(doacao);
    mostrarToast('Doação registrada!');
  }

  DB.salvarDoacoes(doacoes);
  fecharModal('modal-doacao');
  renderDoacoes();
  renderPainel();
}

function excluirDoacao(id) {
  if (!confirm('Excluir esta doação?')) return;
  DB.salvarDoacoes(DB.doacoes().filter(d => d.id !== id));
  mostrarToast('Doação removida.');
  renderDoacoes();
  renderPainel();
}

// ── RELATÓRIO ──
function iniciarRelatorio() {
  const hoje = new Date();
  document.getElementById('rel-mes').value = hoje.getMonth() + 1;
  document.getElementById('rel-ano').value  = hoje.getFullYear();
}

function gerarRelatorio() {
  const mes  = parseInt(document.getElementById('rel-mes').value);
  const ano  = parseInt(document.getElementById('rel-ano').value);
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const doacoes = DB.doacoes().filter(d => {
    const dt = new Date(d.data + 'T12:00:00');
    return dt.getMonth() + 1 === mes && dt.getFullYear() === ano;
  });

  const container = document.getElementById('conteudo-relatorio');

  if (doacoes.length === 0) {
    container.innerHTML = `<div class="sem-dados">
      <div class="ico-grande">📄</div>
      Nenhuma doação registrada em ${meses[mes - 1]}/${ano}
    </div>`;
    return;
  }

  const tipos    = {};
  const doadores = {};
  doacoes.forEach(d => {
    tipos[d.tipo]       = (tipos[d.tipo]       || 0) + 1;
    doadores[d.doador]  = (doadores[d.doador]  || 0) + 1;
  });

  container.innerHTML = `
    <h2 style="font-family:'DM Serif Display',serif;font-size:20px;color:var(--principal);margin-bottom:4px">
      Relatório de Doações — ${meses[mes - 1]}/${ano}
    </h2>
    <p style="font-size:12px;color:var(--cinza-3);margin-bottom:24px">
      Gerado em ${new Date().toLocaleDateString('pt-BR')}
    </p>

    <div class="rel-secao">
      <h3>Resumo Geral</h3>
      <div class="rel-linha">
        <span>Total de doações registradas</span>
        <span class="valor">${doacoes.length}</span>
      </div>
      <div class="rel-linha">
        <span>Doadores diferentes</span>
        <span class="valor">${Object.keys(doadores).length}</span>
      </div>
    </div>

    <div class="rel-secao">
      <h3>Doações por Tipo de Item</h3>
      ${Object.entries(tipos).sort((a, b) => b[1] - a[1]).map(([t, n]) => `
        <div class="rel-linha">
          <span>${t}</span>
          <span class="valor">${n} registro${n !== 1 ? 's' : ''}</span>
        </div>`).join('')}
    </div>

    <div class="rel-secao">
      <h3>Doadores do Mês</h3>
      ${Object.entries(doadores).sort((a, b) => b[1] - a[1]).map(([n, q]) => `
        <div class="rel-linha">
          <span>${n}</span>
          <span class="valor">${q} doação${q !== 1 ? 'ões' : ''}</span>
        </div>`).join('')}
    </div>

    <div class="rel-secao">
      <h3>Detalhamento Completo</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:var(--cinza-1)">
            <th style="padding:8px;text-align:left;border-bottom:1px solid var(--cinza-2)">Data</th>
            <th style="padding:8px;text-align:left;border-bottom:1px solid var(--cinza-2)">Doador</th>
            <th style="padding:8px;text-align:left;border-bottom:1px solid var(--cinza-2)">Item</th>
            <th style="padding:8px;text-align:left;border-bottom:1px solid var(--cinza-2)">Tipo</th>
            <th style="padding:8px;text-align:left;border-bottom:1px solid var(--cinza-2)">Quantidade</th>
          </tr>
        </thead>
        <tbody>
          ${[...doacoes].sort((a, b) => a.data.localeCompare(b.data)).map(d => `
            <tr style="border-bottom:1px solid var(--cinza-1)">
              <td style="padding:7px 8px">${formatarData(d.data)}</td>
              <td style="padding:7px 8px">${d.doador}</td>
              <td style="padding:7px 8px">${d.item}</td>
              <td style="padding:7px 8px">${d.tipo}</td>
              <td style="padding:7px 8px">${d.qtd}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function imprimirRelatorio() { window.print(); }

// ── INIT ──
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('aberto'); });
});

carregarExemplos();
renderPainel();