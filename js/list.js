new Vue({
  el: '#app',
  data: {
    baseUrl: 'http://cloud_livesc.cloud.hoge.cn/',
    liveList: [],
    count: 10,
    page: 1,
    access_token: '',
    requested:false
  },
  beforeMounted() {
    this.access_token = this.getCookie('liv_access_token-i')
  },
  methods: {
    getCookie(name) {
      let arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
      if (arr = document.cookie.match(reg)) {
        return unescape(arr[2]);
      } else {
        return null;
      }
    },
    cutImg(obj, width, height) {
      const imgwidth = width || obj.imgwidth
      const imgheight = height || obj.imgheight
      let url = obj.host + obj.dir + obj.filepath + obj.filename
      url = url.replace('{$hgPicSizeStart}', '').replace('{$hgPicSizeWidth}', imgwidth).replace('{$hgPicSizeHeight}', imgheight).replace('{$hgPicSizeEnd}', '')
      return url
    },
    getList() {
      let url = this.baseUrl + '?m=Apicloud_live&c=activity&a=getActivityList'
      $.http(url, {
        time_status: 1,
        access_token: this.access_token,
        app_secret: this.getCookie('app_secret'),
        count: this.count,
        offset: (this.page - 1) * this.count,
        custom_appid:83,
        custom_appkey:'fe9fc289c3ff0af142b6d3bead98a923'
      }, 'GET').then(res => {
        // console.log(res)
       if (this.liveList.length) {
        res.forEach((item) => {
          item.indexPic = this.cutImg(item.indexpic, '375', '200')
          this.liveList.push(item);
        });
        this.requested = true;
       } else {
        res.forEach((item) => {
          item.indexPic = this.cutImg(item.indexpic, '375', '200')
        });
        this.liveList = res
        this.requested = true;
       }
      })
    },
    goDetail(id) {
      location.href = `http://share.fjtv.net/cloud-live//index.html?activity_id=${id}`
    },
    //获取滚动条当前的位置 
    getScrollTop() {
      var scrollTop = 0;
      if (document.documentElement && document.documentElement.scrollTop) {
        scrollTop = document.documentElement.scrollTop;
      } else if (document.body) {
        scrollTop = document.body.scrollTop;
      }
      return scrollTop;
    },

    //获取当前可视范围的高度 
    getClientHeight() {
      var clientHeight = 0;
      if (document.body.clientHeight && document.documentElement.clientHeight) {
        clientHeight = Math.min(document.body.clientHeight, document.documentElement.clientHeight);
      } else {
        clientHeight = Math.max(document.body.clientHeight, document.documentElement.clientHeight);
      }
      return clientHeight;
    },
    //获取文档完整的高度 
    getScrollHeight() {
      return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    },
  },
  mounted() {
    this.getList();
    window.addEventListener('scroll', () => {
      if (this.getScrollTop() + this.getClientHeight() == this.getScrollHeight()) {
          this.page++;
          this.getList();
          if (this.liveList.length < (this.page) * this.count) {
            return
          }
      }

    });
  },
})