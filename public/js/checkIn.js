document.addEventListener('DOMContentLoaded', function() {
    const checkinSliders = document.querySelectorAll('.checkin-slider');

    // Función para cargar las reservas del usuario
    function loadReservations() {
        fetch('/getReservas?userId=1')  // Reemplaza con la lógica para obtener el ID del usuario dinámicamente
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    populateReservationsTable(data.reservas);
                } else {
                    alert('No se pudieron cargar las reservas.');
                }
            })
            .catch(error => {
                console.error('Error al obtener las reservas:', error);
            });
    }

    // Función para rellenar la tabla con las reservas
    function populateReservationsTable(reservas) {
        const reservationsTableBody = document.querySelector('.reservation-table tbody');
        reservationsTableBody.innerHTML = '';  // Limpia la tabla

        reservas.forEach(reserva => {
            const row = document.createElement('tr');

            // Crear las celdas
            const reservaCell = document.createElement('td');
            reservaCell.textContent = reserva.Reserva;

            const diaCell = document.createElement('td');
            diaCell.textContent = reserva.Fecha;

            const horarioCell = document.createElement('td');
            horarioCell.textContent = `${reserva.HoraInicio} a ${reserva.HoraFinal}`;

            const checkinCell = document.createElement('td');
            const checkinSlider = document.createElement('div');
            checkinSlider.classList.add('checkin-slider');
            if (reserva.HoraCheckIn) {
                checkinSlider.classList.add('checked'); // Indica que ya se hizo check-in
            }
            const slider = document.createElement('div');
            slider.classList.add('slider');
            checkinSlider.appendChild(slider);
            checkinCell.appendChild(checkinSlider);

            // Añadir evento de check-in
            checkinSlider.addEventListener('click', function() {
                handleCheckIn(reserva, checkinSlider);
            });

            // Añadir celdas a la fila
            row.appendChild(reservaCell);
            row.appendChild(diaCell);
            row.appendChild(horarioCell);
            row.appendChild(checkinCell);

            // Añadir fila a la tabla
            reservationsTableBody.appendChild(row);
        });
    }

    // Función para manejar el check-in
    function handleCheckIn(reserva, sliderElement) {
        if (sliderElement.classList.contains('checked')) {
            alert('Ya se ha realizado el check-in para esta reserva.');
            return;
        }

        // Confirmación del check-in
        if (confirm(`¿Estás seguro de que deseas hacer check-in para ${reserva.Reserva} el ${reserva.Fecha} en el horario ${reserva.HoraInicio} a ${reserva.HoraFinal}?`)) {
            const reservationDetails = {
                idAsiento: reserva.IdAsiento,  // Debes asegurarte de que esto esté en la respuesta de /getReservas
                dia: reserva.Fecha,
                horario: reserva.HoraInicio
            };

            // Enviar solicitud de check-in al backend
            fetch('/checkIn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reservationDetails)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Check-in realizado exitosamente.');
                    sliderElement.classList.add('checked');  // Marcar como check-in realizado
                } else {
                    alert('Error al realizar el check-in.');
                }
            })
            .catch(error => {
                console.error('Error al realizar el check-in:', error);
                alert('Error al realizar la operación.');
            });
        }
    }

    // Cargar las reservas cuando la página se cargue
    loadReservations();
});
