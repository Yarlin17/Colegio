function cerrarSesion() {
  localStorage.clear();
  window.location.href = "{{ url_for('index') }}";
}