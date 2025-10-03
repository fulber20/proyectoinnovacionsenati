// envio.js

document.addEventListener("DOMContentLoaded", () => {
  loadUserInfo();  // Asumiendo que esta función está en panel.js
  fetchEnviosSummary();
  fetchEnvios();

  // Búsqueda
  document.querySelector('.search-input').addEventListener('input', filterTable);
  // Filtro por estado
  document.querySelector('.filter-select').addEventListener('change', filterTable);
});

// Función para mostrar notificaciones
function showNotification(message, type = "error") {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// Cargar resumen de contadores
async function fetchEnviosSummary() {
  try {
    const response = await fetch('http://localhost:3000/envios/summary');
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    const counts = await response.json();
    console.log("Datos de resumen recibidos:", counts);
    document.querySelector('.enviado-card .summary-value').textContent = counts['Enviado'] || 0;
    document.querySelector('.en-transito-card .summary-value').textContent = counts['Transito'] || 0;
    document.querySelector('.pendiente-card .summary-value').textContent = counts['Pendiente'] || 0;
    document.querySelector('.total-card .summary-value').textContent = counts.total || 0;
    showNotification('Resumen de envíos cargado exitosamente.', 'success');
  } catch (err) {
    console.error('Error en fetchEnviosSummary:', err);
    showNotification('Error al cargar resumen: ' + err.message, 'error');
  }
}

// Cargar envíos y popular tabla
async function fetchEnvios() {
  try {
    console.log("Intentando conectar a http://localhost:3000/envios");
    const response = await fetch("http://localhost:3000/envios");
    console.log("Respuesta recibida:", response.status, response.statusText);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    const envios = await response.json();
    console.log("Datos de envíos recibidos:", JSON.stringify(envios, null, 2));
    const tbody = document.getElementById("enviosTableBody");
    if (!tbody) {
      console.error("No se encontró el elemento enviosTableBody en el DOM");
      showNotification("Error: Tabla de envíos no encontrada.", "error");
      return;
    }
    tbody.innerHTML = "";
    if (envios.length === 0) {
      tbody.innerHTML = '<tr><td colspan="18">No hay envíos registrados.</td></tr>';
      showNotification("No se encontraron envíos registrados.", "info");
    } else {
      envios.forEach((envio) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${envio.id || "N/A"}</td>
          <td>${envio.cliente || "N/A"}</td>
          <td>${envio.dni || "N/A"}</td>
          <td>${envio.curso || "N/A"}</td>
          <td>${envio.certificados || "N/A"}</td>
          <td>${envio.telefono || "N/A"}</td>
          <td>${envio.departamento || "N/A"}</td>
          <td>${envio.provincia || "N/A"}</td>
          <td>${envio.distrito || "N/A"}</td>
          <td>${envio.empresa_envio || "N/A"}</td>
          <td>${envio.sede_empresa || "N/A"}</td>
          <td><input type="text" class="numero-orden-input" value="${envio.numero_orden || ""}" data-id="${envio.id || 0}"></td>
          <td><input type="text" class="codigo-envio-input" value="${envio.codigo_envio || ""}" data-id="${envio.id || 0}" ${envio.empresa_envio === 'Olva' ? 'disabled' : ''}></td>
          <td>${envio.observaciones || "N/A"}</td>
          <td><span class="status ${envio.estado?.toLowerCase().replace(" ", "-") || "pendiente"}">${envio.estado || "Pendiente"}</span></td>
          <td>${envio.fecha_registro ? new Date(envio.fecha_registro).toLocaleString() : "N/A"}</td>
          <td>
            <button class="action-btn print" onclick="imprimirEnvio(${envio.id || 0})"><i class="fas fa-print"></i> Imprimir</button>
            <button class="action-btn save" onclick="guardarEnvio(${envio.id || 0}, '${envio.empresa_envio || ""}', this.closest('tr'))"><i class="fas fa-save"></i> Guardar</button>
          </td>
        `;
        tbody.appendChild(row);
      });
      showNotification("Lista de envíos cargada exitosamente.", "success");
    }
  } catch (err) {
    console.error("Error en fetchEnvios:", err);
    showNotification("Error al cargar envíos: " + err.message, "error");
  }
}

// [Otras funciones como fetchEnviosSummary, fetchEnvios, etc., permanecen iguales]

// Actualizar estado e imprimir portada
async function imprimirEnvio(id, isChatbotCommand = false) {
  try {
    // Actualizar estado a 'Transito'
    console.log("Intentando actualizar estado a 'Transito' para ID:", id)
    const response = await fetch(`http://localhost:3000/envios/${id}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nuevoEstado: "Transito" }),
    })
    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Error al actualizar estado: ${response.status} - ${errorData}`)
    }
    console.log("Estado actualizado con éxito.")
    const showNotification = (message, type) => {
      // Implementación de showNotification aquí
      console.log(`Notification: ${message} - Type: ${type}`)
    }
    showNotification("Envío actualizado a Transito.", "success")

    // Buscar la fila correspondiente en la tabla
    const row = document.querySelector(`tr td button.action-btn.print[onclick*="${id}"]`)?.closest("tr")
    if (!row) throw new Error("No se encontró la fila para el ID: " + id)

    const cells = row.querySelectorAll("td")
    const envio = {
      id: id,
      cliente: cells[1]?.textContent || "N/A",
      dni: cells[2]?.textContent || "N/A",
      telefono: cells[5]?.textContent || "N/A",
      empresa_envio: cells[9]?.textContent || "N/A",
      departamento: cells[6]?.textContent || "N/A",
      provincia: cells[7]?.textContent || "N/A",
      distrito: cells[8]?.textContent || "N/A",
      sede_empresa: cells[10]?.textContent || "N/A",
    }

    // Asegúrate de que la imagen esté en la carpeta correcta de tu proyecto Electron
    const imagePath = "../img/FONDO4.png" // Ajusta el nombre según tu archivo

    // Crear contenido para la portada con orientación landscape
    // Dentro de imprimirEnvio() reemplaza la variable printContent con esto:

const printContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Portada de Envío</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4 landscape;
            margin: 0;
        }

        @media print {
            html, body {
                width: 297mm;
                height: 210mm;
            }
        }

        body {
            font-family: Arial, sans-serif;
            width: 297mm;
            height: 210mm;
            margin: 0;
            padding: 0;
            position: relative;
            overflow: hidden;
        }

        .background-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 0;
        }

        /* 🔹 Marca de agua en el centro */
        .watermark-center {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 400px;
            opacity: 0.08;
            transform: translate(-50%, -50%);
            z-index: 0;
        }

        /* 🔹 Logo en la parte inferior derecha */
        .watermark-bottom {
            position: absolute;
            bottom: 40px;
            right: 30px;
            width: 180px;
            opacity: 0.3;
            z-index: 0;
        }

        .print-content {
            position: relative;
            z-index: 1;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 40px;
        }

        .content-box {
            padding: 40px 60px;
            border-radius: 12px;
            max-width: 750px;
            width: 100%;
        }

        .info-row {
            display: flex;
            margin: 12px 0;
            padding: 6px 0;
        }

        .info-label {
            font-weight: bold;
            color: #1f2937;
            min-width: 130px;
            font-size: 20px;
            text-transform: uppercase; 
        }

        .info-value {
            color: #111827;
            font-size: 20px;
            flex: 1;
            text-transform: uppercase; /* 🔹 Todo en mayúscula */
        }

        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .background-image,
            .watermark-center,
            .watermark-bottom {
                display: block !important;
            }
        }
    </style>
</head>
<body>
    <!-- Fondo -->
    <img src="${imagePath}" class="background-image" alt="Fondo" onerror="this.style.display='none';">

    <!-- Marca de agua en el centro -->
    <img src="../img/logo-blanco-largo.jpg" class="watermark-center" alt="Marca de agua">

    <!-- Logo inferior derecho -->
    <img src="../img/logos-min.png" class="watermark-bottom" alt="Logo empresa">

    <div class="print-content">
        <div class="content-box">
            <div class="info-row">
                <span class="info-label">NOMBRE:</span>
                <span class="info-value">${envio.cliente}</span>
            </div>
            <div class="info-row">
                <span class="info-label">DNI/RUC:</span>
                <span class="info-value">${envio.dni}</span>
            </div>
            <div class="info-row">
                <span class="info-label">TELÉFONO:</span>
                <span class="info-value">${envio.telefono}</span>
            </div>
            <div class="info-row">
                <span class="info-label">AGENCIA:</span>
                <span class="info-value">${envio.empresa_envio}</span>
            </div>
            <div class="info-row">
                <span class="info-label">DIRECCIÓN:</span>
                <span class="info-value">${envio.departamento}/ ${envio.provincia}/ ${envio.distrito}/ ${envio.sede_empresa}</span>
            </div>
        </div>
    </div>
</body>
</html>
`;


    const printWindow = window.open("", "_blank")
    printWindow.document.write(printContent)
    printWindow.document.close()

    // Esperar a que cargue el contenido
    printWindow.onload = () => {
      setTimeout(() => {
        // Configuración de impresión para Electron
        printWindow.print()

        // Cerrar la ventana después de imprimir
        setTimeout(() => {
          printWindow.close()
        }, 500)
      }, 500)
    }

    // Actualizar la interfaz después de la acción
    const fetchEnvios = async () => {
      // Implementación de fetchEnvios aquí
      console.log("Fetching envios...")
    }
    const fetchEnviosSummary = async () => {
      // Implementación de fetchEnviosSummary aquí
      console.log("Fetching envios summary...")
    }
    await fetchEnvios()
    await fetchEnviosSummary()
  } catch (err) {
    console.error("Error en imprimirEnvio:", err)
    const showNotification = (message, type) => {
      // Implementación de showNotification aquí
      console.log(`Notification: ${message} - Type: ${type}`)
    }
    showNotification("Error al previsualizar/imprimir: " + err.message, "error")
  }
}


// [Resto de las funciones como guardarEnvio, filterTable, handleChatbotCommand permanecen iguales]

// Actualizar número de orden y código (a 'Enviado')
async function guardarEnvio(id, empresa_envio, row) {
  const numero_orden = row.querySelector('.numero-orden').value.trim();
  const codigo_envio = empresa_envio !== 'Olva' ? row.querySelector('.codigo-envio').value.trim() : '';
  if (!numero_orden) {
    showNotification('Debe ingresar un número de orden.', 'warning');
    return;
  }
  try {
    const response = await fetch(`http://localhost:3000/envios/${id}/orden`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero_numero_orden, codigo_envio })
    });
    if (!response.ok) throw new Error('Error al actualizar orden');
    showNotification('Envío marcado como Enviado.', 'success');
    await fetchEnvios();
    await fetchEnviosSummary();
  } catch (err) {
    console.error('Error en guardarEnvio:', err);
    showNotification('Error al guardar: ' + err.message, 'error');
  }
}

// Filtrar y buscar en la tabla
function filterTable() {
    const searchInput = document.querySelector('.search-input').value.toLowerCase();
    const filterSelect = document.querySelector('.filter-select').value.toLowerCase();
    const rows = document.querySelectorAll('table tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 15) return;
        const cliente = cells[1] ? cells[1].textContent.toLowerCase() : '';
        const dni = cells[2] ? cells[2].textContent.toLowerCase() : '';
        const estado = cells[14] ? cells[14].textContent.toLowerCase().replace(/\s+/g, '-') : '';
        const matchesSearch = cliente.includes(searchInput) || dni.includes(searchInput);
        const matchesFilter = filterSelect === '' || estado === filterSelect;
        row.style.display = matchesSearch && matchesFilter ? '' : 'none';
    });
}

// Función para manejar comandos del chatbot
function handleChatbotCommand(command, envioId) {
    if (command.toLowerCase() === "imprimir portada") {
        console.log(`Comando del chatbot recibido: Imprimir portada para envío ID ${envioId}`);
        imprimirEnvio(envioId, true); // Llama a imprimirEnvio con isChatbotCommand = true
    } else {
        showNotification("Comando no reconocido.", "warning");
    }
}