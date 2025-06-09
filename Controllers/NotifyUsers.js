const moment = require('moment');
const { validationResult } = require('express-validator');
const { RedisClient, scanKeysByPattern } = require("../Middleware/redis");
const connectTosqliteDB = require('../Middleware/sqliteDB')

// const sendEmail = require('../Middleware/email');
// const logger = require('../Middleware/logger');

// Updated Date - 11/05/24  10:30 AM
/* Important Notes - */

// @Category      Notification
// @Description   Route is update user real time socket io
// @route         /NotifyUsers
// @method        GET
// @access        Private
// @API-Name      NotifyUsers



// Real time order update to customer using socket io 
async function NotifyUsers(req, res, next) {
    try {


        let result;
        const { data, whomToNotify } = req.body;
        // whomToNotify = [ 'customer' ,'kitchen','driver', 'customer-kitchen','customer-kitchen-driver', 'customer-driver','kitchen-driver']
        // console.log('----data 1', data)
        console.log('---- whomToNotify 1', whomToNotify)

        if (whomToNotify === 'customer') {
            const customerSocketId = req.clients.get('customer_frontend_app');
            const customerSocket = req.io.sockets.sockets.get(customerSocketId)

            if (customerSocket && customerSocket.connected) {
                // customerSocket.emit(data?.email, data)
                req.io.to('customer_room').emit(data?.email, data);

            } else {
                console.log("Socket not available or disconnected for Customer");
            }


        }



        if (whomToNotify === 'kitchen') {
            const kitchenSocketId = req.clients.get(`kitchen_frontend_app_${data?.kitchen_name}`);
            const kitchenSocket = req.io.sockets.sockets.get(kitchenSocketId)
            // const kitchenSocket = req.io.to('kitchen_room').emit(data?.kitchen_name, data);
            const kitchenSockets = await req.io.in('kitchen_room').fetchSockets();
            console.log(`👥 Sockets in kitchen_room: ${kitchenSockets.length}`);


            // // sqliteDB inset 
            // const DB = await connectTosqliteDB()
            // const result = await DB.run('INSERT INTO messages (content) VALUES (?)', JSON.stringify(data));

            // console.log('----result', result)

            // req.io.to('kitchen_room').emit(data?.kitchen_name, data, result.lastID);
            // console.log(`📦 Order sent: ${data.kitchen_name}`);







            //kitchenSocket && kitchenSocket.connected

            if (kitchenSocket && kitchenSocket.connected) {
                // const Respo = kitchenSocket.emit(data?.kitchen_name, data)
                req.io.to('kitchen_room').emit(data?.kitchen_name, data);
                console.log(`📦 Order sent: ${data.kitchen_name}`);
            } else {
                console.log('⚠️ Kitchen socket is not connected');

                // Storing Missied order in Redis
                await RedisClient.set(
                    `kitchen_frontend_app_${data?.kitchen_name}_${data?.order_no}`,
                    JSON.stringify(data)
                );


            }







        }


        try {
            if (whomToNotify === 'customer-driver') {

                const customerSocketId = req.clients.get('customer_frontend_app');
                const customerSocket = req.io.sockets.sockets.get(customerSocketId)
                if (customerSocket && customerSocket.connected) {
                    // customerSocket.emit(data?.email, data)
                    req.io.to('customer_room').emit(data?.email, data);

                } else {
                    console.log("Socket not available or disconnected for Customer");
                }


                const driverSocketId = req.clients.get('driver_frontend_app');

                // Which Driver to give we have to write logic here

                const driverSocket = req.io.sockets.sockets.get(driverSocketId);
                if (driverSocket) {
                    driverSocket.emit(data?.email, data)
                }

            }


            if (whomToNotify === 'customer-kitchen-driver') {

                // when driver operation === 'unpick order' we have to notify kitchen customer and search for new drivers
                const customerSocketId = req.clients.get('customer_frontend_app');
                const customerSocket = req.io.sockets.sockets.get(customerSocketId)
                if (customerSocket && customerSocket.connected) {
                    // customerSocket.emit(data?.email, data)
                    req.io.to('customer_room').emit(data?.email, data);

                } else {
                    console.log("Socket not available or disconnected for Customer");
                }



                const kitchenSocketId = req.clients.get('kitchen_frontend_app');
                const kitchenSocket = req.io.sockets.sockets.get(kitchenSocketId)
                if (kitchenSocket && kitchenSocket.connected) {
                    // const Respo = kitchenSocket.emit(data?.kitchen_name, data)
                    req.io.to('kitchen_room').emit(data?.kitchen_name, data);
                } else {
                    console.log("Socket not available or disconnected for kitchen");
                }





                const driverSocketId = req.clients.get('driver_frontend_app');

                // Which Driver to give we have to write logic here

                const driverSocket = req.io.sockets.sockets.get(driverSocketId);
                if (driverSocket) {
                    driverSocket.emit(data?.email, data)
                }

            }


            if (whomToNotify === 'customer-kitchen') {

                const customerSocketId = req.clients.get('customer_frontend_app');
                const customerSocket = req.io.sockets.sockets.get(customerSocketId)
                if (customerSocket && customerSocket.connected) {
                    // customerSocket.emit(data?.email, data)
                    req.io.to('customer_room').emit(data?.email, data);

                } else {
                    console.log("Socket not available or disconnected for Customer");
                }



                const kitchenSocketId = req.clients.get('kitchen_frontend_app');
                const kitchenSocket = req.io.sockets.sockets.get(kitchenSocketId)
                if (kitchenSocket && kitchenSocket.connected) {
                    // const Respo = kitchenSocket.emit(data?.kitchen_name, data)
                    req.io.to('kitchen_room').emit(data?.kitchen_name, data);
                } else {
                    console.log("Socket not available or disconnected for kitchen");
                }



            }




        } catch (e) {
            // to see if we need to return anything here
            console.log('----Error in NotifyUsers', e)
            return res.status(200).json({
                success: false,
                CustomMessage: "NotifyUsers - Notification server ERROR",
                ERROR: e.message
            });
        }
        res.status(200).json({
            success: true,
            CustomMessage: "NotifyUsers - Notification server"
        });
        next();
    } catch (error) {
        const Api_Name = 'NotifyUsers-API - Notification server';
        req.action = Api_Name;
        next(error, req, res);
    }
}

exports.NotifyUsers = NotifyUsers;
