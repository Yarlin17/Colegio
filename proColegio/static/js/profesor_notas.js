window._notasEdicionActiva = {}; // Moved from `mostrarNotasMateria` for global scope

// Global variables to store extra column details for each corte
// We will still use these *during a single session* for adding/removing,
// but for *initial load*, we will NOT automatically re-add them based on fetched data.
window._colExtraCount = {};
window._colExtraNames = {}; // This will now hold names *before* saving them per-note

async function displayRegistrosNotas(contenedor, profesorId, clases) {
  let registrosHTML = '<h2>Registro de Notas</h2>';
  registrosHTML += `<div id="notas-botones-materias" style="margin-bottom:1rem;">`;
  if (clases.length === 0) {
    registrosHTML += '<p>No se encontraron clases para gestionar registros.</p>';
  } else {
    clases.forEach((clase, idx) => {
      registrosHTML += `<button class="menu-button" style="margin-right:0.5rem;" onclick="mostrarNotasMateria(${idx}, ${profesorId}, ${clase.asignatura_id}, ${clase.grupo_id})">${clase.asignatura} - ${clase.grupo}</button>`;
    });
  }
  registrosHTML += `</div>`;
  registrosHTML += `<div id="notas-materia-contenedor"></div>`;
  contenedor.innerHTML = registrosHTML;

  // Initialize global variables for extra columns for each corte
  for (let i = 1; i <= 3; i++) {
    window._colExtraCount[i] = 0; // Reset count on initial load
    window._colExtraNames[i] = []; // Reset names on initial load
    window._notasEdicionActiva[i] = false; // Default to not active
  }

  // Re-expose global functions for the HTML to call
  window.mostrarNotasMateria = mostrarNotasMateria;
  window.habilitarEdicionNotas = habilitarEdicionNotas;
  window.eliminarNotasCorte = eliminarNotasCorte;
  window.agregarColumnaCorte = agregarColumnaCorte;
  window.eliminarColumnaCorte = eliminarColumnaCorte;
  window.calcularPromedioCorte = calcularPromedioCorte;
  window.calcularPromedioFinal = calcularPromedioFinal;
  window.guardarNota = guardarNota; // Keep this for oninput
  window.guardarTodasNotasCorte = guardarTodasNotasCorte; // New function for the button
  window.regresarSeleccionNotas = regresarSeleccionNotas;
}

