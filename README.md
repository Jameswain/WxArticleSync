# 0、介绍

本文源码：<https://github.com/Jameswain/WxArticleSync> 

​    ![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/001.png)

​    最近有一个需求：把5个公众号的所有文章定时同步到小程序的数据库里，10分钟同步一次。实现这个需求当时我想了两种方案

方案一：使用Puppeteer就所以的历史文章爬下来，然后解析入库。

方案二：通过微信公众号平台提供的接口定时获取数据，然后插入到小程序数据库中。这两种方案中显然是方案二最方便的，本文主要讲解方案二实现过程。

​    技术栈：Node + MySQL + 微信公众号接口



# 1、微信公众平台后台配置

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/002.png)

​    首先需要登录到你的微信公众平台，进行一些开发相关的配置。登录微信公众平台后，在左侧菜单中打开【开发】-【基本配置】

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/003.png)

打开的页面如下图所示，下图涉及到了一些敏感信息，所以我做了一些修改

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/004.png)

​	在【基本配置】里，我们主要需要配置【开发者密码(AppSecret)】和IP白名单，因为我们在调用微信公众平台的接口之前需要获取access_token，在调用接口时access_token传递过去。

## 1.1 开发者密码（AppSecret）

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/005.png)

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/006.png)

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/007.png)

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/008.png)

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/009.png)

## 1.2 IP白名单配置

​    IP白名单：限制微信公众平台接口调用的IP；你要想调用微信开发者平台的接口，你就必须把调用接口机器的公网IP配置到IP白名单里。

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/010.png)

上图我把47.50.55.11这台机器配置到IP白名单里，这样47.50.55.11这台机器就可以调用微信公众平台的相关接口了。 到目前为止，公众号开发的基本配置就配置好了。

# 2、获取access_token

​        **access_token是公众号的全局唯一接口调用凭据，公众号调用各接口时都需使用access_token**。开发者需要进行妥善保存。access_token的存储至少要保留512个字符空间。access_token的有效期目前为2个小时，需定时刷新，重复获取将导致上次获取的access_token失效。这是官网的详细介绍：<https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140183> 

​        公众号可以使用**AppID和AppSecret**调用本接口来获取access_token。AppID和AppSecret可在“微信公众平台-开发-基本配置”页中获得（需要已经成为开发者，且帐号没有异常状态）。**调用接口时，请登录“微信公众平台-开发-基本配置”提前将服务器IP地址添加到IP白名单中，点击查看设置方法，否则将无法调用成功。**

​        获取access_token每日调用上限是2000次，具体情况可以在【开发】-【接口权限】中查看，在这里可以查看到所有接口

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/3a6d043d-20e2-4894-b87b-8c86c3b05c0a.png)

​    开始撸码，新建一个文件夹，并通过npm初始化项目：

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/add8b917-676c-44a0-95c0-7b09fe0118d0.png)

在MpWeixin.js文件中创建实现获取access_token功能，具体流程如下图所示：

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/b547c9e3-07b6-4cdb-ad12-38c7ac9508dd.png)

**MpWexin.js 实现代码如下：** 

