let express = require('express');
let db = require('../db');

let router = express.Router();

router.get('/schema', function(req, res, next) {
    let sql = db.raw("SELECT * \n" +
        "FROM information_schema.columns \n" +
        "WHERE table_schema = 'db_project';")
    sql.timeout(5000, {cancel: true})
        .then(collection => {
            let schema = {};
            for (let i in collection[0]) {
                let row = collection[0][i];
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
    let queryDict = req.body;
    let attrs = queryDict["attributes"];
    let conds = queryDict["conditions"];
    let aggrs = queryDict["aggregations"];
    let selects = [], froms = [], wheres = [], aggregations = [], groupBys = [];

    let simpleAttrToName = attr => {
        if (attr.alias) return (attr.alias);
        else {
            if (attr.from === 'STRING') {
                return ("\"" + attr.name + "\"");
            } else if (attr.from === 'NUMBER') return (attr.name);
            else {
                let prefix = attr.from;
                if (attr.tableAlias) prefix = attr.tableAlias;
                return (prefix + "." + attr.name);
            }
        }
    };

    for (let i in aggrs) {
        let attr = aggrs[i].attr;
        let groupBy = aggrs[i].groupBy;
        let func = aggrs[i].func;
        aggregations.push({
            func: func,
            attr: attr
        });
        let groupByStr = simpleAttrToName(groupBy);
        if (groupBys.indexOf(groupByStr) === -1) groupBys.push(groupByStr);
    }

    for (let i in attrs) {
        let attr = attrs[i].name;
        let fullAttr = attr;
        let from = attrs[i].from;
        if (from === 'STRING') {
            fullAttr = "\"" + fullAttr + "\"";
        }

        if (from !== 'NUMBER' && from !== 'STRING') {
            let prefix = from;
            if (attrs[i].tableAlias) {
                prefix = attrs[i].tableAlias;
                froms.push(from + " AS " + attrs[i].tableAlias);
            }
            else {
                if (froms.indexOf(from) === -1) froms.push(from);
            }
            fullAttr = prefix + "." + fullAttr;
        }
        if (attrs[i].alias) {
            fullAttr = fullAttr + " AS " + attrs[i].alias;
        }
        selects.push(fullAttr);
    }

    for (let i in conds) {
        let cond = [];
        let attr1 = conds[i].attr1;
        cond.push(simpleAttrToName(attr1));
        cond.push(conds[i].operator);
        let attr2 = conds[i].attr2;
        cond.push(simpleAttrToName(attr2));
        wheres.push(cond);
    }

    let sqlStr = "";
    if (selects.length > 0) {
        sqlStr += "SELECT ";
        for (let i in selects) {
            if (i != 0) sqlStr += ', ';
            sqlStr += selects[i];
        }
    }
    if (aggregations.length > 0) {
        if (selects.length > 0) sqlStr += ', ';
        for (let i in aggregations) {
            if (i != 0) sqlStr += ', ';
            sqlStr += aggregations[i].func + '(' + simpleAttrToName(aggregations[i].attr) + ')';
        }
    }
    if (froms.length > 0) {
        sqlStr += "\nFROM ";
        for (let i in froms) {
            if (i != 0) sqlStr += ', ';
            sqlStr += froms[i];
        }
    }
    if (wheres.length > 0) {
        sqlStr += "\nWHERE ";
        for (let i in wheres) {
            if (i != 0) sqlStr += ' AND ';
            sqlStr += wheres[i][0] + " " + wheres[i][1] + " " + wheres[i][2];
        }
    }
    if (groupBys.length > 0) {
        sqlStr += "\nGROUP BY ";
        for (let i in groupBys) {
            if (i != 0) sqlStr += ', ';
            sqlStr += groupBys[i];
        }
    }
    sqlStr += "\nLIMIT 100;";
    console.log(sqlStr);
    let sql = db.raw(sqlStr);
    sql.timeout(10000, {cancel: true})
        .then(collection => {
            res.send({"result" : collection});
    }).catch(err => {
            res.send({"error" : "Query failed with error " + err});
    })
});

module.exports = router;
