var express = require('express');
var router = express.Router();
var mysqldao = require('../api/mysqldao');
const fs = require('fs');
const custom = require('../api/custom');



//添加数据到系统清单表tb_sca_system
router.post('/add', function (req, res, next) {
  // 创建uploads/java/${req.body.SystemName}/src、/analysisReport、/scanResult文件夹
/*   var srcPath = `uploads/java/${req.body.SystemName}/src`;
  var scanResultPath = `uploads/java/${req.body.SystemName}/scanResult`;
  var analysisPath = `uploads/java/${req.body.SystemName}/analysisReport`;
  if (!fs.existsSync(srcPath)) {
    custom.mkdirSync(srcPath, function () {
      console.log('源码目录创建成功')
    });
  }
  if (!fs.existsSync(scanResultPath)) {
    custom.mkdirSync(scanResultPath, function () {
      console.log('扫描报告目录创建成功')
    });
  }
  if (!fs.existsSync(analysisPath)) {
    custom.mkdirSync(analysisPath, function () {
      console.log('分析报告目录创建成功')
    });
  } */

  // 创建扫描结果下载目录
  var scanResultPath = `downloads/${req.body.SystemName}`;
  if (!fs.existsSync(scanResultPath)) {
    custom.mkdirSync(scanResultPath, function () {
      console.log('系统扫描结果目录创建成功')
    });
  }

  //console.log(req.body);
  mysqldao.addSystemData(req.body, function (addResult) {
    res.send(addResult);
  });
});

//更新数据到系统清单表tb_sca_system
router.post('/edit', function (req, res, next) {
  //console.log(req.body);
  mysqldao.updateSystemData(req.body, function (insertResult) {
    res.send(insertResult);
  });
});

//读取系统清单表tb_sca_system
router.get('/', function (req, res, next) {
  mysqldao.selectSystemData(function (rows) {
    res.send(rows);
  });
});

//删除系统清单表tb_sca_system某一行
router.post('/delete', function (req, res, next) {
  console.log(req.body);
  let del_list_name = req.body;
  del_list_name.forEach(element => {
    // 删除uploads/${req.body.Language}/${req.body.SystemName}文件夹
    let dirSysName = `uploads/${element.Language}/${element.SystemName}`;
    if (fs.existsSync(dirSysName)) {
      custom.removeDir(dirSysName).then(function () {
        console.log(`删除uploads/${element.Language}/${element.SystemName}成功`);
      })
    }
  });

  mysqldao.deleteSystemData(del_list_name, function (deleteResult) {
    res.send(deleteResult);
  });
});

module.exports = router;
