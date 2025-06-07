function displayClases(contenedor, clases) {
  let clasesHTML = '<h2>Clases que Imparte</h2>';
  if (clases.length === 0) {
    clasesHTML += '<p>No se encontraron clases asignadas a este profesor.</p>';
  } else {
    clases.forEach(clase => {
      clasesHTML += `
        <div class="info-section">
          <h3>${clase.asignatura} - ${clase.grupo}</h3>
          <p><strong>Horario:</strong> ${clase.horario}</p>
          <p><strong>Aula:</strong> ${clase.aula}</p>
          <p><strong>Estudiantes:</strong> ${clase.estudiantes.map(e => e.nombre).join(', ')}</p>
        </div>
      `;
    });
  }
  contenedor.innerHTML = clasesHTML;
}