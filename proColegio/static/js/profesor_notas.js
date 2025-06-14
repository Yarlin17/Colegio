window._notasEdicionActiva = {};
window._colExtraCount = {};
window._colExtraNames = {};
window._unsavedChangesExist = false;

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

  window._allStudentGrades = {}; 
  clase.estudiantes.forEach(est => {
      window._allStudentGrades[est.id] = {
          totalSum: 0,
          totalCount: 0,
          gradesByCorte: { 1: [], 2: [], 3: [] } 
      };
  });


  for (let corte = 1; corte <= 3; corte++) {
    window._notasEdicionActiva[corte] = false;
    if (!window._colExtraNames[corte]) {
        window._colExtraNames[corte] = {}; 
    }
    if (!window._colExtraNames[corte][grupoId]) { 
        window._colExtraNames[corte][grupoId] = [];
    }

    html += `
      <div class="card mb-4 border-0 shadow-sm">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Corte ${corte}</h5>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-secondary" id="btn-editar-corte-${corte}" onclick="habilitarEdicionNotas(${corte}, true)" title="Editar"><i class="bi bi-pencil-fill"></i></button>
                <button class="btn btn-outline-success" id="btn-guardar-corte-${corte}" onclick="guardarTodasNotasCorte(${corte}, ${asignaturaId}, ${grupoId}, ${profesorId})" title="Guardar" disabled><i class="bi bi-save-fill"></i><span> Guardar</span></button>
                <button class="btn btn-outline-primary" id="btn-agregar-col-corte-${corte}" onclick="agregarColumnaCorte(${corte}, ${profesorId}, ${asignaturaId}, ${grupoId})" title="Agregar columna" disabled><i class="bi bi-plus-lg"></i></button>
                <button class="btn btn-outline-warning" id="btn-quitar-col-corte-${corte}" onclick="eliminarColumnaCortePrompt(${corte}, ${profesorId}, ${asignaturaId}, ${grupoId})" title="Eliminar columna" disabled><i class="bi bi-dash-lg"></i></button>
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
                <tr data-estudiante-id="${est.id}">
                  <td>${est.nombre}</td>
                  <td><input type="number" class="form-control form-control-sm grade-input" data-tipo-nota="trabajos" data-estudiante-id="${est.id}" data-corte="${corte}" min="0" max="5" step="0.1" oninput="validateGradeInput(this); calcularPromedioCorte(${corte}, ${est.id}); calcularPromedioFinalAsignatura(${est.id}); checkUnsavedChanges('tabla-corte-${corte}')" readonly></td>
                  <td><input type="number" class="form-control form-control-sm grade-input" data-tipo-nota="quices" data-estudiante-id="${est.id}" data-corte="${corte}" min="0" max="5" step="0.1" oninput="validateGradeInput(this); calcularPromedioCorte(${corte}, ${est.id}); calcularPromedioFinalAsignatura(${est.id}); checkUnsavedChanges('tabla-corte-${corte}')" readonly></td>
                  <td><input type="number" class="form-control form-control-sm grade-input" data-tipo-nota="evaluacionfinal" data-estudiante-id="${est.id}" data-corte="${corte}" min="0" max="5" step="0.1" oninput="validateGradeInput(this); calcularPromedioCorte(${corte}, ${est.id}); calcularPromedioFinalAsignatura(${est.id}); checkUnsavedChanges('tabla-corte-${corte}')" readonly></td>
                  <td><input type="text" class="form-control form-control-sm fw-bold" id="prom-c${corte}-est${est.id}" readonly style="background:#e9ecef;"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  html += `
    <div class="card mb-4 border-0 shadow-sm">
        <div class="card-header fw-bold bg-white">Promedio Final de Asignatura</div>
        <div class="table-responsive">
            <table class="table table-bordered table-hover align-middle mb-0" id="tabla-promedio-final">
                <thead class="table-light">
                    <tr>
                        <th>Estudiante</th>
                        <th class="fw-bold">Promedio Final</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${clase.estudiantes.sort((a,b) => a.nombre.localeCompare(b.nombre)).map(est => `
                        <tr data-estudiante-id="${est.id}">
                            <td>${est.nombre}</td>
                            <td><input type="text" class="form-control form-control-sm fw-bold" id="prom-final-est${est.id}" readonly style="background:#e9ecef;"></td>
                            <td><span id="estado-est${est.id}" class="badge"></span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
  `;

  contenedor.innerHTML = html;
  await llenarNotasEnTabla(profesorId, asignaturaId, grupoId);
  // Initial button state after load (handled by llenarNotasEnTabla)
}

function habilitarEdicionNotas(corte, activar) {
    document.querySelectorAll(`#tabla-corte-${corte} input.grade-input`).forEach(input => input.readOnly = !activar);
    document.getElementById(`btn-guardar-corte-${corte}`).disabled = !activar;
    document.getElementById(`btn-eliminar-corte-${corte}`).disabled = !activar;
    document.getElementById(`btn-agregar-col-corte-${corte}`).disabled = !activar;
    document.getElementById(`btn-quitar-col-corte-${corte}`).disabled = !activar;
    document.getElementById(`btn-editar-corte-${corte}`).disabled = activar;
    window._notasEdicionActiva[corte] = activar;

    const saveBtn = document.getElementById(`btn-guardar-corte-${corte}`);
    if (activar) { // If enabling edit
        // Mark current values as original when editing is enabled
        document.querySelectorAll(`#tabla-corte-${corte} input.grade-input`).forEach(input => {
            input.dataset.originalValue = input.value.replace(',', '.');
        });
        window._unsavedChangesExist = false; // No changes yet when editing starts
        saveBtn.classList.remove('btn-warning', 'btn-success');
        saveBtn.classList.add('btn-outline-success');
        saveBtn.innerHTML = `<i class="bi bi-save-fill"></i><span> Guardar</span>`;
    } else { // If disabling edit
        window._unsavedChangesExist = false;
        saveBtn.classList.remove('btn-warning', 'btn-success');
        saveBtn.classList.add('btn-outline-success');
        saveBtn.innerHTML = `<i class="bi bi-save-fill"></i><span> Guardar</span>`;
    }
}

function validateGradeInput(inputElement) {
    const value = parseFloat(inputElement.value.replace(',', '.'));
    
    if (inputElement.value.trim() === '') {
        inputElement.classList.remove('is-invalid');
        if (inputElement.nextElementSibling && inputElement.nextElementSibling.classList.contains('invalid-feedback')) {
            inputElement.nextElementSibling.remove();
        }
        return true; 
    }

    if (isNaN(value) || value < 0 || value > 5) {
        inputElement.classList.add('is-invalid');
        if (!inputElement.nextElementSibling || !inputElement.nextElementSibling.classList.contains('invalid-feedback')) {
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = 'La nota debe ser entre 0 y 5.';
            inputElement.parentNode.insertBefore(feedback, inputElement.nextSibling);
        }
        return false;
    } else {
        inputElement.classList.remove('is-invalid');
        if (inputElement.nextElementSibling && inputElement.nextElementSibling.classList.contains('invalid-feedback')) {
            inputElement.nextElementSibling.remove();
        }
        return true;
    }
}

function checkUnsavedChanges(tableId) {
    let changesDetected = false;
    document.querySelectorAll(`#${tableId} input.grade-input`).forEach(input => {
        // Ensure input has original value set and is not read-only
        if (!input.readOnly && input.dataset.originalValue !== undefined) {
            const currentValue = input.value.replace(',', '.');
            const originalValue = input.dataset.originalValue.replace(',', '.');

            if (currentValue !== originalValue) {
                changesDetected = true;
            }
        }
    });

    const corteNum = tableId.split('-').pop(); 
    const saveButton = document.getElementById(`btn-guardar-corte-${corteNum}`);

    if (changesDetected) {
        saveButton.classList.remove('btn-outline-success', 'btn-success');
        saveButton.classList.add('btn-warning'); 
        saveButton.innerHTML = `<i class="bi bi-exclamation-circle-fill me-1"></i><span> Guardar</span>`; 
    } else {
        saveButton.classList.remove('btn-warning', 'btn-success');
        saveButton.classList.add('btn-outline-success'); 
        saveButton.innerHTML = `<i class="bi bi-save-fill"></i><span> Guardar</span>`; 
    }
    window._unsavedChangesExist = changesDetected;
}


async function guardarTodasNotasCorte(corte, asignaturaId, grupoId, profesorId) {
    const tabla = document.getElementById(`tabla-corte-${corte}`);
    const promises = [];
    let hasInvalidGrades = false; 

    tabla.querySelectorAll('tbody tr').forEach(row => {
        const estId = row.dataset.estudianteId;
        row.querySelectorAll('input.grade-input[data-corte="' + corte + '"]').forEach(input => {
            if (!validateGradeInput(input)) { 
                hasInvalidGrades = true; 
            }

            const tipoNota = input.dataset.tipoNota;
            const nombreColumnaExtra = input.dataset.nombreColumnaExtra || null; 
            let nota = parseFloat(input.value.replace(',', '.')); 

            if (input.value.trim() === '') {
                nota = 0.0;
            }
            
            if (!isNaN(nota) && !input.classList.contains('is-invalid')) { 
                const data = {
                    estudiante_id: estId, 
                    asignatura_id: asignaturaId, 
                    profesor_id: profesorId,
                    corte: corte, 
                    tipo_nota: tipoNota, 
                    nota: nota, 
                    nombre_columna_extra: nombreColumnaExtra 
                };
                promises.push(fetch("/api/notas", {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                }));
            }
        });
    });

    if (hasInvalidGrades) {
        alert("Por favor, corrige las notas inválidas (deben estar entre 0 y 5) antes de guardar.");
        return; 
    }

    try {
        await Promise.all(promises);
        alert("Notas guardadas exitosamente.");
        habilitarEdicionNotas(corte, false);
        // Special feedback for successful save
        const saveBtn = document.getElementById(`btn-guardar-corte-${corte}`);
        saveBtn.classList.remove('btn-outline-success', 'btn-warning');
        saveBtn.classList.add('btn-success'); 
        saveBtn.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i><span> Guardado!</span>`; 

        // Revert to outline-success after a short delay
        setTimeout(() => {
            saveBtn.classList.remove('btn-success');
            saveBtn.classList.add('btn-outline-success');
            saveBtn.innerHTML = `<i class="bi bi-save-fill"></i><span> Guardar</span>`;
            window._unsavedChangesExist = false; 
            // After reverting, ensure original values are reset to current for comparison
            document.querySelectorAll(`#tabla-corte-${corte} input.grade-input`).forEach(input => {
                input.dataset.originalValue = input.value.replace(',', '.');
            });
        }, 2000); 

        const currentClaseButton = document.querySelector('#notas-botones-materias .btn.btn-primary');
        if (currentClaseButton) {
            currentClaseButton.click(); 
        }
    } catch (error) {
        console.error("Error al guardar notas:", error);
        alert("Hubo un error al guardar las notas. Consulte la consola para más detalles.");
    }
}

