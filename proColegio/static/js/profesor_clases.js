function displayClases(contenedor, clases, backButtonHTML) {
  let clasesHTML = `
    ${backButtonHTML}
    <div class="row row-cols-1 row-cols-md-2 g-4">
  `;

  if (clases.length === 0) {
    clasesHTML += '<p>No se encontraron clases asignadas a este profesor.</p>';
  } else {
    clases.forEach(clase => {
      clasesHTML += `
        <div class="col">
            <div class="card h-100 shadow-sm border-0">
                <div class="card-body">
                    <h5 class="card-title fw-bold">${clase.asignatura} - ${clase.grupo}</h5>
                    <p class="card-text">
                        <strong><i class="bi bi-calendar-event me-2"></i>Horario:</strong> 
                        ${clase.horario.map(h => `${h.dia} (${h.inicio} - ${h.fin})`).join(', ')}
                    </p>
                    <p class="card-text">
                        <strong><i class="bi bi-door-open-fill me-2"></i>Aula:</strong> ${clase.aula}
                    </p>
                    <p class="card-text">
                        <strong><i class="bi bi-people-fill me-2"></i>Estudiantes:</strong> ${clase.estudiantes.length}
                    </p>
                </div>
                <div class="card-footer bg-white border-0">
                   <a href="#" class="btn btn-outline-primary btn-sm" onclick="cargarVistaProfesor('registros')">Ver Notas</a>
                </div>
            </div>
        </div>
      `;
    });
  }
  clasesHTML += '</div>';
  contenedor.innerHTML = clasesHTML;
}