async function mostrarNotasMateria(claseIdx, profesorId, asignaturaId, grupoId) {
  document.getElementById("notas-botones-materias").style.display = "none";
  let html = `<button class="menu-button" style="margin-bottom:1rem;" onclick="regresarSeleccionNotas()">&larr; Regresar</button>`;
  const clase = clasesDelProfesor[claseIdx]; // Access global clasesDelProfesor
  html += `<h3>${clase.asignatura} - ${clase.grupo}</h3>`;

  // Initialize _colExtraCount and _colExtraNames for each corte before rendering tables.
  // This is crucial to ensure correct initial state for dynamic column addition.
  for (let corte = 1; corte <= 3; corte++) {
    window._colExtraCount[corte] = 0;
    window._colExtraNames[corte] = [];
    window._notasEdicionActiva[corte] = false; // Ensure editing is off by default
  }

  for (let corte = 1; corte <= 3; corte++) {
    html += `
      <div style="display:flex; justify-content:flex-end; align-items:center; margin-bottom:0.3rem;">
        <button class="mini-action-btn" id="btn-editar-corte-${corte}" onclick="habilitarEdicionNotas(${corte}, true)" title="Editar"><span>&#9998;</span></button>
        <button class="mini-action-btn" id="btn-guardar-corte-${corte}" onclick="guardarTodasNotasCorte(${corte}, ${clase.asignatura_id}, ${clase.grupo_id}, ${profesorId})" title="Guardar" disabled><span>&#x1F4BE;</span></button>
        <button class="mini-action-btn" id="btn-eliminar-corte-${corte}" onclick="eliminarNotasCorte(${clase.asignatura_id}, ${clase.grupo_id}, ${profesorId}, ${corte})" title="Eliminar" disabled><span>&#128465;</span></button>
        <button class="mini-action-btn" id="btn-agregar-col-corte-${corte}" onclick="agregarColumnaCorte(${corte}, ${clase.asignatura_id}, ${clase.grupo_id}, ${profesorId})" title="Agregar columna" disabled><span>+</span></button>
        <button class="mini-action-btn" id="btn-quitar-col-corte-${corte}" onclick="eliminarColumnaCorte(${corte}, ${clase.asignatura_id}, ${clase.grupo_id}, ${profesorId})" title="Eliminar columna" disabled><span>-</span></button>
      </div>
    `;
    html += `
      <table class="student-table" id="tabla-corte-${corte}">
        <thead>
          <tr id="thead-corte-${corte}">
            <th>Estudiante</th>
            <th>Trabajos</th>
            <th>Quices</th>
            <th>Evaluación Final</th>
            <th>Promedio Corte</th>
          </tr>
        </thead>
        <tbody>
    `;
    clase.estudiantes.sort((a,b) => a.nombre.localeCompare(b.nombre)).forEach((estudiante) => {
      const idTrab = `grade-input-${asignaturaId}-${grupoId}-${estudiante.id}-${corte}-trabajos`;
      const idQuiz = `grade-input-${asignaturaId}-${grupoId}-${estudiante.id}-${corte}-quices`;
      const idEval = `grade-input-${asignaturaId}-${grupoId}-${estudiante.id}-${corte}-evaluacionfinal`;
      const idProm = `prom-c${corte}-${estudiante.id}`;
      
      html += `
        <tr>
          <td>${estudiante.nombre}</td>
          <td><input type="number" class="grade-input" id="${idTrab}" placeholder="Trabajos" min="0" max="5" step="0.1"
              oninput="calcularPromedioCorte(${asignaturaId}, ${grupoId}, ${corte}, ${estudiante.id}); guardarNota(${estudiante.id}, ${asignaturaId}, ${profesorId}, ${corte}, 'Trabajos', this)" ${window._notasEdicionActiva[corte] ? "" : "readonly"}></td>
          <td><input type="number" class="grade-input" id="${idQuiz}" placeholder="Quices" min="0" max="5" step="0.1"
              oninput="calcularPromedioCorte(${asignaturaId}, ${grupoId}, ${corte}, ${estudiante.id}); guardarNota(${estudiante.id}, ${asignaturaId}, ${profesorId}, ${corte}, 'Quices', this)" ${window._notasEdicionActiva[corte] ? "" : "readonly"}></td>
          <td><input type="number" class="grade-input" id="${idEval}" placeholder="Evaluación Final" min="0" max="5" step="0.1"
              oninput="calcularPromedioCorte(${asignaturaId}, ${grupoId}, ${corte}, ${estudiante.id}); guardarNota(${estudiante.id}, ${asignaturaId}, ${profesorId}, ${corte}, 'Evaluacion Final', this)" ${window._notasEdicionActiva[corte] ? "" : "readonly"}></td>
          <td><input type="text" class="grade-input" id="${idProm}" placeholder="Promedio" readonly style="background:#f5f5f5;"></td>
        </tr>
      `;
    });
    html += `
        </tbody>
      </table>
    `;
  }
  html += `
    <h4>Promedio Final</h4>
    <table class="student-table" id="tabla-final">
      <thead>
        <tr>
          <th>Estudiante</th>
          <th>Promedio Final</th>
        </tr>
      </thead>
      <tbody>
  `;
  clase.estudiantes.sort((a,b) => a.nombre.localeCompare(b.nombre)).forEach((estudiante) => {
    html += `
      <tr>
        <td>${estudiante.nombre}</td>
        <td><input type="text" class="grade-input" id="final-${estudiante.id}" placeholder="Promedio Final" readonly style="background:#f5f5f5;"></td>
      </tr>
    `;
  });
  html += `
      </tbody>
    </table>
  `;
  document.getElementById("notas-materia-contenedor").innerHTML = html;
  
  // Now populate notes and re-add extra columns based on fetched data.
  // The `llenarNotasEnTabla` function will now handle fetching notes and re-adding columns.
  llenarNotasEnTabla(profesorId, asignaturaId, grupoId); 

  // Re-enable/disable buttons based on the last known state of _notasEdicionActiva
  for (let corte = 1; corte <= 3; corte++) {
      habilitarEdicionNotas(corte, window._notasEdicionActiva[corte]);
  }
}