async function llenarNotasEnTabla(profesorId, asignaturaId, grupoId) {
    try {
        const response = await fetch(`/api/notas?profesor_id=${profesorId}&asignatura_id=${asignaturaId}`);
        const notas = await response.json();

        for (let corte = 1; corte <= 3; corte++) {
            if (!window._colExtraNames[corte]) {
                window._colExtraNames[corte] = {}; 
            }
            window._colExtraNames[corte][grupoId] = []; 
            
            document.querySelectorAll(`#tabla-corte-${corte} tbody tr`).forEach(row => {
                Array.from(row.children).slice(4, -1).forEach(td => { 
                    const input = td.querySelector('input');
                    if (input && input.dataset.tipoNota && !['trabajos', 'quices', 'evaluacionfinal'].includes(input.dataset.tipoNota)) {
                        td.remove(); 
                    }
                });
            });
        }
        
        const currentClase = clasesDelProfesor.find(clase => clase.asignatura_id === asignaturaId && clase.grupo_id === grupoId);
        if (currentClase && currentClase.estudiantes) {
            currentClase.estudiantes.forEach(est => {
                if (!window._allStudentGrades[est.id]) {
                    window._allStudentGrades[est.id] = {totalSum: 0, totalCount: 0, gradesByCorte: { 1: [], 2: [], 3: [] }};
                }
                for (let c = 1; c <= 3; c++) {
                    window._allStudentGrades[est.id].gradesByCorte[c] = [];
                }
            });
        }


        const customColumnsToAdd = {}; 
        notas.forEach(nota => {
            const studentInCurrentClass = currentClase.estudiantes.find(est => est.id === nota.estudiante_id);

            if (studentInCurrentClass) {
                const inputElement = document.querySelector(`input[data-estudiante-id="${nota.estudiante_id}"][data-tipo-nota="${nota.tipo_nota}"][data-corte="${nota.corte}"]`);
                
                if (inputElement) {
                    inputElement.value = nota.nota;
                    inputElement.dataset.originalValue = String(nota.nota).replace(',', '.'); // Store as string, normalized
                    inputElement.classList.remove('is-invalid'); 
                    if (inputElement.nextElementSibling && inputElement.nextElementSibling.classList.contains('invalid-feedback')) {
                        inputElement.nextElementSibling.remove();
                    }
                    if (nota.nombrecolumnaextra) {
                        inputElement.dataset.nombreColumnaExtra = nota.nombrecolumnaextra;
                    }
                } 
                else if (nota.nombrecolumnaextra && !window._colExtraNames[nota.corte][grupoId].includes(nota.tipo_nota)) { 
                    if (!customColumnsToAdd[nota.corte]) {
                        customColumnsToAdd[nota.corte] = new Set();
                    }
                    customColumnsToAdd[nota.corte].add(JSON.stringify({
                        tipo_nota: nota.tipo_nota,
                        nombre_columna_extra: nota.nombrecolumnaextra
                    }));
                }
                if (!isNaN(nota.nota) && nota.nota >= 0 && nota.nota <= 5) {
                    if (!window._allStudentGrades[nota.estudiante_id]) {
                         window._allStudentGrades[nota.estudiante_id] = {totalSum: 0, totalCount: 0, gradesByCorte: { 1: [], 2: [], 3: [] }};
                    }
                    if (!window._allStudentGrades[nota.estudiante_id].gradesByCorte[nota.corte]) {
                        window._allStudentGrades[nota.estudiante_id].gradesByCorte[nota.corte] = [];
                    }
                    window._allStudentGrades[nota.estudiante_id].gradesByCorte[nota.corte].push(nota.nota);
                }
                calcularPromedioCorte(nota.corte, nota.estudiante_id);
            }
        });

        for (const corteStr in customColumnsToAdd) {
            const corte = parseInt(corteStr);
            customColumnsToAdd[corteStr].forEach(colStr => {
                const col = JSON.parse(colStr);
                addCustomColumnToTable(corte, col.tipo_nota, col.nombre_columna_extra, profesorId, asignaturaId, grupoId);
            });
        }

        notas.forEach(nota => {
            const studentInCurrentClass = currentClase.estudiantes.find(est => est.id === nota.estudiante_id);
            if (studentInCurrentClass) { 
                const inputElement = document.querySelector(`input[data-estudiante-id="${nota.estudiante_id}"][data-tipo-nota="${nota.tipo_nota}"][data-corte="${nota.corte}"]`);
                if (inputElement && inputElement.value === "") { 
                    inputElement.value = nota.nota;
                    inputElement.dataset.originalValue = String(nota.nota).replace(',', '.'); 
                    inputElement.classList.remove('is-invalid'); 
                    if (inputElement.nextElementSibling && inputElement.nextElementSibling.classList.contains('invalid-feedback')) {
                        inputElement.nextElementSibling.remove();
                    }
                }
                validateGradeInput(inputElement); 
                calcularPromedioCorte(nota.corte, nota.estudiante_id); 
            }
        });

        document.querySelectorAll('#tabla-promedio-final tbody tr').forEach(row => {
            const estId = row.dataset.estudianteId;
            calcularPromedioFinalAsignatura(estId);
        });

        window._unsavedChangesExist = false;
        document.querySelectorAll(`[id^="btn-guardar-corte-"]`).forEach(btn => {
            btn.classList.remove('btn-success', 'btn-warning');
            btn.classList.add('btn-outline-success');
            btn.innerHTML = `<i class="bi bi-save-fill"></i><span> Guardar</span>`; 
        });


    } catch (error) {
        console.error("Error al llenar notas en la tabla:", error);
        alert("Error al cargar las notas existentes.");
    }
}


