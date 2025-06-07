window._notasEdicionActiva = {}; // Moved from `mostrarNotasMateria` for global scope

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
      } catch (error) {
          console.error("Error fetching updated notes:", error);
          return;
      }

      notasExistentesActualizadas.forEach(nota => {
          const tipoNotaFormatted = nota.tipo_nota.replace(/\s/g, '').toLowerCase();
          const inputId = `grade-input-${asignaturaId}-${grupoId}-${nota.estudiante_id}-${nota.corte}-${tipoNotaFormatted}`;
          const inputElement = document.getElementById(inputId);
          if (inputElement) {
              inputElement.value = nota.nota;
              // Call calculate for existing notes to update averages
              calcularPromedioCorte(asignaturaId, grupoId, nota.corte, nota.estudiante_id);
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
              oninput="calcularPromedioCorte(${asignaturaId}, ${grupoId}, ${corte}, ${estudiante.id}); guardarNota(${estudiante.id}, ${asignaturaId}, ${profesorId}, ${corte}, 'Trabajos', this)" readonly></td>
          <td><input type="number" class="grade-input" id="${idQuiz}" placeholder="Quices" min="0" max="5" step="0.1"
              oninput="calcularPromedioCorte(${asignaturaId}, ${grupoId}, ${corte}, ${estudiante.id}); guardarNota(${estudiante.id}, ${asignaturaId}, ${profesorId}, ${corte}, 'Quices', this)" readonly></td>
          <td><input type="number" class="grade-input" id="${idEval}" placeholder="Evaluación Final" min="0" max="5" step="0.1"
              oninput="calcularPromedioCorte(${asignaturaId}, ${grupoId}, ${corte}, ${estudiante.id}); guardarNota(${estudiante.id}, ${asignaturaId}, ${profesorId}, ${corte}, 'Evaluacion Final', this)" readonly></td>
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
  window._notasEdicionActiva = {};
  for (let corte = 1; corte <= 3; corte++) {
    if (window._colExtraCount[corte] > 0) {
      for (let i = 0; i < window._colExtraCount[corte]; i++) {
        agregarColumnaCorte(corte, asignaturaId, grupoId, profesorId, true, window._colExtraNames[corte][i]);
      }
    }
  }
  llenarNotasEnTabla();
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
  if (!window._colExtraCount[corte]) window._colExtraCount[corte] = 0;
  if (window._colExtraCount[corte] >= 2) return;

  const tabla = document.getElementById(`tabla-corte-${corte}`);
  if (!tabla) return;
  const theadRow = tabla.querySelector("thead tr");
  const rows = tabla.querySelectorAll("tbody tr");
  
  let insertIdx;
  let tipoNotaExtra;
  if (window._colExtraCount[corte] === 0) {
    insertIdx = 2;
    tipoNotaExtra = 'Extra1';
  } else {
    insertIdx = 4;
    tipoNotaExtra = 'Extra2';
  }

  const th = document.createElement("th");
  th.textContent = colName;
  th.id = `extra-th-c${corte}-${window._colExtraCount[corte]}`;
  th.contentEditable = "true";
  th.className = "editable-th";
  th.setAttribute('data-tipo-nota-extra', tipoNotaExtra);
  th.onblur = function() {
      if (!window._colExtraNames[corte]) window._colExtraNames[corte] = [];
      window._colExtraNames[corte][window._colExtraCount[corte] -1] = this.textContent;
  };
  theadRow.insertBefore(th, theadRow.children[insertIdx]);
  
  if (!isReload) {
    if (!window._colExtraNames[corte]) window._colExtraNames[corte] = [];
    window._colExtraNames[corte].push(colName);
  }

  const currentClass = clasesDelProfesor.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);

  currentClass.estudiantes.sort((a,b) => a.nombre.localeCompare(b.nombre)).forEach((estudiante) => {
    const td = document.createElement("td");
    const inputId = `grade-input-${asignaturaId}-${grupoId}-${estudiante.id}-${corte}-${tipoNotaExtra.toLowerCase()}`;
    td.innerHTML = `<input type="number" class="grade-input extra-col" id="${inputId}" placeholder="${colName}" min="0" max="5" step="0.1"
        oninput="calcularPromedioCorte(${asignaturaId}, ${grupoId}, ${corte}, ${estudiante.id}); guardarNota(${estudiante.id}, ${asignaturaId}, ${profesorId}, ${corte}, '${tipoNotaExtra}', this)"
        ${window._notasEdicionActiva[corte] ? "" : "readonly"}>`;
    const targetRow = Array.from(tabla.querySelectorAll("tbody tr")).find(row => {
        const firstInput = row.querySelector('input[id^="grade-input-"]');
        if (firstInput) {
            const parts = firstInput.id.split('-');
            return parseInt(parts[3]) === estudiante.id;
        }
        return false;
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
  } else {
    removeIdx = 2;
    tipoNotaToRemove = 'Extra1';
    colExtraIndex = 0;
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

      theadRow.removeChild(theadRow.children[removeIdx]);
      rows.forEach(tr => {
          tr.removeChild(tr.children[removeIdx]);
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

  } catch (error) {
      console.error("Error al eliminar columna y notas:", error);
      alert("Error al eliminar la columna o sus notas.");
  }
}

// Función para calcular el promedio de corte (incluye extras si presentes)
function calcularPromedioCorte(asignaturaId, grupoId, corte, estudianteId) {
  const tabla = document.getElementById(`tabla-corte-${corte}`);
  if (!tabla) return;
  const tr = Array.from(tabla.querySelectorAll("tbody tr")).find(row => {
      const inputId = row.querySelector('input[id^="grade-input-"]').id;
      const parts = inputId.split('-');
      return parseInt(parts[3]) === estudianteId;
  });
  if (!tr) return;

  let vals = [];
  // Trabajos
  vals.push(parseFloat(document.getElementById(`grade-input-${asignaturaId}-${grupoId}-${estudianteId}-${corte}-trabajos`).value));
  
  // Extra1 if exists
  if (window._colExtraCount[corte] >= 1) {
    const extra1Input = document.getElementById(`grade-input-${asignaturaId}-${grupoId}-${estudianteId}-${corte}-extra1`);
    if (extra1Input) vals.push(parseFloat(extra1Input.value));
  }

  // Quices
  vals.push(parseFloat(document.getElementById(`grade-input-${asignaturaId}-${grupoId}-${estudianteId}-${corte}-quices`).value));

  // Extra2 if exists
  if (window._colExtraCount[corte] === 2) {
    const extra2Input = document.getElementById(`grade-input-${asignaturaId}-${grupoId}-${estudianteId}-${corte}-extra2`);
    if (extra2Input) vals.push(parseFloat(extra2Input.value));
  }

  // Evaluación Final
  vals.push(parseFloat(document.getElementById(`grade-input-${asignaturaId}-${grupoId}-${estudianteId}-${corte}-evaluacionfinal`).value));
  
  let prom = 0.0;
  const validVals = vals.filter(v => !isNaN(v));
  if (validVals.length > 0) {
    prom = (validVals.reduce((a, b) => a + b, 0) / validVals.length).toFixed(2);
  } else {
    prom = "0.0";
  }
  document.getElementById(`prom-c${corte}-${estudianteId}`).value = prom;

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
    finalInput.value = count > 0 ? (suma / count).toFixed(2) : "0.0";
  });
}

async function guardarNota(estudianteId, asignaturaId, profesorId, corte, tipoNota, inputElement) {
  const notaValue = parseFloat(inputElement.value);
  const nota = isNaN(notaValue) ? 0 : notaValue;

  if (nota < 0 || nota > 5) {
      console.error(`Nota inválida para ${tipoNota}: ${nota}`);
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
      } else {
          console.error("Error al guardar nota:", result.message);
          alert(`Error al guardar la nota: ${result.message}`);
      }
  } catch (error) {
      console.error("Error de conexión al guardar nota:", error);
      alert("Error de conexión al guardar la nota.");
  }
}

function regresarSeleccionNotas() {
  document.getElementById("notas-botones-materias").style.display = "block";
  document.getElementById("notas-materia-contenedor").innerHTML = "";
}