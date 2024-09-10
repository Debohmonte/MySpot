document.addEventListener('DOMContentLoaded', function() {
    const checkinSliders = document.querySelectorAll('.checkin-slider');


    function loadReservations() {
        fetch('/getReservas?userId=1') 
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

    function populateReservationsTable(reservas) {
        const reservationsTableBody = document.querySelector('.reservation-table tbody');
        reservationsTableBody.innerHTML = '';  

        reservas.forEach(reserva => {
            const row = document.createElement('tr');

          
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
                checkinSlider.classList.add('checked');
            }
            const slider = document.createElement('div');
            slider.classList.add('slider');
            checkinSlider.appendChild(slider);
            checkinCell.appendChild(checkinSlider);

          
            checkinSlider.addEventListener('click', function() {
                handleCheckIn(reserva, checkinSlider);
            });

           
            row.appendChild(reservaCell);
            row.appendChild(diaCell);
            row.appendChild(horarioCell);
            row.appendChild(checkinCell);

          
            reservationsTableBody.appendChild(row);
        });
    }

  
    function handleCheckIn(reserva, sliderElement) {
        if (sliderElement.classList.contains('checked')) {
            alert('Ya se ha realizado el check-in para esta reserva.');
            return;
        }


        if (confirm(`¿Estás seguro de que deseas hacer check-in para ${reserva.Reserva} el ${reserva.Fecha} en el horario ${reserva.HoraInicio} a ${reserva.HoraFinal}?`)) {
            const reservationDetails = {
                idAsiento: reserva.IdAsiento,  
                dia: reserva.Fecha,
                horario: reserva.HoraInicio
            };

            
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
                    sliderElement.classList.add('checked'); 
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

    
    loadReservations();
});
