document.addEventListener('DOMContentLoaded', function() {
    const cancelButtons = document.querySelectorAll('.cancel-btn');

    cancelButtons.forEach(button => {
        button.addEventListener('click', function() {
            
            const reservationRow = this.closest('tr');

//DATOS DE LA RESERVA
            const reservationDetails = {
                reserva: reservationRow.cells[0].textContent,
                dia: reservationRow.cells[1].textContent,
                horario: reservationRow.cells[2].textContent
            };

            // CONFIRMACANCELAACION
            if (confirm(`¿Estás seguro de que deseas cancelar la reserva para ${reservationDetails.reserva} el ${reservationDetails.dia} en el horario ${reservationDetails.horario}?`)) {
                
                
                fetch('/cancelReservation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(reservationDetails)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Reserva cancelada exitosamente.');
                        reservationRow.remove(); 
                    } else {
                        alert('Error al cancelar la reserva.');
                    }
                })
                .catch(error => {
                    console.error('Error al cancelar la reserva:', error);
                    alert('Error al realizar la operación.');
                });
            }
        });
    });
});
