// horario.js
document.addEventListener("DOMContentLoaded", () => {
  loadUserInfo();
  fetchEmployees();
  fetchSchedules();
});

function showNotification(message, type = "error") {
  const notification = document.getElementById("notification");
  if (!notification) {
    console.error("Elemento notification no encontrado en el DOM");
    return;
  }
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.style.display = "block";
  notification.style.opacity = "0"; // Asegurar opacidad inicial
  setTimeout(() => {
    notification.style.opacity = "1";
  }, 50);
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      notification.style.display = "none";
    }, 500);
  }, 3000);
}

// Cargar información del usuario desde localStorage y verificar rol
async function loadUserInfo() {
  try {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      const userData = JSON.parse(storedUserInfo);
      console.log("[v0] Datos del usuario desde localStorage:", userData);
      if (!userData.estado || userData.estado !== "Activo" || (userData.rol !== "Gerente" && userData.rol !== "Administrador")) {
        console.log("[v0] Cuenta inactiva o rol no autorizado, redirigiendo al login");
        document.getElementById("userName").textContent = "Acceso Denegado";
        showNotification("Acceso denegado. Solo Gerentes o Administradores con cuenta activa pueden acceder.", "error");
        setTimeout(() => {
          window.location.href = "../index.html";
        }, 2000);
        return;
      }
      document.getElementById("userName").textContent = userData.nombres || "Usuario";
      document.getElementById("userRole").textContent = userData.rol || "Sin rol";
      console.log("[v0] Usuario cargado desde localStorage:", userData);
    } else {
      console.log("[v0] No hay información de usuario en localStorage, redirigiendo al login");
      showNotification("No se encontró información de usuario. Redirigiendo al login.", "error");
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 2000);
    }
  } catch (error) {
    console.error("[v0] Error al cargar información del usuario:", error);
    document.getElementById("userName").textContent = "Error al cargar";
    showNotification("Error al cargar información del usuario.", "error");
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 2000);
  }
}

// Cargar empleados en el select
async function fetchEmployees() {
  try {
    const response = await fetch("http://localhost:3000/empleados");
    if (!response.ok) throw new Error("Error al obtener empleados");
    const empleados = await response.json();
    const select = document.getElementById("employee");
    empleados.forEach(empleado => {
      const option = document.createElement("option");
      option.value = empleado.id_user;
      option.textContent = `${empleado.nombres} ${empleado.apellidos}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Error en fetchEmployees:", err);
    showNotification("Error al cargar empleados: " + err.message, "error");
  }
}

// Habilitar/deshabilitar campos de tiempo
const checkboxes = document.querySelectorAll('input[type="checkbox"]');
checkboxes.forEach(checkbox => {
  checkbox.addEventListener("change", function () {
    const day = this.id;
    const startHour = document.getElementById(`${day}StartHour`);
    const startMin = document.getElementById(`${day}StartMin`);
    const startAmPm = document.getElementById(`${day}StartAmPm`);
    const endHour = document.getElementById(`${day}EndHour`);
    const endMin = document.getElementById(`${day}EndMin`);
    const endAmPm = document.getElementById(`${day}EndAmPm`);
    const tolerance = document.getElementById(`${day}Tolerance`);
    if (this.checked) {
      startHour.disabled = false;
      startMin.disabled = false;
      startAmPm.disabled = false;
      endHour.disabled = false;
      endMin.disabled = false;
      endAmPm.disabled = false;
      tolerance.disabled = false;
    } else {
      startHour.disabled = true;
      startMin.disabled = true;
      startAmPm.disabled = true;
      endHour.disabled = true;
      endMin.disabled = true;
      endAmPm.disabled = true;
      tolerance.disabled = true;
    }
  });
});

// Agregar horario semanal
async function addWeeklySchedule() {
  const id_user = document.getElementById("employee").value;
  if (!id_user) {
    showNotification("Por favor, seleccione un empleado.", "error");
    return;
  }

  const schedules = [];
  checkboxes.forEach(checkbox => {
    const day = checkbox.id;
    if (checkbox.checked) {
      const startHour = document.getElementById(`${day}StartHour`).value;
      const startMin = document.getElementById(`${day}StartMin`).value;
      const startAmPm = document.getElementById(`${day}StartAmPm`).value;
      const endHour = document.getElementById(`${day}EndHour`).value;
      const endMin = document.getElementById(`${day}EndMin`).value;
      const endAmPm = document.getElementById(`${day}EndAmPm`).value;
      const tolerancia = document.getElementById(`${day}Tolerance`).value || 0;

      if (!startHour || !endHour) {
        showNotification("Por favor, configure horas de inicio y fin para " + checkbox.value, "error");
        return;
      }

      const hora_entrada = `${startHour}:${startMin} ${startAmPm}`;
      const hora_salida = `${endHour}:${endMin} ${endAmPm}`;
      schedules.push({ id_user, dia_semana: checkbox.value, hora_entrada, hora_salida, tolerancia: parseInt(tolerancia) });
    }
  });

  if (schedules.length === 0) {
    showNotification("Por favor, seleccione al menos un día.", "error");
    return;
  }

  console.log("Enviando horarios:", schedules); // Log para depurar

  try {
    for (const schedule of schedules) {
      const response = await fetch("http://localhost:3000/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      const responseData = await response.json(); // Leer el cuerpo solo una vez como JSON
      console.log("Respuesta del servidor para " + schedule.dia_semana + ":", responseData);
      console.log("Status:", response.status);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${responseData.error || 'Desconocido'}`);
      }
    }
    showNotification("Horarios agregados exitosamente.", "success");
    document.getElementById("employee").value = "";
    checkboxes.forEach(cb => cb.checked = false);
    fetchSchedules();
  } catch (err) {
    console.error("Error en addWeeklySchedule:", err);
    showNotification("Error al agregar horarios: " + err.message, "error");
  }
}

