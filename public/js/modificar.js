// CARGA LA IMAGEN DESDE EL FILE
document.getElementById('floor-plan-upload').addEventListener('change', function (event) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.id = "floor-plan-image";
        const container = document.getElementById('floor-plan-container');
        container.innerHTML = '';  // Limpia el contenedor antes de agregar la nueva imagen
        container.appendChild(img);
    };
    reader.readAsDataURL(event.target.files[0]);
});

// CREA LOS ICONOS
let createIconMode = false;
let iconsData = []; // ARRAY DE ICONOS CREADOS

document.getElementById('create-button').addEventListener('click', function () {
    createIconMode = !createIconMode;
    this.textContent = createIconMode ? 'Modo Crear Activado' : 'Crear Icono de Espacio';
});

// LOS CLICK PARA CREAR ASIENTOS
document.getElementById('floor-plan-container').addEventListener('click', function (event) {
    if (createIconMode) {
        const container = event.currentTarget;
        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const floor = document.getElementById('floor-select').value;
        const type = document.getElementById('type-select').value;

        // REMOVER ÍCONOS SI YA EXISTEN EN LA MISMA POSICIÓN
        const existingIcon = document.elementFromPoint(event.clientX, event.clientY);
        if (existingIcon && existingIcon.classList.contains('icon')) {
            container.removeChild(existingIcon);
            iconsData = iconsData.filter(icon => icon.xPos !== existingIcon.dataset.xPos || icon.yPos !== existingIcon.dataset.yPos);
            renumberIcons(container);
        } else {
            const icon = document.createElement('div');
            icon.className = 'icon';
            icon.style.left = (x - 15) + 'px';
            icon.style.top = (y - 15) + 'px';
            icon.setAttribute('data-floor', floor);
            icon.setAttribute('data-type', type);
            icon.setAttribute('data-xPos', x);
            icon.setAttribute('data-yPos', y);
            icon.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)}-${floor}`;
            container.appendChild(icon);

            iconsData.push({
                idAsiento: type === 'Escritorio' ? generateId() : null,
                idOficina: type === 'Oficina' ? generateId() : null,
                piso: floor,
                tipo: type,
                xPos: x,
                yPos: y
            });

            renumberIcons(container);
        }
    }
});

// RENOMBRA LOS ICONOS
function renumberIcons(container) {
    const icons = container.querySelectorAll('.icon');
    icons.forEach((icon, index) => {
        icon.textContent = `${icon.getAttribute('data-type').charAt(0).toUpperCase() + icon.getAttribute('data-type').slice(1)}-${icon.getAttribute('data-floor')} (${index + 1})`;
    });
}

// GENERA LAS ID DE LOS ICONOS
function generateId() {
    return Math.floor(Math.random() * 1000000);
}

// GUARDAR
document.getElementById('confirm-changes').addEventListener('click', function () {
    const formData = new FormData();
    const fileInput = document.getElementById('floor-plan-upload');
    const idPiso = document.getElementById('floor-select').value;
    const tipo = document.getElementById('type-select').value;

    formData.append('planoImagen', fileInput.files[0]); // Subir la imagen
    formData.append('idPiso', idPiso);
    formData.append('tipo', tipo);
    formData.append('icons', JSON.stringify(iconsData)); // Enviar los íconos en formato JSON

    fetch('/savePlan', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Cambios confirmados.');
        } else {
            alert('Error al guardar los cambios.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al confirmar los cambios.');
    });
});
