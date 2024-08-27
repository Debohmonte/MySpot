const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        db.run('PRAGMA busy_timeout = 60000'); // 60 segundos de timeout
    }
});

const app = express();
const port = 3000;


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// HTML
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/login.html'));
});

app.get('/menuUsuario', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/menuUsuario.html'));
});

app.get('/menuAdm', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/menuAdm.html'));
});

// login
app.post('/login', (req, res) => {
    const { IdUsuario, password } = req.body;

    console.log('Datos recibidos:', { IdUsuario, password });

    const userId = parseInt(IdUsuario.trim(), 10);

    const query = 'SELECT * FROM Usuario WHERE IdUsuario = ?';
    db.get(query, [userId], (err, row) => {
        if (err) {
            console.error('Error en la consulta:', err.message);
            return res.status(500).send('Error interno del servidor');
        }

        console.log('Resultado de la consulta:', row);

        if (row) {
            if (row.Password === password) {
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
// Ruta para guardar el plano y los íconos 
app.post('/savePlan', (req, res) => {
    const { rutaArchivo, idPiso, tipo, icons } = req.body;

    if (!rutaArchivo || !idPiso || !tipo || !icons || icons.length === 0) {
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

        const insertIconQuery = 'INSERT INTO AsientoOficinaPlano (IdPlano, IdAsiento, IdOficina) VALUES (?, ?, ?)';
        const insertStmt = db.prepare(insertIconQuery);

        icons.forEach(icon => {
            if (tipo === 'Escritorio') {
                insertStmt.run([idPlano, icon.idAsiento, null], function (err) {
                    if (err) {
                        console.error('Error al insertar un ícono (escritorio):', err.message);
                    } else {
                        console.log('Ícono (escritorio) insertado:', { IdPlano: idPlano, IdAsiento: icon.idAsiento });
                    }
                });
            } else if (tipo === 'Oficina') {
                insertStmt.run([idPlano, null, icon.idOficina], function (err) {
                    if (err) {
                        console.error('Error al insertar un ícono (oficina):', err.message);
                    } else {
                        console.log('Ícono (oficina) insertado:', { IdPlano: idPlano, IdOficina: icon.idOficina });
                    }
                });
            }
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
///planos get
app.get('/getPlan', (req, res) => {
    const { piso, tipo } = req.query;

    const query = `SELECT * FROM Plano WHERE IdPiso = ? AND Tipo = ? ORDER BY IdPlano DESC LIMIT 1`; // Selecciona el último plano
    db.get(query, [piso, tipo], (err, row) => {
        if (err) {
            console.error('Error al obtener el plano:', err.message);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }

        if (row) {
            const planQuery = `SELECT * FROM AsientoOficinaPlano WHERE IdPlano = ?`;
            db.all(planQuery, [row.IdPlano], (err, icons) => {
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
                        texto: `Asiento ${icon.IdAsiento}` // Personaliza el texto si lo necesitas
                    }))
                });
            });
        } else {
            res.json({ success: false, message: 'Plano no encontrado' });
        }
    });
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});