var vm = new Vue({
  el: '#main-wrap',
  data: {
    baseUrl: 'http://cloud_livesc.cloud.hoge.cn/',
    //礼物接口
    goodsUrl : 'http://rewardsc.cloud.hoge.cn/',   
    activity: {
      anchor_info: {
        anchor_avatar: {
          host : '',
          dir : '',
          filepath : '',
          filename : ''
        },
        anchor_username: ''
      },
      announcement_info: ''
    },
    userImgList: [],
    firstUserImgList: [],
    newId: -1,
    showPanelFlag: false,
    comment: ''.showPanelFlag,
    count: 10,
    page: 1,
    // 公告展示
    liveNoticeFlag: false,
    liveNotice: '',
    commentList: [],
    firstCommentList: [],
    commentFlag: false,
    timer: '',
    noMoreData: false,
    flag: false,
    watchNum: '',
    loveNum: '',
    playIcon: true,
    maskFlag: false,
    currentTranscode: 0, // 视频转码状态,
    offset: 0,
    count: 5,
    goUrl: '',
    access_token: '',
    deviceToken: '',
    localSocket: {},
    socketMsgQueue: [],
    marginRight: 0.2,
    giftsList: [],
    currentPage: 1,  //显示的是哪一页
    totalPage: 0, //记录总数
    showGifts: false,
    showUserMask: false,
    goodsFlag:false,
    giftsInfo: [],
    timeId: '',
    rewardNum: 0,
    appStoreNotice:false,
    goodsLink:'',
    live_open : false,  //直播开始弹框控制
  },
  filters: {
    transformTime(timestamp) {
      var date = new Date(timestamp * 1000);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
      var year = date.getFullYear(),
          month = ("0" + (date.getMonth() + 1)).slice(-2),
          sdate = ("0" + date.getDate()).slice(-2),
          hour = ("0" + date.getHours()).slice(-2),
          minute = ("0" + date.getMinutes()).slice(-2),
          second = ("0" + date.getSeconds()).slice(-2);
      return year + "-"+ month +"-"+ sdate +" "+ hour +":"+ minute;
    },
    toThousands(num) {
      var num = (num || 0).toString(), result = '';
      while (num.length > 3) {
          result = ',' + num.slice(-3) + result;
          num = num.slice(0, num.length - 3);
      }
      if (num) { result = num + result; }
      return result;
    }
  },
  beforeDestroy() {
    clearTimeout(this.timeId)
  },
  created() {
    window.addEventListener('beforeunload', this.colseSocket)
  },
  mounted() {
    if (location.search.indexOf('debug') > -1) {
      new VConsole();
    }
    this.getDetail();
  },
  destroyed() {
    window.removeEventListener('beforeunload', this.colseSocket)
  },
  watch: {
    appStoreNotice(val){
      val === false && clearTimeout(this.appTimer)
    }
  },
  methods: {
    cutImg(obj, width, height) {
      const imgwidth = width || obj.imgwidth
      const imgheight = height || obj.imgheight
      let url = obj.host + obj.dir + obj.filepath + obj.filename
      url = url.replace('{$hgPicSizeStart}', '').replace('{$hgPicSizeWidth}', imgwidth).replace('{$hgPicSizeHeight}', imgheight).replace('{$hgPicSizeEnd}', '')
      return url
    },
    _initSwiper() {
      new Swiper(this.$refs.swiperContainer, {
        loop: false,
        pagination: {
          el: this.$refs.swiperPagination,
        },
        observer:true,
      })
    },
    chunk (array, size) {
      // 获取数组的长度，如果你传入的不是数组，那么获取到的就是undefined
      const length = array.length
      // 判断不是数组，或者size没有设置，size小于1，就返回空数组
      if (!length || !size || size < 1) {
          return []
      }
      // 核心部分
      let index = 0 // 用来表示切割元素的范围start
      let resIndex = 0 // 用来递增表示输出数组的下标

      // 根据length和size算出输出数组的长度，并且创建它。
      let result = new Array(Math.ceil(length / size))
      // 进行循环
      while (index < length) {
      // 循环过程中设置result[0]和result[1]的值。该值根据array.slice切割得到。
      result[resIndex++] = array.slice(index, (index += size))
      }
      // 输出新数组
      return result
    },
    reward (item) {
      const _this = this
      if (item.value != 0) {
        _this.clipboard1 = new ClipboardJS('.rewardItem', {
          text: () => `[hogeLink]anchorShow/ModAnchorShowStyle1Detail?id=${this.activity.id}[hogeLink]`
        });
        this.appStoreNotice = true;
        this.showGifts = false;
        this.appTimer = setTimeout(()=>{
          this.jumpToAppStore()
        },3000)
      } else {
        let url = this.goodsUrl + '?m=Apireward&c=goods&a=reward'
        $.http(url, {
          type: item.type,
          goods_id: item.id,
          order_id: item.order_id,
          origin_title: item.name,
          origin_user_id: this.member_id,
          origin_id:this.activity.id,
          access_token: this.access_token,
          app_secret: this.activity.app_secret,
          is_share: 1,
        }, 'GET').then((res) => {
          if (res.error_message === '未登录') {
            window.location.replace(this.activity.weixin_login_url + '&goUrl=' + this.goUrl + '&wx_secret=' + this.activity.app_secret);
          }
          if (!res.error_code && res.error_code == 0) {
            this.showGifts = false;
          }
        })
      }
    },
    getGiftsList() {
      var url = this.goodsUrl + '?m=Apireward&c=goods&a=getGoodsList'
      $.http(url, {
        access_token: this.access_token,
        app_secret: this.activity.app_secret
      }, 'GET').then(res => {
       this.totalPage = Math.ceil(res.length / 8)
       this.giftsList = this.chunk(res, 8)
      //  console.log('this.giftsList',this.giftsList)
      // 处理图片url
       for (let pageItem of this.giftsList) {
        for(let item of pageItem) {
          if(item.img && Object.keys(item.img).length > 0) {
            this.$set(item, 'imgUrl', this.cutImg(item.img, '36', '36'));
          }
        }
       }
      //  console.log('this.giftsList',this.giftsList)
        // setTimeout(() => {
        //   this._initSwiper()
        // }, 300)
      })
    },
    // 格式化数字
    numberFormat(value) {
      var param = {};
      var k = 10000,
        sizes = ['', '万', '亿', '万亿'],
        i;
      if (value < k) {
        param.value = value
        param.unit = ''
      } else {
        i = Math.floor(Math.log(value) / Math.log(k));
        param.value = ((value / Math.pow(k, i))).toFixed(1);
        param.unit = sizes[i];
      }
      let str;
      if (param.unit) {
        str = `${param.value}${param.unit}+`
      } else {
        str = `${param.value}${param.unit}`
      }
      return str;
    },
    setCookie(name, value) {
      var hours = 6;
      var exp = new Date();
      exp.setTime(exp.getTime() + hours * 60 * 60 * 1000);
      document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();
    },
    getCookie(name) {
      let arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
      if (arr = document.cookie.match(reg)) {
        return unescape(arr[2]);
      } else {
        return null;
      }
    },
    initUserInfo() {
      // var arrCookie = document.cookie;
      var member_info = this.getCookie('liv_member_info-i');
      if (member_info && member_info != null) {
        var str = decodeURIComponent(member_info);
        obj = JSON.parse(str);
        this.member_id = obj.member_id;
        this.nick_name = obj.nick_name;
        this.thumb_url = obj.avatar;
      }
      this.access_token = this.getCookie('liv_access_token-i')
      if (this.access_token) {
        this.getMoney()
      }
      this.goUrl = window.location.href;
    },
    showPanel() {
      this.showPanelFlag = true;
      this.$nextTick(() => {
        document.getElementById('send-text').focus();
      })
      // location.href = this.activity.client_info.download_page;
    },
    goApp() {
      this.clipboard = new ClipboardJS('.copy-button', {
        text: () => `[hogeLink]anchorShow/ModAnchorShowStyle1Detail?id=${this.activity.id}[hogeLink]`
      });
      this.appStoreNotice = true;
      this.showGifts = false;
      this.appTimer = setTimeout(()=>{
        this.jumpToAppStore()
      },3000)
    },
    jumpToAppStore(){
        this.appStoreNotice = false
        window.location.href = this.activity.client_info.download_page;
    },
    isLogin() {
      if (!this.access_token && this.activity.weixin_login_url!== '') {
        // 提交代码解开下面注释
        window.location.replace(this.activity.weixin_login_url + '&goUrl=' + this.goUrl + '&wx_secret=' + this.activity.app_secret);
        // 本地代码解开下面注释 测试cookie
        // this.setCookie('liv_member_info-i', '%7B%22member_id%22%3A%22845182%22%2C%22platform_id%22%3A%22o_LZ-t6ZjptSulcw4lE5d_srXUFM%22%2C%22member_name%22%3A%22%5Cu4f59%5Cu97f3%5Cu7ed5%5Cu6881%5Cu2121%22%2C%22nick_name%22%3A%22%5Cu4f59%5Cu97f3%5Cu7ed5%5Cu6881%5Cu2121%22%2C%22type%22%3A%22gzh_13%22%2C%22type_name%22%3A%22%5Cu6d77%5Cu535aTV%22%2C%22avatar%22%3A%22http%3A%5C%2F%5C%2Fimg1.fjtv.net%5C%2Fmaterial%5C%2Fmembers%5C%2Fimg%5C%2F2020%5C%2F02%5C%2Fbd7a43e7db8138ea1be0c5d8b2c1be9c.jpg%22%2C%22access_token%22%3A%225519f10e1506fe23af59b982c50a157f%22%2C%22last_login_device%22%3A%22%22%7D')
        // this.setCookie('liv_access_token-i', '4c815d00159f81d4b952cea8d007dc68')
      }
    },
    // 获取唯一标识
    genUniqHash() {
      return Math.floor(Date.now() / 1000) + Math.random().toString().slice(2, 8);
    },
    _initSocket(url) {
      // 创建一个Socket实例
      this.localSocket = new WebSocket(url);
      // console.log(this.localSocket)
      // 打开Socket 
      this.localSocket.onopen = (event) => {
        console.log('WebSocket连接已打开！readyState=' + this.localSocket.readyState)
        // 发送消息
        if (this.localSocket.readyState === 1) {
          let data = {
            message: "进入房间",
            event: "enter_room",
            user_info: {
              "user_id": this.member_id,
              "user_name": this.nick_name,
              "user_avatar": this.thumb_url,
            }
          }
          this.localSocket.send(JSON.stringify(data))
        };
      }
      let list = [];
      let imgList = [];
      // 监听消息
      this.localSocket.onmessage = (res) => {
        
        let message = res.data;
        var socketData = JSON.parse(message);
        if (socketData.event === 'common') {
          if (socketData.text && JSON.parse(socketData.text).websocket_text) {
            socketData = JSON.parse(JSON.parse(socketData.text).websocket_text)
          }
          if (socketData.text) {
            socketData = JSON.parse(socketData.text)
          }
          //开启直播
          if (socketData.event == "live_open") {
            this.live_open = true;
          }
          //关闭直播
          if (socketData.event == "live_close") {
            // this.showUserMask = true;
            this.maskFlag = true;
            this.videoplayer.pause();
          }
          //强制结束断流（问号)）
          if (socketData.event == "stop_live") {
            // this.showUserMask = true;
            this.maskFlag = true;
            this.videoplayer.pause();
          }
          // 公告
          if (socketData.event == 'publish_notice') {
            this.liveNotice = socketData.message
            this.liveNoticeFlag = true;
          }
          // 评论
          if (socketData.event == 'chat') {
            //this.commentFlag = true;
            // console.log(socketData)
            list.push(socketData)
            // 直播预告页面接收到开始直播的信息 刷新页面
            if(socketData.stream_notify == 1){
                window.location.reload()
            }
            this.commentList = this.firstCommentList.concat(list).slice(-50);
            this.commentScroll();
          }
          // 进入房间在线人数头像
          if (socketData.event == 'enter_room') {
            if (socketData.user_info.user_avatar && socketData.user_info.user_avatar.host && typeof (socketData.user_info.user_avatar) != 'string') {
              socketData.user_info.user_avatar = socketData.user_info.user_avatar.host + socketData.user_info.user_avatar.dir + socketData.user_info.user_avatar.filepath + socketData.user_info.user_avatar.filename
            }
            // list.push(socketData)
            // this.commentList = list;
            this.watchNum = this.numberFormat(1 + Number(this.activity.watch_num))
            if (imgList.findIndex(obj => (obj.user_id) == socketData.user_info.user_id) > -1) {
              imgList.splice(imgList.findIndex(obj => (obj.user_id) == socketData.user_info.user_id), 1);
            }
            imgList.push(socketData.user_info)
            this.userImgList = this.firstUserImgList.concat(imgList).slice(-6);
            if (this.userImgList.length > 3) {
              this.marginRight = -(1.65 * this.userImgList.length - 6) / this.userImgList.length
            }
          }
          // 打赏
          if(socketData.event == 'send_gift') {
            socketData.goodsPic = this.cutImg(socketData.goods_icon)
            socketData.active = 0
            this.giftsInfo.push(socketData)
            setTimeout(() => {
              var domLi = document.getElementsByClassName('fadeOutLeft')
              domLi[0].remove()
            },4000)
            list.push(socketData)
            this.commentList = this.firstCommentList.concat(list).slice(-50);
            this.commentScroll()
            var ele = document.getElementsByClassName('reward');
            this.$nextTick(function(){
              ele.scrollTop = ele.scrollHeight;
            })
          }
          // 退出房间
          if (socketData.event == 'leave_room') {
            imgList.splice(imgList.findIndex(obj => (obj.user_id) == socketData.user_info.user_id), 1);
            this.userImgList = this.firstUserImgList.concat(imgList).slice(-6);
          }
        }
      };

      // 监听Socket的关闭
      this.localSocket.onclose = function (event) {
        console.log('Client notified socket has closed', event);
        // setTimeout(() => {
        //   _initSocket(url);
        // },1000)
      };

      this.localSocket.onError = function (res) {
        console.log('error readyState=' + this.localSocket.readyState)
        setTimeout(function () {
          console.log('WebSocket连接错误！readyState=' + this.localSocket.readyState)
          this._initSocket()
        }, 1000)
      }
    },
    colseSocket() {
      console.log('socket shut down');
      let data = {
        message: "退出房间",
        event: "leave_room",
        user_info: {
          "user_id": this.member_id,
          "user_name": this.nick_name,
          "user_avatar": this.thumb_url,
        }
      }
      this.localSocket.send(JSON.stringify(data));
      setTimeout(() => {
        this.localSocket.close();
        this.localSocket = null;
      }, 1000)

    },
    refresh : function(){
      window.location.reload();
    },

    userMaskClose : function(){
      this.showUserMask = false;
    },

    //统一发送消息 未使用
    sendSocketMessage: function (msg) {
      if (this.localSocket.readyState === 1) {
        this.localSocket.send({
          data: JSON.stringify(msg)
        })
      } else {
        socketMsgQueue.push(msg)
      }
    },
    // 获取视频详情
    getDetail() {
      //  || location.pathname.split('/')[2].split('.shtml')[0] 
      const id = this.getParam('cert_id')
      // console.log(location.pathname)
      // if (location.pathname && location.pathname.split('/')) {
      //   id  = location.pathname.split('/')[2].split('.shtml')[0]
      // }
      const activityId = this.getParam('activity_id')
      if (!id && !activityId) {
        window.location = 'http://cloud-live-anchor.cloud.hoge.cn/error.html';
        return;
      }
      if (this.getParam('access_token')) {
        this.setCookie('liv_access_token-i', this.getParam('access_token'))
      }
      var url = this.baseUrl + '?m=Apicloud_live&c=share&a=index&cert_id=' + id + '&activity_id=' + activityId;
      $.http(url, null, 'GET')
        .then(data => {
          if (data.ErrorCode && data.ErrorCode > 0) {
            window.location = 'http://cloud-live-anchor.cloud.hoge.cn/error.html';
          } else {
            
            this.activity = data;
            //
            if(Number(this.activity.time_status) == 2){
              this.showUserMask = true;
            }
            // 直播带货链接
            if(this.activity.is_open_live_sell && this.activity.goods_link){
              this.goodsLink = this.activity.goods_link
            }
            this.watchNum = this.numberFormat(this.activity.watch_num);
            console.log('activity', this.activity);
            // src 播放器封面图
            var src;
            if (this.activity.live_notice_info.if_show == '1') {
              // src = this.activity.live_notice_info.info.host + this.activity.live_notice_info.info.dir + this.activity.live_notice_info.info.filepath + this.activity.live_notice_info.info.filename
              src = this.cutImg(this.activity.live_notice_info.info, '375', '375')
            } else {
              // src = this.activity.indexpic.host + this.activity.indexpic.dir + this.activity.indexpic.filepath + this.activity.indexpic.filename;
              src = this.cutImg(this.activity.indexpic, '375', '375')
            }
            // if (Number(this.activity.time_status) == 0) {
            //   src = this.activity.live_notice_show && this.activity.live_notice ? this.activity.live_notice.host + this.activity.live_notice.dir + this.activity.live_notice.filepath + this.activity.live_notice.filename : 'image/moren.png';
            // } else {
            //   src = this.activity.indexpic.host + this.activity.indexpic.dir + this.activity.indexpic.filepath + this.activity.indexpic.filename;
            // }
            // 二次分享图片
            // var share_src = this.activity.indexpic.host + this.activity.indexpic.dir + this.activity.indexpic.filepath + this.activity.indexpic.filename;
            var share_src = this.cutImg(this.activity.indexpic)
            // 播放器封面图
            this.$set(this.activity, 'src', src);
            // 二次分享图片
            this.$set(this.activity, 'share_src', share_src);
            document.title = this.activity.title + '分享页';
            this.setCookie('app_secret', this.activity.app_secret)
            /********************    建立socket 开始         ************************/
            // 获取唯一标识
            var value = localStorage.getItem('deviceToken')
            if (value) {
              this.deviceToken = value;
            } else {
              localStorage.setItem('deviceToken', this.genUniqHash())
              this.deviceToken = localStorage.getItem('deviceToken');
            }
            // socket地址
            let url = 'wss://pushserver-api.cloud.hoge.cn/server_all/cloud_live/cloud_live_' + this.activity.id  + '?app_secret='+ this.activity.app_secret + '&device_token=' + this.deviceToken;
            // console.log(url)
            // this._initSocket(url);
            /********************    建立socket 结束         ************************/
            setTimeout(() => {
              this.initUserInfo();
              this.isLogin();
              this._initSocket(url);
              this.getGiftsList();
            }, 500);
          }

          this.getCommentList();
          this.getLoveNum(0);
          setInterval(() => {
            this.getLoveNum(0);
          }, 5000); // 轮询同步点赞数
          if (this.currentTranscode !== 0) {
            this.maskFlag = true;
            this.playIcon = false;
          } else {
            this.maskFlag = false;
            this.playIcon = true;
          }
          this._initTcPlayer();
          this.share();
          this.getUserImgList();
          this.flag = true;
        });
    },
    getMoney() {
      const url = this.goodsUrl + '?m=Apireward&c=currencyType&a=getUserCurrencyType'
      $.http(url,{
        access_token: this.access_token,
        app_secret: this.activity.app_secret
      },"GET").then(res => {
        if (res.error_code == 0) {
          this.rewardNum = res.data.reward_user_credit
        }
      })
    },
    // 实例化视频
    _initTcPlayer() {
      var options = {
        m3u8: this.activity.camera_info[0].play_stream_url || '',
        mp4: this.activity.camera_info[0].play_stream_url || '',
        autoplay: Number(this.activity.time_status) == 1 ? true : false,
        live: Number(this.activity.time_status) === 1,
        width: '375',
        height: '667',
        x5_type: 'h5',
        x5_player: true,
        systemFullscreen: false,
        coverpic: {
          'style': 'cover',
          'src': this.activity.src ? this.activity.src : ''
        },
        controls: Number(this.activity.time_status) !== 0 ? 'default' : 'none'
      };
      this.videoplayer = new TcPlayer('video_container', options);
      this._addEventListener();
      if (this.activity.is_svideo == 1) {
        document.getElementsByTagName('video')[0].style['object-fit'] = "fill"
      }
    },
    getParam(name) {
      name = name.replace(/[[\]]/g, '\\$&');
      var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
      // // http://cloud-live-anchor.cloud.hoge.cn?cert_id=AoJRa3BWMdeLXXvD 福建
      // http://cloud-live-anchor.cloud.hoge.cn/?cert_id=AYNTMXJTMYSLXXvK 嘉兴
      // const location = this.baseUrl + '/?cert_id=VtVUZyZWYo-LXX_F';
      // var results = location.match(regex);
      var results = location.href.match(regex);
      return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, '%20'));
    },
    // 获取评论数据
    getCommentList() {
      if (this.noMoreData) return;
      $.http(this.baseUrl + '?m=Apicloud_live&c=share&a=getCommentList', {
          // count: this.count,
          // offset: this.commentList.length,
          activity_id: this.activity.id,
          order_type: 'asc'
        }, 'GET')
        .then(res => {
          this.commentList = res;
          this.firstCommentList = res;
          this.commentScroll();
        });
    },
    commentScroll() {
      var ele = document.getElementById('commentlist');
      this.$nextTick(function(){
        ele.scrollTop = ele.scrollHeight;
      })
    },
    // 获取点击数
    getWatchNum() {
      $.http(this.baseUrl + '/index.php?m=Apicloud_live&c=share&a=getActivityWatchNum', {
          activity_id: this.activity.id
        }, 'GET')
        .then(res => {
          this.watchNum = this.numberFormat(res.num);
          this.currentTranscode = parseInt(res.transcode, 10);
          // transcode=1  转码中 this.currentTranscode == 1
          if (this.currentTranscode === 1) {
            this.maskFlag = true;
            this.playIcon = false;
          } else {
            this.maskFlag = false;
          }
        });
    },
    blur() {
      this.kickBack();
    },
    // 发送评论
    sendMessage() {
      if (this.comment.length === 0) return;
      $.http(this.baseUrl + '?m=Apicloud_live&c=share&a=comment', {
          content: this.comment,
          activity_id: this.activity.id,
          access_token: this.access_token,
          app_secret: this.activity.app_secret
        }, 'GET', {
          withCredentials: true
        })
        .then(res => {
          // console.log(res)
          if (res.ErrorCode == 0 && this.activity.comment_auto_audit == 0) {
            this.commentFlag = true;
          } else if (res.ErrorCode == 0 && this.activity.comment_auto_audit == 1) {
            this.commentFlag = false;
          }
          // this.getCommentList();
          this.showPanelFlag = false;
          this.comment = '';
          this.page = 1;
          document.getElementById('comment').scrollTop = document.getElementById('comment').scrollHeight;
        });
      this.kickBack();
    },
    // 刷新页面
    updatePanel() {
      location.reload();
    },
    random(lower, upper) {
      return Math.floor(Math.random() * (upper - lower)) + lower;
    },
    // 喜爱
    giveLove(e) {
      var body = document.getElementsByTagName('body')[0];
      var num = this.random(0, 19);
      // 颜色数组
      var color = ['peru', 'goldenrod', 'yellow',
        'chartreuse', 'palevioletred', 'deeppink',
        'pink', 'palegreen', 'plum',
        'darkorange', 'powderblue', 'orangered',
        'orange', 'orchid', 'red',
        'aqua', 'salmon', 'gold', 'lawngreen'
      ];
      var divmain = document.createElement('div');
      var first = document.createElement('div');
      var second = document.createElement('div');
      // 给div加属性
      divmain.setAttribute('id', 'love');
      divmain.setAttribute('class', 'love');
      first.setAttribute('id', 'first');
      second.setAttribute('id', 'second');
      // 向最外层内添加内层div
      divmain.appendChild(first);
      divmain.appendChild(second);
      // 根据鼠标位置来确定div的位置
      divmain.style.cssText = 'top:' + e.pageY + 'px;left:' + e.pageX + 'px';

      // 给心形div加随机颜色
      first.style.backgroundColor = color[num];
      second.style.backgroundColor = color[num];
      body.appendChild(divmain);
      setTimeout(function () {
        divmain.remove();
      }, 3500);
      this.getLoveNum(1);
    },
    // 获取最新公告 第一版
    // getNewComment () {
    //   // 公告展示时间
    //   let currentDate = Math.ceil(new Date().getTime() / 1000);
    //   if (this.activity.announcement_info) {
    //     if (Number(this.activity.announcement_info.end_time) < currentDate) {
    //       this.liveNoticeFlag = false;
    //     }
    //   }
    // },
    // 获取点赞数
    getLoveNum(num) {
      $.http(this.baseUrl + 'index.php?m=Apicloud_live&c=activity&a=xin', {
          activity_id: this.activity.id,
          app_secret: this.activity.app_secret,
          xin_num: num
        }, 'GET')
        .then(res => {
          if (!res.ErrorCode) {
            this.loveNum = res.data.num;
          }
        });
    },
    // 获取最新公告
    getNewTips() {
      // 如果没有app_secret 不展示最新公告
      if (!this.activity.app_secret) {
        return false;
      }
      $.http(this.baseUrl + 'index.php', {
          m: 'Apicloud_live',
          c: 'announcement',
          a: 'getAnnouncementList',
          activity_id: this.activity.id,
          app_secret: this.activity.app_secret
        }, 'GET')
        .then(res => {
          if (res[0] && res[0].content) {
            this.liveNotice = res[0].content;
            if (localStorage.getItem('liveNoticeId') == res[0].id) {
              return;
            }
            this.liveNoticeFlag = true;
            localStorage.setItem('liveNoticeId', res[0].id);
          }
        });
    },
    getUserImgList() {
      // m=Apicloud_live&c=share&a=getChatroomInfo
      $.http(this.baseUrl + '?m=Apicloud_live&c=share&a=getChatroomInfo', {
          count: 3,
          chatroom_id: this.activity.id
        }, 'GET')
        .then(res => {
          if (res.users) {
            res.users.forEach(item => {
              item.user_id = item.id
            })
            this.userImgList = res.users
            this.firstUserImgList = res.users
          }
        });
    },
    // 二次分享
    share() {
      let debug = this.getParam('debug');
      var _url = encodeURIComponent(location.href.split('#')[0]);
      // console.log('-url', _url);
      var wxjssdkurl;
      if (debug) {
        wxjssdkurl = `https://wxjssdk2.hoge.cn/index.php?site_id=${this.activity.custom_appid}&url=${_url}&debug=${debug}`;
      } else {
        wxjssdkurl = `https://wxjssdk2.hoge.cn/index.php?site_id=${this.activity.custom_appid}&url=${_url}`;
      }
      // console.log('axurl', wxjssdkurl);
      $.http(wxjssdkurl, 'GET').then((res) => {
        // console.log('res', res);
        if(!res.ErrorMessage){
          document.getElementById('wxjs').innerHTML = res;
        }
      });
    },
    videoPlay() {
      this.playIcon = false;
      var video = document.getElementsByTagName('video')[0];
      video.play();
    },
    _addEventListener() {
      var video = document.getElementsByTagName('video')[0];
      video.addEventListener('play', () => {
        this.playIcon = false;
      });
      video.addEventListener('pause', () => {
        this.playIcon = true;
      });
    },
    /* ios键盘回弹**********************************************/
    kickBack() {
      // alert("是去焦点了");
      setTimeout(() => {
        window.scrollTo(0, document.body.scrollTop + 1);
        document.body.scrollTop >= 1 && window.scrollTo(0, document.body.scrollTop - 1);
      }, 10);
    },
    /* ios键盘回弹end**************************************/
    goPrev () {
      if (this.currentPage === 1) return
      this.currentPage --
    },
    goNext () {
      if (this.currentPage === this.totalPage) return
      this.currentPage ++
    },
    toggleGoodsMask () {
      this.goodsFlag = !this.goodsFlag
    }
  }
});