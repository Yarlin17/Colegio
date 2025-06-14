let currentProfesorId = null;
let clasesDelProfesor = [];
let profesorDatosGenerales = {};

window.onload = async function() {
  const usuarioNombre = localStorage.getItem("usuarioNombre");
  const usuarioApellido = localStorage.getItem("usuarioApellido");
  const emailProfesor = localStorage.getItem("usuarioEmail");

  let displayName = "Profesor";
  if (usuarioNombre && usuarioApellido) displayName = `${usuarioNombre} ${usuarioApellido}`;
  else if (usuarioNombre) displayName = usuarioNombre;
  document.getElementById("usuarioNombre").textContent = displayName;

  if (!emailProfesor) {
    document.getElementById("contenido-principal").innerHTML = `<div class="alert alert-danger">Error: No se encontró el email del profesor.</div>`;
    return;
  }

  try {
    const profesorResponse = await fetch(`/api/profesores?email=${emailProfesor}`);
    const profesores = await profesorResponse.json();
    if (profesores.length > 0) {
      profesorDatosGenerales = profesores[0];
      currentProfesorId = profesorDatosGenerales.profesor_id;

      // Generar iniciales para el profesor (Nombre + Apellido)
      let inicialesProfesor = '';
      if (profesorDatosGenerales.nombreprofesor) {
          inicialesProfesor += profesorDatosGenerales.nombreprofesor.charAt(0).toUpperCase();
      }
      if (profesorDatosGenerales.apellidoprofesor) {
          inicialesProfesor += profesorDatosGenerales.apellidoprofesor.charAt(0).toUpperCase();
      }
      if (!inicialesProfesor) {
          inicialesProfesor = 'PR'; // Por defecto si no hay nombre/apellido
      }
      document.getElementById('user-avatar-profesor').textContent = inicialesProfesor;

      // Asignar color dinámico basado en la primera letra del nombre del profesor
      const colorClassProfesor = getColorClassForInitial(profesorDatosGenerales.nombreprofesor);
      document.getElementById('user-avatar-profesor').classList.add(colorClassProfesor);

      const horariosResponse = await fetch(`/api/horarios?profesor_id=${currentProfesorId}`);
      const horarios = await horariosResponse.json();
      await procesarClases(horarios);
      
      cargarVistaProfesor('dashboard');
    } else {
      throw new Error("Profesor no encontrado.");
    }
  } catch (error) {
    console.error("Error al cargar datos iniciales:", error);
    document.getElementById("contenido-principal").innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
};

async function procesarClases(horarios) {
    const processedClases = {};
    for (const horario of horarios) {
        const key = `${horario.asignatura_id}-${horario.grupo_id}`;
        if (!processedClases[key]) {
             const estudiantesResp = await fetch(`/api/estudiantes?grupo_id=${horario.grupo_id}`);
             processedClases[key] = {
                asignatura_id: horario.asignatura_id, asignatura: horario.nombreasignatura,
                grupo_id: horario.grupo_id, grupo: horario.nombregrupo,
                horario: [], aula: horario.nombreaula,
                estudiantes: (await estudiantesResp.json()).map(e => ({ id: e.estudiante_id, nombre: `${e.nombreestudiante} ${e.apellidoestudiante}` }))
            };
        }
        processedClases[key].horario.push({ 
            dia: horario.diasemana, 
            inicio: new Date(horario.horainicio).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'}),
            fin: new Date(horario.horafin).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})
        });
    }
    clasesDelProfesor = Object.values(processedClases);
}

