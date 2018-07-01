# 0、介绍

本文源码：<https://github.com/Jameswain/WxArticleSync> 

​    ![img](https://vipkshttps9.wiz.cn/wiz-resource/1b300862-b565-454e-bb0f-541f765397ff/2900168e-9aeb-4825-8fc8-484a814c0f50/index_files/0.7547024588164581.png)

​    最近PM有一个需求：把5个公众号的所有文章定时同步到小程序的数据库里，10分钟同步一次。实现这个需求当时我想了两种方案

方案一：使用Puppeteer就所以的历史文章爬下来，然后解析入库。

方案二：通过微信公众号平台提供的接口获取数据，然后定时插入到小程序数据库中，这两种方案中显然是方案二最方便的，本文主要讲解方案二实现过程。

​    技术栈：Node + MySQL + 微信公众号接口



# 1、微信公众平台后台配置

![img](file:///D:/Documents/My Knowledge/temp/2900168e-9aeb-4825-8fc8-484a814c0f50/128/index_files/29580953.png)

​    首先需要登录到你的微信公众平台，进行一些开发相关的配置。登录微信公众平台后，在左侧菜单中打开【开发】-【基本配置】