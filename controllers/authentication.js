const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');


dotenv.config();


function isAuthenticated(req, res, next) {

    const token = req.session.token;

    if (!token) {
        return res.status(401).send('Access Denied: No Token Provided');
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (err) {
        return res.status(400).send('Invalid Token');
    }
}


function isAdmin(req, res, next) {
    const user = req.user;

    if (user && user.role === 'admin') {
        next(); 
    } else {
        res.status(403).send('Access Denied: You do not have admin privileges');
    }
}


function isUser(req, res, next) {
    const user = req.user;

    if (user && user.role === 'user') {
        next(); 
    } else {
        res.status(403).send('Access Denied: You do not have the correct privileges');
    }
}

module.exports = {
    isAuthenticated,
    isAdmin,
    isUser
};
