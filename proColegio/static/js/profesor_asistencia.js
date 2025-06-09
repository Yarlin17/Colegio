// proColegio/static/js/profesor_asistencia.js

// Función para mostrar la sección de asistencia en el panel del profesor
async function displayAsistencia(contenedor, profesorId, clases) {
  // Construye el HTML inicial con el selector de clase y el input de fecha
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

  // Establece la fecha predeterminada del input de fecha a la fecha actual
  // Y también establece el atributo 'max' para evitar fechas futuras.
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Los meses son 0-indexados, por eso +1
  const day = String(today.getDate()).padStart(2, '0');
  const maxDate = `${year}-${month}-${day}`; // Formato YYYY-MM-DD

  document.getElementById('asistencia-fecha-input').value = maxDate; // Asigna la fecha actual
  document.getElementById('asistencia-fecha-input').setAttribute('max', maxDate); // Restringe fechas futuras

  // Expone las funciones globalmente para que puedan ser llamadas desde el HTML
  window.mostrarEstudiantesParaAsistencia = mostrarEstudiantesParaAsistencia;
  window.guardarAsistencia = guardarAsistencia;
}

// Función para cargar la lista de estudiantes de una clase y fecha seleccionadas
async function mostrarEstudiantesParaAsistencia() {
    const selectElement = document.getElementById('asistencia-clase-select');
    const fechaInput = document.getElementById('asistencia-fecha-input');

    // Divide el valor del selector para obtener asignatura_id y grupo_id
    const [selectedAsignaturaId, selectedGrupoId] = selectElement.value.split('-').map(Number);
    const selectedFecha = fechaInput.value; // Obtiene la fecha en formato YYYY-MM-DD

    // Validación básica de selección
    if (!selectedAsignaturaId || !selectedGrupoId || !selectedFecha) {
        alert("Por favor, seleccione una clase y una fecha.");
        return;
    }

    // Busca la clase seleccionada en las clases del profesor (variable global)
    const claseSeleccionada = clasesDelProfesor.find(c => c.asignatura_id === selectedAsignaturaId && c.grupo_id === selectedGrupoId); //
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

    // Ordena a los estudiantes alfabéticamente por nombre
    const estudiantes = claseSeleccionada.estudiantes.sort((a,b) => a.nombre.localeCompare(b.nombre));
    
    // Intenta obtener la asistencia existente para esta clase y fecha
    let asistenciaExistente = [];
    try {
        const response = await fetch(`/api/asistencia?asignatura_id=${selectedAsignaturaId}&grupo_id=${selectedGrupoId}&fecha=${selectedFecha}`);
        asistenciaExistente = await response.json();
        console.log("Asistencia existente:", asistenciaExistente);
    } catch (error) {
        console.error("Error al cargar asistencia existente:", error);
        alert("Hubo un error al cargar la asistencia. Por favor, intente de nuevo.");
    }

    // Genera las filas de la tabla para cada estudiante
    estudiantes.forEach(estudiante => {
        // Comprueba si el estudiante ya está marcado como presente para esta fecha
        const isPresente = asistenciaExistente.some(a => a.estudiante_id === estudiante.id && a.presente); //
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

// Función para guardar la asistencia de los estudiantes
async function guardarAsistencia(asignaturaId, grupoId, fecha) {
    const selectedDate = new Date(fecha); // Crea un objeto Date de la fecha seleccionada (YYYY-MM-DD)
    const today = new Date(); // Obtiene la fecha actual

    // Normaliza ambas fechas a UTC para comparar solo el día, ignorando la hora y las diferencias de zona horaria
    selectedDate.setUTCHours(0, 0, 0, 0);
    today.setUTCHours(0, 0, 0, 0);

    // Validación para evitar guardar asistencia en fechas futuras
    if (selectedDate.getTime() > today.getTime()) {
        alert("No se puede registrar asistencia para una fecha futura.");
        return;
    }

    // Encuentra la clase seleccionada
    const claseSeleccionada = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId); //
    if (!claseSeleccionada) return;

    const estudiantes = claseSeleccionada.estudiantes;
    const promises = []; // Array para almacenar las promesas de las solicitudes fetch

    // Itera sobre cada estudiante y crea una promesa para guardar su asistencia
    estudiantes.forEach(estudiante => {
        const checkbox = document.getElementById(`presente-${estudiante.id}`);
        const presente = checkbox ? checkbox.checked : false; // Determina si está presente o ausente

        const data = {
            estudiante_id: estudiante.id,
            asignatura_id: asignaturaId,
            fecha: fecha, // La cadena de fecha YYYY-MM-DD se envía tal cual
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
        // Espera a que todas las promesas de guardado se completen
        await Promise.all(promises);
        alert("Asistencia guardada correctamente.");
        // Vuelve a cargar la lista de estudiantes para reflejar los cambios guardados
        mostrarEstudiantesParaAsistencia();
    } catch (error) {
        console.error("Error al guardar asistencia:", error);
        alert("Hubo un error al guardar la asistencia de algunos estudiantes.");
    }
}