function cerrarSesion() {
  localStorage.clear();
  // Use the globally defined logout_url
  window.location.href = window.logout_url;
}