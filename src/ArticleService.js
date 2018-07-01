const moment = require('moment');
const ArticleDao = require('./ArticleDao');
const MpWeixin = require('./MpWeixin');

/**
 * 获取公众号文章，并保存到数据库中
 **/
class ArticleService {
    /**
     * @param appID       开发者ID(AppID)
     * @param appSecret   开发者密码(AppSecret)
     */
    constructor(appID, appSecret) {
        this.mpWeixin = new MpWeixin(appID, appSecret);
        this.articleDao = new ArticleDao();
    }

    /**
     * 同步最新文章到数据库中
     */
    async syncLatestArticle() {
        try {
            //获取最新的前20篇图文文章
            const result = await this.mpWeixin.getBatchGetMaterial('news', 0, 20);
            console.log('result =>',result);
            const {item} = result;
            console.log('item =>',item);
            await this.parseNewsItems(item);
        } catch (e) {
            console.error('syncLatestArticle error => ', e);
        }
    }

    /**
     * 解析接口返回的文章列表，并同步到数据库
     * @param arrItems
     * @return {Array}
     */
    async parseNewsItems(arrItems) {
        for (let i = 0; i < arrItems.length; i++) {
            const item = arrItems[i];
            //创建日期
            let create_time = parseInt(item.content.create_time) * 1000;
            //更新日期
            let update_time = parseInt(item.content.update_time) * 1000;
            for (let j = 0; j < item.content.news_item.length; j++) {
                //获取图文消息
                const {title,thumb_media_id,show_cover_pic,author,digest,content,url,content_source_url,thumb_url} = item.content.news_item[j];
                //过滤未发布的文章,没有封面表示没有发布
                if (thumb_url === '' || thumb_url === null || thumb_url.trim().length === 0) continue;
                //格式化时间
                create_time = moment(create_time).format('YYYY-MM-DD HH:mm:ss');
                update_time = moment(update_time).format('YYYY-MM-DD HH:mm:ss');
                const article = {
                    title,
                    thumb_media_id,
                    show_cover_pic,
                    author,
                    digest,
                    content,
                    url,
                    content_source_url,
                    thumb_url,
                    create_time,
                    update_time
                };
                //将文章同步到数据库中
                const result = await this.articleDao.saveArticle(article);
                console.log(result);
            }
        }
    }
}

module.exports = ArticleService;