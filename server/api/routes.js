const express = require('express');
const controllers = require('./controllers');

const router = express.Router();

router.post('/data', controllers.addData);

module.exports = router;