// Update llenarNotasEnTabla to accept parameters and fetch its own notes
const llenarNotasEnTabla = async (profesorId, asignaturaId, grupoId) => {
    let notasExistentesActualizadas = [];
    try {
        const response = await fetch(`/api/notas?profesor_id=${profesorId}&asignatura_id=${asignaturaId}`);
        notasExistentesActualizadas = await response.json();
        console.log("Notes fetched for population:", notasExistentesActualizadas);
    } catch (error) {
        console.error("Error fetching updated notes:", error);
        return;
    }

    // First, dynamically add extra columns if they exist in the fetched notes
    for (let corte = 1; corte <= 3; corte++) {
        const extra1NotesForCorte = notasExistentesActualizadas.filter(n => n.corte === corte && n.tipo_nota === 'Extra1');
        const extra2NotesForCorte = notasExistentesActualizadas.filter(n => n.corte === corte && n.tipo_nota === 'Extra2');

        // Reset global state for this corte before re-adding based on data
        window._colExtraCount[corte] = 0;
        window._colExtraNames[corte] = [];

        if (extra1NotesForCorte.length > 0) {
            const customName1 = extra1NotesForCorte[0].nombrecolumnaextra || 'Extra1';
            agregarColumnaCorte(corte, asignaturaId, grupoId, profesorId, true, customName1);
        }
        if (extra2NotesForCorte.length > 0) {
            const customName2 = extra2NotesForCorte[0].nombrecolumnaextra || 'Extra2';
            agregarColumnaCorte(corte, asignaturaId, grupoId, profesorId, true, customName2);
        }
    }

    // Now populate the notes into the existing (or newly added) input fields
    notasExistentesActualizadas.forEach(nota => {
        const tipoNotaFormatted = nota.tipo_nota.replace(/\s/g, '').toLowerCase();
        // Construct the input ID using correct asignaturaId and grupoId parameters
        const inputId = `grade-input-${asignaturaId}-${grupoId}-${nota.estudiante_id}-${nota.corte}-${tipoNotaFormatted}`;
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.value = nota.nota;
        } else {
            console.warn(`Input element not found for ID: ${inputId}. This might be an extra column note whose column wasn't re-added or input ID is incorrect.`);
        }
    });

    // Recalculate all corte averages after all individual notes are set
    const currentClass = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);
    if (currentClass) {
        currentClass.estudiantes.forEach((estudiante) => {
            for (let corte = 1; corte <= 3; corte++) {
                calcularPromedioCorte(asignaturaId, grupoId, corte, estudiante.id);
            }
        });
        calcularPromedioFinal(asignaturaId, grupoId, currentClass.estudiantes.length);
    }
};


function habilitarEdicionNotas(corte, activar) {
  const tabla = document.getElementById(`tabla-corte-${corte}`);
  if (!tabla) return;
  tabla.querySelectorAll('input.grade-input').forEach(input => {
    if (input.type === "number") input.readOnly = !activar;
  });
  document.getElementById(`btn-eliminar-corte-${corte}`).disabled = !activar;
  document.getElementById(`btn-agregar-col-corte-${corte}`).disabled = !activar;
  document.getElementById(`btn-quitar-col-corte-${corte}`).disabled = !activar;
  document.getElementById(`btn-editar-corte-${corte}`).disabled = activar; // Disable edit button when active
  document.getElementById(`btn-guardar-corte-${corte}`).disabled = !activar; // Enable save button when active
  if (window._colExtraCount[corte] > 0) { // Only check if extra columns exist
    for (let i = 0; i < window._colExtraCount[corte]; i++) {
      const th = document.getElementById(`extra-th-c${corte}-${i}`);
      if (th) {
        th.contentEditable = activar ? "true" : "false";
        if (activar) th.classList.add("editable-th");
        else th.classList.remove("editable-th");
      }
    }
  }
  window._notasEdicionActiva[corte] = activar;
}

