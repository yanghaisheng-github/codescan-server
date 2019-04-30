var express = require('express');
var router = express.Router();
var mysqldao = require('../api/mysqldao');
var multer = require('multer');
const custom = require('../api/custom');
const fs = require('fs');
const path = require('path');


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let saveDir = req.url.split('/')[1];
    console.log(`saveDir: ${saveDir}`);
    let savePath = `uploads/${req.params.language}/${req.body.SystemName}/${saveDir}`;
    if (!fs.existsSync(savePath)) {
      custom.mkdirSync(savePath, function () {
        console.log('目录创建成功');
        cb(null, savePath); // 保存的路径，备注：需要自己创建
      });
    }else{
      cb(null, savePath); // 保存的路径，备注：需要自己创建
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);    // 保存的文件名称
  }
})
var upload = multer({
  storage: storage
})

//上传源码 并将源码存放路径和开始扫描日期更新到保存到tb_sca_record表
router.post('/src/:language', upload.single('file'), function (req, res, next) {
  //console.log(req);
  console.log(req.body);
  console.log(req.file);
  //获取当前时间
  var currTime = custom.getCurrentTime();
  console.log(currTime);
  var update_sql = "update tb_sca_record set scan_start_time = ?, scan_src = ?, scan_src_name = ?  where system_name = ?";
  var update_sql_params = [currTime, req.file.path, req.file.originalname, req.body.SystemName];

  mysqldao.update_tb_sca_record(update_sql, update_sql_params, function (status) {
    if (status) {
      res.send({ "status": "true", "msg": "上传源码成功,即将开始扫描，扫描完成后再点击下载按钮" });
      console.log('------------解压缩--------------');
      custom.uncompress(req.file.path);
    }
  });
});

//上传excel格式分析报告
router.post('/analysisReport/:language', upload.single('file'), function (req, res, next) {
  console.log(req.body);
  console.log(req.file);
  //获取当前时间
  var currTime = custom.getCurrentTime();
  console.log(currTime);

  var update_sql = "update tb_sca_record set analysis_time = ?, analysis_report = ?, analysis_report_name = ? where system_name = ?";
  var update_sql_params = [currTime, req.file.path, req.file.originalname, req.body.SystemName];
  mysqldao.update_tb_sca_record(update_sql, update_sql_params, function (status) {
    if (status) {
      res.send({ "status": "true", "msg": "上传分析报告成功" });
    }
  });
});

//获取初始页面数据
router.post('/table/:language', function (req, res, next) {
  console.log(req.body);
  mysqldao.select_Scan_Data(req.body.username, req.params.language,function (rows) {
    res.send(rows);
  });
});

//删除源码或者代码分析报告
router.post('/:delty/delete', function (req, res, next) {
  console.log('---------------删除源码或者代码分析报告---------------------');
  console.log(req.body);
  if (req.body.url) {
    let filePath = req.body.url;
    let SystemName = filePath.split('\\')[2];
    let update_sql = '';
    console.log(req.params.delty);
    if (req.params.delty == 'src'){
      update_sql = "update tb_sca_record set  scan_src = '', scan_src_name = ''  where system_name = ?";
      let fileDir = path.join(filePath, "../");
      custom.removeDir(fileDir).then(function () {
        console.log(`删除${fileDir}成功`);
      });
    }
    if (req.params.delty == 'analysis'){
      update_sql = "update tb_sca_record set  analysis_report = '', analysis_report_name = ''  where system_name = ?";
      custom.deleteFile(filePath, function (delRes) {
          console.log(delRes.msg);
      });
    }
      
    var update_sql_params = [SystemName];
    console.log(update_sql);
    mysqldao.update_tb_sca_record(update_sql, update_sql_params, function (status) {
      if (status) {
        res.send({ "status": true, "msg": `存在该文件，已被删除` });
      }else{
        res.send({ "status": false, "msg": `删除失败，没找到该文件。可尝试新刷新页面。` });
      }
    });
  } else {
    res.send({ "status": false, "msg": `发现您操作频繁，请刷新页面后再删除` });
  }
});

//下载文件
router.post('/download', function (req, res, next) {
  console.log('---------------下载文件---------------------');
  console.log(req.body);
  //res.setHeader('Content-Type', 'application/vnd.ms-excel');
  /*   let filePath ='D:\\Projects\\Nodejs\\express-example\\' + req.body.url;
    console.log("FileInfo: " + filePath);
    res.sendFile(filePath, function (err) {
      if (err) {
        console.log("发送失败：" + err);
        next(err);
      } else {
        console.log('发送成功:'+req.body.url);
      }
    }); */
  console.log(`req.body.url: ${req.body.url}`);
  if (req.body.url) {
    res.download(req.body.url, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('发送成功');
      }
    });
  } else {
    console.log(`发送的报文中没有文件对应路径，发送失败`);
    res.send({ "status": false, "msg": `发现您操作频繁，请刷新页面后再下载` });
  }

});

module.exports = router;