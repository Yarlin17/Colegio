window._notasEdicionActiva = {}; // Moved from `mostrarNotasMateria` for global scope

// Global variables to store extra column details for each corte
window._colExtraCount = {};
window._colExtraNames = {};

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

  // Initialize global variables for extra columns if not already
  for (let i = 1; i <= 3; i++) {
    if (typeof window._colExtraCount[i] === 'undefined') {
      window._colExtraCount[i] = 0;
    }
    if (typeof window._colExtraNames[i] === 'undefined') {
      window._colExtraNames[i] = [];
    }
    if (typeof window._notasEdicionActiva[i] === 'undefined') {
        window._notasEdicionActiva[i] = false; // Default to not active
    }
  }

  // Re-expose global functions for the HTML to call
  window.mostrarNotasMateria = mostrarNotasMateria;
  window.habilitarEdicionNotas = habilitarEdicionNotas;
  window.eliminarNotasCorte = eliminarNotasCorte;
  window.agregarColumnaCorte = agregarColumnaCorte;
  window.eliminarColumnaCorte = eliminarColumnaCorte;
  window.calcularPromedioCorte = calcularPromedioCorte;
  window.calcularPromedioFinal = calcularPromedioFinal;
  window.guardarNota = guardarNota;
  window.regresarSeleccionNotas = regresarSeleccionNotas;
}