// NEW FUNCTION: Save all notes for a specific corte when the Save button is clicked
async function guardarTodasNotasCorte(corte, asignaturaId, grupoId, profesorId) {
    const tabla = document.getElementById(`tabla-corte-${corte}`);
    if (!tabla) return;

    const currentClass = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);
    if (!currentClass) return;

    const studentRows = tabla.querySelectorAll('tbody tr');
    const promises = [];

    studentRows.forEach(row => {
        const student = currentClass.estudiantes.find(e => `${e.nombre} ${e.apellido}`.trim() === row.querySelector('td:first-child').textContent.trim());
        const studentId = student?.id;
        if (!studentId) return;

        const inputs = row.querySelectorAll('input.grade-input[type="number"]');
        inputs.forEach(input => {
            const idParts = input.id.split('-');
            const tipoNota = idParts[idParts.length - 1]
                                .replace('trabajos', 'Trabajos')
                                .replace('quices', 'Quices')
                                .replace('evaluacionfinal', 'Evaluacion Final')
                                .replace('extra1', 'Extra1')
                                .replace('extra2', 'Extra2');

            // Get the custom column name from the header if it's an extra column
            let nombreColumnaExtra = null;
            if (tipoNota === 'Extra1' || tipoNota === 'Extra2') {
                const colIndex = (tipoNota === 'Extra1' ? 0 : 1); // 0 for Extra1, 1 for Extra2
                const thElement = document.getElementById(`extra-th-c${corte}-${colIndex}`);
                if (thElement && thElement.contentEditable === "true") { // Only capture if it's currently editable (means it's a dynamic column)
                    nombreColumnaExtra = thElement.textContent.trim();
                } else if (window._colExtraNames[corte] && window._colExtraNames[corte][colIndex]) { // Fallback to global state
                    nombreColumnaExtra = window._colExtraNames[corte][colIndex];
                }
            }


            const notaValue = parseFloat(input.value);
            const nota = isNaN(notaValue) ? 0 : notaValue;

            if (nota < 0 || nota > 5) {
                console.error(`Nota inválida para ${tipoNota}: ${nota} para estudiante ${studentId}`);
                return;
            }

            const data = {
                estudiante_id: studentId,
                asignatura_id: asignaturaId,
                profesor_id: profesorId,
                corte: corte,
                tipo_nota: tipoNota,
                nombre_columna_extra: nombreColumnaExtra, // Send the custom name
                nota: nota
            };
            promises.push(
                fetch("/api/notas", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                .then(response => response.json())
                .then(result => {
                    if (!result.success) {
                        console.error("Error al guardar nota:", result.message);
                    } else {
                        console.log(`Nota para ${tipoNota} del estudiante ${studentId} en corte ${corte} guardada/actualizada.`);
                    }
                    return result;
                })
                .catch(error => {
                    console.error("Error de conexión al guardar nota:", error);
                })
            );
        });
    });

    try {
        await Promise.all(promises);
        alert("Notas guardadas correctamente.");
        habilitarEdicionNotas(corte, false); // Disable editing after saving
    } catch (error) {
        alert("Hubo un error al guardar algunas notas. Por favor, revise la consola para más detalles.");
    }
}


async function eliminarNotasCorte(asignaturaId, grupoId, profesorId, corte) {
  if (!window._notasEdicionActiva[corte]) return;
  if (!confirm("¿Seguro que desea eliminar TODAS las notas de este corte para esta clase? Esta acción es irreversible.")) return;

  try {
      const response = await fetch("/api/notas/bulk_delete", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              profesor_id: profesorId,
              asignatura_id: asignaturaId,
              corte: corte
          })
      });
      const result = await response.json();
      if (result.success) {
          alert("Notas del corte eliminadas correctamente.");
          const tabla = document.getElementById(`tabla-corte-${corte}`);
          if (tabla) {
              tabla.querySelectorAll('input.grade-input[type="number"]').forEach(input => input.value = "");
              tabla.querySelectorAll('input[readonly][id^="prom-c"]').forEach(input => input.value = "0.0");
          }
          const currentClassObj = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);
          if (currentClassObj) {
               currentClassObj.estudiantes.forEach((estudiante) => {
                   calcularPromedioFinal(asignaturaId, grupoId, currentClassObj.estudiantes.length);
               });
          }
          // Reset extra column count for this corte after deletion
          window._colExtraCount[corte] = 0;
          window._colExtraNames[corte] = [];
          // To make columns disappear immediately, re-render the section:
          // This will re-call mostrarNotasMateria and rebuild the table from default state
          const contenedor = document.getElementById("contenido-principal");
          mostrarNotasMateria(clasesDelProfesor.findIndex(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId), profesorId, asignaturaId, grupoId);

      } else {
          alert(`Error al eliminar las notas del corte: ${result.message}`);
      }
  } catch (error) {
      console.error("Error de conexión al eliminar notas del corte:", error);
      alert("Error de conexión al eliminar las notas del corte.");
  }
}

