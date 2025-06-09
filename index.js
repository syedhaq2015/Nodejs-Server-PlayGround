const { app, server, express } = require('./Server/server');
const config = require('./env-config.js');
// const bodyParser = require('body-parser');
// const busboy = require('connect-busboy');
const { RedisClient, scanKeysByPattern } = require("./Middleware/redis");
const missedOrders = require("./missedOrders.js"); // 🟢 Shared order buffer
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const chalk = require('chalk');
const connected = chalk.bold.yellowBright;
const colorProcessId = chalk.hex('#FF893A');
const socketIoColor = chalk.hex('#FF893A');
const warningColor = chalk.hex('#FF6138');
const connectionPing = chalk.hex('#acfa70')
const logger = require('./Middleware/logger');
const error = chalk.bold.redBright;

const db = require('./Middleware/db');
const db2 = require('./Middleware/db2')
const { io } = require('./SocketIo/socketIo');

const errorHandler = require('./Middleware/error')
const Routes = require('./routes'); // All api URLS NEW file structure

const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const connectTosqliteDB = require('./Middleware/sqliteDB.js')



// require('./cron-jobs'); // We have to test this feature for cron job auto renew

/* Before Live - we will use below corsOption when we go production,we will allow our hosting domain,APIs will only work for our routes

// const corsOptions = {
//   origin: ['http://localhost:3009'], // use this array when going production
//   // origin: '*',
//   optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
// };
// app.use(cors(corsOptions)); // cors is for cross origin resources for issue with front end backend ports
*/

app.use(cors()); // cors is for cross origin resources for issue with front end backend ports
app.use(mongoSanitize()); // Sanitize data
app.use(helmet());// Security headers


app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    express.json()(req, res, (err) => {
        if (err) {
            // console.error(err);
            logger.error(`400 || ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
            return res.sendStatus(400); // Bad request
        }
        logger.info(`${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
        next();
    });
});

app.use(morgan('tiny'));
app.use(cookieParser());
app.use(compression()); // // asset compression for zipping files
app.use(express.json());

app.set('trust proxy', 1);


// Before going live capture disconnect event and capture in newrelic or monitoring tool,so you know when cient go down
const clients = new Map();
io.on("connection", async (socket) => {
    const clientType = socket.handshake.query.type;
    const clientTypeName = socket.handshake.query.KitchenName;
    const allowedFrontEndClients = ['customer_frontend_app', 'kitchen_frontend_app', 'driver_frontend_app'];



    if (allowedFrontEndClients.includes(clientType)) {


        if (clientType === 'kitchen_frontend_app') {
            socket.join('kitchen_room');

            // sent data to missed orders when they are connected ,redis or queuing when user connect you sent data and flush that from redis
            // const KitchenOrderData = await RedisClient.getAsync(`kitchen_frontend_app_${clientTypeName}`)
            // const KitchenOrderDataArray = KitchenOrderData ? JSON.parse(KitchenOrderData) : []
            // console.log('---redis data', KitchenOrderData)

            if (!socket.recovered) {
                // if the connection state recovery was not successful

                console.log('----SOCKET MISSED ROW - 1')
                try {
                    await connectTosqliteDB().each('SELECT id, content FROM messages WHERE id > ?',
                        [socket.handshake.auth.serverOffset || 0],
                        (_err, row) => {
                            console.log('----SOCKET MISSED ROW', row)
                            socket.emit(clientTypeName, JSON.parse(row.content), row.id);
                        }
                    )
                } catch (e) {
                    // something went wrong
                }
            }


        } else if (clientType === 'customer_frontend_app') {
            socket.join('customer_room');

        } else if (clientType === 'driver_frontend_app') {
            socket.join('driver_room');
        }


        console.log(socketIoColor(`Client connected: ${clientTypeName} ${socket.id} [${clientType}]`));

        if (clientType) {
            clients.set(`${clientType}_${clientTypeName}`, socket.id);
        }

        // Client sending ping message to check connection ,server will reply pong
        socket.on("ping", async () => {
            console.log(connectionPing(`Received ping from client [${clientType}_${clientTypeName}] , `));
            socket.emit(`pong-${clientTypeName}`, { data: 'ikram' }); // Reply to ping



            // const KitchenOrderData = await RedisClient.getAsync(`kitchen_frontend_app_${clientTypeName}`)
            // const KitchenOrderDataArray = KitchenOrderData ? JSON.parse(KitchenOrderData) : []




            // KitchenOrderDataArray.forEach((order) => {
            //     socket.emit(clientTypeName, order); // Reply to ping
            // })



            // scanKeysByPattern(`kitchen_frontend_app_${clientTypeName}:*`, (err, keys) => {
            //     if (err) {
            //         console.error('Scan error:', err);
            //     } else {
            //         console.log('Found keys:', keys);

            //         keys.forEach(async (key) => {
            //             const KitchenOrderData = await RedisClient.getAsync(key)
            //             socket.emit(clientTypeName, KitchenOrderData); // Reply to ping

            //             await RedisClient.del(key);
            //         })

            //     }
            // });




            RedisClient.keys(`kitchen_frontend_app_${clientTypeName}*`, (err, keys) => {
                if (err) {
                    console.error('Error fetching keys:', err);
                } else {
                    console.log('Found keys:', keys);

                    keys.forEach(async (key) => {
                        const KitchenOrderData = await RedisClient.getAsync(key)
                        console.log('---KitchenOrderData', KitchenOrderData)
                        //socket.emit(clientTypeName, KitchenOrderData); // Reply to ping


                        // io.to('kitchen_room').emit(clientTypeName, KitchenOrderData);
                        const RespoFromUi = socket.emit(`pong-${clientTypeName}`, KitchenOrderData); // Reply to ping

                        if (RespoFromUi) {
                            await RedisClient.del(key);
                        }


                    })

                }
            });



        });

        // Before going live capture disconnect event and capture in newrelic or monitoring tool,so you know when cient go down
        socket.on("disconnect", () => {
            clients.forEach((id, key) => {
                if (id === socket.id) {
                    clients.delete(key);
                    console.log(warningColor(`Client disconnected: ${socket.id} [${key}] [${clientType}_${clientTypeName}]`));

                }
            });
        });
    } else {
        // Before going live capture disconnect event and capture in newrelic or monitoring tool,so you know when cient go down
        console.log(`Client type not allowed: ${clientType}`);
        socket.disconnect();
    }
});




app.use(express.json());

// api key validation
app.use((req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === process.env.X_API_KEY || req.path === '/GenerateApiKey' || req.path.includes('/events')) {
        next();
    } else {
        res.status(200).json({ success: false, CustomMessage: 'Unauthorized' });
    }
});



