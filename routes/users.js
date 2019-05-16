var express = require('express');
const jwt = require('jsonwebtoken');  //用来生成token
var mysqldao = require('../api/mysqldao');
var router = express.Router();
var logger = require('log4js').getLogger("users");

var secretkey = '123123';

var loginSuccess = {
  'code': 200,
  'msg': '登录成功'
};

var loginFailed = {
  'code': 500,
  'msg': '用户名和密码验证失败，请重新输入'
};

/* GET users listing. */
router.post('/', function (req, res, next) {
  //mysqldao.queryAll();
  mysqldao.verifyUser(req.body.username, req.body.password, function (verifyResult) {
    if (verifyResult.status) {
      logger.info('用户验证成功')
      // 验证成功
      let content = { username: req.body.username }; //生成token的主题信息
      let token = jwt.sign(content, secretkey, {
        expiresIn: 60 * 60 * 1       //1h过期
      });
      loginSuccess.token = token;
      loginSuccess.role = verifyResult.role,
        res.send(JSON.stringify(loginSuccess));
    } else {
      // 验证失败
      logger.info('用户验证失败')
      res.send(JSON.stringify(loginFailed));
    }
  });
  //logger.info(varifyResult);  //异步导致返回值为undefined
});

//读取tb_users所有信息
router.get('/', function (req, res, next) {
  var sql = "select username,department,usertype,authority from tb_users";
  var sql_params = [];
  mysqldao.selectData(sql, sql_params, function (result) {
    res.send(result);
  });
});

//添加用户
router.post('/add', function (req, res, next) {
  mysqldao.addUsersData(req.body, function (result) {
    res.send(result);
  })
});

//编辑用户
router.post('/edit', function (req, res, next) {
  mysqldao.updateUsersData(req.body, function (result) {
    res.send(result);
  })
});

//删除用户
router.post('/delete', function (req, res, next) {
  mysqldao.deleteUsersData(req.body, function (result) {
    res.send(result);
  })
});

//修改用户密码
router.post('/modifyPw', function (req, res, next) {
  //console.log("req.body:" + req.body);
  mysqldao.modifyUsersPw(req.body, function (result) {
    res.send(result);
  })
});

module.exports = router;
