const mongoose = require('mongoose');



// Implemnet better response 
// https://www.geeksforgeeks.org/node-js-process-uptime-method/
//https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html

// @Category      Kitchen
// @Description   Server health check
// @route         /ServerHealthCheck
// @method        POST
// @access        Public
// @API-Name      Server Health check

async function ServerHealthCheck(req, res, next) {

    //console.log('-----process.env ', process.env.ENV_FILE_SERVERD)
    // console.log('------Mongoose', mongoose.connections)
    // console.log('------Mongoose', mongoose.connections[0].readyState)
    // console.log('------Mongoose', mongoose.connections[1].readyState)


    try {
        const data = {
            uptime: process.uptime(),
            message: 'Server is Up and Ok',
            date: new Date(),
            Env_File_Served: process.env.ENV_FILE_SERVERD,
            // [mongoose.connections[0].name]: mongoose.STATES[mongoose.connections[0].readyState],
            // [mongoose.connections[1].name]: mongoose.STATES[mongoose.connections[1].readyState]

        }
        const {
            rss,
            heapTotal,
            heapUsed,
            external,
            arrayBuffers,
        } = process.memoryUsage();

        const memoryUsage = {
            rss: rss / 1000000,
            heapTotal: heapTotal / 1000000,
            heapUsed: heapUsed / 1000000,
            external: external / 1000000,
            arrayBuffers: arrayBuffers / 1000000,
        };

        // console.log('memoryUsages', memoryUsage);
        return res.status(200).json({
            success: true,
            data: data,
            memoryUsage,
            message: 'live ( heroku) notification server health check',
            whichEnvAreWePicking: process.env.NODE_ENV || null,
            UrlPicked_CustomerFrontEnd: process.env.CUSTOMER_FRONTEND_DOMAIN_URL || null,
            UrlPicked_KitchenFrontEnd: process.env.KITCHEN_FRONTEND_DOMAIN_URL || null,
            UrlPicked_DriverFrontEnd: process.env.DRIVER_FRONTEND_DOMAIN_URL || null,
        });
    } catch (error) {
        const Api_Name = 'Server health check';
        req['action'] = Api_Name;
        next(error, req, res);
    }
}

exports.ServerHealthCheck = ServerHealthCheck;