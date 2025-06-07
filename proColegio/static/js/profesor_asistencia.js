async function displayAsistencia(contenedor, profesorId, clases) {
  contenedor.innerHTML = `
      <h2>Registro de Asistencia</h2>
      <div style="margin-bottom: 1rem;">
          <label for="asistencia-clase-select">Seleccionar Clase:</label>
          <select id="asistencia-clase-select" class="menu-button" style="width:auto; display:inline-block; margin-left:0.5rem;">
              <option value="">-- Seleccione una clase --</option>
              ${clases.map(clase => `<option value="${clase.asignatura_id}-${clase.grupo_id}">${clase.asignatura} - ${clase.grupo}</option>`).join('')}
          </select>
          <label for="asistencia-fecha-input" style="margin-left:1rem;">Fecha:</label>
          <input type="date" id="asistencia-fecha-input" class="grade-input" style="width:auto; display:inline-block; margin-left:0.5rem;">
          <button class="menu-button" style="margin-left:1rem;" onclick="mostrarEstudiantesParaAsistencia()">Cargar Estudiantes</button>
      </div>
      <div id="asistencia-estudiantes-contenedor">
          <p>Seleccione una clase y una fecha para cargar la lista de estudiantes.</p>
      </div>
  `;

  // Re-expose global functions for the HTML to call
  window.mostrarEstudiantesParaAsistencia = mostrarEstudiantesParaAsistencia;
  window.guardarAsistencia = guardarAsistencia;
}

async function mostrarEstudiantesParaAsistencia() {
    const selectElement = document.getElementById('asistencia-clase-select');
    const fechaInput = document.getElementById('asistencia-fecha-input');
    const [selectedAsignaturaId, selectedGrupoId] = selectElement.value.split('-').map(Number);
    const selectedFecha = fechaInput.value;

    if (!selectedAsignaturaId || !selectedGrupoId || !selectedFecha) {
        alert("Por favor, seleccione una clase y una fecha.");
        return;
    }

    const claseSeleccionada = clasesDelProfesor.find(c => c.asignatura_id === selectedAsignaturaId && c.grupo_id === selectedGrupoId); // Access global clasesDelProfesor
    if (!claseSeleccionada) {
        document.getElementById('asistencia-estudiantes-contenedor').innerHTML = "<p>Clase no encontrada.</p>";
        return;
    }

    let estudiantesHTML = `
        <h3>Lista de Estudiantes para ${claseSeleccionada.asignatura} - ${claseSeleccionada.grupo} en ${selectedFecha}</h3>
        <table class="student-table">
            <thead>
                <tr>
                    <th>Estudiante</th>
                    <th>Presente</th>
                </tr>
            </thead>
            <tbody>
    `;

    const estudiantes = claseSeleccionada.estudiantes.sort((a,b) => a.nombre.localeCompare(b.nombre));
    
    let asistenciaExistente = [];
    try {
        const response = await fetch(`/api/asistencia?asignatura_id=${selectedAsignaturaId}&grupo_id=${selectedGrupoId}&fecha=${selectedFecha}`);
        asistenciaExistente = await response.json();
        console.log("Asistencia existente:", asistenciaExistente);
    } catch (error) {
        console.error("Error al cargar asistencia existente:", error);
        alert("Hubo un error al cargar la asistencia. Por favor, intente de nuevo.");
    }

    estudiantes.forEach(estudiante => {
        const isPresente = asistenciaExistente.some(a => a.estudiante_id === estudiante.id && a.presente);
        estudiantesHTML += `
            <tr>
                <td>${estudiante.nombre}</td>
                <td>
                    <input type="checkbox" id="presente-${estudiante.id}" data-estudiante-id="${estudiante.id}"
                        ${isPresente ? 'checked' : ''}>
                </td>
            </tr>
        `;
    });

    estudiantesHTML += `
            </tbody>
        </table>
        <button class="menu-button" style="margin-top:1rem;" onclick="guardarAsistencia(${selectedAsignaturaId}, ${selectedGrupoId}, '${selectedFecha}')">Guardar Asistencia</button>
    `;
    document.getElementById('asistencia-estudiantes-contenedor').innerHTML = estudiantesHTML;
}

async function guardarAsistencia(asignaturaId, grupoId, fecha) {
    const claseSeleccionada = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId); // Access global clasesDelProfesor
    if (!claseSeleccionada) return;

    const estudiantes = claseSeleccionada.estudiantes;
    const promises = [];

    estudiantes.forEach(estudiante => {
        const checkbox = document.getElementById(`presente-${estudiante.id}`);
        const presente = checkbox ? checkbox.checked : false;

        const data = {
            estudiante_id: estudiante.id,
            asignatura_id: asignaturaId,
            fecha: fecha,
            presente: presente
        };

        promises.push(
            fetch("/api/asistencia", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                if (!result.success) {
                    console.error(`Error al guardar asistencia para ${estudiante.nombre}:`, result.message);
                    return Promise.reject(`Error al guardar asistencia para ${estudiante.nombre}: ${result.message}`);
                }
                return result;
            })
        );
    });

    try {
        await Promise.all(promises);
        alert("Asistencia guardada correctamente.");
        mostrarEstudiantesParaAsistencia();
    } catch (error) {
        console.error("Error al guardar asistencia:", error);
        alert("Hubo un error al guardar la asistencia de algunos estudiantes.");
    }
}