```javascript
const path = require('path');
const fe = require('fs-extra');
const axios = require('axios');

class MpWeixin {
    /**
     * @param appID       开发者ID(AppID)
     * @param appSecret   开发者密码(AppSecret)
     */
    constructor(appID,appSecret) {
        this.appID = appID;
        this.appSecret = appSecret;
    }

    /**
     *读取本地磁盘上access_token
     */
    getAccessTokenForLocalDisk(){
        let accessTokenFile = null;
        try {
            //读取当前目录下config/token文件中的token文件
            accessTokenFile = fe.readJsonSync(path.resolve('config','token',`${this.appID}.json`));
        } catch(e) {
            //如果文件不存在则创建一个空的access_token对象
            accessTokenFile = {
                access_token : '',
                expires_time : 0
            }
        }
        return accessTokenFile;
    }

    /**
     * 获取access_token
     * access_token是公众号的全局唯一接口调用凭据，access_token的有效期目前为2个小时，需定时刷新，重复获取将导致上次获取的access_token失效。
     * 实现思路：每次获取access_token之前检查本地文件是否存在access_token并且没有过期，如果本地没有access_token或者已过期则重新获取access_token并保存到本地文件中
     */
    async getAccessToken() {
        const href = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appID}&secret=${this.appSecret}`;
        //获取本地存储的access_token
        const accessTokenFile = this.getAccessTokenForLocalDisk();
        const currentTime = Date.now();
        //如果本地文件中的access_token为空 或者 access_token的有效时间小于当前时间 表示access_token已过期
        if(accessTokenFile.access_token === '' || accessTokenFile.expires_time < currentTime) {
            try {
                //访问微信公众平台接口获取acccess_token
                const {status,data} = await axios.get(href);
                console.log('getAccessToken status : ',status);
                console.log('getAccessToken data : ',data);
                if(data.access_token && data.expires_in) {
                    //将access_token保存到本地文件中
                    accessTokenFile.access_token = data.access_token;
                    accessTokenFile.expires_time = Date.now() + (parseInt(data.expires_in) - 180) * 1000;               //access_token 有效期1小时57分钟
                    //将access_token写到本地文件中
                    const file = path.resolve('config','token',`${this.appID}.json`);
                    fe.ensureFileSync(file);
                    fe.outputJsonSync(file,accessTokenFile);
                    return data.access_token;
                } else {
                    throw new Error(JSON.stringify(data));
                }
            } catch (e) {
                console.error('请求获取access_token出错：',e);
            }
        }
        //access_token 没有过期，则直接返回本地存储的token
        else {
            return accessTokenFile.access_token;
        }
    }

}
module.exports = MpWeixin;
```

然后新建一个App.js文件，在这个文件中测试一下获取access_token这个方法，具体代码如下： 

```javascript
const MpWeixin = require('./src/MpWeixin');

new MpWeixin('替换成你订阅号的appID','替换成你订阅号的appSecret').getAccessToken().then(access_token => {
    console.log('access_token:',access_token);
});
```

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/e6876655-3d1a-4341-a1c2-aa9a21610698.png) 

**注意：以上代码必须要放在IP白名单中配置的机器上执行才能成功获取access_token** 



# 3、获取永久素材管理（公众号文章）接口

 永久素材管理接口必须需要通过微信认证，微信认证必须要是要是企业订阅号才可以进行微信认证，个人订阅号无法进行微信认证，也就是说个人订阅号是没有调用这个接口权限的。接口官方说明：<https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1444738734> ；

​        **在MpWeixin.js 添加【获取素材列表】代码：**

```javascript
     /**
     * https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1444738729
     * 获取素材列表
     * @param type     素材的类型，图片（image）、视频（video）、语音 （voice）、图文（news）
     * @param offset   从全部素材的该偏移位置开始返回，0表示从第一个素材 返回
     * @param count    返回素材的数量，取值在1到20之间
     * @returns {Promise<void>}
     */
    async getBatchGetMaterial(type,offset,count) {
        try {
            const access_token = await this.getAccessToken();
            const href = `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${access_token}`;
            const {status,data} = await axios.post(href,{type,offset,count});
            console.log('status => ',status);
            return data;
        } catch(e) {
            console.error('获取素材列表getBatchGetMaterial出错：',e);
        }
    }
```

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/ca485be5-e58e-48a4-9fdd-23285d2f1736.png)

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/835f9793-3c6a-4477-a891-ef913ea3658c.png)

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/9e27f005-81f4-4ee3-a462-202326f9bc92.png)

​        修改App.js文件，测试获取素材列表接口：

```javascript
const MpWeixin = require('./src/MpWeixin');

