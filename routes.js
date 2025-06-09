
const express = require('express');
const router = express.Router();

const generateApiKeyController = require('./Controllers/GenerateApiKey')
const notifyUsersController = require('./Controllers/NotifyUsers')
const getServerHealthCheckController = require('./Controllers/ServerHealthCheck');
const { registerClient } = require('./Controllers/ServerSentEvent');





router.post('/GenerateApiKey', generateApiKeyController.GenerateApiKey); // UploadFile [ payload validation pending ]  - POSTMAN TESTING PENDING
router.post('/NotifyUsers', notifyUsersController.NotifyUsers); // UploadFile [ payload validation pending ]  - POSTMAN TESTING PENDING
router.get('/ServerHealthCheck', getServerHealthCheckController.ServerHealthCheck); // getServerHealthCheck[ payload validation pending ] - POSTMAN TESTING PENDING
// router.get('/events/:id', (req, res) => {
//     registerClient(req.params.id, res);
// });



module.exports = router;
