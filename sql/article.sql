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

