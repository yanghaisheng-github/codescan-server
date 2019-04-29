var express = require('express');
var router = express.Router();
var mysqldao = require('../api/mysqldao');
var multer = require('multer');
const custom = require('../api/custom');


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `uploads/java/${req.body.SystemName}/${req.url}`); // 保存的路径，备注：需要自己创建
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);    // 保存的文件名称
  }
})
var upload = multer({
  storage: storage
})

//上传源码 并将源码存放路径和开始扫描日期更新到保存到tb_sca_record表
router.post('/src', upload.single('file'), function (req, res, next) {
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
router.post('/analysisReport', upload.single('file'), function (req, res, next) {
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
router.post('/table', function (req, res, next) {
  console.log(req.body);
  mysqldao.select_Java_Scan_Data(req.body.username, function (rows) {
    res.send(rows);
  });
});

//移除单个上传的文件
router.post('/:delty/delete', function (req, res, next) {
  console.log('---------------移除单个src上传的文件---------------------');
  console.log(req.body);
  if (req.body.url) {
    let filePath = req.body.url;
    let SystemName = filePath.split('\\')[2];
    let update_sql = '';
    console.log(req.params.delty);
    if (req.params.delty == 'src')
      update_sql = "update tb_sca_record set  scan_src = '', scan_src_name = ''  where system_name = ?";
    if (req.params.delty == 'analysis')
      update_sql = "update tb_sca_record set  analysis_report = '', analysis_report_name = ''  where system_name = ?";
    var update_sql_params = [SystemName];
    console.log(update_sql);
    mysqldao.update_tb_sca_record(update_sql, update_sql_params, function (status) {
      if (status) {
        custom.deleteFile(filePath, function (delRes) {
          res.send(delRes);
        });
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