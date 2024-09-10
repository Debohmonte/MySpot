document.addEventListener('DOMContentLoaded', function() {
    const floorPlanContainer = document.getElementById('floor-plan-container');

    
    const floorRadios = document.querySelectorAll('input[name="floor"]');
    floorRadios.forEach(radio => {
        radio.addEventListener('change', loadPlan);
    });

    function loadPlan() {
        const selectedFloor = document.querySelector('input[name="floor"]:checked').value;
        const selectedType = 'Escritorio';

        fetch(`/getPlan?piso=${selectedFloor}&tipo=${selectedType}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const planImage = new Image();
                    planImage.src = data.planImage;

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

                            iconElement.addEventListener('click', function() {
                                const estado = iconElement.dataset.estado;
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

    if (document.querySelector('input[name="floor"]:checked')) {
        loadPlan();  // Cargar el plano si ya hay una selección
    }
});
