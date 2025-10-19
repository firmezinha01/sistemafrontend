// const API_URL = 'http://localhost:8080/api/appointments';
const API_BASE_URL = 'https://sistemabackend-tsn1.onrender.com/api';

const list = document.getElementById('appointmentList');

async function loadAppointments(filters = {}) {
  const params = new URLSearchParams();
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.search) params.append('search', filters.search);

  try {
    const response = await fetch(`${API_BASE_URL}/appointments?${params.toString()}`);
    if (!response.ok) throw new Error('Erro ao buscar agendamentos');
    const appointments = await response.json();

    // ...continua normalmente

    appointments.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return a.person_name.localeCompare(b.person_name);
    });


    

    const grouped = groupByDate(appointments);
    list.innerHTML = Object.entries(grouped).map(([date, items]) => `
      <li>
        <h4>${date} — ${items.length} agendado(s)</h4>
        <ul>
          ${items.map(appt => `
            <li>
              <strong>${appt.person_name}</strong>
              <br />
              <small>Cadastrado por: ${appt.scheduled_by_name || 'Desconhecido'}</small>
            </li>
          `).join('')}
        </ul>
      </li>
    `).join('');
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar agendamentos');
  }
}

document.getElementById('clearFilters').addEventListener('click', () => {
  document.getElementById('filterFrom').value = '';
  document.getElementById('filterTo').value = '';
  document.getElementById('filterSearch').value = '';
  loadAppointments(); // Recarrega sem filtros
});

document.getElementById('applyFilters').addEventListener('click', () => {
  const from = document.getElementById('filterFrom').value;
  const to = document.getElementById('filterTo').value;
  const search = document.getElementById('filterSearch').value.trim();
  loadAppointments({ from, to, search });
});

document.addEventListener('DOMContentLoaded', () => loadAppointments());


document.getElementById('exportPDF').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const items = [...document.querySelectorAll('#appointmentList li')];
  items.forEach((item, i) => {
    doc.text(item.innerText, 10, 10 + i * 10);
  });
  doc.save('agendamentos.pdf');
});

// function groupByDate(appointments) {
//   const grouped = {};
//   appointments.forEach(appt => {
//     const date = appt.date; // usa diretamente o valor sem converter
//     if (!grouped[date]) grouped[date] = [];
//     grouped[date].push(appt);
//   });
//   return grouped;
// }
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function groupByDate(appointments) {
  const grouped = {};
  appointments.forEach(appt => {
    const formattedDate = formatDate(appt.date);
    if (!grouped[formattedDate]) grouped[formattedDate] = [];
    grouped[formattedDate].push(appt);
  });
  return grouped;
}


// function groupByDate(appointments) {
//   const grouped = {};
//   appointments.forEach(appt => {
//     const date = new Date(appt.date).toLocaleDateString();
//     if (!grouped[date]) grouped[date] = [];
//     grouped[date].push(appt);
//   });
//   return grouped;
// }