// Cargar y mostrar horarios
async function fetchSchedules() {
  try {
    const response = await fetch("http://localhost:3000/horarios");
    if (!response.ok) throw new Error("Error al obtener horarios");
    const horarios = await response.json();
    console.log("Horarios recibidos:", JSON.stringify(horarios, null, 2)); // Log para depurar
    const tbody = document.getElementById("scheduleTableBody");
    tbody.innerHTML = "";
    horarios.forEach(horario => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${horario.id_horario}</td>
        <td>${horario.id_user}</td>
        <td>${horario.empleado}</td>
        <td>${horario.dia_semana}</td>
        <td>${horario.hora_entrada}</td>
        <td>${horario.hora_salida}</td>
        <td>${horario.tolerancia}</td>
        <td><button class="btn-eliminar" onclick="deleteSchedule(${horario.id_horario})">Eliminar</button></td>
      `;
      tbody.appendChild(row);
    });
    updateWeeklyCalendar(horarios);
  } catch (err) {
    console.error("Error en fetchSchedules:", err);
    showNotification("Error al cargar horarios: " + err.message, "error");
  }
}
// Actualizar calendario semanal
function updateWeeklyCalendar(horarios) {
  const tbody = document.getElementById("weeklyCalendarBody");
  tbody.innerHTML = "";
  const empleados = {};
  horarios.forEach(horario => {
    if (!empleados[horario.id_user]) {
      empleados[horario.id_user] = { nombre: horario.empleado, schedule: {} };
    }
    // Normalizar el día (quitar tildes)
    const diaNormalizado = horario.dia_semana.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    console.log(`Asignando horario para ${horario.empleado} en ${diaNormalizado}: ${horario.hora_entrada} - ${horario.hora_salida} (${horario.tolerancia} min)`);
    empleados[horario.id_user].schedule[diaNormalizado] = `${horario.hora_entrada} - ${horario.hora_salida} (${horario.tolerancia} min)`;
  });

  for (const id_user in empleados) {
    const row = document.createElement("tr");
    const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]
      .map(day => day.normalize("NFD").replace(/[\u0300-\u036f]/g, "")); // Normalizar días sin tildes
    const cells = [empleados[id_user].nombre].concat(
      days.map(day => {
        const schedule = empleados[id_user].schedule[day] || "";
        console.log(`Verificando día ${day} para ${empleados[id_user].nombre}: ${schedule}`);
        return `<td>${schedule}</td>`;
      })
    );
    row.innerHTML = cells.join("");
    tbody.appendChild(row);
  }
}

// Filtrar tablas
function filterSchedules() {
  const input = document.getElementById("searchInputSchedule").value.toLowerCase();
  const rows = document.getElementById("scheduleTableBody").getElementsByTagName("tr");
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName("td");
    let found = false;
    for (let j = 0; j < cells.length - 1; j++) {
      if (cells[j].textContent.toLowerCase().includes(input)) {
        found = true;
        break;
      }
    }
    rows[i].style.display = found ? "" : "none";
  }
}

function filterCalendar() {
  const input = document.getElementById("searchInputCalendar").value.toLowerCase();
  const rows = document.getElementById("weeklyCalendarBody").getElementsByTagName("tr");
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName("td");
    let found = cells[0].textContent.toLowerCase().includes(input);
    rows[i].style.display = found ? "" : "none";
  }
}

async function deleteSchedule(id_horario) {
  if (!id_horario || isNaN(id_horario)) {
    console.error("ID de horario inválido:", id_horario);
    showNotification("ID de horario inválido.", "error");
    return;
  }

  try {
    console.log("Intentando eliminar horario con id_horario:", id_horario);
    const response = await fetch(`http://localhost:3000/horarios/${id_horario}`, {
      method: "DELETE",
    });
    console.log("Respuesta del servidor:", response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (jsonErr) {
        errorData = { error: await response.text() || "Error desconocido" };
      }
      throw new Error(`Error ${response.status}: ${errorData.error || "Desconocido"}`);
    }
    showNotification("Horario eliminado exitosamente.", "success");
    fetchSchedules();
  } catch (err) {
    console.error("Error en deleteSchedule:", err.message);
    if (err.message.includes("db is not defined")) {
      showNotification("Error del servidor: No se pudo conectar con la base de datos.", "error");
    } else if (err.message.includes("foreign key constraint fails")) {
      showNotification("Error: No se puede eliminar el horario porque está vinculado a un usuario.", "error");
    } else {
      showNotification("Error al eliminar horario: " + err.message, "error");
    }
  }
}
