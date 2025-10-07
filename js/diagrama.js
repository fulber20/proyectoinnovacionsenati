document.addEventListener("DOMContentLoaded", () => {
  fetchAsistenciasChartData();
});

async function fetchAsistenciasChartData() {
  try {
    const response = await fetch("http://localhost:3000/asistencias");
    if (!response.ok) throw new Error("Error al obtener asistencias");
    const asistencias = await response.json();

    // Contar la frecuencia de cada estado
    const estadoCounts = {};
    asistencias.forEach(a => {
      estadoCounts[a.estado] = (estadoCounts[a.estado] || 0) + 1;
    });

    const ctx = document.getElementById("asistenciaChart").getContext("2d");
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: Object.keys(estadoCounts), // ['Temprano', 'Tarde', 'A tiempo', etc.]
        datasets: [{
          data: Object.values(estadoCounts), // [número de cada estado]
          backgroundColor: [
            '#e90909ff',
            '#22c55e', // verde - Temprano
            '#34d399', // verde claro - A tiempo
             '#facc15',
            '#f97316'// naranja - Salida temprana
             // rojo - No programado
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 14
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.raw} (${((context.raw / asistencias.length) * 100).toFixed(1)}%)`;
              }
            }
          }
        }
      }
    });
  } catch (err) {
    console.error("Error en fetchAsistenciasChartData:", err);
    showNotification("Error al cargar gráfico de asistencias: " + err.message, "error");
  }
}