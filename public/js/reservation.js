document.getElementById('reservation-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    const userId = sessionStorage.getItem('userId');
    console.log('ID del Usuario:', userId);  // Verificar si el ID se obtiene correctamente

    if (!userId) {
        alert('Error: No se pudo obtener el ID del usuario. Por favor, intenta iniciar sesión nuevamente.');
        return;
    }

    const reservationDetails = {
        idUsuario: userId,
        floor: formData.get('floor'),
        date: formData.get('date'),
        timeFrom: formData.get('time-from'),
        timeTo: formData.get('time-to'),
        idAsiento: formData.get('idAsiento')
    };

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
