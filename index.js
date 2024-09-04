const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const session = require('express-session');  // Añadir esto

const app = express();
const port = 3000;

// Configuración de la sesión
app.use(session({
    secret: 'mysecretkey',  // Cambia esto por una clave secreta real
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Debe ser 'true' si usas HTTPS
}));



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const db = new sqlite3.Database('./database.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        db.run('PRAGMA busy_timeout = 60000'); // 60 segundos de timeout
    }
});



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

//  HTML
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/login.html'));
});

app.get('/menuUsuario', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/menuUsuario.html'));
});

app.get('/menuAdm', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/menuAdm.html'));
});

// LOGIN
app.post('/login', (req, res) => {
    const { IdUsuario, password } = req.body;

    const userId = parseInt(IdUsuario.trim(), 10);

    const query = 'SELECT * FROM Usuario WHERE IdUsuario = ?';
    db.get(query, [userId], (err, row) => {
        if (err) {
            console.error('Error en la consulta:', err.message);
            return res.status(500).send('Error interno del servidor');
        }

        if (row) {
            if (row.Password === password) {
                // Guardar el userId en la sesión del servidor
                req.session.userId = userId;
                console.log('User ID guardado en la sesión:', req.session.userId);  /
                
                if (row.IdGrupoUsuario === 1) {
                    return res.redirect('/menuAdm');
                } else if (row.IdGrupoUsuario === 2) {
                    return res.redirect('/menuUsuario');
                } else {
                    return res.status(400).send('Grupo de usuario no reconocido');
                }
            } else {
                return res.status(401).send('Contraseña incorrecta');
            }
        } else {
            return res.status(404).send('Usuario no encontrado');
        }
    });
});

// PLANOS GET
app.get('/getPlan', (req, res) => {
    const { piso, tipo } = req.query;
    console.log(`Recibido: Piso - ${piso}, Tipo - ${tipo}`);
    

    const query = `SELECT * FROM Plano WHERE IdPiso = ? AND Tipo = ? ORDER BY IdPlano DESC LIMIT 1`;
    db.get(query, [piso, tipo], (err, row) => {
        if (err) {
            console.error('Error al obtener el plano:', err.message);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }

        if (row) {
            const planQuery = `SELECT * FROM Asiento1 WHERE IdPlano = ? AND IdPiso = ?`;
            db.all(planQuery, [row.IdPlano, piso], (err, icons) => {
                if (err) {
                    console.error('Error al obtener los íconos del plano:', err.message);
                    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
                }

                res.json({
                    success: true,
                    planImage: row.RutaArchivo,
                    icons: icons.map(icon => ({
                        xPos: icon.xPos,
                        yPos: icon.yPos,
                        idAsiento: icon.IdAsiento,
                        texto: `Asiento ${icon.IdAsiento}`,
                        estado: icon.IdEstado // Añadimos el estado
                    }))
                });
            });
        } else {
            res.json({ success: false, message: 'Plano no encontrado' });
        }
    });
})

// SAVE PALNOS
app.post('/savePlan', upload.single('planoImagen'), (req, res) => {
    const { idPiso, tipo, icons } = req.body;
    const rutaArchivo = `/uploads/${req.file.filename}`;

    console.log('Datos recibidos en /savePlan:', { rutaArchivo, idPiso, tipo, icons });

    if (!rutaArchivo || !idPiso || !tipo || !icons || JSON.parse(icons).length === 0) {
        console.error('Datos incompletos:', { rutaArchivo, idPiso, tipo, icons });
        return res.status(400).json({ success: false, message: 'Datos incompletos.' });
    }

    
    const insertPlanQuery = 'INSERT INTO Plano (RutaArchivo, IdPiso, Tipo) VALUES (?, ?, ?)';
    db.run(insertPlanQuery, [rutaArchivo, idPiso, tipo], function (err) {
        if (err) {
            console.error('Error al guardar el plano:', err.message);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }

        const idPlano = this.lastID;

        if (!idPlano) {
            console.error('No se pudo obtener el ID del plano insertado.');
            return res.status(500).json({ success: false, message: 'Error al obtener el ID del plano.' });
        }

        console.log('Plano guardado con ID:', idPlano);

        //(asientos u oficinas)
        const insertIconQuery = 'INSERT INTO Asiento1 (IdPlano, IdPiso, xPos, yPos, IdEstado) VALUES (?, ?, ?, ?, ?)';
        const insertStmt = db.prepare(insertIconQuery);

        JSON.parse(icons).forEach(icon => {
            insertStmt.run([idPlano, idPiso, icon.xPos, icon.yPos, 1], function (err) {
                if (err) {
                    console.error('Error al insertar un ícono:', err.message);
                } else {
                    console.log('Ícono insertado:', { IdPlano: idPlano });
                }
            });
        });

        insertStmt.finalize(err => {
            if (err) {
                console.error('Error al finalizar la inserción de íconos:', err.message);
                return res.status(500).json({ success: false, message: 'Error al guardar los íconos del plano' });
            }
            res.json({ success: true });
        });
    });
});
//reservsa
app.post('/reserve', (req, res) => {
    const { idUsuario, floor, date, timeFrom, timeTo, idAsiento } = req.body;
    console.log('Datos recibidos para la reserva:', { idUsuario, floor, date, timeFrom, timeTo, idAsiento });

    if (!idUsuario || !floor || !date || !timeFrom || !timeTo || !idAsiento) {
        return res.status(400).json({ success: false, message: 'Datos incompletos para realizar la reserva.' });
    }

    const checkAvailabilityQuery = 'SELECT IdEstado FROM Asiento1 WHERE IdAsiento = ? AND IdPiso = ?';

    db.get(checkAvailabilityQuery, [idAsiento, floor], (err, row) => {
        if (err) {
            console.error('Error al verificar disponibilidad:', err.message);
            return res.status(500).json({ success: false, message: 'Error al verificar disponibilidad.' });
        }

        if (row && row.IdEstado == 1) {  // Estado disponible
            console.log('Asiento disponible. Procediendo con la reserva...');

            const idEstado = 2;  // Estado reservado
            const insertReservationQuery = `
                INSERT INTO ReservaEscritorio (IdUsuario, Fecha, HoraInicio, HoraFinal, IdAsiento, IdPiso, IdEstado)
                VALUES (?, ?, ?, ?, ?, ?, ?)`;

            db.run(insertReservationQuery, [idUsuario, date, timeFrom, timeTo, idAsiento, floor, idEstado], function (err) {
                if (err) {
                    console.error('Error al guardar la reserva:', err.message);
                    return res.status(500).json({ success: false, message: 'Error al guardar la reserva.' });
                }

                console.log('Reserva insertada correctamente.');

                const updateSeatStatusQuery = 'UPDATE Asiento1 SET IdEstado = ? WHERE IdAsiento = ? AND IdPiso = ?';
                db.run(updateSeatStatusQuery, [idEstado, idAsiento, floor], (err) => {
                    if (err) {
                        console.error('Error al actualizar el estado del asiento en Asiento1:', err.message);
                        return res.status(500).json({ success: false, message: 'Error al actualizar el estado del asiento en Asiento1.' });
                    }
                    console.log('Estado del asiento actualizado a reservado en Asiento1.');
                    res.json({ success: true, message: 'Reserva realizada con éxito.' });
                });
            });
        } else {
            if (row) {
                console.log(`El asiento no está disponible. Estado actual: ${row.IdEstado}`);
            } else {
                console.log('El asiento no existe en la base de datos.');
            }
            res.status(400).json({ success: false, message: 'El asiento no está disponible.' });
        }
    });
});

