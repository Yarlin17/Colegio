// Global variables to store extra column details for each corte
window._colExtraCount = {}; // e.g., {1: 0, 2: 1}
window._colExtraNames = {}; // e.g., {1: [], 2: ["Participation"]}

// Store fetched data globally or pass it around
let currentProfesorId = null;
let clasesDelProfesor = [];
let profesorDatosGenerales = {};

window.onload = async function () {
  const fechaElemento = document.getElementById("fecha");
  const hoy = new Date();
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  fechaElemento.textContent = hoy.toLocaleDateString('es-ES', opciones);

  const usuarioNombre = localStorage.getItem("usuarioNombre");
  const usuarioApellido = localStorage.getItem("usuarioApellido");
  let displayName = "Profesor";

  if (usuarioNombre && usuarioApellido) {
    displayName = `${usuarioNombre} ${usuarioApellido}`;
  } else if (usuarioNombre) {
    displayName = usuarioNombre;
  }
  document.getElementById("usuarioNombre").textContent = displayName;

  // Initialize global variables for extra columns
  for (let i = 1; i <= 3; i++) {
    window._colExtraCount[i] = 0;
    window._colExtraNames[i] = [];
  }

  // --- FETCH INITIAL DATA FROM BACKEND ---
  const emailProfesor = localStorage.getItem("usuarioEmail");
  
  if (emailProfesor) {
      try {
          const responseProfesor = await fetch(`/api/profesores?email=${emailProfesor}`);
          const profesores = await responseProfesor.json();
          if (profesores.length > 0) {
              profesorDatosGenerales = profesores[0];
              currentProfesorId = profesorDatosGenerales.profesor_id;
              console.log("Datos del profesor cargados:", profesorDatosGenerales);
          } else {
              console.warn("Profesor no encontrado en la base de datos.");
              currentProfesorId = 2; // Default for testing
          }
      } catch (error) {
          console.error("Error al cargar datos del profesor:", error);
          currentProfesorId = 2; // Default for testing
      }
  } else {
      currentProfesorId = 2; // Default if no email in localStorage
      console.warn("No hay email de usuario en localStorage. Usando ID de profesor predeterminado.");
  }

  // Fetch classes taught by this professor
  if (currentProfesorId) {
      try {
          const responseClases = await fetch(`/api/horarios?profesor_id=${currentProfesorId}`);
          const horarios = await responseClases.json();
          console.log("Horarios fetched:", horarios);

          // Process horarios to form 'clasesDelProfesor' structure
          const processedClases = {};
          for (const horario of horarios) {
              const key = `${horario.asignatura_id}-${horario.grupo_id}`;
              if (!processedClases[key]) {
                  const [asignaturaResp, grupoResp] = await Promise.all([
                      fetch(`/api/asignaturas?asignatura_id=${horario.asignatura_id}`).then(res => res.json()),
                      fetch(`/api/grupos?grupo_id=${horario.grupo_id}`).then(res => res.json())
                  ]);
                  const asignatura = asignaturaResp[0];
                  const grupo = grupoResp[0];

                  const estudiantesResp = await fetch(`/api/estudiantes?grupo_id=${horario.grupo_id}`);
                  const estudiantes = await estudiantesResp.json();
                  const formattedEstudiantes = estudiantes.map(e => ({
                      id: e.estudiante_id,
                      nombre: `${e.nombreestudiante} ${e.apellidoestudiante}`
                  }));

                  processedClases[key] = {
                      asignatura_id: horario.asignatura_id,
                      asignatura: asignatura ? asignatura.nombreasignatura : 'Desconocida',
                      grupo_id: horario.grupo_id,
                      grupo: grupo ? grupo.nombregrupo : 'Desconocido',
                      horario: [],
                      horaInicio: horario.horainicio ? new Date(horario.horainicio).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'}) : '',
                      horaFin: horario.horafin ? new Date(horario.horafin).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'}) : '',
                      aula: horario.aula_id ? (await fetch(`/api/aulas?aula_id=${horario.aula_id}`).then(res => res.json()))[0].nombreaula : 'Desconocida',
                      estudiantes: formattedEstudiantes
                  };
              }
              const horaInicioStr = horario.horainicio ? new Date(horario.horainicio).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'}) : '';
              const horaFinStr = horario.horafin ? new Date(horario.horafin).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'}) : '';
              processedClases[key].horario.push(`${horario.diasemana} ${horaInicioStr} - ${horaFinStr}`);
          }

          clasesDelProfesor = Object.values(processedClases).map(clase => {
              clase.horario = clase.horario.join(', ');
              return clase;
          });
          console.log("Clases del profesor cargadas:", clasesDelProfesor);

      } catch (error) {
          console.error("Error al cargar clases del profesor:", error);
          alert("Hubo un error al cargar las clases. Por favor, recargue la página.");
      }
  }
};

