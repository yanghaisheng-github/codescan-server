var express = require('express');
var router = express.Router();
const mmscdao = require('../api/mmscdao');
const custom = require('../api/custom');

// 初始化消息页面
router.post('/homepage', function (req, res, next) {
    let username = req.body.username;
    var select_sql = "select * from tb_mmsc where username = ?";
    var select_sql_params = [username];
    mmscdao.simpleDao(select_sql, select_sql_params, function(select_result){
        res.send(select_result);
    });
});

// 当用户将消息标为已读
router.post('/unreadchange/:num', function(req, res, next){
    let update_sql = '';
    let update_sql_params = '';
    let username = req.body.username;
    if(req.params.num == 'one'){
        let time = req.body.time;
        update_sql = "update tb_mmsc set status = '已读' where username = ? and time = ?";
        update_sql_params = [username, time];
    }else{
        update_sql = "update tb_mmsc set status = '已读' where username = ?";
        update_sql_params = [username];
    }
    mmscdao.simpleDao(update_sql, update_sql_params, function(update_result){
        res.send(`${update_result.affectedRows}`);
    });
});

//删除已读内容
router.post('/delete/:num', function(req, res, next){
    let delete_sql = '';
    let delete_sql_params = '';
    console.log(req.body);
    let username = req.body.username;
    if(req.params.num == 'one'){
        let time = req.body.time;
        delete_sql = "delete from tb_mmsc  where username = ? and time = ? and status = '已读'";
        delete_sql_params = [username, time];
    }else{
        delete_sql = "delete from tb_mmsc where username = ? and status = '已读'";
        delete_sql_params = [username];
    }
    mmscdao.simpleDao(delete_sql, delete_sql_params, function(delete_result){
        res.send(`${delete_result.affectedRows}`);
    });
});


module.exports = router;