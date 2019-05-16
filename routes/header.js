var express = require('express');
var router = express.Router();
const mmscdao = require('../api/mmscdao');
var logger = require('log4js').getLogger("header");

// 初始化Header.vue页面
router.post('/', function (req, res, next) {
    logger.info(`==================header页面====================`);
    let select_sql = "select count(*) as unread from tb_mmsc where username = ? and status = ?";
    let select_sql_params = [req.body.username, '未读'];
    mmscdao.simpleDao(select_sql, select_sql_params, function (rows) {
        logger.info(`======rows[0]========`)
        logger.info(rows[0]);
        res.send(rows[0]);
    });
});

module.exports = router;