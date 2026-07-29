"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
exports.errorHandler = errorHandler;
exports.corsMiddleware = corsMiddleware;
exports.authMiddleware = authMiddleware;
const logger_1 = require("./logger");
function requestLogger(req, res, next) {
    logger_1.logger.info({
        method: req.method,
        path: req.path,
        query: req.query,
    });
    next();
}
function errorHandler(err, req, res, next) {
    logger_1.logger.error(err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({ success: false, error: message, code: err.code });
}
function corsMiddleware(req, res, next) {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
}
async function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    // TODO: validate token with auth service or JWT
    req.userId = null; // placeholder
    next();
}
