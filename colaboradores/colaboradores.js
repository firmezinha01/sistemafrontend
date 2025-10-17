
const $ = (s) => document.querySelector(s);
const state = { employees: [] };

// const API_BASE = 'http://localhost:8080/api';
const API_BASE_URL = 'https://sistemabackend-tsn1.onrender.com/api';



function api(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
    .then(async res => {
      if (!res.ok) {
        let errorMessage = 'Erro desconhecido';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || res.statusText;
        } catch {
          errorMessage = res.statusText;
        }
        throw new Error(`Erro ${res.status}: ${errorMessage}`);
      }
      return res.json();
    })
    .catch(err => {
      console.error('Erro na API:', err);
      throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
    });
}

async function loadEmployees() {
  try {
    const res = await api('/employees');
    state.employees = res;
    renderEmployeeList();
  } catch (err) {
    alert(err.message);
  }
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

$('#addEmployee').addEventListener('click', async () => {
  const name = $('#newEmployeeName').value.trim();
  const role = $('#newEmployeeRole').value.trim();
  if (!name || !role) {
    alert('Preencha nome e função');
    return;
  }

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

$('#employeeList').addEventListener('click', async e => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  try {
    if (action === 'toggle') {
      const emp = state.employees.find(e => e.id == id);
      if (!emp) throw new Error('Colaborador não encontrado');
      await api(`/employees/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !emp.active })
      });
    }

    if (action === 'delete') {
      if (confirm('Tem certeza que deseja excluir este colaborador?')) {
        await api(`/employees/${id}`, { method: 'DELETE' });
      }
    }

    await loadEmployees();
  } catch (err) {
    alert(err.message);
  }
});

document.addEventListener('DOMContentLoaded', loadEmployees);
