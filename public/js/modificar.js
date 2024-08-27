// CARGA LA IMAGEN DESDE EL FILE
document.getElementById('floor-plan-upload').addEventListener('change', function (event) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.id = "floor-plan-image";
        const container = document.getElementById('floor-plan-container');
        container.innerHTML = '';
        container.appendChild(img);
    };
    reader.readAsDataURL(event.target.files[0]);
});

// CREA LOS ICONOS
let createIconMode = false;
let iconsData = []; // ARRAY DE ICONOS CREASDOS

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

        // QUE ESTEN LOSS ICOMOS POSICIONADOS
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

// RENOMBRA LOS ICONOS ? ES NECESARIO
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

//GUARDAR
document.getElementById('confirm-changes').addEventListener('click', function () {
    const rutaArchivo = document.getElementById('floor-plan-upload').value;
    const idPiso = document.getElementById('floor-select').value;
    const tipo = document.getElementById('type-select').value;

    // RUTA DE DB
    if (!rutaArchivo || !idPiso || !tipo || iconsData.length === 0) {
        alert('Faltan datos para completar la operación.');
        return;
    }

    console.log('Datos enviados:', {
        rutaArchivo: rutaArchivo,
        idPiso: idPiso,
        tipo: tipo,
        icons: iconsData
    });

    fetch('/savePlan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            rutaArchivo: rutaArchivo,
            idPiso: idPiso,
            tipo: tipo,
            icons: iconsData
        })
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
