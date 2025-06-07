function displayHorario(contenedor, clases) {
  let horarioHTML = '<h2>Mi Horario</h2><table class="schedule-table"><thead><tr><th>Asignatura</th><th>Hora Inicio</th><th>Hora Fin</th><th>Aula</th><th>Cant. Estudiantes</th></tr></thead><tbody>';
  if (clases.length === 0) {
    horarioHTML += '<tr><td colspan="5">No hay horario disponible.</td></tr>';
  } else {
    clases.forEach(clase => {
      horarioHTML += `<tr><td>${clase.asignatura} - ${clase.grupo}</td><td>${clase.horaInicio}</td><td>${clase.horaFin}</td><td>${clase.aula}</td><td>${clase.estudiantes.length}</td></tr>`;
    });
  }
  horarioHTML += '</tbody></table>';
  contenedor.innerHTML = horarioHTML;
}