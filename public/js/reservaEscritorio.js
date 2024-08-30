/*document.addEventListener('DOMContentLoaded', function() {
    const floorPlanContainer = document.getElementById('floor-plan-container');

    // PISO Y TIPO
    const selectedFloor = document.querySelector('input[name="floor"]:checked').value;
    const selectedType = 'Escritorio'; 

    //  CARGA PLANO YPISO
    fetch(`/getPlan?piso=${selectedFloor}&tipo=${selectedType}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const planImage = new Image();
                planImage.src = data.planImage; // URL DE LA IMAGEN
                floorPlanContainer.innerHTML = ''; 
                floorPlanContainer.appendChild(planImage);

                // ICONOS DEL PLANO DEBERIAN ESTAR YA CREADORS
                data.icons.forEach(icon => {
                    const iconElement = document.createElement('div');
                    iconElement.className = 'icon';
                    iconElement.style.left = `${icon.xPos}px`;
                    iconElement.style.top = `${icon.yPos}px`;
                    iconElement.textContent = icon.texto || ''; 
                    iconElement.dataset.id = icon.idAsiento; // ID
                    iconElement.addEventListener('click', function() {
                        document.querySelector('input[name="idAsiento"]').value = icon.idAsiento;
                    });
                    floorPlanContainer.appendChild(iconElement);
                });
            } else {
                alert('No se pudo cargar el plano. Intenta nuevamente.');
            }
        })
        .catch(error => {
            console.error('Error al cargar el plano:', error);
        });
});*/