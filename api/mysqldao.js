var mysql = require('mysql');
var db = require('../config/db.config');
var custom = require('./custom');
var async = require('async');
var logger = require('log4js').getLogger("mysqldao");

var connPool = mysql.createPool(db.mysql);
module.exports = {
    //just a test
    queryAll: function () {
        var sql = 'select * from tb_users where id = ? ';
        var sql_param = 1;
        connPool.getConnection(function (err, conn) {
            conn.query(sql, [sql_param], function (err, rows) {
                if (err) throw err;
               logger.info(rows[0]);
               logger.info(rows[1]);
               logger.info(rows[0].username);
            });
            conn.release();
        });
    },
    //读表
    selectData: function (select_sql, select_sql_params, callback) {
        connPool.getConnection(function (err, conn) {
            conn.query(select_sql, select_sql_params, function (err, rows) {
                if (err) throw err;
               logger.info(rows);
                callback(rows);
            });
            conn.release();
        });
    },
    // 从数据库对比登录用户信息
    verifyUser: function (username, password, callback) {
       logger.info("username: " + username + "   password: " + password);
        var sql = "select * from tb_users where username= ?";
        //var sql_param = username;

        connPool.getConnection(function (err, conn) {
            conn.query(sql, [username], function (err, rows) {
                if (err) throw err;
                if (rows[0] != undefined) {
                    if (rows[0].password == password) {
                        callback({ 'status': true, 'role': rows[0].authority });
                    } else {
                        callback({ 'status': false });
                    }
                } else {
                    callback({ 'status': false });
                }
            });
            conn.release();
        });
    },

    //通过事务判断数据是否已存在，然后添加数据到系统清单表tb_users，并返回操作时间
    addUsersData: function (data, returnRes) {
       logger.info(data);

        var select_sql = "select username from tb_users where username = ?";
        var select_sql_params = [data.username];

        var add_sql = "insert into tb_users(username, department, usertype, authority) values(?, ?, ?, ?)";
        var add_sql_params = [data.username, data.department, data.usertype, data.authority];
       logger.info("-------开始执行事务--------");
        connPool.getConnection(function (err, conn) {
            conn.beginTransaction(function (err) {
                if (err) throw err;
            });
            var task1 = function (callback) {
               logger.info('=========开始执行task1==========');
                conn.query(select_sql, select_sql_params, function (errI, rows) {
                   logger.info(rows);
                    if (errI) returnRes({ "status": "false", "msg": "数据库判断该用户名称是否已存在时发生异常" });
                    if (rows.length != 0) {
                        returnRes({ "status": "false", "msg": "数据库已存在相同用户名称" });
                        conn.release();
                        return;
                    }
                   logger.info("----task1执行结果----")
                    callback(null, rows);
                });
            };

            var task2 = function (callback) {
               logger.info('=========开始执行task2==========');
                conn.query(add_sql, add_sql_params, function (errI, rows) {
                    if (errI) returnRes({ "status": "false", "msg": "数据库插入该用户名称时发生异常" });
                    //console.log(rows);
                    returnRes({ "status": "success", "msg": "用户添加成功" });
                   logger.info("----task2执行结果----")
                    callback(null, rows);
                });
            };

            async.series([task1, task2], function (err, result) {
                if (err) {
                   logger.info(err);
                    //回滚
                    connection.rollback(function () {
                       logger.info('出现错误,回滚!');
                        //释放资源
                        connection.release();
                    });
                    return;
                }
                //提交
                conn.commit(function (err) {
                    if (err) throw err;
                   logger.info(result);
                    conn.release();
                });

            });
        });
    },

    //更新用户表tb_users
    updateUsersData: function (data, callback) {
        var edit_sql = "update tb_users set department = ?, usertype = ?, authority = ? where username = ? ";
        var edit_sql_params = [data.department, data.usertype, data.authority, data.username];
        connPool.getConnection(function (err, conn) {
            if (err) throw err;
            conn.query(edit_sql, edit_sql_params, function (errI, rows) {
                if (errI) callback({ "status": "false", "msg": "数据库更新用户信息时发生异常" });
                callback({ "status": "true", "msg": "数据库更新用户信息成功" });
               logger.info("----更新数据成功-----");
            });
            conn.release();
        });
    },

    //通过事务先判断原密码是否正确，然后修改用户密码
    modifyUsersPw: function (data, returnRes) {

       logger.info("data.username: " + data.username);
        var validate_pw_sql = "select password from tb_users where username = ?";
        var validate_pw_sql_params = [data.username];

        var update_pw_sql = "update tb_users set password = ? where username = ? ";
        var update_pw_sql_params = [data.pw, data.username];

       logger.info("-------开始执行事务--------")
        connPool.getConnection(function (err, conn) {
            conn.beginTransaction(function (err) {
                if (err) throw err;
            });
            var task1 = function (callback) {
               logger.info('=========开始执行task1==========');
                conn.query(validate_pw_sql, validate_pw_sql_params, function (errI, rows) {
                   logger.info("数据库密码：" + rows[0].password);
                   logger.info("data.oldPw: " + data.oldPw);
                    if (errI) returnRes({ "status": "false", "msg": "数据库获取改用户密码时发生异常" });
                    if (rows.length != 0) {
                        if (rows[0].password != data.oldPw) {
                            returnRes({ "status": "false", "msg": "原密码验证不正确，请重新输入" });
                            conn.release();
                            return;
                        }
                    }
                   logger.info("----task1执行结果----")
                    callback(null, rows);
                });
            };

            var task2 = function (callback) {
               logger.info('=========开始执行task2==========');
                conn.query(update_pw_sql, update_pw_sql_params, function (errI, rows) {
                    if (errI) returnRes({ "status": "false", "msg": "数据库更新用户密码时发生异常" });
                    //console.log(rows);
                    returnRes({ "status": "success", "msg": "数据库更新用户密码成功" });
                   logger.info("----task2执行结果----")
                    callback(null, rows);
                });
            };

            async.series([task1, task2], function (err, result) {
                if (err) {
                   logger.info(err);
                    //回滚
                    connection.rollback(function () {
                       logger.info('出现错误,回滚!');
                        //释放资源
                        connection.release();
                    });
                    return;
                }
                //提交
                conn.commit(function (err) {
                    if (err) throw err;
                   logger.info(result);
                    conn.release();
                });

            });
        });
    },

    //删除用户表中的信息
    deleteUsersData: function (data, callback) {
        var delete_sql = "";
        var delete_sql_params = [];
        if (data.username) {
           logger.info('---1--');
            delete_sql = "delete from tb_users where username = ? ";
            delete_sql_params = [data.username];
        }
        if (data.multiUsers.length != 0) {
           logger.info('---data.multiUsers--' + data.multiUsers);
            delete_sql = "delete from tb_users where username in (";
            data.multiUsers.forEach(function (v, i, a) {
                delete_sql += "?,";
            });
            delete_sql = delete_sql.substr(0, delete_sql.length - 1);
            delete_sql += ")";

            delete_sql_params = data.multiUsers;
        }
       logger.info(delete_sql);
       logger.info(delete_sql_params);
        if (delete_sql != "") {
            connPool.getConnection(function (err, conn) {
                if (err) throw err;
                conn.query(delete_sql, delete_sql_params, function (errI, rows) {
                    if (errI) callback({ "status": "false", "msg": "数据库删除用户信息时发生异常" });
                    callback({ "status": "true", "msg": "数据库删除用户成功" });
                   logger.info("----删除tb_users数据成功-----");
                });
                conn.release();
            });
        }
    },

    //读取系统清单表tb_sca_system
    selectSystemData: function (callback) {
        var sql = "select system_name as SystemName, department as Department, security_level as SecurityLevel, maintenance as Maintenance, code_checker as CodeChecker, architect as Architect, language as Language, edit_time as date, remark as Remark from tb_sca_system";

        connPool.getConnection(function (err, conn) {
            conn.query(sql, function (err, rows) {
                if (err) throw err;
               logger.info(rows);
                callback(rows);
            });
            conn.release();
        });
    },

    //通过事务判断数据是否已存在，然后添加数据到系统清单表tb_sca_system，并返回操作时间
    //再次添加维护联系人，代码检测人员、安全架构师用户
    /*     addSystemData: function (data, returnRes) {
            //获取当前时间
            var currTime = custom.getCurrentTime();
           logger.info(currTime);
    
            var select_sql = "select system_name from tb_sca_system where system_name = ?";
            var select_sql_params = [data.SystemName];
    
            var add_tb_sca_system_sql = "insert into tb_sca_system(system_name, department, security_level, maintenance, code_checker, architect, language, edit_time, remark)"
                + " values(?, ?, ?, ?, ?, ?, ?, ?, ?)";
            var add_tb_sca_system_sql_params = [data.SystemName, data.Department, data.SecurityLevel, data.Maintenance, data.CodeChecker, data.Architect, data.Language, currTime, data.Remark];
    
           logger.info("-------开始执行事务--------")
            connPool.getConnection(function (err, conn) {
                conn.beginTransaction(function (err) {
                    if (err) throw err;
                });
                var task1 = function (callback) {
                   logger.info('=========开始执行task1==========');
                    conn.query(select_sql, select_sql_params, function (errI, rows) {
                       logger.info(rows);
                        if (errI) returnRes({ "status": "false", "msg": "数据库判断该系统名称是否已存在时发生异常" });
                        if (rows.length != 0) {
                            returnRes({ "status": "false", "msg": "数据库已存在相同系统名称" });
                            conn.release();
                            return;
                        }
                       logger.info("----task1执行结果----")
                        callback(null, rows);
                    });
                };
    
                var task2 = function (callback) {
                   logger.info('=========开始执行task2==========');
                    conn.query(add_tb_sca_system_sql, add_tb_sca_system_sql_params, function (errI, rows) {
                        if (errI) returnRes({ "status": "false", "msg": "数据库插入该系统名称时发生异常" });
                        //console.log(rows);
                        returnRes({ "status": "success", "msg": currTime });
                       logger.info("----task2执行结果----")
                        callback(null, rows);
                    });
                };
    
                var task3 = function (callback) {
                   logger.info('=========开始执行task3==========');
                    conn.query(add_tb_mmsc_Maintenance_sql, add_tb_mmsc_sql_Maintenance_params, function (errI, rows) {
                        if (errI) returnRes({ "status": "false", "msg": "数据库给Maintenance插入mmsc表时发生异常" });
                        //console.log(rows);
                        returnRes({ "status": "success", "msg": currTime });
                       logger.info("----task3执行结果----")
                        callback(null, rows);
                    });
                };
                var task4 = function (callback) {
                   logger.info('=========开始执行task4==========');
                    conn.query(add_tb_mmsc_CodeChecker_sql, add_tb_mmsc_sql_CodeChecker_params, function (errI, rows) {
                        if (errI) returnRes({ "status": "false", "msg": "数据库给CodeChecker插入mmsc表时发生异常" });
                        //console.log(rows);
                        returnRes({ "status": "success", "msg": currTime });
                       logger.info("----task4执行结果----")
                        callback(null, rows);
                    });
                };
                
                async.series([task1, task2, task3, task4], function (err, result) {
                    if (err) {
                       logger.info(err);
                        //回滚
                        connection.rollback(function () {
                           logger.info('出现错误,回滚!');
                            //释放资源
                            connection.release();
                        });
                        return;
                    }
                    //提交
                    conn.commit(function (err) {
                        if (err) throw err;
                       logger.info(result);
                        conn.release();
                    });
    
                });
            });
        }, */

    //通过事务判断系统名称数据是否已存在，然后添加数据到系统清单表tb_sca_system，并返回操作时间
    //然后再添加到表tb_sca_record
    addSystemData: function (data, returnRes) {
        //获取当前时间
        var currTime = custom.getCurrentTime();
       logger.info(currTime);
       logger.info(data);

        var select_sql = "select system_name from tb_sca_system where system_name = ?";
        var select_sql_params = [data.SystemName];

        var add_tb_sca_system_sql = "insert into tb_sca_system(system_name, department, security_level, maintenance, code_checker, architect, language, edit_time, remark)"
            + " values(?, ?, ?, ?, ?, ?, ?, ?, ?)";
        var add_tb_sca_system_sql_params = [data.SystemName, data.Department, data.SecurityLevel, data.Maintenance, data.CodeChecker, data.Architect, data.Language, currTime, data.Remark];

        var add_tb_sca_record_sql = "insert into tb_sca_record(system_name) values(?)";
        var add_tb_sca_record_sql_params = [data.SystemName];

        var add_tb_mmsc_Maintenance_sql = 'insert into tb_mmsc(username, msg, status, time) values(?, ?, "未读", ?)';
        var add_tb_mmsc_sql_Maintenance_params = [data.Maintenance, `“${data.SystemName}”已被管理员在${currTime}创建，请及时上传源码`, currTime];

        var add_tb_mmsc_CodeChecker_sql = 'insert into tb_mmsc(username, msg, status, time) values(?, ?, "未读", ?)';
        var add_tb_mmsc_sql_CodeChecker_params = [data.CodeChecker, `“${data.SystemName}”已被管理员在${currTime}创建，请及时上传源码`, currTime];
       logger.info("-------开始执行事务--------")
        connPool.getConnection(function (err, conn) {
            conn.beginTransaction(function (err) {
                if (err) throw err;
            });
            var task1 = function (callback) {
               logger.info('=========开始执行task1==========');
                conn.query(select_sql, select_sql_params, function (errI, rows) {
                    if (errI) returnRes({ "status": "false", "msg": "数据库判断该系统名称是否已存在时发生异常" });
                   logger.info("----task1执行结果----");
                   logger.info(rows);
                    if (rows.length != 0) {
                        returnRes({ "status": "false", "msg": "数据库已存在相同系统名称" });
                        conn.release();
                        return;
                    }
                    callback(null, rows);
                });
            };

            var task2 = function (callback) {
               logger.info('=========开始执行task2==========');
                conn.query(add_tb_sca_system_sql, add_tb_sca_system_sql_params, function (errI, rows) {
                    if (errI) returnRes({ "status": "false", "msg": "数据库插入该系统名称时发生异常" });
                    //console.log(rows);
                    returnRes({ "status": "success", "msg": currTime });
                   logger.info("----task2执行结果----" + rows);
                    callback(null, rows);
                });
            };

            var task3 = function (callback) {
               logger.info('=========开始执行task3==========');
                conn.query(add_tb_sca_record_sql, add_tb_sca_record_sql_params, function (errI, rows) {
                    if (errI)logger.info("数据库初始化扫描记录时发生异常");
                   logger.info("----task3执行结果----");
                    callback(null, rows);
                });
            };

            var task4 = function (callback) {
               logger.info('=========开始执行task3==========');
                conn.query(add_tb_mmsc_Maintenance_sql, add_tb_mmsc_sql_Maintenance_params, function (errI, rows) {
                    if (errI) returnRes({ "status": "false", "msg": "数据库给Maintenance插入mmsc表时发生异常" });
                    //console.log(rows);
                   logger.info("----tas4执行结果----")
                    callback(null, rows);
                });
            };
            var task5 = function (callback) {
               logger.info('=========开始执行task5==========');
                conn.query(add_tb_mmsc_CodeChecker_sql, add_tb_mmsc_sql_CodeChecker_params, function (errI, rows) {
                    if (errI) returnRes({ "status": "false", "msg": "数据库给CodeChecker插入mmsc表时发生异常" });
                    //console.log(rows);
                   logger.info("----task5执行结果----")
                    callback(null, rows);
                });
            };

            async.series([task1, task2, task3, task4, task5], function (err, result) {
                if (err) {
                   logger.info(err);
                    //回滚
                    connection.rollback(function () {
                       logger.info('出现错误,回滚!');
                        //释放资源
                        connection.release();
                    });
                    return;
                }
                //提交
                conn.commit(function (err) {
                    if (err) throw err;
                   logger.info(result);
                    conn.release();
                });

            });
        });
    },
    //更新系统清单表tb_sca_system
    updateSystemData: function (data, callback) {
        //获取当前时间
        var currTime = custom.getCurrentTime();
       logger.info(currTime);

        var edit_tb_sca_system_sql = "update tb_sca_system set department = ?, security_level = ?, maintenance = ?, code_checker = ?, architect = ?, language = ?, edit_time = ?, remark = ? where system_name = ? ";
        var edit_tb_sca_system_sql_params = [data.Department, data.SecurityLevel, data.Maintenance, data.CodeChecker, data.Architect, data.Language, currTime, data.Remark, data.SystemName];

        connPool.getConnection(function (err, conn) {
            if (err) throw err;
            conn.query(edit_tb_sca_system_sql, edit_tb_sca_system_sql_params, function (errI, rows) {
                if (errI) throw errI;
                callback(currTime);
               logger.info("----更新数据成功-----");
            });
            conn.release();
        });
    },
    deleteSystemData: function (data, callback) {
       logger.info(data);
        var delete_sql = "";
        var delete_sql_params = [];
        if (data.length != 0) {
            delete_sql = "delete from tb_sca_system where system_name in (";
            data.forEach(function (v, i, a) {
                delete_sql += "?,";
                delete_sql_params.push(v.SystemName);
            });
            delete_sql = delete_sql.substr(0, delete_sql.length - 1);
            delete_sql += ")";
        }
       logger.info(delete_sql);
       logger.info(delete_sql_params);
        if (delete_sql != "") {
            connPool.getConnection(function (err, conn) {
                if (err) throw err;
                conn.query(delete_sql, delete_sql_params, function (errI, rows) {
                    if (errI) throw errI;
                    callback(true);
                   logger.info("----删除数据成功-----");
                });
                conn.release();
            });
        }
    },

    //代码扫描页面初始化,根据用户名和语言显示对应的数据
    select_Scan_Data: function (data, language, callback) {
       logger.info("username:" + data.username);
       logger.info(`role: ${data.role}`);
        //判断用户是否为管理员，若是管理员，则根据语言显示所有数据
        var sql = '';
        var sql_params = '';
        if (data.role == '管理员') {
            sql = "select system_name as SystemName, scan_src, scan_src_name, scan_report_first, scan_report, scan_report_name, analysis_report_first, analysis_report, analysis_report_name from tb_sca_record where system_name in (select system_name from tb_sca_system where language = ?)";
            sql_params = [language];
        } else {
            sql = "select system_name as SystemName, scan_src, scan_src_name, scan_report_first, scan_report, scan_report_name, analysis_report_first, analysis_report, analysis_report_name from tb_sca_record where system_name in (select system_name from tb_sca_system where (maintenance = ?  or code_checker = ? or architect = ?) and language = ?)";
            sql_params = [data.username, data.username, data.username, language];
        }
        connPool.getConnection(function (err, conn) {
            conn.query(sql, sql_params, function (err, rows) {
                if (err) throw err;
               logger.info(rows);
                callback(rows);
            });
            conn.release();
        });
    },

    //更新tb_sca_record表
    update_tb_sca_record: function (update_sql, update_sql_params, returnRes) {
        connPool.getConnection(function (err, conn) {
            conn.query(update_sql, update_sql_params, function (err, rows) {
                if (err) throw err;
               logger.info(rows);
                returnRes(true);;
            });
            conn.release();
        });
    },
    

    //mysql事务封装，传入[task1, task2, ...]
    transactionDao: function (taskparas, returnRes) {
       logger.info("-------开始执行事务--------");
        let tasks = [];
        connPool.getConnection(function (err, conn) {
            conn.beginTransaction(function (err) {
                if (err) throw err;
            });

            taskparas.forEach(function (v) {
                var task = function (callback) {
                   logger.info(`============${v.desc}=======开始执行=======`);
                    conn.query(v.sql, v.sql_params, function (errI, rows) {
                        if (errI) returnRes({ "status": false, "msg": v.msg_err });
                        //console.log(rows);
                       logger.info(`============${v.desc}========执行成功======`);
                        callback(null, rows);
                    });
                };
                tasks.push(task);
            });

            async.series(tasks, function (err, result) {
                if (err) {
                   logger.info(err);
                    //回滚
                    connection.rollback(function () {
                       logger.info('出现错误,回滚!');
                        //释放资源
                        connection.release();
                    });
                    return;
                }
                //提交
                conn.commit(function (err) {
                    if (err) throw err;
                   logger.info(result);
                    returnRes(true);
                    conn.release();
                });

            });
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

