const express = require('express');
const router = express.Router();
const compilerController = require('../controllers/compiler.controller');

// Execute code in supported languages
router.post('/run', compilerController.runCode);

// Convert code between programming languages
router.post('/convert-code', compilerController.convertCode);

module.exports = router;