function calcularPromedioCorte(corte, estId) {
    const inputs = document.querySelectorAll(`#tabla-corte-${corte} tbody tr[data-estudiante-id="${estId}"] .grade-input[data-corte="${corte}"]`);
    let sum = 0;
    let count = 0;
    const currentCorteGrades = []; 

    inputs.forEach(input => {
        const value = parseFloat(input.value.replace(',', '.')); 
        if (!isNaN(value) && value >= 0 && value <= 5) {
            sum += value;
            count++;
            currentCorteGrades.push(value);
        }
    });
    const promedioElement = document.getElementById(`prom-c${corte}-est${estId}`);
    if (promedioElement) {
        promedioElement.value = count > 0 ? (sum / count).toFixed(2) : 'N/A';
    }

    if (!window._allStudentGrades[estId]) {
         window._allStudentGrades[estId] = {totalSum: 0, totalCount: 0, gradesByCorte: { 1: [], 2: [], 3: [] }};
    }
    if (!window._allStudentGrades[estId].gradesByCorte[corte]) {
        window._allStudentGrades[estId].gradesByCorte[corte] = [];
    }
    window._allStudentGrades[estId].gradesByCorte[corte] = currentCorteGrades;
}

function calcularPromedioFinalAsignatura(estId) {
    let totalSum = 0;
    let totalCount = 0;

    if (window._allStudentGrades[estId]) { 
        for (let corte = 1; corte <= 3; corte++) {
            if (window._allStudentGrades[estId].gradesByCorte[corte]) {
                window._allStudentGrades[estId].gradesByCorte[corte].forEach(grade => {
                    totalSum += grade;
                    totalCount++;
                });
            }
        }
    }


    const promedioFinalElement = document.getElementById(`prom-final-est${estId}`);
    const estadoElement = document.getElementById(`estado-est${estId}`);

    if (promedioFinalElement) {
        const finalAverage = totalCount > 0 ? (totalSum / totalCount).toFixed(2) : 'N/A';
        promedioFinalElement.value = finalAverage;

        if (finalAverage !== 'N/A') {
            if (parseFloat(finalAverage) >= 3.0) {
                estadoElement.textContent = 'Aprobado';
                estadoElement.className = 'badge bg-success-subtle text-success-emphasis';
            } else {
                estadoElement.textContent = 'Reprobado';
                estadoElement.className = 'badge bg-danger-subtle text-danger-emphasis';
            }
        } else {
            estadoElement.textContent = '';
            estadoElement.className = 'badge';
        }
    }
}