async function displayDashboard(contenedor) {
    contenedor.innerHTML = `<div class="d-flex justify-content-center mt-5"><div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div></div>`;
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
    const clasesHoy = clasesDelProfesor.filter(c => c.horario.some(h => h.dia.toLowerCase() === today.toLowerCase()));
    
    // KPI Data
    const asistenciaResponse = await fetch(`/api/asistencia?profesor_id=${currentProfesorId}`);
    const allAsistencia = await asistenciaResponse.json();
    let averageAttendance = allAsistencia.length > 0 ? Math.round(allAsistencia.filter(a => a.presente).length / allAsistencia.length * 100) + '%' : 'N/A';
    
    const kpiData = [
        { title: 'Clases Hoy', value: clasesHoy.length, icon: 'bi-journal-bookmark-fill', color: 'text-primary', bg: 'bg-primary-subtle' },
        { title: 'Asistencia Prom.', value: averageAttendance, icon: 'bi-check-circle-fill', color: 'text-success', bg: 'bg-success-subtle' },
        { title: 'Grupos Asignados', value: [...new Set(clasesDelProfesor.map(c => c.grupo))].length, icon: 'bi-people-fill', color: 'text-warning', bg: 'bg-warning-subtle' },
        { title: 'Asignaturas', value: [...new Set(clasesDelProfesor.map(c => c.asignatura))].length, icon: 'bi-book-half', color: 'text-danger', bg: 'bg-danger-subtle' }
    ];

    const kpiHTML = kpiData.map(kpi => `
        <div class="col">
            <div class="card kpi-card border-0 shadow-sm">
                <div class="card-body">
                    <div class="kpi-icon ${kpi.bg} ${kpi.color}"><i class="bi ${kpi.icon}"></i></div>
                    <div class="kpi-text">
                        <h3>${kpi.value}</h3><p class="text-muted mb-0">${kpi.title}</p>
                    </div>
                </div>
            </div>
        </div>`).join('');

    const clasesHoyHTML = clasesHoy.length > 0 ? clasesHoy.flatMap(c => c.horario
        .filter(h => h.dia.toLowerCase() === today.toLowerCase())
        .map(h => `
            <div class="class-list-item mb-3 pb-3 border-bottom">
                <div class="class-time">${h.inicio}</div>
                <div class="flex-grow-1 ms-3">
                    <h6 class="mb-0 fw-bold">${c.asignatura}</h6>
                    <small class="text-muted">${c.aula} - ${c.grupo}</small>
                </div>
                <button class="btn btn-outline-primary btn-sm" onclick="cargarVistaProfesor('asistencia')">Asistencia</button>
            </div>`
        )).join('') : '<p class="text-muted mt-3">No tiene clases programadas para hoy.</p>';
    
    const dashboardHTML = `
        <div class="mb-4">
            <h3 class="fw-bold">Bienvenido, ${profesorDatosGenerales.nombreprofesor}</h3>
            <p class="text-muted">Aquí tiene un resumen de su actividad reciente.</p>
        </div>
        <div class="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-4 mb-4">${kpiHTML}</div>
        <div class="row g-4">
            <div class="col-lg-7">
                <div class="card h-100 border-0 shadow-sm"><div class="card-body"><h5 class="card-title fw-bold">Próximas Clases del Día</h5>${clasesHoyHTML}</div></div>
            </div>
            <div class="col-lg-5">
                <div class="card h-100 border-0 shadow-sm"><div class="card-body"><h5 class="card-title fw-bold">Notificaciones</h5>
                    <div class="list-group list-group-flush">
                        <div class="list-group-item d-flex align-items-center px-0"><i class="bi bi-people-fill fs-4 text-danger me-3"></i><div><strong>Reunión de departamento</strong> mañana a las 9:00 <br><small class="text-muted">Hace 1 hora</small></div></div>
                        <div class="list-group-item d-flex align-items-center px-0"><i class="bi bi-check2-circle fs-4 text-success me-3"></i><div><strong>Calificaciones</strong> enviadas correctamente<br><small class="text-muted">Ayer</small></div></div>
                    </div>
                </div></div>
            </div>
        </div>`;
    contenedor.innerHTML = dashboardHTML;
}

async function cargarVistaProfesor(seccion) {
  const contenedor = document.getElementById("contenido-principal");
  contenedor.innerHTML = `<div class="d-flex justify-content-center mt-5"><div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div></div>`;
  
  document.querySelectorAll('.sidebar .nav-link').forEach(link => link.classList.remove('active'));
  const activeLink = document.querySelector(`.sidebar .nav-link[onclick="cargarVistaProfesor('${seccion}')"]`);
  if (activeLink) {
      activeLink.classList.add('active');
      document.getElementById('header-title').textContent = activeLink.textContent.trim();
  }

  const backButton = `<button class="btn btn-secondary mb-3" onclick="cargarVistaProfesor('dashboard')"><i class="bi bi-arrow-left me-2"></i>Volver al Panel</button>`;

  switch (seccion) {
    case 'dashboard':
      await displayDashboard(contenedor);
      break;
    case 'clases':
      displayClases(contenedor, clasesDelProfesor, backButton);
      break;
    case 'registros':
      displayRegistrosNotas(contenedor, currentProfesorId, clasesDelProfesor, backButton);
      break;
    case 'horario':
      displayHorario(contenedor, clasesDelProfesor, backButton);
      break;
    case 'asistencia':
      displayAsistencia(contenedor, currentProfesorId, clasesDelProfesor, backButton);
      break;
    default:
      contenedor.innerHTML = `<div class="alert alert-warning">Sección no encontrada.</div>`;
  }
}

// Nueva función para obtener la clase de color (reutilizable)
function getColorClassForInitial(name) {
    if (!name) return 'bg-secondary'; // Color por defecto

    const colors = [
        'bg-primary', 'bg-success', 'bg-info', 'bg-warning', 'bg-danger', 'bg-dark',
        'bg-secondary' // Adding another Bootstrap color
    ];
    
    // Un hash simple para asignar un color consistente a cada inicial
    const charCode = name.charCodeAt(0);
    const index = charCode % colors.length;
    return colors[index];
}