const path = require('path');
const fs = require('fs');
const { exec, execFile } = require('child_process');
const iconv = require('iconv-lite');
const mmscdao = require('./mmscdao');
var logger = require('log4js').getLogger("custom");

/**
 * 扩展Date的Format函数
 * 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
 * @param {[type]} fmt [description]
 */
Date.prototype.Format = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

//var getCurrentTime = () => (new Date()).Format("yyyy-MM-dd hh:mm:ss");

//异步创建文件夹
function mkdirSync(dir, cb) {
    let paths = dir.split('/');
    let index = 1;
    function next(index) {
        //递归结束判断
        if (index > paths.length) return cb();
        let newPath = paths.slice(0, index).join('/');
        fs.access(newPath, function (err) {
            if (err) {//如果文件不存在，就创建这个文件
                fs.mkdir(newPath, function (err) {
                    next(index + 1);
                });
            } else {
                //如果这个文件已经存在，就进入下一个循环
                next(index + 1);
            }
        })
    }
    next(index);
}

//异步删除文件夹
function removeDir(dir) {
    return new Promise(function (resolve, reject) {
        //先读文件夹
        fs.stat(dir, function (err, stat) {
            if (stat.isDirectory()) {
                fs.readdir(dir, function (err, files) {
                    files = files.map(file => path.join(dir, file)); // a/b  a/m
                    files = files.map(file => removeDir(file)); //这时候变成了promise
                    Promise.all(files).then(function () {
                        fs.rmdir(dir, resolve);
                    })
                })
            } else {
                fs.unlink(dir, resolve)
            }
        })
    })
}

//删除文件
function deleteFile(fileUrl, callback) {
    if (fs.existsSync(fileUrl)) {
        fs.unlinkSync(fileUrl);
        logger.info(`存在该文件${fileUrl}，已被删除`);
        callback({ "status": true, "msg": `存在该文件，已被删除` });
    } else {
        logger.info(`没找到该文件${fileUrl}`);
        callback({ "status": false, "msg": `删除失败，没找到该文件。可尝试新刷新页面。` });
    }
}

//使用7-zip解压缩，所以电脑上需要安装7-zip，并配置环境变量
//相关命令参考https://www.jianshu.com/p/4f9be6b47161
//指定目录-o${scanDir} 无空格
function callScript(systemname, compressedFile, languange) {
    //压缩文件绝对路径
    var compressedAbsFile = path.join(__dirname, '../', compressedFile);
    //扫描目录
    var scanDir = path.join(compressedAbsFile, "../");
    //扫描结果保存目录
    var outputDir = path.join(__dirname, '../downloads/', systemname);
    //自定义扫描模板cib_low_whitelist等的路径
    var moderDir = path.join(__dirname, "../config/");
    /*     var cmdStr = `7z x ${compressedAbsFile} -o${scanDir} -y`;
       logger.info(cmdStr);
        exec(cmdStr, { encoding: 'binary' }, function (err, stdout, stderr) {
            if (err) {
                stderr = iconv.decode(stderr, 'gbk');
               logger.info(`解压出错：${stderr}`);
            } else {
                stdout = iconv.decode(stdout, 'gbk');
               logger.info(`解压成功：${stdout}`);
                //开始扫描
            }
        }); */
    let batScript = "scanJava.bat";
    if (languange == "JS") {
        batScript = "scanJS.bat";
    } else if (languange == "C") {
        batScript = "scanC.bat"
    }

    let batScriptPath = path.join(__dirname, batScript);

    execFile(batScriptPath, [systemname, compressedAbsFile, scanDir, outputDir, moderDir], function (err, stdout, stderr) {
        if (err) {
            logger.info(err);
            return;
        } else {
            // 将扫描结果路径和时间更新到数据库中
            var currTime = (new Date()).Format("yyyy-MM-dd hh:mm:ss");
            /*             var updatesql = "update tb_sca_record set scan_end_time = ? , scan_report = ? where system_name = ?";
                        var updatesql_params = [currTime, `${outputDir}\\${systemname}.pdf`, systemname];
                       logger.info("===================");
                       logger.info(currTime);
                       logger.info(updatesql);
                       logger.info(updatesql_params);
                        mmscdao.simpleDao(updatesql, updatesql_params, function(rows){
                            if(rows.affectedRows == 1){
                               logger.info("已经成功将扫描结果路径和时间更新到数据库中");
                            }
                        }); */

            let maintenance_msg = `"${systemname}"已完成扫描，请及时下载扫描报告，并上传代码分析报告`;
            let code_checker_msg = `"${systemname}"已完成扫描，请及时下载扫描报告，并上传代码分析报告`;
            let architect_msg = `"${systemname}"已完成扫描，可查看扫描报告`;
            let sql_procedurce = `CALL mmsc_upload_file(?, ?, ?, ?, ?, ?, ?, ?)`;
            let filePath = path.join(outputDir, `${systemname}.pdf`);
            let sql_procedurce_params = [systemname, 'scanFinsh', filePath, `${systemname}.pdf`,
                maintenance_msg, code_checker_msg, architect_msg, currTime];
            logger.info(`========${outputDir}\\${systemname}.pdf==========`);
            mmscdao.call_procudure(sql_procedurce, sql_procedurce_params, function (status) {
                if (status) {
                    logger.info(`"${systemname}"已完成扫描`);
                }
            });
            //console.log(`stdout: ${stdout}`);
        }
    });
}

module.exports = {
    getCurrentTime: () => (new Date()).Format("yyyy-MM-dd hh:mm:ss"),
    mkdirSync,
    removeDir,
    deleteFile,
    callScript,
}