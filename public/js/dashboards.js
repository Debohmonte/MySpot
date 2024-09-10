document.getElementById('dashboardForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const chartType = document.getElementById('chartType').value;
    const filterSexo = document.getElementById('filterSexo').value;
    const filterRangoEdad = document.getElementById('filterRangoEdad').value;
    const filterDia = document.getElementById('filterDia').value;
    const filterMes = document.getElementById('filterMes').value;

    // Realiza una solicitud al backend para obtener los datos filtrados
    fetch('/getDashboardData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chartType: chartType,
            sexo: filterSexo,
            rangoEdad: filterRangoEdad,
            dia: filterDia,
            mes: filterMes
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            renderChart(chartType, data.chartData);
        } else {
            alert('Error al generar el gráfico.');
        }
    })
    .catch(error => {
        console.error('Error al obtener los datos del dashboard:', error);
    });
});

function renderChart(chartType, chartData) {
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    
    // Elimina cualquier gráfico previo
    if (window.myChart) {
        window.myChart.destroy();
    }

    // Crear el nuevo gráfico
    window.myChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Datos',
                data: chartData.data,
                backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)'],
                borderColor: ['rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