function addCustomColumnToTable(corte, tipoNota, nombreColumna, profesorId, asignaturaId, grupoId) {
    if (!window._colExtraNames[corte]) {
        window._colExtraNames[corte] = {};
    }
    if (!window._colExtraNames[corte][grupoId]) {
        window._colExtraNames[corte][grupoId] = [];
    }

    if (!window._colExtraNames[corte][grupoId].includes(tipoNota)) { 
        window._colExtraNames[corte][grupoId].push(tipoNota);

        const theadRow = document.getElementById(`thead-corte-${corte}`);
        const newTh = document.createElement('th');
        newTh.textContent = nombreColumna;
        newTh.dataset.tipoNota = tipoNota; 
        theadRow.insertBefore(newTh, theadRow.lastElementChild); 

        document.querySelectorAll(`#tabla-corte-${corte} tbody tr`).forEach(row => {
            const estId = row.dataset.estudianteId;
            const newTd = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'form-control form-control-sm grade-input';
            input.dataset.tipoNota = tipoNota;
            input.dataset.estudianteId = estId;
            input.dataset.corte = corte; 
            input.dataset.nombreColumnaExtra = nombreColumna; 
            input.min = '0';
            input.max = '5';
            input.step = '0.1';
            input.readOnly = !window._notasEdicionActiva[corte]; 
            input.oninput = () => {
                validateGradeInput(input); 
                calcularPromedioCorte(corte, estId);
                calcularPromedioFinalAsignatura(estId); 
                checkUnsavedChanges(input.closest('table').id); 
            };
            newTd.appendChild(input);
            row.insertBefore(newTd, row.lastElementChild); 
        });
    }
}

