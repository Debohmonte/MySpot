document.addEventListener('DOMContentLoaded', function() {
    const floorPlanContainer = document.getElementById('floor-plan-container');

    // SELECCION PISO
    const floorRadios = document.querySelectorAll('input[name="floor"]');
    floorRadios.forEach(radio => {
        radio.addEventListener('change', loadPlan);
    });

    // FCARGA PLANO Y PISO
    function loadPlan() {
        const selectedFloor = document.querySelector('input[name="floor"]:checked').value;
        const selectedType = 'Escritorio';

        fetch(`/getPlan?piso=${selectedFloor}&tipo=${selectedType}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const planImage = new Image();
                    planImage.src = data.planImage;

                    console.log("Cargando imagen desde:", planImage.src);

                    floorPlanContainer.innerHTML = '';
                    floorPlanContainer.appendChild(planImage);

                    planImage.onerror = function() {
                        alert('No se pudo cargar la imagen del plano.');
                    };

                    planImage.onload = () => {
                        data.icons.forEach(icon => {
                            const iconElement = document.createElement('div');
                            iconElement.className = 'icon';
                            iconElement.style.left = `${icon.xPos}px`;
                            iconElement.style.top = `${icon.yPos}px`;
                            iconElement.textContent = icon.texto || '';
                            iconElement.dataset.id = icon.idAsiento;
                            iconElement.dataset.estado = icon.estado; 

                            
                            console.log(`Asiento ID: ${icon.idAsiento}, Estado: ${icon.estado}`);

                            iconElement.addEventListener('click', function() {
                                const estado = iconElement.dataset.estado;

                                
                                console.log(`Estado del asiento al hacer clic: ${estado}`);

                                if (estado == 1) { 
                                    document.querySelector('input[name="idAsiento"]').value = icon.idAsiento;
                                } else {
                                    alert('Este asiento no está disponible.');
                                }
                            });
                            floorPlanContainer.appendChild(iconElement);
                        });
                    };
                } else {
                    alert('No se pudo cargar el plano. Intenta nuevamente.');
                }
            })
            .catch(error => {
                console.error('Error al cargar el plano:', error);
            });
    }

    // CARGA EL PLANO SI YA HAY UNA SELECCIÓN
    if (document.querySelector('input[name="floor"]:checked')) {
        loadPlan();
    }
});

// CONFIRMACION DE RESERVA
document.getElementById('reservation-form').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const formData = new FormData(this);
    const reservationDetails = {
        idUsuario: idUsuario, 
        floor: formData.get('floor'),
        date: formData.get('date'),
        timeFrom: formData.get('time-from'),
        timeTo: formData.get('time-to'),
        idAsiento: formData.get('idAsiento')
    };

    if (!reservationDetails.idAsiento) {
        alert('Debe seleccionar un asiento disponible antes de confirmar la reserva.');
        return;
    }

    fetch('/reserve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reservationDetails)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Reserva confirmada.');
            window.location.reload();
        } else {
            alert('Hubo un problema al confirmar la reserva.');
        }
    })
    .catch(error => {
        console.error('Error al confirmar la reserva:', error);
        alert('Error al confirmar la reserva.');
    });
});
