# 0、介绍

本文源码：<https://github.com/Jameswain/WxArticleSync> 

​    ![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/001.png)

​    最近PM有一个需求：把5个公众号的所有文章定时同步到小程序的数据库里，10分钟同步一次。实现这个需求当时我想了两种方案

方案一：使用Puppeteer就所以的历史文章爬下来，然后解析入库。

方案二：通过微信公众号平台提供的接口获取数据，然后定时插入到小程序数据库中，这两种方案中显然是方案二最方便的，本文主要讲解方案二实现过程。

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

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/011.png)

​    开始撸码，新建一个文件夹，并通过npm初始化项目：

![img](https://raw.githubusercontent.com/Jameswain/WxArticleSync/master/images/012.png)

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










