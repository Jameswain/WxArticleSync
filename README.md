# 0、介绍

本文源码：<https://github.com/Jameswain/WxArticleSync> 

​    ![img](file:///D:/Documents/My Knowledge/temp/2900168e-9aeb-4825-8fc8-484a814c0f50/128/index_files/0.7547024588164581.png)

​    最近PM有一个需求：把5个公众号的所有文章定时同步到小程序的数据库里，10分钟同步一次。实现这个需求当时我想了两种方案

方案一：使用Puppeteer就所以的历史文章爬下来，然后解析入库。

方案二：通过微信公众号平台提供的接口获取数据，然后定时插入到小程序数据库中，这两种方案中显然是方案二最方便的，本文主要讲解方案二实现过程。

​    技术栈：Node + MySQL + 微信公众号接口



# 1、微信公众平台后台配置

![img](file:///D:/Documents/My Knowledge/temp/2900168e-9aeb-4825-8fc8-484a814c0f50/128/index_files/29580953.png)

​    首先需要登录到你的微信公众平台，进行一些开发相关的配置。登录微信公众平台后，在左侧菜单中打开【开发】-【基本配置】

![img](file:///D:/Documents/My Knowledge/temp/2900168e-9aeb-4825-8fc8-484a814c0f50/128/index_files/894bb812-e3d9-4610-8470-b81f9538b6f9.png) 

打开的页面如下图所示，下图涉及到了一些敏感信息，所以我做了一些修改 

![img](file:///D:/Documents/My Knowledge/temp/2900168e-9aeb-4825-8fc8-484a814c0f50/128/index_files/5cd15871-01bc-4be5-977a-efb1d188d03c.png) 

​	在【基本配置】里，我们主要需要配置【开发者密码(AppSecret)】和IP白名单，因为我们在调用微信公众平台的接口之前需要获取access_token，在调用接口时access_token传递过去。 

## 1.1 开发者密码（AppSecret）

![img](file:///D:/Documents/My Knowledge/temp/2900168e-9aeb-4825-8fc8-484a814c0f50/128/index_files/f13fdeac-dc76-40e9-9ee5-8baa83205556.png) 

![img](file:///D:/Documents/My Knowledge/temp/2900168e-9aeb-4825-8fc8-484a814c0f50/128/index_files/896e57c9-6915-45d5-9747-e055f7308bf6.png) 

![img](file:///D:/Documents/My Knowledge/temp/2900168e-9aeb-4825-8fc8-484a814c0f50/128/index_files/914d5797-bf99-4945-9965-4e5f27420f9c.png) 

![img](file:///D:/Documents/My Knowledge/temp/2900168e-9aeb-4825-8fc8-484a814c0f50/128/index_files/bc36a22a-9a72-4c71-bf42-cd32b0e7b2c9.png) 

![img](file:///D:/Documents/My Knowledge/temp/2900168e-9aeb-4825-8fc8-484a814c0f50/128/index_files/21bd454f-ba51-49fa-8c6e-1e39d0874df4.png) 

## 1.2 IP白名单配置

​    IP白名单：限制微信公众平台接口调用的IP；你要想调用微信开发者平台的接口，你就必须把调用接口机器的公网IP配置到IP白名单里。

![img](file:///D:/Documents/My Knowledge/temp/2900168e-9aeb-4825-8fc8-484a814c0f50/128/index_files/6bfc83d5-6c8a-404e-a3a4-e431f9b7934a.png)    

上图我把47.50.55.11这台机器配置到IP白名单里，这样47.50.55.11这台机器就可以调用微信公众平台的相关接口了。 到目前为止，公众号开发的基本配置就配置好了。





