async function agregarColumnaCorte(corte, profesorId, asignaturaId, grupoId) { 
    const nombreColumna = prompt("Ingrese el nombre de la nueva columna de nota (ej: Taller 1, Examen Final Parcial):");
    if (!nombreColumna) return;

    const tipoNota = nombreColumna.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!window._colExtraNames[corte]) {
        window._colExtraNames[corte] = {};
    }
    if (!window._colExtraNames[corte][grupoId]) {
        window._colExtraNames[corte][grupoId] = [];
    }

    if (window._colExtraNames[corte][grupoId].includes(tipoNota)) { 
        alert("Ya existe una columna con un nombre similar para este corte en este grupo. Por favor, use un nombre diferente.");
        return;
    }

    addCustomColumnToTable(corte, tipoNota, nombreColumna, profesorId, asignaturaId, grupoId); 

    const tabla = document.getElementById(`tabla-corte-${corte}`);
    const promises = [];
    tabla.querySelectorAll('tbody tr').forEach(row => {
        const estId = row.dataset.estudianteId;
        const data = {
            estudiante_id: estId,
            asignatura_id: asignaturaId,
            profesor_id: profesorId,
            corte: corte,
            tipo_nota: tipoNota,
            nombre_columna_extra: nombreColumna,
            nota: 0.0 
        };
        promises.push(fetch("/api/notas", {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        }));
    });

    try {
        await Promise.all(promises);
        alert(`Columna '${nombreColumna}' agregada exitosamente. Recuerde guardar las notas.`);
        document.querySelectorAll('#tabla-promedio-final tbody tr').forEach(row => {
            const estId = row.dataset.estudianteId;
            calcularPromedioFinalAsignatura(estId);
        });
        checkUnsavedChanges(`tabla-corte-${corte}`); 
    } catch (error) {
        console.error("Error al agregar columna y notas iniciales:", error);
        alert("Hubo un error al agregar la columna. Consulte la consola para más detalles.");
    }
}

