// Global variables to store extra column details for each corte
window._colExtraCount = {};
window._colExtraNames = {};

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
      displayClases(contenedor, clasesDelProfesor); // Llama a la función del nuevo archivo
      break;
    case 'registros':
      displayRegistrosNotas(contenedor, currentProfesorId, clasesDelProfesor); // Llama a la función del nuevo archivo
      break;
    case 'horario':
      displayHorario(contenedor, clasesDelProfesor); // Llama a la función del nuevo archivo
      break;
    case 'asistencia':
      displayAsistencia(contenedor, currentProfesorId, clasesDelProfesor); // Llama a la función del nuevo archivo
      break;
    case 'info-general':
      displayInfoGeneral(contenedor, profesorDatosGenerales); // Llama a la función del nuevo archivo
      break;
    default:
      contenedor.innerHTML = "<p>Seleccione una opción del menú.</p>";
  }
}