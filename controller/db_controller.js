const { Pool } = require('pg')
global.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})

const executeQuery = function (query) {
    return new Promise((resolve, reject) => {
        try {
            global.pool.connect()
                .then(client => {
                    return client.query(query)
                        .then(result => {
                            client.release()
                            resolve(result)
                        })
                        .catch(err => {
                            client.release()
                            reject(err)
                        })
                })
                .catch(err => {
                    reject(err)
                })
        } catch (err) {
            reject(err)
        }
    })
}

module.exports = { executeQuery };
