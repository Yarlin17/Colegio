function displayHorario(contenedor, clases, backButtonHTML) {
  let horarioHTML = `
    ${backButtonHTML}
    <div class="d-flex justify-content-end mb-3">
        <button class="btn btn-primary" onclick="downloadSchedulePdf()"><i class="bi bi-file-earmark-arrow-down me-2"></i>Descargar Horario PDF</button>
    </div>
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <h3 class="card-title fw-bold">Mi Horario Completo</h3>
        <div class="table-responsive">
          <table class="table table-hover align-middle" id="profesorScheduleTable">
            <thead class="table-light">
              <tr>
                <th>Asignatura</th>
                <th>Grupo</th>
                <th>Día</th>
                <th>Hora Inicio</th>
                <th>Hora Fin</th>
                <th>Aula</th>
              </tr>
            </thead>
            <tbody>
  `;

  if (clases.length === 0) {
    horarioHTML += '<tr><td colspan="6" class="text-center text-muted">No hay horario disponible.</td></tr>';
  } else {
    clases.forEach(clase => {
        clase.horario.forEach(h => {
             horarioHTML += `
                <tr>
                    <td>${clase.asignatura}</td>
                    <td>${clase.grupo}</td>
                    <td>${h.dia}</td>
                    <td>${h.inicio}</td>
                    <td>${h.fin}</td>
                    <td>${clase.aula}</td>
                </tr>`;
        });
    });
  }
  horarioHTML += '</tbody></table></div></div></div>';
  contenedor.innerHTML = horarioHTML;
}

// Function to download the schedule as PDF
function downloadSchedulePdf() {
    const element = document.getElementById('profesorScheduleTable');
    if (element) {
        // Get professor's name from localStorage
        const profesorNombre = localStorage.getItem("usuarioNombre") || "Profesor";
        const profesorApellido = localStorage.getItem("usuarioApellido") || "";
        const filename = `horario_${profesorNombre.replace(/\s/g, '_')}_${profesorApellido.replace(/\s/g, '_')}.pdf`;

        html2pdf(element, {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        });
    } else {
        alert('No se encontró la tabla de horario para descargar.');
    }
}