function displayHorario(contenedor, clases, backButtonHTML) {
  let horarioHTML = `
    ${backButtonHTML}
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <h3 class="card-title fw-bold">Mi Horario Completo</h3>
        <div class="table-responsive">
          <table class="table table-hover align-middle">
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