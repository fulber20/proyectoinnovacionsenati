document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    loadCajaData();
    loadGastos();
    loadGastoDia();

    // Form submission for creating caja
    document.getElementById('cajaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const idAdmin = document.getElementById('idAdmin').value;
        const montoInicial = document.getElementById('montoInicialForm').value;
        const fechaEntrega = document.getElementById('fechaEntrega').value;

        try {
            const response = await fetch('http://localhost:3000/caja', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_admin: idAdmin, monto_inicial: montoInicial, fecha_entrega: fechaEntrega })
            });
            const result = await response.json();
            if (response.ok) {
                showNotification('Caja creada exitosamente', 'success');
                closeCajaModal();
                await loadCajaData(); // Asegurar que se actualice inmediatamente
            } else {
                showNotification(result.error || 'Error al crear caja', 'error');
            }
        } catch (err) {
            console.error('Error al crear caja:', err);
            showNotification('Error al crear caja', 'error');
        }
    });

    // Form submission for registering gasto
    document.getElementById('gastoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const idCaja = document.getElementById('idCaja').value;
        const descripcion = document.getElementById('descripcion').value;
        let monto = parseFloat(document.getElementById('monto').value); // Convertir a número explícitamente
        const tipoComprobante = document.getElementById('tipoComprobante').value;
        const nroComprobante = document.getElementById('nroComprobante').value;
        const fecha = document.getElementById('fechaGasto').value;

        // Validación frontend rápida
        if (isNaN(monto) || monto <= 0) {
            showNotification('El monto debe ser un número válido mayor a 0', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/gasto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_caja: idCaja,
                    descripcion,
                    monto,
                    tipo_comprobante: tipoComprobante,
                    nro_comprobante: nroComprobante,
                    fecha
                })
            });
            const result = await response.json();
            if (response.ok) {
                showNotification('Gasto registrado exitosamente', 'success');
                closeGastoModal(); // Cerrar modal automáticamente tras éxito
                loadGastos();
                await loadCajaData(); // Actualizar datos de caja tras registrar gasto
                loadGastoDia();
            } else {
                showNotification(result.error || 'Error al registrar gasto', 'error');
            }
        } catch (err) {
            console.error('Error al registrar gasto:', err);
            showNotification('Error al registrar gasto', 'error');
        }
    });
});

// Función para mostrar notificación en modal
function showNotification(message, type = 'success') {
    const modal = document.getElementById('notificationModal');
    const messageElem = document.getElementById('notificationMessage');
    messageElem.textContent = message;
    messageElem.className = type; // Agrega clase para estilo (success o error)
    modal.style.display = 'flex';
    setTimeout(closeNotification, 5000); // Cierra automáticamente después de 5s
}

function closeNotification() {
    document.getElementById('notificationModal').style.display = 'none';
}

