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

  const items = [...document.querySelectorAll('#appointmentList > li')];
  let y = 10;

  items.forEach(item => {
    const title = item.querySelector('h4')?.innerText;
    if (title) {
      doc.setFontSize(14);
      doc.text(title, 10, y);
      y += 8;
    }

    const subItems = item.querySelectorAll('ul > li');
    subItems.forEach(sub => {
      const text = sub.innerText.trim();
      const lines = doc.splitTextToSize(text, 180); // quebra linhas longas
      doc.setFontSize(11);
      lines.forEach(line => {
        doc.text(line, 12, y);
        y += 6;
      });
      y += 4;
    });

    y += 6; // espaço entre blocos
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save('agendamentos.pdf');
});

document.getElementById('exportExcel').addEventListener('click', () => {
  const items = [...document.querySelectorAll('#appointmentList > li')];
  const data = [];

  items.forEach(item => {
    const date = item.querySelector('h4')?.innerText.split(' — ')[0];
    const subItems = item.querySelectorAll('ul > li');
    subItems.forEach(sub => {
      const name = sub.querySelector('strong')?.innerText || '';
      const registeredBy = sub.querySelector('small')?.innerText.replace('Cadastrado por: ', '') || '';
      data.push({ Data: date, Nome: name, Colaborador: registeredBy });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Agendamentos');
  XLSX.writeFile(workbook, 'agendamentos.xlsx');
});


// document.getElementById('exportPDF').addEventListener('click', () => {
//   const { jsPDF } = window.jspdf;
//   const doc = new jsPDF();
//   const items = [...document.querySelectorAll('#appointmentList li')];
//   items.forEach((item, i) => {
//     doc.text(item.innerText, 10, 10 + i * 10);
//   });
//   doc.save('agendamentos.pdf');
// });


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
    // Extrai apenas a parte da data (YYYY-MM-DD)
    const dateOnly = appt.date.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    const formattedDate = `${day}/${month}/${year}`; // dd/mm/yyyy

    if (!grouped[formattedDate]) grouped[formattedDate] = [];
    grouped[formattedDate].push(appt);
  });
  return grouped;
}

