var express = require('express');
var xlsx = require('node-xlsx');
var router = express.Router();
const mmscdao = require('../api/mmscdao');
var formidable = require("formidable");
var custom = require('../api/custom');
const fs = require('fs');

//从Excel中读取时间，实际上拿到的整数值是日期距离1900年1月1日的天数，这时需要写一个函数转换：
//参数：numb是excel转换出来的整数值，format是年月日之间分隔符号。
function formatDate(numb, format) {
    let time = new Date((numb - 1) * 24 * 3600000 + 1)
    time.setYear(time.getFullYear() - 70)
    let year = time.getFullYear() + ''
    let month = time.getMonth() + 1 + ''
    let date = time.getDate() + ''
    if (format && format.length === 1) {
        return year + format + month + format + date
    }
    return year + (month < 10 ? '0' + month : month) + (date < 10 ? '0' + date : date)
}

// 初始化Header.vue页面
router.post('/', function (req, res, next) {
    console.log(`==================tabAnalysisReport页面====================`);
    console.log(req.body);
    //获取项目对应的上传的代码分析报告路径
    let select_sql = "select system_name_id, category, level, count, conditions, repairtime, explains, example, mark from tb_codeanalysis where system_name = ?";
    let select_sql_params = [req.body.systemName];
    mmscdao.simpleDao(select_sql, select_sql_params, function (rows) {
        console.log(rows);
        res.send(rows);
    });

});

router.post('/simpleInputUpdate', function (req, res, next) {
    console.log(`==================tabAnalysisReport页面更新代码安全缺陷类别至计划修复时间5个简单值====================`);
    console.log(req.body);
    let updateRow = req.body;
    //获取项目对应的上传的代码分析报告路径
    let update_sql = '';
    let update_sql_params = '';
    if (updateRow.type === 'update') {
        update_sql = "update tb_codeanalysis set category = ?,  level = ?, count = ?, conditions = ?, repairtime = ? where system_name = ? and system_name_id = ?";
        update_sql_params = [updateRow.category, updateRow.level, updateRow.count, updateRow.conditions, updateRow.repairtime, updateRow.system_name, updateRow.system_name_id];
    } else {
        update_sql = "insert into tb_codeanalysis(system_name_id, system_name, category, level, count, conditions, repairtime) values(?, ?, ?, ?, ?, ?, ?)";
        update_sql_params = [updateRow.system_name_id, updateRow.system_name, updateRow.category.trim(), updateRow.level, updateRow.count, updateRow.conditions, updateRow.repairtime];
    }

    mmscdao.simpleDao(update_sql, update_sql_params, function (rows) {
        console.log(rows.affectedRows);
        res.send({ status: rows.affectedRows, msg: "数据更新成功" });
    });
});

//读取富文本html
router.post('/rtfHtml', function (req, res, next) {
    console.log(`==================返回tabAnalysisReport页面富文本====================`);
    console.log(req.body);
    let selectRow = req.body;
    let select_sql = `select ${selectRow.whichRtf} from tb_codeanalysis where system_name = ? and system_name_id = ?`;
    let select_sql_params = [selectRow.system_name, selectRow.system_name_id];

    mmscdao.simpleDao(select_sql, select_sql_params, function (rows) {
        res.send(rows);
        console.log(rows);
        console.log('返回数据成功');
    });
});

//将富文本html插入到数据库中
router.post('/rtfupload', function (req, res, next) {
    console.log(`==================上传tabAnalysisReport页面富文本====================`);
    console.log(req.body);
    let updateRow = req.body;

    console.log(updateRow.system_name)
    console.log(updateRow.system_name_id)
    let update_sql = `update tb_codeanalysis set ${updateRow.whichRtf}= ? where system_name = ? and system_name_id = ?`;
    let update_sql_params = [updateRow.htmlContent, updateRow.system_name, updateRow.system_name_id];

    mmscdao.simpleDao(update_sql, update_sql_params, function (rows) {
        res.send({status: rows.affectedRows, msg: "数据更新成功" });
    });
});

function resfileAbsPath(req, res, uploadDir){
    var form = new formidable.IncomingForm();
    form.uploadDir = uploadDir; //上传文件的保存路径
    form.keepExtensions = true; //保存扩展名

    form.parse(req, function (err, fields, files) {
       // console.log('fields', fields);//表单传递的input数据  
        console.log('files', files);//上传文件数据

        // froala-wysiwyg图片上传后需要返回{"link": "图片的绝对地址"}, 同时需要设置该目录资源为静态资源
        let absPath = files.file.path.substring(4).replace(/\\/g, '\/');
        console.log(`http://localhost:3000/${absPath}`);
        let fileLink = {"link": `http://localhost:3000/${absPath}` };
        res.send(fileLink);
    });
}

// 上传富文本中图片类型数据
router.post('/RTF/:systemName/:type', function (req, res, next) {
    console.log(`==================tabAnalysisReport页面富文本图片====================`);
    let uploadDir = `RTF/${req.params.systemName}/${req.params.type}`;
    if (!fs.existsSync(uploadDir)) {
        custom.mkdirSync(uploadDir, function () {
            console.log('富文本文件存放目录创建成功');
            resfileAbsPath(req, res, uploadDir);
        });
    }else{
        resfileAbsPath(req, res, uploadDir);
    }
});

module.exports = router;