const MpWeixin = require('./src/MpWeixin');

new MpWeixin('appID','appSecret').getAccessToken().then(access_token => {
    console.log('access_token:',access_token);
});

