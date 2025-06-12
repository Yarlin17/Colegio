async function displayAsistencia(contenedor, profesorId, clases, backButtonHTML) {
  let asistenciaHTML = `
    ${backButtonHTML}
    <div class="card border-0 shadow-sm">
        <div class="card-body">
            <h3 class="card-title fw-bold">Registro de Asistencia</h3>
            <div class="row g-3 align-items-end mb-4">
                <div class="col-md-5">
                    <label for="asistencia-clase-select" class="form-label">Seleccionar Clase:</label>
                    <select id="asistencia-clase-select" class="form-select">
                        <option value="">-- Seleccione una clase --</option>
                        ${clases.map(clase => `<option value="${clase.asignatura_id}-${clase.grupo_id}">${clase.asignatura} - ${clase.grupo}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-4">
                    <label for="asistencia-fecha-input" class="form-label">Fecha:</label>
                    <input type="date" id="asistencia-fecha-input" class="form-control">
                </div>
                <div class="col-md-3">
                    <button class="btn btn-primary w-100" onclick="mostrarEstudiantesParaAsistencia()">Cargar Estudiantes</button>
                </div>
            </div>
            <div id="asistencia-estudiantes-contenedor">
                <p class="text-muted">Seleccione una clase y una fecha para cargar la lista de estudiantes.</p>
            </div>
        </div>
    </div>`;
  contenedor.innerHTML = asistenciaHTML;

  const today = new Date();
  const maxDate = today.toISOString().split("T")[0];
  document.getElementById('asistencia-fecha-input').value = maxDate;
  document.getElementById('asistencia-fecha-input').setAttribute('max', maxDate);
}

async function mostrarEstudiantesParaAsistencia() {
    const selectElement = document.getElementById('asistencia-clase-select');
    const fechaInput = document.getElementById('asistencia-fecha-input');
    const [asignaturaId, grupoId] = selectElement.value.split('-').map(Number);
    const fecha = fechaInput.value;

    if (!asignaturaId || !grupoId || !fecha) {
        alert("Por favor, seleccione una clase y una fecha.");
        return;
    }

    const clase = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);
    const contenedorEstudiantes = document.getElementById('asistencia-estudiantes-contenedor');
    contenedorEstudiantes.innerHTML = `<div class="d-flex justify-content-center"><div class="spinner-border spinner-border-sm" role="status"></div><span class="ms-2">Cargando...</span></div>`;
    
    const response = await fetch(`/api/asistencia?asignatura_id=${asignaturaId}&grupo_id=${grupoId}&fecha=${fecha}`);
    const asistenciaExistente = await response.json();

    let estudiantesHTML = `
        <h5 class="mt-4">Lista de Estudiantes: ${clase.asignatura}</h5>
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light"><tr><th>Estudiante</th><th class="text-center">Presente</th></tr></thead>
                <tbody>`;

    clase.estudiantes.sort((a, b) => a.nombre.localeCompare(b.nombre)).forEach(estudiante => {
        const isPresente = asistenciaExistente.some(a => a.estudiante_id === estudiante.id && a.presente);
        estudiantesHTML += `
            <tr>
                <td>${estudiante.nombre}</td>
                <td class="text-center">
                    <div class="form-check form-switch d-inline-block">
                        <input class="form-check-input" type="checkbox" role="switch" id="presente-${estudiante.id}" ${isPresente ? 'checked' : ''}>
                    </div>
                </td>
            </tr>`;
    });

    estudiantesHTML += `
                </tbody>
            </table>
        </div>
        <button class="btn btn-success mt-3" onclick="guardarAsistencia(${asignaturaId}, ${grupoId}, '${fecha}')"><i class="bi bi-save-fill me-2"></i>Guardar Asistencia</button>`;
    
    contenedorEstudiantes.innerHTML = estudiantesHTML;
}

async function guardarAsistencia(asignaturaId, grupoId, fecha) {
    const clase = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);
    if (!clase) return;

    const promises = clase.estudiantes.map(estudiante => {
        const presente = document.getElementById(`presente-${estudiante.id}`).checked;
        return fetch("/api/asistencia", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estudiante_id: estudiante.id, asignatura_id: asignaturaId, fecha, presente })
        });
    });

    try {
        await Promise.all(promises);
        alert("Asistencia guardada correctamente.");
        mostrarEstudiantesParaAsistencia(); 
    } catch (error) {
        console.error("Error al guardar asistencia:", error);
        alert("Hubo un error al guardar la asistencia.");
    }
}