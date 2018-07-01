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