// Load user info from session
async function loadUserInfo() {
    try {
        const response = await fetch('http://localhost:3000/login', { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
            document.getElementById('userName').textContent = `${data.user.nombres} ${data.user.apellidos}`;
            document.getElementById('userRole').textContent = data.user.rol;
        }
    } catch (err) {
        console.error('Error al cargar info de usuario:', err);
    }
}

// Load caja data
async function loadCajaData() {
    try {
        const response = await fetch('http://localhost:3000/caja/activa');
        if (!response.ok) {
            console.error('Error en /caja/activa:', response.status, response.statusText);
            showNotification('Error al cargar caja activa', 'error');
            return;
        }
        const caja = await response.json();
        console.log('Datos de caja activa:', caja); // Log para depuración
        if (caja && caja.id_caja) {
            document.getElementById('cajaId').textContent = `CAJA${caja.id_caja.toString().padStart(3, '0')}`;
            document.getElementById('saldoActual').textContent = `S/. ${parseFloat(caja.saldo_actual).toFixed(2)}`;
            document.getElementById('montoInicial').textContent = `S/. ${parseFloat(caja.monto_inicial).toFixed(2)}`;
            document.getElementById('cajaEstado').textContent = 'Activo';
            const porcentaje = (caja.saldo_actual / caja.monto_inicial) * 100;
            document.getElementById('nativeProg').value = porcentaje;
            document.getElementById('porcentaje').textContent = `${porcentaje.toFixed(0)}% de ${parseFloat(caja.monto_inicial).toFixed(2)}`;
            document.getElementById('idCaja').value = caja.id_caja;
        } else {
            document.getElementById('cajaId').textContent = 'Sin caja activa';
            document.getElementById('saldoActual').textContent = 'S/. 0.00';
            document.getElementById('montoInicial').textContent = 'S/. 0.00';
            document.getElementById('cajaEstado').textContent = 'Inactivo';
            document.getElementById('nativeProg').value = 0;
            document.getElementById('porcentaje').textContent = '0% de 0.00';
            document.getElementById('idCaja').value = ''; // Asegurar que idCaja se limpie si no hay caja
        }
    } catch (err) {
        console.error('Error al cargar datos de caja:', err);
        showNotification('Error al cargar datos de caja', 'error');
    }
}

// Load gastos
async function loadGastos() {
    try {
        const response = await fetch('http://localhost:3000/gastos');
        const gastos = await response.json();
        const tbody = document.getElementById('gastosTableBody');
        tbody.innerHTML = '';
        gastos.forEach(gasto => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${gasto.descripcion}</td>
                <td>${gasto.tipo_comprobante}</td>
                <td>${gasto.nro_comprobante}</td>
                <td>${gasto.fecha}</td>
                <td class="monto">S/. ${parseFloat(gasto.monto).toFixed(2)}</td>
                <td class="caja">CAJA${gasto.id_caja.toString().padStart(3, '0')}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Error al cargar gastos:', err);
    }
}

// Load gasto del día
async function loadGastoDia() {
    try {
        const response = await fetch('http://localhost:3000/gastos/dia');
        const data = await response.json();
        document.getElementById('gastoDia').textContent = `S/. ${parseFloat(data.total).toFixed(2)}`;
    } catch (err) {
        console.error('Error al cargar gasto del día:', err);
    }
}

// Modal controls
function openCajaModal() {
    // Verificar si hay una caja activa con saldo > 0
    const saldoActual = parseFloat(document.getElementById('saldoActual').textContent.replace('S/. ', '')) || 0;
    if (saldoActual > 0) {
        showNotification('No puedes crear una nueva caja hasta que el saldo llegue a 0', 'error');
        return;
    }
    document.getElementById('cajaModal').style.display = 'flex';
}

function closeCajaModal() {
    document.getElementById('cajaModal').style.display = 'none';
    document.getElementById('cajaForm').reset();
}

function openGastoModal() {
    // Forzar recarga de datos antes de abrir el modal
    loadCajaData().then(() => {
        const idCaja = document.getElementById('idCaja').value;
        if (!idCaja) {
            showNotification('No hay caja activa. Crea una caja primero.', 'error');
            return;
        }
        document.getElementById('gastoModal').style.display = 'flex';
    }).catch(err => {
        console.error('Error al recargar datos para abrir modal:', err);
        showNotification('Error al verificar caja activa', 'error');
    });
}

function closeGastoModal() {
    document.getElementById('gastoModal').style.display = 'none';
    document.getElementById('gastoForm').reset();
}

// Cerrar modales al hacer clic fuera (para todos los modales)
window.onclick = function (event) {
    const gastoModal = document.getElementById("gastoModal");
    const cajaModal = document.getElementById("cajaModal");
    const notificationModal = document.getElementById("notificationModal");

    if (event.target === gastoModal) {
        closeGastoModal();
    } else if (event.target === cajaModal) {
        closeCajaModal();
    } else if (event.target === notificationModal) {
        closeNotification();
    }
};