const crypto = require('crypto');

// Updated Date - 11/05/24  10:30 AM
// @Category      Notification
// @Description   This route will make address as default address
// @route         /GenerateApiKey
// @method        GET
// @access        Private
// @API-Name      GenerateApiKey

async function GenerateApiKey(req, res, next) {
    try {
        const apiKey = crypto.randomBytes(32).toString('hex');;
        res.status(200).json({ success: true, apiKey, CustomMessage: "GenerateApiKey - Notification server" });
        next();
    } catch (error) {
        const Api_Name = 'GenerateApiKey-API - Notification server';
        req.action = Api_Name;
        next(error, req, res);
    }
}

exports.GenerateApiKey = GenerateApiKey;
