---
title: Hexo博客的搭建
tags:
  - guide
  - website
  - fronted
  - hexo
  - frp
  - gcp
  - cloudflare
categories:
  - [Docs, Dev]
date: 2025-10-07 15:02:44
---

<div style="text-align:right; color:#b3c5d8 !important;">
  <em style="color:#b3c5d8: !important;"> —— 
        本文介绍Hexo博客的搭建，以及相关的域名和服务器问题简单讲解
    </em>
</div>
<div style="clear:both;"></div>
<!--more-->

# [Hexo](https://hexo.io)的部署

## 安装

### nodejs

- ArchLinux(包管理器即可)
  ```sh
  sudo pacman -S nodejs npm
  ```
- Ubuntu/Deb系([NodeSource](https://nodesource.com/products/distributions))
  ```sh
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- 安装完成后查看node与npm版本（node大概20+比较好应该）
  ```sh
  node -v
  npm -v
  ```

### 本体

直接npm安装

```sh
npm install -g hexo-cli
```

### 初始化

- init命令
  ```sh
  hexo init hexo
  ```
- npm install
  ```sh
  cd hexo
  npm install
  ```
- 完成后文件结构如下
  ```sh
  $ tree -d -L 1
  /path/to/hexo
  ├── node_modules
  ├── scaffolds
  ├── source
  └── themes
  ```

## 常用命令

### new

初始化完成后就可以开始进行写作了（先不用管其他乱七八糟的，抓住主要矛盾）<br>
命令形式：`hexo new [layout] <title>`（layout默认分为post、page、draft；默认值为post）<br>

- post
  ```sh
  hexo new "First"
  ```
  会创建文件/path/to/hexo/source/\_posts/First.md
- page
  ```sh
  hexo new page "About"
  ```
  创建文件/path/to/hexo/source/About/index.md<br>
  作用是创建一个新的页面。（私以为刚开始搞用处不大，本人放了一个用来放本站的[About](/about)）
- draft
  ```sh
  hexo new draft "draft"
  ```
  创建文件/path/to/hexo/source/\_drafts/draft.md<br>
  用以存放尚未完成的文章。在生成静态网页时\_drafts/下的.md文件不会被渲染为网页。

### generate

到此你已经会在hexo的目录下写文章了，就到了最重要的md->html环节。<br>

```sh
hexo generate
//或者
hexo g
```

之后终端会告诉你生成了具体哪些文件，这些文件都存放在/path/to/hexo/public中，这个public就是博客网站的根目录。结构如此：

```sh
/path/to/hexo/public
├── 2025
├── About
├── archives
├── css
├── fancybox
└── js
```

生成的文章会以时间为分类依据保存。同时如果.md中有设置标签则还会多处categories这一目录

### server

接下来是快速检验自己的网站效果的步骤。

```sh
hexo server
//或者
hexo s
```

启动hexo服务器。在浏览器打开网址输入http://localhost:4000 或者 127.0.0.1:4000<br>
可以看到网页如下：

![ServerLaunched](/2025/10/07/Hexo博客的搭建/Hexo_Server1.png)

### publish

将\_drafts/下的草稿发布为\_posts/下的文章。

```sh
hexo publish draft
```

/path/to/hexo/source/\_drafts/draft.md移到/path/to/hexo/source/\_posts/draft.md<br>
此时再hexo g则会将draft.md一并渲染为网页并存入/public中，之后再次hexo s则可以看到网页变化：

![DraftPublished](/2025/10/07/Hexo博客的搭建/Hexo_Server2.png)

发现多了一篇文章名为draft

### deploy

```sh
hexo deploy
//或者
hexo d
```

用于将本地hexo项目generate之后的/public整体同步到用于部署网页的服务端；可以是Github Pages等托管平台，也可以是自己的[nginx服务器](#title-14)<!--(#服务器nginx部署)--><br>
deploy需要在hexo项目根目录下的\_config.yml中进行[配置](#title-20)<!--(#\_config.yml)--><br>

### 实际使用

实际使用过程中以下操作比较常见

```sh
hexo new <Title>          //新建文章
hexo new draft <Title>    //新建草稿
hexo publish <Title>      //发布草稿
hexo g && hexo s          //本地服务测试
hexo g -d                 //生成静态页面并部署
```

## 其他需要的npm包

大致写一下，回头再好好儿整理

```sh
npm install hexo-renderer-markdown-it
npm install hexo-deployer-rsync
npm install hexo-generator-search
```

## 部署上线

### githubPage部署

- 待完成。我没用这个，以后再说吧

### 服务器nginx部署

#### 服务端

- nginx安装
  包管理器安装
  ```sh
  sudo apt install nginx
  ```
- 示例文件/etc/nginx/sites-available
  ```nginx
  server {
  	listen 80;
  	server_name example.your.domain;
  	root /path/to/your/blog/dir/public;    #注意此处与hexo的deploy配置路径一致
  	index index.html;
  }
  ```
- 启动nginx并设置自启动
  ```sh
  sudo systemctl enable --now nginx
  ```
- 访问网页
  在浏览器中输入http://example.your.domain看是否能够访问。
- [certbot](https://certbot.eff.org/)可帮你进行https的相关配置，教程详细操作无脑不赘述
- [其他域名与服务器相关](#title-30)<!--(#域名与服务器)-->

#### 客户端(hexo配置)

- 安装插件（以rsync为例）

```sh
cd /path/to/hexo/root
npm install hexo-deployer-rsync --save
```

- 在hexo项目根目录下的\_config.yml文件中修改或添加deploy项

```yaml
deploy:
  type: rsync
  host: YourHostIP
  user: sydx
  root: /path/to/your/blog/dir/public; #注意此处与hexo的deploy配置路径一致
  port: 22 #ssh端口
  delete: true
  verbose: true
  ignore_errors: false
```

- 之后在写作完成进行`hexo d`的时候就会根据deploy中的配置进行部署

# 选择主题

## [hingle](https://docs.paul.ren/hingle/#/?id=%e5%ae%89%e8%a3%85)

- 安装方法
  从[github](https://github.com/Dreamer-Paul/)下载解压命名为hingle至hexo/themes/下，修改hexo的\_config.yml：

```yml
theme:hingle
```

- 其他配置详情参见hingle主页或[我的配置](https://github.com/SydX-pages/BlueBits)

## 配置文件概述

### \_config.yml

在hexo和主题下都有，全局和主题相关的配置文件。

### public/

hexo g后生成的静态网页文件，包括html、css、js以及assets。

### source

与写作直接关联的md文件存储位置。

### themes

各种主题。

#### layout

生成静态网页的模板文件（hingle中是.ejs），类似html，但是用占位符替代具体内容。

#### source

主题会用到的css、js，generate之后会存在/public/static和/public/js中。

# 评论区配置

不想写了，回头新开一篇写

## Waline

## Giscus

## Valine

# 域名与服务器

## 域名与托管

- 域名申请
  1.  [digitplant](https://dash.domain.digitalplat.org)
      原us.kg，免费，注册非常简单，给他们star一下就可以注册两个域名，等什么时候我再新开一篇专门从头注册个域名
  2.  [is-a.dev](https://is-a.dev/)
      通过在Github上提交PR进行子域名申请，没有NS，感觉可玩性不如dpdns。我还没用这个，回头和github-pages配合一下。
  3.  其他还了解过比如[eu.org](https://nic.eu.org/arf/en/login/?next=/arf/en/)，似乎已经不接受注册了，申请了迟迟没有回信。
  4.  购买域名，不多赘述。

- 域名托管
  不多解释，请选择大善人[Cloudflare](https://dash.cloudflare.com/)<br>
  大概讲下DNS records怎么添加：
  1. dash的主页里点击onboard a domain把注册好的域名添加进去。
  2. 选中自己的域名进入管理界面

     ![Cloudflare1](/2025/10/07/Hexo博客的搭建/Cloudflare1.png)

  3. 左侧边栏中DNS-Records。以A记录为例，选择Type为A，Name字段填写你的子域名（比如你的域名是example.domain.org，然后Name字段填了www，那这条dns记录就是给了www.example.domain.org），IPv4地址填你的服务器地址

     ![Cloudflare2](/2025/10/07/Hexo博客的搭建/Cloudflare2.png)

     这样做完之后，浏览器中输入www.example.domain.org就会给你(http://<你的IP>)的网页了。

## 服务器

### VPS

我用的[gcp](https://cloud.google.com/)

### 端口映射

因为gcp建的机器性能很差，感觉甚至不如树莓派，所以我实际上nginx开的网页服务跑在家里的树莓派上，再用[frp](https://gofrp.org/en/)把VPSIP的80/443映射到RpiIP的80/443上（其他端口也行，我图省事儿）