async function eliminarColumnaCortePrompt(corte, profesorId, asignaturaId, grupoId) { 
    const customCols = (window._colExtraNames[corte] && window._colExtraNames[corte][grupoId]) ? 
                       window._colExtraNames[corte][grupoId].filter(tn => !['trabajos', 'quices', 'evaluacionfinal'].includes(tn)) : 
                       [];

    if (customCols.length === 0) {
        alert("No hay columnas adicionales para eliminar en este corte para este grupo.");
        return;
    }

    const colMap = {};
    const options = customCols.map((tn, idx) => {
        const thElement = document.querySelector(`#thead-corte-${corte} th[data-tipo-nota="${tn}"]`);
        const colName = thElement ? thElement.textContent : tn; 
        colMap[idx + 1] = tn;
        return `${idx + 1}. ${colName}`;
    }).join('\n');

    const selectedIdx = prompt(`Seleccione el número de la columna a eliminar para el Corte ${corte} del grupo ${grupoId}:\n${options}\n(Esta acción eliminará todas las notas asociadas a esta columna.)`);

    if (selectedIdx && colMap[parseInt(selectedIdx)]) {
        const tipoNotaToDelete = colMap[parseInt(selectedIdx)];
        const confirmation = confirm(`¿Está seguro de que desea eliminar la columna "${document.querySelector(`#thead-corte-${corte} th[data-tipo-nota="${tipoNotaToDelete}"]`).textContent}" y todas sus notas asociadas para el Corte ${corte} del grupo ${grupoId}?`);
        if (confirmation) {
            await eliminarColumnaCorte(corte, profesorId, asignaturaId, grupoId, tipoNotaToDelete); 
        }
    } else if (selectedIdx) {
        alert("Selección inválida.");
    }
}

async function eliminarColumnaCorte(corte, profesorId, asignaturaId, grupoId, tipoNota) { 
    try {
        const response = await fetch(`/api/notas/bulk_delete`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                profesor_id: profesorId,
                asignatura_id: asignaturaId,
                corte: corte,
                tipo_nota: tipoNota,
                grupo_id: grupoId 
            })
        });

        const result = await response.json();
        if (result.success) {
            alert(`Columna '${tipoNota}' eliminada exitosamente.`);
            const theadRow = document.getElementById(`thead-corte-${corte}`);
            const thToRemove = theadRow.querySelector(`th[data-tipo-nota="${tipoNota}"]`);
            if (thToRemove) thToRemove.remove();

            document.querySelectorAll(`#tabla-corte-${corte} tbody tr`).forEach(row => {
                const inputElement = row.querySelector(`input[data-tipo-nota="${tipoNota}"][data-corte="${corte}"]`);
                if (inputElement) {
                    const tdToRemove = inputElement.closest('td');
                    if (tdToRemove) tdToRemove.remove();
                }
                const estId = row.dataset.estudianteId;
                calcularPromedioCorte(corte, estId); 
                calcularPromedioFinalAsignatura(estId); 
            });

            if (window._colExtraNames[corte] && window._colExtraNames[corte][grupoId]) {
                window._colExtraNames[corte][grupoId] = window._colExtraNames[corte][grupoId].filter(tn => tn !== tipoNota);
            }
            checkUnsavedChanges(`tabla-corte-${corte}`); 
        } else {
            alert(`Error al eliminar la columna: ${result.message}`);
        }
    } catch (error) {
        console.error("Error al eliminar columna:", error);
        alert("Hubo un error al eliminar la columna. Consulte la consola.");
    }
}

