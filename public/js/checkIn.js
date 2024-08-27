document.querySelectorAll('.checkin-slider').forEach(slider => {
    slider.addEventListener('click', function() {

        this.classList.toggle('checked');
        

        if (this.classList.contains('checked')) {
            alert('Check-in realizado.');
        } else {
            alert('Check-in cancelado.');
        }
    });
});