app.post('/cancelReservation', (req, res) => {
    const { reserva, dia, horario } = req.body;

  
    const query = `
        DELETE FROM ReservaEscritorio
        WHERE IdAsiento = (SELECT IdAsiento FROM Asiento WHERE nombre = ?)
        AND Fecha = ?
        AND HoraInicio = ?
    `;

   
  

    db.run(query, [asiento.trim(), dia, horario.split(' ')[0]], function(err) {
        if (err) {
            console.error('Error al cancelar la reserva:', err.message);
            return res.status(500).json({ success: false, message: 'Error al cancelar la reserva.' });
        }

        res.json({ success: true });
    });
});

app.post('/checkIn', (req, res) => {
    const { idReserva, tipoReserva } = req.body;

    let query = '';
    if (tipoReserva === 'Escritorio') {
        query = `
            UPDATE ReservaEscritorio
            SET HoraCheckIn = time('now', 'localtime')
            WHERE IdReservaEscritorio = ?
        `;
    } else if (tipoReserva === 'Oficina') {
        query = `
            UPDATE ReservaOficina
            SET HoraCheckIn = time('now', 'localtime')
            WHERE IdReservaOficina = ?
        `;
    } else {
        return res.status(400).json({ success: false, message: 'Tipo de reserva no válido.' });
    }

    db.run(query, [idReserva], function(err) {
        if (err) {
            console.error('Error al realizar el check-in:', err.message);
            return res.status(500).json({ success: false, message: 'Error al realizar el check-in.' });
        }

        res.json({ success: true });
    });
});


app.get('/getReservas', (req, res) => {
    const userId = req.query.userId;

    const query = `
        SELECT 
            'Escritorio' AS Tipo, 
            R.IdReservaEscritorio AS IdReserva,  
            'Asiento ' || A.IdAsiento || ' P' || R.IdPiso AS Reserva,
            R.Fecha, 
            R.HoraInicio, 
            R.HoraFinal,
            R.HoraCheckIn
        FROM 
            ReservaEscritorio R 
            INNER JOIN Asiento A ON R.IdAsiento = A.IdAsiento
        WHERE 
            R.IdUsuario = ?
        UNION ALL
        SELECT 
            'Oficina' AS Tipo, 
            RO.IdReservaOficina AS IdReserva,  
            'Oficina ' || O.IdOficina || ' P' || RO.IdPiso AS Reserva,
            RO.Fecha, 
            RO.HoraInicio, 
            RO.HoraFinal,
            RO.HoraCheckIn
        FROM 
            ReservaOficina RO 
            INNER JOIN Oficina O ON RO.IdOficina = O.IdOficina
        WHERE 
            RO.IdUsuario = ?
        ORDER BY Fecha, HoraInicio;
    `;

    db.all(query, [userId, userId], (err, rows) => {
        if (err) {
            console.error('Error al obtener las reservas:', err.message);
            return res.status(500).json({ success: false, message: 'Error al obtener las reservas.' });
        }

        if (rows.length > 0) {
            console.log('Reservas encontradas:', rows); // Depuración: ver las filas obtenidas
            res.json({ success: true, reservas: rows });
        } else {
            console.log('No se encontraron reservas para el usuario:', userId);
            res.json({ success: true, reservas: [] }); // Asegura que devuelva una respuesta vacía en lugar de nada
        }
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
