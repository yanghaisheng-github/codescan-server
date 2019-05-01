var mysql = require('mysql');
var db = require('../config/db.config');
var custom = require('./custom');
var async = require('async');

var connPool = mysql.createPool(db.mysql);
module.exports = {
    simpleDao: function (sql, sql_param, callback) {
        connPool.getConnection(function (err, conn) {
            conn.query(sql, sql_param, function (err, rows) {
                if (err) throw err;
                console.log(rows);
                callback(rows);
            });
            conn.release();
        });
    },
}