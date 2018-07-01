const db = require('./DB');
const sqlstring = require('sqlstring');     //sql占位符模块

/**
 * 文章存储dao操作
 **/
class ArticleDao {
    /**
     * 保持文章到数据库中
     * @param article
     * @returns {Promise<void>}
     */
    async saveArticle(article) {
        try {
            const {thumb_media_id} = article;
            const isExits = await this.isExitsArticle(thumb_media_id);
            let keys = Object.keys(article);
            let vals = Object.values(article);
            if(isExits) {   //数据库中已存在 UPDATE
                const index = keys.indexOf('thumb_media_id');
                keys.splice(index,1);
                vals.splice(index,1);
                const sign = keys.map(key => `${key}=?`).join(',');
                vals.push(thumb_media_id);
                const sql    = sqlstring.format(`UPDATE article SET ${sign} WHERE thumb_media_id = ?`,vals);
                console.log('sql => ',sql)
                const result = await db.query(sql,true);
                return result;
            } else {        //数据库中不存在 INSERT
                const sign   = new Array(keys.length).fill('?').join(',');
                const sql    = sqlstring.format(`INSERT INTO article(${keys.join(',')}) VALUES(${sign})`,vals);
                console.log('sql => ',sql);
                const result = await db.query(sql,true);
                return result;
            }
        } catch (e) {
            console.error('saveArticle出错：',e)
        }
    }

    /**
     * 根据 thumb_media_id 查询数据库中是否存在文章
     * @param thumb_media_id
     * @returns {Promise<void>}
     */
    async isExitsArticle(thumb_media_id) {
        try {
            const sql = sqlstring.format(`SELECT * FROM article WHERE thumb_media_id = ?`,[thumb_media_id]);
            const result = await db.query(sql,true);
            return result && result.length > 0;
        } catch (e) {
            throw e;
        }
    }
}
module.exports = ArticleDao;