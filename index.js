const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const session = require('express-session');

const app = express();
const port = 3000;

// SESION
app.use(session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  
}));

// PARA IAMGENES
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
        db.run('PRAGMA busy_timeout = 60000');  // 60 segundos de timeout
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

//  LOGIN
app.post('/login', (req, res) => {
    const { IdUsuario, password } = req.body;

    const userId = parseInt(IdUsuario.trim(), 10);

    const query = `
        SELECT U.IdUsuario, U.DNI, U.Password, E.Nombre, E.Apellido, E.Direccion
        FROM Usuario U
        INNER JOIN Empleados E ON U.DNI = E.DNI
        WHERE U.IdUsuario = ? AND U.Password = ?
    `;

    db.get(query, [userId, password], (err, row) => {
        if (err) {
            console.error('Error en la consulta:', err.message);
            return res.status(500).send('Error interno del servidor');
        }

        if (row) {
            req.session.user = row; // Guardar toda la información del usuario en la sesión
            res.redirect('/menuUsuario');
        } else {
            res.status(401).send('Credenciales incorrectas');
        }
    });
});

// Ruta para obtener la información del usuario logueado desde la sesión
app.get('/getUserInfo', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ message: 'Usuario no logueado' });
    }
});

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error al cerrar sesión');
        }
        res.redirect('/login');
    });
});

// OBTENER PLANOS EN RESERVAS
app.get('/getPlan', (req, res) => {
    const { piso, tipo } = req.query;
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
                        estado: icon.IdEstado
                    }))
                });
            });
        } else {
            res.json({ success: false, message: 'Plano no encontrado' });
        }
    });
});

// GARDAR LOS PLANOS DE MODIFICACION
app.post('/savePlan', upload.single('planoImagen'), (req, res) => {
    const { idPiso, tipo, icons } = req.body;
    const rutaArchivo = `/uploads/${req.file.filename}`;
    const insertPlanQuery = 'INSERT INTO Plano (RutaArchivo, IdPiso, Tipo) VALUES (?, ?, ?)';

    db.run(insertPlanQuery, [rutaArchivo, idPiso, tipo], function (err) {
        if (err) {
            console.error('Error al guardar el plano:', err.message);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }

        const idPlano = this.lastID;
        const insertIconQuery = 'INSERT INTO Asiento1 (IdPlano, IdPiso, xPos, yPos, IdEstado) VALUES (?, ?, ?, ?, ?)';
        const insertStmt = db.prepare(insertIconQuery);

        JSON.parse(icons).forEach(icon => {
            insertStmt.run([idPlano, idPiso, icon.xPos, icon.yPos, 1]);
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

// RESERVA

app.post('/reserve', (req, res) => {
    const { floor, date, timeFrom, timeTo, idAsiento } = req.body;
    const idUsuario = req.session.userId;  //ID USUARIO


    if (!idUsuario || !floor || !date || !timeFrom || !timeTo || !idAsiento) {
        console.log('Datos incompletos:', { idUsuario, floor, date, timeFrom, timeTo, idAsiento });
        return res.status(400).json({ success: false, message: 'Datos incompletos para realizar la reserva.' });
    }

    console.log('Datos recibidos para la reserva:', { idUsuario, floor, date, timeFrom, timeTo, idAsiento });

    const checkAvailabilityQuery = 'SELECT IdEstado FROM Asiento1 WHERE IdAsiento = ? AND IdPiso = ?';

    db.get(checkAvailabilityQuery, [idAsiento, floor], (err, row) => {
        if (err) {
            console.error('Error al verificar disponibilidad:', err.message);
            return res.status(500).json({ success: false, message: 'Error al verificar disponibilidad.' });
        }

        if (row && row.IdEstado == 1) {  //DISPOPNIBLe
            const idEstado = 2;  // RESERVADO
            const insertReservationQuery = `
                INSERT INTO ReservaEscritorio (IdUsuario, Fecha, HoraInicio, HoraFinal, IdAsiento, IdPiso, IdEstado)
                VALUES (?, ?, ?, ?, ?, ?, ?)`;

            db.run(insertReservationQuery, [idUsuario, date, timeFrom, timeTo, idAsiento, floor, idEstado], function (err) {
                if (err) {
                    console.error('Error al guardar la reserva:', err.message);
                    return res.status(500).json({ success: false, message: 'Error al guardar la reserva.' });
                }

                console.log('Reserva insertada correctamente con ID:', this.lastID);

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
            console.log(`El asiento no está disponible o no existe. Estado actual: ${row ? row.IdEstado : 'desconocido'}`);
            return res.status(400).json({ success: false, message: 'El asiento no está disponible.' });
        }
    });
});

// CHECK IN INDEPENDIENTE SE OFICINA O ESCRITORIO
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

    db.run(query, [idReserva], function (err) {
        if (err) {
            console.error('Error al realizar el check-in:', err.message);
            return res.status(500).json({ success: false, message: 'Error al realizar el check-in.' });
        }

        res.json({ success: true });
    });
});

// DAA LAS RESERVAS PARA EL CHECK IN 
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

        res.json({ success: true, reservas: rows });
    });
});



// Iniciar el servidor
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