function agregarColumnaCorte(corte, asignaturaId, grupoId, profesorId, isReload = false, colName = "Extra") {
  if (!isReload && !window._notasEdicionActiva[corte]) return;
  // Limit to 2 extra columns
  if (!isReload && window._colExtraCount[corte] >= 2) return;

  const tabla = document.getElementById(`tabla-corte-${corte}`);
  if (!tabla) return;
  const theadRow = tabla.querySelector("thead tr");
  
  let insertIdx;
  let tipoNotaExtra;
  if (window._colExtraCount[corte] === 0) { // First extra column
    insertIdx = 2; // Insert before Quices (index 2 in original table: Estudiante[0], Trabajos[1], Quices[2])
    tipoNotaExtra = 'Extra1';
  } else if (window._colExtraCount[corte] === 1) { // Second extra column
    insertIdx = theadRow.children.length - 2; // Insert before Evaluación Final (index 4 in original table, or 5 if Extra1 is present)
    tipoNotaExtra = 'Extra2';
  } else {
      return; // Should not happen if limit is working
  }

  const th = document.createElement("th");
  th.textContent = colName;
  const colIndexForId = window._colExtraCount[corte]; // Use current count for ID
  th.id = `extra-th-c${corte}-${colIndexForId}`;
  th.contentEditable = "true";
  th.className = "editable-th";
  th.setAttribute('data-tipo-nota-extra', tipoNotaExtra);
  th.onblur = function() {
      // Capture custom name when blur occurs
      if (window._colExtraNames[corte]) {
          window._colExtraNames[corte][colIndexForId] = this.textContent;
      }
      // If a note exists for this column, save it to update the name
      const studentId = clase.estudiantes[0].id; // Just pick first student to trigger a save
      const inputElement = document.getElementById(`grade-input-${asignaturaId}-${grupoId}-${studentId}-${corte}-${tipoNotaExtra.toLowerCase()}`);
      if (inputElement) {
          guardarNota(studentId, asignaturaId, profesorId, corte, tipoNotaExtra, inputElement);
      }
  };
  theadRow.insertBefore(th, theadRow.children[insertIdx]);
  
  // Store the column name in global state for current session
  if (!window._colExtraNames[corte]) window._colExtraNames[corte] = [];
  window._colExtraNames[corte][colIndexForId] = colName;

  const currentClass = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);

  currentClass.estudiantes.sort((a,b) => a.nombre.localeCompare(b.nombre)).forEach((estudiante) => {
    const td = document.createElement("td");
    const inputId = `grade-input-${asignaturaId}-${grupoId}-${estudiante.id}-${corte}-${tipoNotaExtra.toLowerCase()}`;
    td.innerHTML = `<input type="number" class="grade-input extra-col" id="${inputId}" placeholder="${colName}" min="0" max="5" step="0.1"
        oninput="calcularPromedioCorte(${asignaturaId}, ${grupoId}, ${corte}, ${estudiante.id}); guardarNota(${estudiante.id}, ${asignaturaId}, ${profesorId}, ${corte}, '${tipoNotaExtra}', this)"
        ${window._notasEdicionActiva[corte] ? "" : "readonly"}>`;
    
    const targetRow = Array.from(tabla.querySelectorAll("tbody tr")).find(row => {
        const firstCell = row.querySelector('td:first-child');
        const student = currentClass.estudiantes.find(e => e.id === estudiante.id);
        return firstCell && student && firstCell.textContent.trim() === student.nombre;
    });

    if (targetRow) {
      targetRow.insertBefore(td, targetRow.children[insertIdx]);
    }
  });
  window._colExtraCount[corte]++;
}