async function eliminarNotasCorte(asignaturaId, grupoId, profesorId, corte) {
    const confirmation = confirm(`¿Está seguro de que desea eliminar TODAS las notas para el Corte ${corte} del grupo ${grupoId} de esta asignatura? Esta acción es irreversible.`);
    if (!confirmation) return;

    try {
        const response = await fetch(`/api/notas/bulk_delete`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                profesor_id: profesorId,
                asignatura_id: asignaturaId,
                corte: corte,
                grupo_id: grupoId 
            })
        });

        const result = await response.json();
        if (result.success) {
            alert("Notas del corte eliminadas correctamente.");
            document.querySelectorAll(`#tabla-corte-${corte} tbody tr`).forEach(row => {
                row.querySelectorAll(`input.grade-input[data-corte="${corte}"]`).forEach(input => input.value = '');
                document.getElementById(`prom-c${corte}-est${row.dataset.estudianteId}`).value = 'N/A'; 

                calcularPromedioFinalAsignatura(row.dataset.estudianteId);
            });

            const theadRow = document.getElementById(`thead-corte-${corte}`);
            if (theadRow) {
                Array.from(theadRow.children).slice(1, -1).forEach(th => {
                    const tipoNota = th.dataset.tipoNota;
                    if (tipoNota && !['trabajos', 'quices', 'evaluacionfinal'].includes(tipoNota)) {
                        th.remove();
                    }
                });
            }
            document.querySelectorAll(`#tabla-corte-${corte} tbody tr`).forEach(row => {
                Array.from(row.children).slice(1, -1).forEach(td => {
                    const input = td.querySelector('input');
                    if (input && input.dataset.tipoNota && !['trabajos', 'quices', 'evaluacionfinal'].includes(input.dataset.tipoNota)) {
                        td.remove();
                    }
                });
            });
            if (window._colExtraNames[corte]) {
                window._colExtraNames[corte][grupoId] = [];
            }
            
            habilitarEdicionNotas(corte, false); 
            window._unsavedChangesExist = false;
            const saveBtn = document.getElementById(`btn-guardar-corte-${corte}`);
            saveBtn.classList.remove('btn-warning');
            saveBtn.classList.add('btn-outline-success'); 
            saveBtn.innerHTML = `<i class="bi bi-save-fill"></i><span> Guardar</span>`;


        } else {
            alert(`Error al eliminar notas: ${result.message}`);
        }
    } catch (error) {
        console.error("Error al eliminar notas del corte:", error);
        alert("Hubo un error al eliminar las notas del corte.");
    }
}