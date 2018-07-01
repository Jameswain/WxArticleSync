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
}
module.exports = MpWeixin;