async function eliminarColumnaCorte(corte, asignaturaId, grupoId, profesorId) {
  if (!window._notasEdicionActiva[corte]) return;
  if (!window._colExtraCount[corte] || window._colExtraCount[corte] === 0) return;
  
  let removeIdx;
  let tipoNotaToRemove;
  let colExtraIndex;

  if (window._colExtraCount[corte] === 2) {
    removeIdx = 4;
    tipoNotaToRemove = 'Extra2';
    colExtraIndex = 1;
  } else { // window._colExtraCount[corte] === 1
    removeIdx = 2;
    tipoNotaToRemove = 'Extra1';
    colExtraIndex = 0;
  }

  if (!confirm(`¿Seguro que desea eliminar la columna "${window._colExtraNames[corte][colExtraIndex] || tipoNotaToRemove}"? Esto eliminará todas las notas asociadas a ella.`)) return;

  try {
      const response = await fetch("/api/notas/bulk_delete", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              profesor_id: profesorId,
              asignatura_id: asignaturaId,
              corte: corte,
              tipo_nota: tipoNotaToRemove
          })
      });
      const result = await response.json();
      if (result.success) {
          alert("Columna y sus notas eliminadas correctamente.");

          const tabla = document.getElementById(`tabla-corte-${corte}`);
          const theadRow = tabla.querySelector("thead tr");
          const rows = tabla.querySelectorAll("tbody tr");

          // Remove TH from header
          if (theadRow.children[removeIdx]) {
            theadRow.removeChild(theadRow.children[removeIdx]);
          }
          
          // Remove TD from all rows
          rows.forEach(tr => {
              if (tr.children[removeIdx]) {
                tr.removeChild(tr.children[removeIdx]);
              }
          });

          window._colExtraCount[corte]--;
          if (window._colExtraNames[corte]) {
              window._colExtraNames[corte].splice(colExtraIndex, 1);
          }

          const currentClass = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);
          currentClass.estudiantes.forEach((estudiante) => {
              calcularPromedioCorte(asignaturaId, grupoId, corte, estudiante.id);
          });
          calcularPromedioFinal(asignaturaId, grupoId, currentClass.estudiantes.length);

      } else {
          alert(`Error al eliminar columna y notas: ${result.message}`);
      }
  } catch (error) {
      console.error("Error al eliminar columna y notas:", error);
      alert("Error al eliminar la columna o sus notas.");
  }
}

// Función para calcular el promedio de corte (incluye extras si presentes)
function calcularPromedioCorte(asignaturaId, grupoId, corte, estudianteId) {
  const tabla = document.getElementById(`tabla-corte-${corte}`);
  if (!tabla) return;
  
  const studentRow = Array.from(tabla.querySelectorAll("tbody tr")).find(row => {
    const firstCell = row.querySelector('td:first-child');
    const currentClass = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);
    const student = currentClass.estudiantes.find(e => e.id === estudianteId);
    return firstCell && student && firstCell.textContent.trim() === student.nombre;
  });

  if (!studentRow) {
      console.warn(`No se encontró la fila del estudiante ${estudianteId} en el corte ${corte}`);
      return;
  }

  let vals = [];
  const trabajosInput = studentRow.querySelector(`input[id$="-trabajos"]`);
  if (trabajosInput) vals.push(parseFloat(trabajosInput.value));
  
  const extra1Input = studentRow.querySelector(`input[id$="-extra1"]`);
  if (extra1Input) vals.push(parseFloat(extra1Input.value));

  const quicesInput = studentRow.querySelector(`input[id$="-quices"]`);
  if (quicesInput) vals.push(parseFloat(quicesInput.value));

  const extra2Input = studentRow.querySelector(`input[id$="-extra2"]`);
  if (extra2Input) vals.push(parseFloat(extra2Input.value));

  const evalFinalInput = studentRow.querySelector(`input[id$="-evaluacionfinal"]`);
  if (evalFinalInput) vals.push(parseFloat(evalFinalInput.value));
  
  let prom = 0.0;
  const validVals = vals.map(v => isNaN(v) ? 0 : v).filter(v => v !== null);

  if (validVals.length > 0) {
    prom = (validVals.reduce((a, b) => a + b, 0) / validVals.length).toFixed(2);
  } else {
    prom = "0.0";
  }

  const promCorteInput = document.getElementById(`prom-c${corte}-${estudianteId}`);
  if (promCorteInput) {
    promCorteInput.value = prom;
  } else {
    console.warn(`Input for prom-c${corte}-${estudianteId} not found.`);
  }

  const currentClassObj = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);
  calcularPromedioFinal(asignaturaId, grupoId, currentClassObj.estudiantes.length);
}

