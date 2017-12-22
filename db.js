// var mysql = require('mysql');

// var db = mysql.createConnection({
//     host: "REDACTED",
//     port: "REDACTED",
//     user: "REDACTED",
//     password: "REDACTED"
// });

var db = require('knex')({
    client: 'mysql',
    connection: {
        host: "REDACTED",
        port: "REDACTED",
        user: "REDACTED",
        password: "REDACTED",
        database : 'db_project'
    }
});

// db.connect();

module.exports = db;