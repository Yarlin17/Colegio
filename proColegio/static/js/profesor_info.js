function displayInfoGeneral(contenedor, profesorDatos) {
  if (profesorDatos.nombreprofesor) {
    contenedor.innerHTML = `
      <h2>Información General del Profesor</h2>
      <p><strong>Nombre:</strong> ${profesorDatos.nombreprofesor} ${profesorDatos.apellidoprofesor}</p>
      <p><strong>Email:</strong> ${profesorDatos.emailprofesor}</p>
      <p><strong>Teléfono:</strong> ${profesorDatos.telefonoprofesor || 'N/A'}</p>
      <p><strong>Disponibilidad:</strong> ${profesorDatos.disponibilidad || 'N/A'}</p>
    `;
  } else {
    contenedor.innerHTML = `<p>No se pudo cargar la información general del profesor.</p>`;
  }
}