const mp_weixin = new MpWeixin('替换成你订阅号的appID','替换成你订阅号的appSecret').;
//获取图文素材前20片文章
mp_weixin.getBatchGetMaterial('news',0,20).then(data => {
    console.log('获取图文素材：',data);
}).catch(e => {
    console.error('获取图片素材出错：',e);
});
```

**在白名单中配置的机器上的运行结果如下：**

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/1ca1a91d-a4a0-4ec2-90e2-3e64b328ca2d.png)

 

# 4、创建存储文件表

获取到的文章相关数据，需要将它存储到MySQL数据库中，所以首先需要创建一张文章表，创建SQL如下： 

```javascript
CREATE TABLE `article` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL COMMENT '标题',
  `thumb_url` varchar(255) NOT NULL COMMENT '文章封面',
  `thumb_media_id` varchar(255) DEFAULT NULL COMMENT '图文消息的封面图片素材id（必须是永久mediaID）',
  `show_cover_pic` tinyint(10) DEFAULT NULL COMMENT '是否显示封面，0为false，即不显示，1为true，即显示',
  `author` varchar(100) DEFAULT NULL COMMENT '作者',
  `digest` varchar(255) DEFAULT NULL COMMENT '图文消息的摘要，仅有单图文消息才有摘要，多图文此处为空。如果本字段为没有填写，则默认抓取正文前64个字。',
  `content` text COMMENT '图文消息的具体内容，支持HTML标签，必须少于2万字符，小于1M，且此处会去除JS,涉及图片url必须来源 "上传图文消息内的图片获取URL"接口获取。外部图片url将被过滤。',
  `url` varchar(255) DEFAULT NULL COMMENT '图文页的URL',
  `content_source_url` varchar(255) DEFAULT NULL COMMENT '图文消息的原文地址，即点击“阅读原文”后的URL',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;
```

创建表操作也可以通过一些图形化软件进行操作，比如Navicat，操作界面如下： 

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/5ab4d6ce-e96b-4f6d-9062-120666ebeb30.png)



# 5、实现文章存储DAO层

    	DAO层主要是实现数据库相关操作的，我使用的是MySQL数据库，所以需要安装一个【promise-mysql】模块进行数据库相关操作，并且对数据库操作进行一个简单的封装，把数据库的连接和断开连接操作都封装到一个db.js文件中，在需要进行数据库操作的地方引入该模块即可。 

  **db.js 数据连接 & 断开操作封装** 

```javascript
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
```

 接下来实现文章存储到MySQL的DAO相关操作ArticleDao.js，具体实现代码如下： 

```javascript
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
```



# 6、实现文章存储Service层

在Service层实现获取公众号文章并存储到数据库中的相关业务代码，ArticleService.js 具体实现代码如下： 

```javascript
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
```



# 7、创建定时任务

        每10分钟同步一次文章数据，因为获取列表素材接口每天有调用次数的限制，所以我设置凌晨1点 ~ 早上7点不同步，因为这个点写更新的公众文章的可能性非常小。我在App.js实现定时同步文章操作，具体实现代码如下： 

```javascript
const moment = require('moment');
const ArticleService = require('./src/ArticleService');

//公众号1
const as1 = new ArticleService('替换成你订阅号的appID','替换成你订阅号的appSecret');
//公众号2
const as2 = new ArticleService('替换成你订阅号的appID','替换成你订阅号的appSecret');
//公众号3
const as3 = new ArticleService('替换成你订阅号的appID','替换成你订阅号的appSecret');
//公众号4
const as4 = new ArticleService('替换成你订阅号的appID','替换成你订阅号的appSecret');

//执行间隔,单位：分钟
const MINUTE = 10;
setInterval(async () => {
    //设置凌晨1点 ~ 早上7点不同步
    const hour = parseInt(moment().format('HH'));
    if(hour > 0 && hour < 8) return;

    //多个公众号同时进行同步到一张表中
    await Promise.all([
        as1.syncLatestArticle(),
        as2.syncLatestArticle(),
        as3.syncLatestArticle(),
        as4.syncLatestArticle()
    ]);
    console.log(moment().format('YYYY-MM-DD HH:mm:ss'),'同步完毕');
},1000 * 60 * MINUTE);
```

​    	写到这里，整个定时同步微信公众号文章到数据库的操作就已经全部实现完成了，本人技术有限，欢迎各位大神交流指正。


