document.querySelectorAll('.cancel-btn').forEach(button => {
    button.addEventListener('click', function() {
        const reservationDetails = this.closest('tr').querySelector('td').textContent;

        if (confirm(`¿Estás seguro de que deseas cancelar la siguiente reserva?\n\n${reservationDetails}`)) {

            this.closest('tr').remove(); 
            alert('Reserva cancelada.');
        } else {
            alert('La reserva no ha sido cancelada.');
        }
    });
});
