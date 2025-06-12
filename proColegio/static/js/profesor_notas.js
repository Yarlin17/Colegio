window._notasEdicionActiva = {};
window._colExtraCount = {};
window._colExtraNames = {};

async function displayRegistrosNotas(contenedor, profesorId, clases, backButtonHTML) {
  let registrosHTML = `
    ${backButtonHTML}
    <div class="card border-0 shadow-sm">
        <div class="card-body">
            <h3 class="card-title fw-bold">Registro de Notas</h3>
            <p class="card-subtitle mb-3 text-muted">Seleccione una clase para empezar a registrar las notas de los estudiantes.</p>
            <div id="notas-botones-materias" class="d-flex flex-wrap gap-2">
                ${clases.map((clase, idx) => `
                    <button class="btn btn-outline-primary" onclick="mostrarNotasMateria(${idx}, ${profesorId}, ${clase.asignatura_id}, ${clase.grupo_id})">
                        ${clase.asignatura} - ${clase.grupo}
                    </button>
                `).join('')}
            </div>
            <hr>
            <div id="notas-materia-contenedor" class="mt-4"></div>
        </div>
    </div>`;
  contenedor.innerHTML = registrosHTML;
}

async function mostrarNotasMateria(claseIdx, profesorId, asignaturaId, grupoId) {
  const contenedor = document.getElementById('notas-materia-contenedor');
  contenedor.innerHTML = `<div class="d-flex justify-content-center"><div class="spinner-border"></div></div>`;
  
  const clase = clasesDelProfesor[claseIdx];
  let html = `<h4 class="mb-3">Gestionando Notas para: <span class="text-primary">${clase.asignatura} - ${clase.grupo}</span></h4>`;

  for (let corte = 1; corte <= 3; corte++) {
    window._notasEdicionActiva[corte] = false;
    html += `
      <div class="card mb-4 border-0 shadow-sm">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Corte ${corte}</h5>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-secondary" id="btn-editar-corte-${corte}" onclick="habilitarEdicionNotas(${corte}, true)" title="Editar"><i class="bi bi-pencil-fill"></i></button>
                <button class="btn btn-outline-success" id="btn-guardar-corte-${corte}" onclick="guardarTodasNotasCorte(${corte}, ${asignaturaId}, ${grupoId}, ${profesorId})" title="Guardar" disabled><i class="bi bi-save-fill"></i></button>
                <button class="btn btn-outline-primary" id="btn-agregar-col-corte-${corte}" onclick="agregarColumnaCorte(${corte}, ${asignaturaId}, ${grupoId}, ${profesorId})" title="Agregar columna" disabled><i class="bi bi-plus-lg"></i></button>
                <button class="btn btn-outline-warning" id="btn-quitar-col-corte-${corte}" onclick="eliminarColumnaCorte(${corte}, ${asignaturaId}, ${grupoId}, ${profesorId})" title="Eliminar columna" disabled><i class="bi bi-dash-lg"></i></button>
                <button class="btn btn-outline-danger" id="btn-eliminar-corte-${corte}" onclick="eliminarNotasCorte(${asignaturaId}, ${grupoId}, ${profesorId}, ${corte})" title="Eliminar todo el corte" disabled><i class="bi bi-trash-fill"></i></button>
            </div>
        </div>
        <div class="table-responsive">
          <table class="table table-bordered table-hover align-middle mb-0" id="tabla-corte-${corte}">
            <thead class="table-light"><tr id="thead-corte-${corte}">
              <th>Estudiante</th>
              <th>Trabajos</th><th>Quices</th><th>Evaluación Final</th>
              <th class="fw-bold">Promedio Corte</th>
            </tr></thead>
            <tbody>
              ${clase.estudiantes.sort((a,b) => a.nombre.localeCompare(b.nombre)).map(est => `
                <tr>
                  <td>${est.nombre}</td>
                  <td><input type="number" class="form-control form-control-sm grade-input" id="grade-input-${asignaturaId}-${grupoId}-${est.id}-${corte}-trabajos" min="0" max="5" step="0.1" oninput="calcularPromedioCorte(${asignaturaId}, ${grupoId}, ${corte}, ${est.id})" readonly></td>
                  <td><input type="number" class="form-control form-control-sm grade-input" id="grade-input-${asignaturaId}-${grupoId}-${est.id}-${corte}-quices" min="0" max="5" step="0.1" oninput="calcularPromedioCorte(${asignaturaId}, ${grupoId}, ${corte}, ${est.id})" readonly></td>
                  <td><input type="number" class="form-control form-control-sm grade-input" id="grade-input-${asignaturaId}-${grupoId}-${est.id}-${corte}-evaluacionfinal" min="0" max="5" step="0.1" oninput="calcularPromedioCorte(${asignaturaId}, ${grupoId}, ${corte}, ${est.id})" readonly></td>
                  <td><input type="text" class="form-control form-control-sm fw-bold" id="prom-c${corte}-${est.id}" readonly style="background:#e9ecef;"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
  // TODO: Add final average table if needed
  contenedor.innerHTML = html;
  llenarNotasEnTabla(profesorId, asignaturaId, grupoId);
}

function habilitarEdicionNotas(corte, activar) {
    document.querySelectorAll(`#tabla-corte-${corte} input.grade-input`).forEach(input => input.readOnly = !activar);
    document.getElementById(`btn-guardar-corte-${corte}`).disabled = !activar;
    document.getElementById(`btn-eliminar-corte-${corte}`).disabled = !activar;
    document.getElementById(`btn-agregar-col-corte-${corte}`).disabled = !activar;
    document.getElementById(`btn-quitar-col-corte-${corte}`).disabled = !activar;
    document.getElementById(`btn-editar-corte-${corte}`).disabled = activar;
    window._notasEdicionActiva[corte] = activar;
}

async function guardarTodasNotasCorte(corte, asignaturaId, grupoId, profesorId) {
    const tabla = document.getElementById(`tabla-corte-${corte}`);
    const promises = [];
    tabla.querySelectorAll('tbody tr').forEach(row => {
        const estId = row.querySelector('input').id.split('-')[3]; // A bit fragile, better to use data-id
        row.querySelectorAll('input.grade-input').forEach(input => {
            const tipoNota = input.id.split('-').pop();
            const nota = parseFloat(input.value) || 0;
            const data = {
                estudiante_id: estId, asignatura_id: asignaturaId, profesor_id: profesorId,
                corte, tipo_nota: tipoNota, nota
            };
            promises.push(fetch("/api/notas", {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            }));
        });
    });
    await Promise.all(promises);
    alert("Notas guardadas exitosamente.");
    habilitarEdicionNotas(corte, false);
}

// Las demás funciones (llenarNotasEnTabla, calcularPromedioCorte, etc.)
// deberían funcionar sin cambios mayores, ya que manipulan los valores de los inputs.
// Solo asegúrate de que los IDs de los inputs se mantengan consistentes.

// Dummy functions to avoid errors if they are not defined elsewhere.
// You should replace these with your actual logic.
async function llenarNotasEnTabla(profesorId, asignaturaId, grupoId) { console.log('Llenando notas...'); }
function calcularPromedioCorte(asignaturaId, grupoId, corte, estId) { console.log(`Calculando promedio para est ${estId}`); }
function agregarColumnaCorte(corte, asignaturaId, grupoId, profesorId) { alert('Función "Agregar Columna" no implementada completamente.'); }
function eliminarColumnaCorte(corte, asignaturaId, grupoId, profesorId) { alert('Función "Eliminar Columna" no implementada completamente.'); }
async function eliminarNotasCorte(asignaturaId, grupoId, profesorId, corte) { alert('Función "Eliminar Corte" no implementada completamente.'); }