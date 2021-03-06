var mysql = require('mysql');
var db = require('../config/db.config');
var logger = require('log4js').getLogger("mmscdao");

var connPool = mysql.createPool(db.mysql);
module.exports = {
    simpleDao: function (sql, sql_param, callback) {
        connPool.getConnection(function (err, conn) {
            conn.query(sql, sql_param, function (err, rows) {
                if (err) throw err;
                logger.info(rows);
                callback(rows);
            });
            conn.release();
        });
    },

    // 调用mysql存储过程
    call_procudure: function (sql_procedurce, sql_procedurce_params, returnRes) {
        connPool.getConnection(function (err, conn) {
            conn.query(sql_procedurce, sql_procedurce_params, function (err, rows) {
                if (err) throw err;
                logger.info(rows);
                returnRes(true);;
            });
            conn.release();
        });
    },
}