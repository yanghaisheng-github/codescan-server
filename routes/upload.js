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
    } else {
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
router.post('/srcupload/:language', upload.single('file'), function (req, res, next) {
  console.log('---------------上传源码或者代码分析报告---------------------');
  let taskparas = [];
  //console.log(req);
  console.log(`req.params.language: ${req.params.language}`);
  console.log(req.body);
  console.log(req.file);
  //获取当前时间
  var currTime = custom.getCurrentTime();
  console.log(currTime);
  /*   var update_sql = "update tb_sca_record set scan_start_time = ?, scan_src = ?, scan_src_name = ?  where system_name = ?";
    var update_sql_params = [currTime, req.file.path, req.file.originalname, req.body.SystemName];
  
    mysqldao.update_tb_sca_record(update_sql, update_sql_params, function (status) {
      if (status) {
        res.send({ "status": "true", "msg": "上传源码成功,即将开始扫描，扫描完成后再点击下载按钮" });
        console.log('------------解压缩并开始扫描--------------');
        custom.callScript(req.body.SystemName, req.file.path, req.params.language);
      }
    }); */

  let maintenance_msg = `"${req.body.SystemName}"已经成功上传源码，扫描成功后请及时下载扫描报告，并上传代码分析报告`;
  let code_checker_msg = `"${req.body.SystemName}"已经成功上传源码，扫描成功后请及时下载扫描报告，并上传代码分析报告`;
  let architect_msg = `"${req.body.SystemName}"已经成功上传源码，扫描成功后可查看扫描报告`;
  let sql_procedurce = `CALL mmsc_upload_file(?, ?, ?, ?, ?, ?, ?, ?)`;
  let sql_procedurce_params = [req.body.SystemName, 'src', req.file.path, req.file.originalname,
    maintenance_msg, code_checker_msg, architect_msg, currTime];
  mysqldao.call_procudure(sql_procedurce, sql_procedurce_params, function (status) {
    if (status) {
      res.send({ "status": "true", "msg": "上传源码成功,即将开始扫描，扫描完成后再点击下载按钮" });
      console.log('------------解压缩并开始扫描--------------');
      custom.callScript(req.body.SystemName, req.file.path, req.params.language);
    }
  });

});

/* //上传excel格式分析报告
router.post('/analysisReport/:language', upload.single('file'), function (req, res, next) {
  console.log(req.body);
  console.log(req.file);
  //获取当前时间
  var currTime = custom.getCurrentTime();
  console.log(currTime);
  let maintenance_msg = `"${req.body.SystemName}"已经成功上传分析报告`;
  let code_checker_msg = `"${req.body.SystemName}"已经成功上传分析报告`;
  let architect_msg = `"${req.body.SystemName}"已经成功上传分析报告，请及时审核`;
  let sql_procedurce = `CALL mmsc_upload_file(?, ?, ?, ?, ?, ?, ?, ?)`;
  let sql_procedurce_params = [req.body.SystemName, 'analysisReport', req.file.path, req.file.originalname,
    maintenance_msg, code_checker_msg, architect_msg, currTime];
  mysqldao.call_procudure(sql_procedurce, sql_procedurce_params, function (status) {
    if (status) {
      res.send({ "status": "true", "msg": "上传分析报告成功" });
    }
  });

}); */

//获取初始页面数据
router.post('/table/:language', function (req, res, next) {
  console.log(req.body);
  mysqldao.select_Scan_Data(req.body, req.params.language, function (rows) {
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
    if (req.params.delty == 'src') {
      update_sql = "update tb_sca_record set  scan_src = '', scan_src_name = ''  where system_name = ?";
      let fileDir = path.join(filePath, "../");
      custom.removeDir(fileDir).then(function () {
        console.log(`删除${fileDir}成功`);
      });
    }
    if (req.params.delty == 'analysis') {
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
      } else {
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

router.post('/downloadReport', function (req, res, next) {
  console.log('==============下载报告=====================');
  console.log(req.body.systemname);
  let download_url = path.join(__dirname, '../downloads/', req.body.systemname, `/${req.body.systemname}.pdf`);
  console.log(`download_url: ${download_url}`)

  res.download(download_url, function (err) {
    if (err) {
      console.log(err);
      console.log(`服务器发送失败`);
      //由于responseType: "arraybuffer"的作用导致返回的数据都是buffer类型，不是json，所以客户端无法通过res.data.*去获取对应的返回数据
      //res.send({ "status": false, "msg": `服务器发送失败` });
    } else {
      console.log('发送成功');
    }
  });
});

module.exports = router;