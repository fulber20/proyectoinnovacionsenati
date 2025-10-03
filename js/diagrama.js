const ctx = document.getElementById('asistenciaChart').getContext('2d');
new Chart(ctx, {
  type: 'pie',
  data: {
    labels: ['Temprano', 'Tarde', 'Ausente'], // 3 estados
    datasets: [{
      data: [50, 35, 15], // 3 valores (ejemplo)
      backgroundColor: [
        '#22c55e', // verde - Temprano
        '#facc15', // amarillo - Tarde
        '#ef4444'  // rojo - Ausente
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
            return `${context.label}: ${context.raw}`;
          }
        }
      }
    }
  }
});
