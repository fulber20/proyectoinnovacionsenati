function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = `notification ${type}`;
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }

        // Verificar estado del usuario después de cargar la info desde panel.js
        document.addEventListener("DOMContentLoaded", () => {
            const storedUserInfo = localStorage.getItem("userInfo");
            if (storedUserInfo) {
                try {
                    const userData = JSON.parse(storedUserInfo);
                    if (userData.estado !== "Activo") {
                        showNotification("Tu cuenta está inactiva. Contacta al administrador.", "error");
                        setTimeout(() => {
                            window.location.href = "index.html";
                        }, 2000);
                        return;
                    }
                } catch (error) {
                    console.error("Error al verificar estado del usuario:", error);
                }
            }
        });

        function togglePassword() {
            const passwordInput = document.getElementById("password");
            const toggleIcon = document.getElementById("toggleIcon");
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                toggleIcon.classList.remove("fa-eye");
                toggleIcon.classList.add("fa-eye-slash");
            } else {
                passwordInput.type = "password";
                toggleIcon.classList.remove("fa-eye-slash");
                toggleIcon.classList.add("fa-eye");
            }
        }

        document.getElementById("registroForm").addEventListener("submit", async (e) => {
            e.preventDefault();

            const rol = document.getElementById("rol").value;
            if (!rol) {
                showNotification("Por favor, seleccione un rol válido.", "error");
                return;
            }

            const empleado = {
                nombres: document.getElementById("nombres").value,
                apellidos: document.getElementById("apellidos").value,
                email: document.getElementById("email").value,
                password: document.getElementById("password").value,
                rol: rol,
                estado: document.getElementById("estado").value,
                ocupacion: document.getElementById("ocupacion").value || null,
                tipo_contrato: document.getElementById("tipoContrato").value,
            };

            console.log("Datos enviados al registrar:", empleado);

            const submitBtn = document.getElementById("submitBtn");
            const btnText = submitBtn.querySelector(".btn-text");
            const btnLoading = submitBtn.querySelector(".btn-loading");

            btnText.style.display = "none";
            btnLoading.style.display = "flex";

            try {
                const res = await fetch("http://localhost:3000/registrar-empleado", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(empleado),
                });
                const data = await res.json();
                console.log("Respuesta del servidor:", data);

                btnLoading.style.display = "none";
                if (res.ok) {
                    btnText.textContent = " Empleado registrado";
                    await cargarEmpleados();
                    document.getElementById("registroForm").reset();
                    showNotification("Empleado registrado exitosamente.", "success");
                } else {
                    btnText.textContent = "❌ Error: " + (data.error || "No se pudo registrar");
                    showNotification("Error: " + (data.error || "No se pudo registrar"), "error");
                }
            } catch (err) {
                btnLoading.style.display = "none";
                btnText.textContent = "⚠️ Error de conexión";
                console.error("Error registrando:", err);
                showNotification("Error de conexión. Verifica que el servidor esté activo.", "error");
            }

            setTimeout(() => {
                btnText.textContent = "Registrar Usuario";
                btnText.style.display = "inline";
            }, 500);
        });

        async function cargarEmpleados(filter = "") {
            try {
                console.log("Cargando empleados con filtro:", filter);
                const res = await fetch("http://localhost:3000/empleados");
                if (!res.ok) {
                    throw new Error(`Error HTTP: ${res.status} ${res.statusText}`);
                }
                const empleados = await res.json();
                console.log("Empleados recibidos:", empleados);

                const tbody = document.querySelector("#employeeTable tbody");
                tbody.innerHTML = "";

                if (empleados.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="10">No hay empleados registrados.</td></tr>`;
                    return;
                }

                const userInfo = JSON.parse(localStorage.getItem("userInfo"));
                const userRol = userInfo ? userInfo.rol : null;
                const userId = userInfo ? userInfo.id_user : null;
                console.log("Rol del usuario:", userRol);

                empleados
                    .filter(emp =>
                        filter
                            ? emp.nombres.toLowerCase().includes(filter.toLowerCase()) ||
                              emp.email.toLowerCase().includes(filter.toLowerCase())
                            : true
                    )
                    .forEach(emp => {
                        const isOwnUser = userId === emp.id_user;
                        const isAdminAndGerente = userRol === "Administrador" && emp.rol === "Gerente";
                        const estadoOnClick = (isOwnUser || isAdminAndGerente) ? "" : `cambiarEstado(${emp.id_user}, '${emp.estado}')`;
                        const estadoHTML = `
                            <span class="estado ${emp.estado === "Activo" ? "activo" : "inactivo"}" 
                                  onclick="${estadoOnClick}">
                                ${emp.estado}
                            </span>
                        `;
                        let accionesHTML = "";
                        if (!isAdminAndGerente) {
                            accionesHTML = `
                                <button class="btn-editar" onclick="openEditModal(${emp.id_user}, '${emp.nombres}', '${emp.apellidos}', '${emp.email}', '${emp.rol}', '${emp.estado}', '${emp.ocupacion || ""}', '${emp.tipo_contrato}')">
                                    Editar
                                </button>
                            `;
                        } else {
                            accionesHTML = `<span style="color: gray;">No editable</span>`;
                        }
                        const row = `
                            <tr>
                                <td>${emp.codigo_user || emp.id_user}</td>
                                <td>${emp.nombres}</td>
                                <td>${emp.apellidos}</td>
                                <td>${emp.email}</td>
                                <td>${emp.rol}</td>
                                <td>${estadoHTML}</td>
                                <td>${new Date(emp.fecha_crea).toLocaleString()}</td>
                                <td>${emp.ocupacion || "-"}</td>
                                <td>${emp.tipo_contrato}</td>
                                <td>${accionesHTML}</td>
                            </tr>
                        `;
                        tbody.innerHTML += row;
                    });
            } catch (err) {
                console.error("Error cargando empleados:", err);
                const tbody = document.querySelector("#employeeTable tbody");
                tbody.innerHTML = `<tr><td colspan="10">Error al cargar empleados: ${err.message}</td></tr>`;
            }
        }

        async function cambiarEstado(id, estadoActual) {
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            const userId = userInfo ? userInfo.id_user : null;

            if (userId === id) {
                showNotification("No puedes cambiar tu propio estado para evitar inactivarte por error.", "error");
                return;
            }

            const nuevoEstado = estadoActual === "Activo" ? "Inactivo" : "Activo";
            try {
                console.log(`Cambiando estado de ${id} a ${nuevoEstado}`);
                const res = await fetch(`http://localhost:3000/empleados/${id}/estado`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ estado: nuevoEstado }),
                });
                const data = await res.json();
                console.log("Respuesta del servidor:", data);
                if (res.ok) {
                    cargarEmpleados(document.getElementById("searchBar").value);
                    showNotification(`Estado cambiado a ${nuevoEstado}`, "success");
                } else {
                    const errorMessage = data.error || `Código de estado: ${res.status}`;
                    console.error("Error del servidor:", errorMessage);
                    showNotification("Error al cambiar estado: " + errorMessage, "error");
                }
            } catch (err) {
                console.error("Error en cambiarEstado:", err.message);
                showNotification("Error de conexión al cambiar estado: " + err.message, "error");
            }
        }

        function openEditModal(id, nombres, apellidos, email, rol, estado, ocupacion, tipo_contrato) {
            const userInfo = JSON.parse(localStorage.getItem("userInfo"));
            const userRol = userInfo ? userInfo.rol : null;

            if (userRol === "Administrador" && rol === "Gerente") {
                showNotification("El administrador no puede editar información del gerente.", "error");
                return;
            }

            document.getElementById("editNombres").value = nombres;
            document.getElementById("editApellidos").value = apellidos;
            document.getElementById("editEmail").value = email;
            document.getElementById("editRol").value = rol;
            document.getElementById("editEstado").value = estado;
            document.getElementById("editOcupacion").value = ocupacion;
            document.getElementById("editTipoContrato").value = tipo_contrato;
            document.getElementById("editForm").dataset.id = id;
            document.getElementById("editModal").style.display = "flex";
        }

        function closeEditModal() {
            document.getElementById("editModal").style.display = "none";
            document.getElementById("editForm").reset();
        }

        document.getElementById("editForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = e.target.dataset.id;
            const empleado = {
                nombres: document.getElementById("editNombres").value,
                apellidos: document.getElementById("editApellidos").value,
                email: document.getElementById("editEmail").value,
                password: document.getElementById("editPassword").value || undefined,
                rol: document.getElementById("editRol").value,
                estado: document.getElementById("editEstado").value,
                ocupacion: document.getElementById("editOcupacion").value || null,
                tipo_contrato: document.getElementById("editTipoContrato").value,
            };
            console.log("Datos enviados al editar:", empleado);
            try {
                const res = await fetch(`http://localhost:3000/empleados/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(empleado),
                });
                const data = await res.json();
                console.log("Respuesta del servidor:", data);
                if (res.ok) {
                    showNotification("Empleado actualizado exitosamente.", "success");
                    closeEditModal();
                    cargarEmpleados(document.getElementById("searchBar").value);
                } else {
                    const errorMessage = data.error || `Código de estado: ${res.status}`;
                    console.error("Error del servidor:", errorMessage);
                    showNotification("Error al actualizar: " + errorMessage, "error");
                }
            } catch (err) {
                console.error("Error actualizando empleado:", err.message);
                showNotification("Error de conexión al actualizar empleado: " + err.message, "error");
            }
        });

        document.getElementById("searchBar").addEventListener("input", (e) => {
            console.log("Buscando con:", e.target.value);
            cargarEmpleados(e.target.value);
        });

        window.addEventListener('load', () => {
            console.log("Página cargada, iniciando cargarEmpleados");
            cargarEmpleados();
        });