async function mostrarNotasMateria(claseIdx, profesorId, asignaturaId, grupoId) {
  document.getElementById("notas-botones-materias").style.display = "none";
  let html = `<button class="menu-button" style="margin-bottom:1rem;" onclick="regresarSeleccionNotas()">&larr; Regresar</button>`;
  const clase = clasesDelProfesor[claseIdx]; // Access global clasesDelProfesor
  html += `<h3>${clase.asignatura} - ${clase.grupo}</h3>`;

  // Function to populate inputs after HTML is rendered
  const llenarNotasEnTabla = async () => {
      const currentClass = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);
      if (!currentClass) return;

      let notasExistentesActualizadas = [];
      try {
          const response = await fetch(`/api/notas?profesor_id=${profesorId}&asignatura_id=${asignaturaId}`);
          notasExistentesActualizadas = await response.json();
          console.log("Notas existentes fetched:", notasExistentesActualizadas);
      } catch (error) {
          console.error("Error fetching updated notes:", error);
          return;
      }

      // First, reset all inputs to clear previous state before populating
      for (let corte = 1; corte <= 3; corte++) {
        const tabla = document.getElementById(`tabla-corte-${corte}`);
        if (tabla) {
          tabla.querySelectorAll('input.grade-input[type="number"]').forEach(input => input.value = "");
          tabla.querySelectorAll('input[readonly][id^="prom-c"]').forEach(input => input.value = "0.0");
        }
      }

      notasExistentesActualizadas.forEach(nota => {
          const tipoNotaFormatted = nota.tipo_nota.replace(/\s/g, '').toLowerCase();
          const inputId = `grade-input-${asignaturaId}-${grupoId}-${nota.estudiante_id}-${nota.corte}-${tipoNotaFormatted}`;
          const inputElement = document.getElementById(inputId);
          if (inputElement) {
              inputElement.value = nota.nota;
              // No need to call calculate here directly.
              // We will call calculatePromedioCorte for all students after all notes are populated.
          }
      });

      // After all individual notes are set, recalculate all corte averages
      currentClass.estudiantes.forEach((estudiante) => {
        for (let corte = 1; corte <= 3; corte++) {
          calcularPromedioCorte(asignaturaId, grupoId, corte, estudiante.id);
        }
      });
      calcularPromedioFinal(asignaturaId, grupoId, currentClass.estudiantes.length);
  };

  for (let corte = 1; corte <= 3; corte++) {
    html += `
      <div style="display:flex; justify-content:flex-end; align-items:center; margin-bottom:0.3rem;">
        <button class="mini-action-btn" id="btn-editar-corte-${corte}" onclick="habilitarEdicionNotas(${corte}, true)" title="Editar"><span>&#9998;</span></button>
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
  
  // Reapply extra columns and their names if they were added previously
  for (let corte = 1; corte <= 3; corte++) {
    if (window._colExtraCount[corte] > 0) {
      for (let i = 0; i < window._colExtraCount[corte]; i++) {
        // Pass the stored column name when re-adding
        agregarColumnaCorte(corte, asignaturaId, grupoId, profesorId, true, window._colExtraNames[corte][i]);
      }
    }
  }
  // Enable/disable buttons based on the last known state of _notasEdicionActiva
  for (let corte = 1; corte <= 3; corte++) {
      habilitarEdicionNotas(corte, window._notasEdicionActiva[corte]);
  }

  llenarNotasEnTabla(); // Call this AFTER all HTML is rendered and extra columns are added
}

function habilitarEdicionNotas(corte, activar) {
  const tabla = document.getElementById(`tabla-corte-${corte}`);
  if (!tabla) return;
  tabla.querySelectorAll('input.grade-input').forEach(input => {
    if (input.type === "number") input.readOnly = !activar;
  });
  document.getElementById(`btn-eliminar-corte-${corte}`).disabled = !activar;
  document.getElementById(`btn-agregar-col-corte-${corte}`).disabled = !activar;
  document.getElementById(`btn-quitar-col-corte-${corte}`).disabled = !activar;
  document.getElementById(`btn-editar-corte-${corte}`).disabled = activar;
  if (window._colExtraCount[corte]) {
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
      if (!window._colExtraNames[corte]) window._colExtraNames[corte] = [];
      // Update the name in the array at the specific index corresponding to this column
      window._colExtraNames[corte][colIndexForId] = this.textContent;
  };
  theadRow.insertBefore(th, theadRow.children[insertIdx]);
  
  // Store the column name if it's not a reload
  if (!isReload) {
    if (!window._colExtraNames[corte]) window._colExtraNames[corte] = [];
    window._colExtraNames[corte][colIndexForId] = colName;
  }

  const currentClass = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);

  currentClass.estudiantes.sort((a,b) => a.nombre.localeCompare(b.nombre)).forEach((estudiante) => {
    const td = document.createElement("td");
    const inputId = `grade-input-${asignaturaId}-${grupoId}-${estudiante.id}-${corte}-${tipoNotaExtra.toLowerCase()}`;
    td.innerHTML = `<input type="number" class="grade-input extra-col" id="${inputId}" placeholder="${colName}" min="0" max="5" step="0.1"
        oninput="calcularPromedioCorte(${asignaturaId}, ${grupoId}, ${corte}, ${estudiante.id}); guardarNota(${estudiante.id}, ${asignaturaId}, ${profesorId}, ${corte}, '${tipoNotaExtra}', this)"
        ${window._notasEdicionActiva[corte] ? "" : "readonly"}>`;
    
    const targetRow = Array.from(tabla.querySelectorAll("tbody tr")).find(row => {
        const firstCell = row.querySelector('td:first-child');
        return firstCell && firstCell.textContent.trim() === estudiante.nombre;
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
    // If two extra columns, remove the second one (Extra2), which is at the fixed original index of Evaluación Final if only original columns are counted (index 4 for Eval Final, 3 if only Quices and Trabajos are considered)
    // After Trabajos (idx 1), Extra1 (idx 2), Quices (idx 3) -> Extra2 will be at idx 4
    removeIdx = 4; // Assuming 0:Estudiante, 1:Trabajos, 2:Extra1, 3:Quices, 4:Extra2, 5:EvaluaciónFinal, 6:PromedioCorte
    tipoNotaToRemove = 'Extra2';
    colExtraIndex = 1; // Index in _colExtraNames array
  } else { // window._colExtraCount[corte] === 1
    // If one extra column, remove the first one (Extra1)
    removeIdx = 2; // Assuming 0:Estudiante, 1:Trabajos, 2:Extra1, 3:Quices, 4:EvaluaciónFinal, 5:PromedioCorte
    tipoNotaToRemove = 'Extra1';
    colExtraIndex = 0; // Index in _colExtraNames array
  }

  if (!confirm(`¿Seguro que desea eliminar la columna "${window._colExtraNames[corte][colExtraIndex]}"? Esto eliminará todas las notas asociadas a ella.`)) return;

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
      if (!result.success) {
          throw new Error(result.message || "Error al eliminar notas de la columna.");
      }
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
          window._colExtraNames[corte].splice(colExtraIndex, 1); // Remove the name from the array
      }

      const currentClass = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);
      currentClass.estudiantes.forEach((estudiante) => {
          calcularPromedioCorte(asignaturaId, grupoId, corte, estudiante.id);
      });
      calcularPromedioFinal(asignaturaId, grupoId, currentClass.estudiantes.length);

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
    // Find the student by checking the first column's text content (student name)
    // This is more robust than relying on input IDs in the first column
    const currentClass = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);
    const student = currentClass.estudiantes.find(e => e.id === estudianteId);
    return firstCell && student && firstCell.textContent.trim() === student.nombre;
  });

  if (!studentRow) {
      console.warn(`No se encontró la fila del estudiante ${estudianteId} en el corte ${corte}`);
      return;
  }

  let vals = [];
  // Trabajos
  const trabajosInput = studentRow.querySelector(`input[id$="-trabajos"]`);
  if (trabajosInput) vals.push(parseFloat(trabajosInput.value));
  
  // Extra1 if exists
  if (window._colExtraCount[corte] >= 1) {
    const extra1Input = studentRow.querySelector(`input[id$="-extra1"]`);
    if (extra1Input) vals.push(parseFloat(extra1Input.value));
  }

  // Quices
  const quicesInput = studentRow.querySelector(`input[id$="-quices"]`);
  if (quicesInput) vals.push(parseFloat(quicesInput.value));

  // Extra2 if exists
  if (window._colExtraCount[corte] === 2) {
    const extra2Input = studentRow.querySelector(`input[id$="-extra2"]`);
    if (extra2Input) vals.push(parseFloat(extra2Input.value));
  }

  // Evaluación Final
  const evalFinalInput = studentRow.querySelector(`input[id$="-evaluacionfinal"]`);
  if (evalFinalInput) vals.push(parseFloat(evalFinalInput.value));
  
  let prom = 0.0;
  // Filter out NaN values, but ensure that if an input exists and is empty, it counts as 0 for calculation, not skipped
  const validVals = vals.map(v => isNaN(v) ? 0 : v).filter(v => v !== null); // Ensure nulls are also handled if any existed

  if (validVals.length > 0) {
    // Only calculate if there are actual inputs (even if some are 0)
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
      // Optionally, revert the input value or show a visual error
      // inputElement.value = inputElement.defaultValue; // Or a previously valid value
      return;
  }

  const data = {
      estudiante_id: estudianteId,
      asignatura_id: asignaturaId,
      profesor_id: profesorId,
      corte: corte,
      tipo_nota: tipoNota,
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
          // Optionally, add a small visual feedback for success (e.g., green border)
          inputElement.style.transition = 'border-color 0.3s ease';
          inputElement.style.borderColor = '#4CAF50'; // Green for success
          setTimeout(() => {
              inputElement.style.borderColor = ''; // Revert after a short delay
          }, 1000);
      } else {
          console.error("Error al guardar nota:", result.message);
          alert(`Error al guardar la nota: ${result.message}`);
          inputElement.style.transition = 'border-color 0.3s ease';
          inputElement.style.borderColor = '#f44336'; // Red for error
      }
  } catch (error) {
      console.error("Error de conexión al guardar nota:", error);
      alert("Error de conexión al guardar la nota.");
      inputElement.style.transition = 'border-color 0.3s ease';
      inputElement.style.borderColor = '#f44336'; // Red for error
  }
}

function regresarSeleccionNotas() {
  document.getElementById("notas-botones-materias").style.display = "block";
  document.getElementById("notas-materia-contenedor").innerHTML = "";
}