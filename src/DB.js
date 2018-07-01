const mysql = require('promise-mysql');

class DB {
    /**
     * 执行sql查询数据库
     * @param {String} sql
     * @param {String} isSql
     */
    static async query(sql,isSql) {
        let connection,dataresult;
        try {
            connection = await mysql.createConnection(DB.DB_CONFIG);
            dataresult = await connection.query(sql);
            isSql && console.log(sql);
            connection.end();
            return dataresult;
        } catch(e) {
            console.log(e);
            if (connection && connection.end) connection.end();
            console.debug(e);
            throw e;
        }
    }

    static escape (value) {
        return mysql.escape(value);
    }
}


const config = {
    /**
     * 测试库
     */
    test:{
        host: '47.50.55.11',        //数据库地址
        user: 'root',               //用户名
        password: '123456',         //密码
        database: 'mp',             //数据库
        port:3306                   //端口
    }
}

//数据库配置
DB.DB_CONFIG = config.test;
module.exports = DB;