app.use((req, res, next) => {
    req.io = io;
    req.clients = clients;
    return next()
});  // We are getting socket IO as middleware in ( meal order , payasyougo order ,order update)







app.use('/', Routes); // New Path for route
app.use(errorHandler); // Error Handler DB2 Connected





server.listen(process.env.PORT || process.env.PORT_NUMBER, () => {
    console.log(chalk.yellowBright(`
    ENV file : ${process.env.ENV_FILE_SERVERD}
    APP NAME : ${process.env.APP_NAME}
    App listening on PORT : ${process.env.PORT || process.env.PORT_NUMBER}
    HOST : ${process.env.HOST}
    DB1 : ${process.env.NOTES_JUST_TO_INFORM}
    DB2 : ${process.env.NOTES_JUST_TO_INFORM_2}
    Redis url 😀 : ${process.env.NODE_ENV === "production" ? process.env.HOSTED_REDIS_URL : process.env.REDIS_URL}
    `))

    // logger.info(`Server started and running on http://${process.env.HOST}:${config.PORT}
    // `)
})

const closeConnections = async (msg) => {
    try {
        if (db.readyState === 1) { // 1 means connected
            console.log('First Mongo DB is active');
            await db.getClient().close();
            console.log(error(`First Mongo DB disconnected through app termination (${msg})`));
        } else {
            console.log('First Mongo DB is already disconnected.');
        }

        if (db.readyState === 1) { // 1 means connected
            console.log('Second Mongo DB is active');
            await db2.getClient().close();
            console.log(error(`Second Mongo DB disconnected through app termination (${msg})`));
        } else {
            console.log('Second Mongo DB is already disconnected.');
        }
    } catch (e) {
        console.log('error >> ', e);
        process.exit(1);
    }
};

process.on('SIGINT', async () => {
    console.log('SIGINT received');
    await closeConnections('SIGINT');
    // Close the HTTP server gracefully
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0); // Exit after server is closed
    });
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM received');
    await closeConnections('SIGTERM');
});

module.exports = app;