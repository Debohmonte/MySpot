document.addEventListener('DOMContentLoaded', function() {
    const floorPlanContainer = document.getElementById('floor-plan-container');

    function loadFloorPlan() {
        fetch('/getPlan?piso=1&tipo=Escritorio')  //CAMBIA PISO O TIPO
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const planImage = new Image();
                    planImage.src = data.planImage;
                    planImage.id = "floor-plan-image";
                    planImage.style.position = 'absolute'; //POS IMAGEN
                    planImage.style.top = '0';
                    planImage.style.left = '0';
                    planImage.style.width = '100%'; 
                    planImage.style.height = 'auto'; 

                    floorPlanContainer.style.position = 'relative';
                    floorPlanContainer.style.width = '100%'; 
                    floorPlanContainer.style.height = 'auto'; 

                    floorPlanContainer.innerHTML = ''; 
                    floorPlanContainer.appendChild(planImage);

                    // QUE LOS ICONOS SE CARGUEN DESPUES DE LA IMAGEN
                    planImage.onload = () => {
                        const containerRect = floorPlanContainer.getBoundingClientRect();
                        const imageRect = planImage.getBoundingClientRect();

                        const scaleX = imageRect.width / planImage.naturalWidth;
                        const scaleY = imageRect.height / planImage.naturalHeight;

                        data.icons.forEach(icon => {
                            const iconElement = document.createElement('div');
                            iconElement.className = `icon ${icon.estado}`;  // ESTADO

                            // COORDENADAS DE LOS PUNTOS
                            iconElement.style.left = `${icon.xPos * scaleX}px`;
                            iconElement.style.top = `${icon.yPos * scaleY}px`;

                            iconElement.textContent = icon.texto || ''; 
                            iconElement.dataset.id = icon.idAsiento || icon.idOficina;

                            // CLICK EN EL ICONO
                            iconElement.addEventListener('click', function() {
                                alert(`Has seleccionado ${icon.idAsiento ? 'el asiento' : 'la oficina'} con ID ${iconElement.dataset.id}`);
                                
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

    loadFloorPlan();
});
