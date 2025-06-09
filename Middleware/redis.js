

const redis = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis);




// const HerokuRedisUrl = {
//   url: 'redis://:pda8535ef51adae1daee565f1a2f07f7065fce6d8003b3dbfe740013b7f0d5b6f@ec2-54-87-101-8.compute-1.amazonaws.com:28979'
// }




const RedisURL = process.env.NODE_ENV === "production" ? process.env.HOSTED_REDIS_URL : process.env.REDIS_URL


// console.log('-----😀Redis url ', RedisURL)

const RedisClient = redis.createClient(RedisURL)
RedisClient.on('connect', function () {
    console.log('Redis connected..');
});




const scanKeysByPattern = (pattern, callback) => {
    let cursor = '0';
    let allKeys = [];

    function scanNext() {
        RedisClient.scan(cursor, 'MATCH', pattern, 'COUNT', '100', (err, res) => {
            if (err) return callback(err);

            cursor = res[0];
            const keys = res[1];

            allKeys.push(...keys);

            if (cursor === '0') {
                callback(null, allKeys);
            } else {
                scanNext();
            }
        });
    }


    scanNext();
}







module.exports = { RedisClient, scanKeysByPattern };

