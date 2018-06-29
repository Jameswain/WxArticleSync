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
            accessTokenFile = fe.readJsonSync(path.resolve(__dirname,'config','token',`${this.appID}.json`));
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
        const accessTokenFile = this.getAccessTokenForLocalDisk();
        const currentTime = Date.now();
        //如果本地文件中的access_token为空 或者 access_token的有效时间小于当前时间 表示access_token已过期
        if(accessTokenFile.access_token === '' || accessTokenFile.expires_time < currentTime) {
            const result = await axios.get(href);
            console.log(result);
        }
        //access_token 没有过期，则直接返回本地存储的token
        else {
            return accessTokenFile.access_token;
        }
    }

}
module.exports = MpWeixin;
