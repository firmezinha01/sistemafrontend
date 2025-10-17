// const API = window.API_BASE || 'http://localhost:8080/api';
const API_BASE_URL = 'https://sistemabackend-tsn1.onrender.com/api';

// Utilitários
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// Estado global
const state = {
  employees: [],
  appointments: []
};

// Requisição genérica
async function api(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro HTTP ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

// =========================
// FUNCIONÁRIOS
// =========================
async function loadEmployees() {
  state.employees = await api('/employees?onlyActive=true');
  renderEmployeeSelect();
  renderEmployeeList();
}

function renderEmployeeSelect() {
  const sel = $('#employeeSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Selecione —</option>' +
    state.employees.map(e => `<option value="${e.id}">${e.name} — ${e.role}</option>`).join('');
}

function renderEmployeeList() {
  const ul = $('#employeeList');
  if (!ul) return;
  ul.innerHTML = state.employees.map(e => `
    <li>
      <span>
        <strong>${e.name}</strong> — ${e.role || 'Sem função'}
        <span class="badge">${e.active ? 'ativo' : 'inativo'}</span>
      </span>
      <span class="action">
        <button data-action="toggle" data-id="${e.id}">${e.active ? 'Desativar' : 'Ativar'}</button>
        <button class="danger" data-action="delete" data-id="${e.id}">Excluir</button>
      </span>
    </li>
  `).join('');
}

$('#addEmployee')?.addEventListener('click', async () => {
  const name = $('#newEmployeeName').value.trim();
  const role = $('#newEmployeeRole')?.value.trim();
  if (!name || !role) return alert('Informe nome e função');

  try {
    await api('/employees', {
      method: 'POST',
      body: JSON.stringify({ name, role })
    });
    $('#newEmployeeName').value = '';
    $('#newEmployeeRole').value = '';
    await loadEmployees();
  } catch (err) {
    alert(err.message);
  }
});

$('#employeeList')?.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  try {
    if (action === 'toggle') {
      const emp = state.employees.find(x => x.id === id);
      if (!emp) return;
      await api(`/employees/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !emp.active })
      });
    }

    if (action === 'delete') {
      const confirmed = confirm('Excluir funcionário? (agendamentos antigos ficarão sem vínculo)');
      if (!confirmed) return;
      await api(`/employees/${id}`, { method: 'DELETE' });
    }

    await loadEmployees();
    await loadAppointments();
  } catch (err) {
    alert(err.message);
  }
});

// =========================
// AGENDAMENTOS
// =========================
async function loadAppointments() {
  const from = $('#from')?.value;
  const to = $('#to')?.value;
  const search = $('#search')?.value.trim();
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (search) params.set('search', search);

  state.appointments = await api(`/appointments?${params.toString()}`);
  renderTable();
}

function renderTable() {
  const tb = $('#tbl tbody');
  if (!tb) return;
  tb.innerHTML = state.appointments.map(a => `
    <tr data-id="${a.id}">
      <td><input value="${a.person_name}" data-field="person_name" /></td>
      <td><input type="date" value="${a.date}" data-field="date" /></td>
      <td>
        <select data-field="scheduled_by">
          <option value="">— Selecione —</option>
          ${state.employees.map(e => `<option ${a.scheduled_by === e.id ? 'selected' : ''} value="${e.id}">${e.name}</option>`).join('')}
        </select>
      </td>
      <td class="action">
        <button data-action="save">Salvar</button>
        <button class="danger" data-action="delete">Excluir</button>
      </td>
    </tr>
  `).join('');
}

$('#formAppointment')?.addEventListener('submit', async (e) => {
  e.preventDefault();
const formData = new FormData(e.target);
const data = Object.fromEntries(formData);

// Corrige o campo de data para evitar UTC
if (formData.has('date')) {
  const rawDate = formData.get('date'); // ex: '2025-10-30'
  data.date = rawDate.split('T')[0]; // garante que só a data seja enviada
}
  
  // const data = Object.fromEntries(new FormData(e.target));
  try {
    await api('/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    e.target.reset();
    await loadAppointments();
    alert('Agendamento criado!');
  } catch (err) {
    alert(err.message);
  }
});

$('#tbl')?.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const tr = e.target.closest('tr');
  const id = tr.dataset.id;
  const action = btn.dataset.action;

  if (action === 'save') {
    const payload = {};
    tr.querySelectorAll('input, select').forEach(el => {
      const key = el.dataset.field;
      if (!key) return;
      payload[key] = el.value || null;
    });

    try {
      await api(`/appointments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      await loadAppointments();
      alert('Agendamento atualizado!');
    } catch (err) {
      alert(err.message);
    }
  }

  if (action === 'delete') {
    if (!confirm('Excluir este agendamento?')) return;
    try {
      await api(`/appointments/${id}`, { method: 'DELETE' });
      await loadAppointments();
      alert('Agendamento excluído!');
    } catch (err) {
      alert(err.message);
    }
  }
});

// =========================
// FILTROS
// =========================
$('#btnFilter')?.addEventListener('click', loadAppointments);
$('#btnClear')?.addEventListener('click', () => {
  $('#from').value = '';
  $('#to').value = '';
  $('#search').value = '';
  loadAppointments();
});
$('#search')?.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') loadAppointments();
});

// =========================
// INICIALIZAÇÃO
// =========================
(async function init() {
  await loadEmployees();
  await loadAppointments();
})();
