document.addEventListener("DOMContentLoaded", () => {
  loadUserInfo();
  fetchUsuariosActivos();
  fetchAsistencias();
  fetchPatronesPuntualidad();
   // Escuchar cambios en filtros
  document.getElementById("busqueda").addEventListener("input", aplicarFiltros);
  document.getElementById("filtroEstado").addEventListener("change", aplicarFiltros);
});

function showNotification(message, type = "error") {
  const notification = document.createElement("div");
  notification.id = "notification";
  notification.textContent = message;
  notification.className = `notification ${type}`;
  document.body.appendChild(notification);
  notification.style.opacity = "0";
  setTimeout(() => {
    notification.style.opacity = "1";
  }, 50);
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 3000);
}

async function loadUserInfo() {
  // Simulación desde localStorage (ajusta según tu lógica)
  const userData = JSON.parse(localStorage.getItem("userInfo")) || { nombres: "Usuario", rol: "Empleado" };
  document.getElementById("userName").textContent = userData.nombres;
  document.getElementById("userRole").textContent = userData.rol;
}

async function fetchUsuariosActivos() {
  try {
    const response = await fetch("http://localhost:3000/usuarios/activos");
    if (!response.ok) throw new Error("Error al obtener usuarios activos");
    const { count } = await response.json();
    document.querySelector(".card-tarjeta .numero").textContent = count;
  } catch (err) {
    console.error("Error en fetchUsuariosActivos:", err);
    showNotification("Error al cargar usuarios activos: " + err.message, "error");
  }
}

async function fetchAsistencias() {
  try {
    const response = await fetch("http://localhost:3000/asistencias");
    if (!response.ok) throw new Error("Error al obtener asistencias");
    const asistencias = await response.json();
    const tbody = document.querySelector(".tabla-container table tbody");
    tbody.innerHTML = "";
    asistencias.forEach(asistencia => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${asistencia.id_asistencia}</td>
        <td>${asistencia.nombre}</td>
        <td>${asistencia.fecha}</td>
        <td>${asistencia.hora_marcado}</td>
        <td>${asistencia.tipo}</td>
        <td><span class="estado ${asistencia.estado.toLowerCase().replace(' ', '-')}">${asistencia.estado}</span></td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Error en fetchAsistencias:", err);
    showNotification("Error al cargar asistencias: " + err.message, "error");
  }
}
function aplicarFiltros() {
  const texto = document.getElementById("busqueda").value.toLowerCase();
  const estadoSeleccionado = document.getElementById("filtroEstado").value;

  const filtradas = asistenciasData.filter(asistencia => {
    const coincideTexto =
      asistencia.nombre.toLowerCase().includes(texto) ||
      asistencia.tipo.toLowerCase().includes(texto);

    const coincideEstado =
      estadoSeleccionado === "" || asistencia.estado === estadoSeleccionado;

    return coincideTexto && coincideEstado;
  });

  renderAsistencias(filtradas);
}

async function fetchPatronesPuntualidad() {
  try {
    const response = await fetch("http://localhost:3000/patrones/puntualidad");
    if (!response.ok) throw new Error("Error al obtener patrones de puntualidad");
    const patrones = await response.json();
    const lista = document.querySelector(".lista-tardanzas");
    lista.innerHTML = "";
    patrones.forEach(patron => {
      const li = document.createElement("li");
      li.innerHTML = `<i class="fas fa-clock"></i> ${patron.nombre}: <span class="tarde">tarde</span> (${patron.tardanzas} veces, ${patron.minutos_tarde_promedio.toFixed(1)} min tardanza promedio)`;
      lista.appendChild(li);
    });
    document.querySelector(".resumen").textContent = `Tardías Promedio: <strong>${(patrones.reduce((sum, p) => sum + p.minutos_tarde_promedio, 0) / (patrones.length || 1)).toFixed(1)} / semana</strong>`;
  } catch (err) {
    console.error("Error en fetchPatronesPuntualidad:", err);
    showNotification("Error al cargar patrones de puntualidad: " + err.message, "error");
  }
}

function mostrarDetalles(id) {
  showNotification(`Detalles de asistencia ID ${id} mostrados.`, "info");
  // Implementa un modal o lógica adicional si lo deseas
}