async function cargarVistaProfesor(seccion) {
  const contenedor = document.getElementById("contenido-principal");

  if (!currentProfesorId || clasesDelProfesor.length === 0) {
      contenedor.innerHTML = "<p>Cargando información... por favor espere.</p>";
      await window.onload();
      if (!currentProfesorId || clasesDelProfesor.length === 0) {
        contenedor.innerHTML = "<p>No se pudo cargar la información del profesor o sus clases. Intente recargar.</p>";
        return;
      }
  }

  switch (seccion) {
    case 'clases':
      let clasesHTML = '<h2>Clases que Imparte</h2>';
      if (clasesDelProfesor.length === 0) {
        clasesHTML += '<p>No se encontraron clases asignadas a este profesor.</p>';
      } else {
        clasesDelProfesor.forEach(clase => {
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
      break;

    case 'registros':
      let registrosHTML = '<h2>Registro de Notas</h2>';
      registrosHTML += `<div id="notas-botones-materias" style="margin-bottom:1rem;">`;
      if (clasesDelProfesor.length === 0) {
        registrosHTML += '<p>No se encontraron clases para gestionar registros.</p>';
      } else {
        clasesDelProfesor.forEach((clase, idx) => {
          registrosHTML += `<button class="menu-button" style="margin-right:0.5rem;" onclick="mostrarNotasMateria(${idx}, ${currentProfesorId}, ${clase.asignatura_id}, ${clase.grupo_id})">${clase.asignatura} - ${clase.grupo}</button>`;
        });
      }
      registrosHTML += `</div>`;
      registrosHTML += `<div id="notas-materia-contenedor"></div>`;
      contenedor.innerHTML = registrosHTML;

      window.mostrarNotasMateria = async function(claseIdx, profesorId, asignaturaId, grupoId) {
        document.getElementById("notas-botones-materias").style.display = "none";
        let html = `<button class="menu-button" style="margin-bottom:1rem;" onclick="regresarSeleccionNotas()">&larr; Regresar</button>`;
        const clase = clasesDelProfesor[claseIdx];
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
                    const estudianteIndex = currentClass.estudiantes.findIndex(e => e.id === nota.estudiante_id);
                    if (estudianteIndex !== -1) {
                        calcularPromedioCorte(asignaturaId, grupoId, nota.corte, nota.estudiante_id); // Pass student ID directly
                    }
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
      };

      window.habilitarEdicionNotas = function(corte, activar) {
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
      };

      window.eliminarNotasCorte = async function(asignaturaId, grupoId, profesorId, corte) {
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
      };

      window.agregarColumnaCorte = function(corte, asignaturaId, grupoId, profesorId, isReload = false, colName = "Extra") {
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
      };

      window.eliminarColumnaCorte = async function(corte, asignaturaId, grupoId, profesorId) {
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
      };

      // Función para calcular el promedio de corte (incluye extras si presentes)
      window.calcularPromedioCorte = function(asignaturaId, grupoId, corte, estudianteId) {
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
      };

      // Calcular promedio final (promedio de los promedios de cada corte)
      window.calcularPromedioFinal = function(asignaturaId, grupoId, numEstudiantes) {
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
      };

      window.guardarNota = async function(estudianteId, asignaturaId, profesorId, corte, tipoNota, inputElement) {
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
      };

      window.regresarSeleccionNotas = function() {
        document.getElementById("notas-botones-materias").style.display = "block";
        document.getElementById("notas-materia-contenedor").innerHTML = "";
      };
      break;

    case 'horario':
      let horarioHTML = '<h2>Mi Horario</h2><table class="schedule-table"><thead><tr><th>Asignatura</th><th>Hora Inicio</th><th>Hora Fin</th><th>Aula</th><th>Cant. Estudiantes</th></tr></thead><tbody>';
      if (clasesDelProfesor.length === 0) {
        horarioHTML += '<tr><td colspan="5">No hay horario disponible.</td></tr>';
      } else {
        clasesDelProfesor.forEach(clase => {
          horarioHTML += `<tr><td>${clase.asignatura} - ${clase.grupo}</td><td>${clase.horaInicio}</td><td>${clase.horaFin}</td><td>${clase.aula}</td><td>${clase.estudiantes.length}</td></tr>`;
        });
      }
      horarioHTML += '</tbody></table>';
      contenedor.innerHTML = horarioHTML;
      break;

    case 'asistencia':
        cargarVistaAsistencia(contenedor, currentProfesorId, clasesDelProfesor);
        break;

    case 'info-general':
      if (profesorDatosGenerales.nombreprofesor) {
        contenedor.innerHTML = `
          <h2>Información General del Profesor</h2>
          <p><strong>Nombre:</strong> ${profesorDatosGenerales.nombreprofesor} ${profesorDatosGenerales.apellidoprofesor}</p>
          <p><strong>Email:</strong> ${profesorDatosGenerales.emailprofesor}</p>
          <p><strong>Teléfono:</strong> ${profesorDatosGenerales.telefonoprofesor || 'N/A'}</p>
          <p><strong>Disponibilidad:</strong> ${profesorDatosGenerales.disponibilidad || 'N/A'}</p>
        `;
      } else {
        contenedor.innerHTML = `<p>No se pudo cargar la información general del profesor.</p>`;
      }
      break;

    default:
      contenedor.innerHTML = "<p>Seleccione una opción del menú.</p>";
  }
}

async function cargarVistaAsistencia(contenedor, profesorId, clases) {
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

    window.mostrarEstudiantesParaAsistencia = async function() {
        const selectElement = document.getElementById('asistencia-clase-select');
        const fechaInput = document.getElementById('asistencia-fecha-input');
        const [selectedAsignaturaId, selectedGrupoId] = selectElement.value.split('-').map(Number);
        const selectedFecha = fechaInput.value;

        if (!selectedAsignaturaId || !selectedGrupoId || !selectedFecha) {
            alert("Por favor, seleccione una clase y una fecha.");
            return;
        }

        const claseSeleccionada = clases.find(c => c.asignatura_id === selectedAsignaturaId && c.grupo_id === selectedGrupoId);
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
    };

    window.guardarAsistencia = async function(asignaturaId, grupoId, fecha) {
        const claseSeleccionada = clases.find(c => c.asignatura_id === asignaturaId && c.grupo_id === grupoId);
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
    };
}

function cerrarSesion() {
  localStorage.clear();
  window.location.href = "{{ url_for('index') }}";
}