// Calcular promedio final (promedio de los promedios de cada corte)
function calcularPromedioFinal(asignaturaId, grupoId, numEstudiantes) {
  const currentClass = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);
  if (!currentClass) return;

  currentClass.estudiantes.sort((a,b) => a.nombre.localeCompare(b.nombre)).forEach((estudiante) => {
    let suma = 0;
    let count = 0;
    for (let corte = 1; corte <= 3; corte++) {
      const promInput = document.getElementById(`prom-c${corte}-${estudiante.id}`);
      if (promInput && promInput.value !== "") {
        const promValue = parseFloat(promInput.value);
        if (!isNaN(promValue)) {
          suma += promValue;
          count++;
        }
      }
    }
    const finalInput = document.getElementById(`final-${estudiante.id}`);
    if (finalInput) {
      finalInput.value = count > 0 ? (suma / count).toFixed(2) : "0.0";
    } else {
        console.warn(`Input for final-${estudiante.id} not found.`);
    }
  });
}

async function guardarNota(estudianteId, asignaturaId, profesorId, corte, tipoNota, inputElement) {
  const notaValue = parseFloat(inputElement.value);
  const nota = isNaN(notaValue) ? 0 : notaValue;

  if (nota < 0 || nota > 5) {
      console.error(`Nota inválida para ${tipoNota}: ${nota}`);
      inputElement.style.transition = 'border-color 0.3s ease';
      inputElement.style.borderColor = '#f44336';
      return;
  }

  // Get the custom column name if it's an extra column type
  let nombreColumnaExtra = null;
  if (tipoNota === 'Extra1' || tipoNota === 'Extra2') {
      const colIndex = (tipoNota === 'Extra1' ? 0 : 1);
      const thElement = document.getElementById(`extra-th-c${corte}-${colIndex}`);
      if (thElement && thElement.contentEditable === "true") { // If it's a dynamic header being edited
          nombreColumnaExtra = thElement.textContent.trim();
      } else if (window._colExtraNames[corte] && window._colExtraNames[corte][colIndex]) { // Fallback to global state
          nombreColumnaExtra = window._colExtraNames[corte][colIndex];
      }
  }

  const data = {
      estudiante_id: estudianteId,
      asignatura_id: asignaturaId,
      profesor_id: profesorId,
      corte: corte,
      tipo_nota: tipoNota,
      nombre_columna_extra: nombreColumnaExtra, // Pass the custom name
      nota: nota
  };

  try {
      const response = await fetch("/api/notas", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
          console.log(`Nota para ${tipoNota} del estudiante ${estudianteId} en corte ${corte} guardada/actualizada.`);
          inputElement.style.transition = 'border-color 0.3s ease';
          inputElement.style.borderColor = '#4CAF50';
          setTimeout(() => {
              inputElement.style.borderColor = '';
          }, 1000);
      } else {
          console.error("Error al guardar nota:", result.message);
          alert(`Error al guardar la nota: ${result.message}`);
          inputElement.style.transition = 'border-color 0.3s ease';
          inputElement.style.borderColor = '#f44336';
      }
  } catch (error) {
      console.error("Error de conexión al guardar nota:", error);
      alert("Error de conexión al guardar la nota.");
      inputElement.style.transition = 'border-color 0.3s ease';
      inputElement.style.borderColor = '#f44336';
  }
}

function regresarSeleccionNotas() {
  document.getElementById("notas-botones-materias").style.display = "block";
  document.getElementById("notas-materia-contenedor").innerHTML = "";
}