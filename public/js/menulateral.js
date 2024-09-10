document.addEventListener('DOMContentLoaded', function() {

    fetch('/getUserInfo')
        .then(response => response.json())
        .then(userData => {
            document.getElementById('userName').textContent = userData.Nombre;
            document.getElementById('userLastName').textContent = userData.Apellido;
            document.getElementById('userEmail').textContent = userData.Direccion; 
        });


    const userIcon = document.getElementById('userIcon');
    const userMenu = document.getElementById('userMenu');

    userIcon.addEventListener('click', function() {
        userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
    });
});
