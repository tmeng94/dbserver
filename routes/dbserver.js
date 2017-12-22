var express = require('express');
var db = require('../db');

var router = express.Router();

router.get('/schema', function(req, res, next) {
    var sql = db.select('*').from('information_schema.columns')
        .where({
            table_schema: 'db_project'
        });
    sql.timeout(5000, {cancel: true})
        .then(collection => {
            var schema = {};
            for (var i in collection) {
                var row = collection[i];
                if (Object.keys(schema).includes(row["TABLE_NAME"])) {
                    schema[row["TABLE_NAME"]].push(row["COLUMN_NAME"]);
                } else {
                    schema[row["TABLE_NAME"]] = [row["COLUMN_NAME"]];
                }
            }
            res.send({"result" : schema});
    }).catch(err => {
            res.send({"error" : "Get schema failed with " + err});
    })
});

router.post('/query', function(req, res, next) {
    console.log(req.body);
    var queryDict = req.body;
    var sql = db.select('*').from('Game').limit(100);
    sql.timeout(5000, {cancel: true})
        .then(collection => {
            res.send({"result" : collection});
    }).catch(err => {
            res.send({"error" : "Query failed."});
    })

    // var sql = 'select * from Game limit 100';
    // db.query(sql, function (err, result) {
    //     if (err) throw err;
    //     res.send({"result" : result});
    // });
});

module.exports = router;
