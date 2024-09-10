const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();

dotenv.config();
const db = new sqlite3.Database('./database.db');

// GENERA  TOKEN
function generateToken(user) {
    return jwt.sign({ id: user.IdUsuario }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const methods = {
    // LOG IN 
    login: (req, res) => {
        const { IdUsuario, password } = req.body;
        const userId = parseInt(IdUsuario.trim(), 10);

        const query = 'SELECT * FROM Usuario WHERE IdUsuario = ?';
        db.get(query, [userId], (err, row) => {
            if (err) {
                console.error('Error querying database:', err.message);
                return res.status(500).send('Internal server error');
            }

            if (row) {
                // COMPARA CONTRASENAS
                bcrypt.compare(password, row.Password, (err, result) => {
                    if (result) {
                        const token = generateToken(row);
                        req.session.token = token;
                        res.redirect(row.IdGrupoUsuario === 1 ? '/menuAdm' : '/menuUsuario');
                    } else {
                        res.status(401).send('Invalid password');
                    }
                });
            } else {
                res.status(404).send('User not found');
            }
        });
    },
};

module.exports = { methods };
