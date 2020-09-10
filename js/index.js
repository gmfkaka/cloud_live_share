var baseUrl = 'http://cloud_livesc.cloud.hoge.cn/';
var avatar = document.getElementsByClassName('avatar')[0];
var username = document.getElementsByClassName('username')[0];
var sendBtn = document.getElementsByClassName('send-btn')[0];
var input = document.getElementById('send-text');
var container = document.getElementById('comment');
var icon = document.getElementsByClassName('statue-icon');
var numWrap = document.getElementsByClassName('number');
// var liveNum = document.getElementsByClassName('live-num');
var liveNotice = document.getElementsByClassName('live-notice');
var currentDate = Math.ceil(new Date().getTime() / 1000);
var activity = { };
var commentParams = {
  count: 10
};
var timer;
// 获取 活动详情
function getDetail () {
  const id = getParam('cert_id');
  if (!id) {
    window.location = CONFIG.static + 'h5/error.html';
    return;
  }
  var url = 'http://cloud_livesc.cloud.hoge.cn/?m=Apicloud_live&c=share&a=index&cert_id=' + id;
  $.http(url, null, 'GET')
    .then(function (data) {
      activity = data || {};
      if (data.id) {
        commentParams.activity_id = activity.id;
        getCommentList();
        username.innerHTML = data.anchor_info.anchor_username || ''; // 主播名称
        const state = Number(data.time_status) === 0 ? '准备中' : Number(data.time_status) === 1 ? '直播中' : '回看';
        const className = Number(data.time_status) === 0 ? 'notice-icon' : Number(data.time_status) === 1 ? 'live-icon' : 'reply-icon';
        document.getElementsByClassName('status')[0].innerHTML = state; // 直播状态
        icon[0].classList.remove('notice-icon');
        icon[0].classList.remove('reply-icon');
        icon[0].classList.remove('live-icon');
        icon[0].classList.add(className);
        // 头像
        var img = data.anchor_info.anchor_avatar ? `${data.anchor_info.anchor_avatar.host}${data.anchor_info.anchor_avatar.dir}${data.anchor_info.anchor_avatar.filepath}${data.anchor_info.anchor_avatar.filename}` : '././image/avatar.png';
        if (img.length > 0) {
          avatar.src = img;
        }
        // 开始时间
        if (data.start_time) {
          var date = new Date(data.start_time * 1000);
          var Y = date.getFullYear() + '-';
          var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
          var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
          if (Number(data.time_status) === 0) {
            document.getElementsByClassName('start-time')[0].innerHTML = `开始时间：${Y + M + D}`;
          } else {
            document.getElementsByClassName('watch-num')[0].classList.remove('watch-num');
          }
        } else {
          numWrap[0].classList.add('num-wrap');
        }
        // liveNum[0].innerHTML = data.watch_num || 0; // 观看数
        if (data.announcement_info) {
          if (Number(data.announcement_info.start_time) < currentDate && Number(activity.announcement_info.end_time) > currentDate) {
            liveNotice[0].innerHTML = `公告：${data.announcement_info.announcement}`;
            liveNotice[0].classList.remove('hide-panel');
          }
        }
        var options = {
          m3u8: data.camera_info[0].play_stream_url || '',
          // mp4: data.camera_info[0].play_stream_url || '',
          autoplay: false,
          live: Number(data.time_status) === 1,
          width: '375',
          height: '667',
          x5_type: 'h5',
          x5_player: true,
          systemFullscreen: false,
          coverpic: { 'style': 'cover', 'src': Number(data.time_status) === 0 ? data.live_notice.host + data.live_notice.dir + data.live_notice.filepath + data.live_notice.filename : data.indexpic.host + data.indexpic.dir + data.indexpic.filepath + data.indexpic.filename},
          controls: Number(data.time_status) !== 0 ? 'default' : 'none',

          wording: {
          // 2032: '请求视频失败，请检查网络',
          // 2048: '请求m3u8文件失败，可能是网络错误或者跨域问题'
          }
        };
        window.tcplayer = new TcPlayer('video_container', options);
      } else {
        window.location = CONFIG.static + 'h5/error.html';
      }
    });
}

function getParam (name) {
  name = name.replace(/[[\]]/g, '\\$&');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const location = 'http://cloud-live-anchor.cloud.hoge.cn?cert_id=VNdUY3RRMtWOWXs';
  var results = location.match(regex);
  // var results = location.href.match(regex);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, '%20'));
};
(function () {
  getDetail();
  // 评论框 btn的状态
  input.oninput = function (e) {
    if (input.value.length > 0) {
      sendBtn.classList.add('success');
    } else {
      sendBtn.classList.remove('success');
    }
  };
  // end
})();

// 评论列表
var page = 1;
var noMoreData = false;
var newId = -1;
function getCommentList () {
  if (noMoreData) return;
  commentParams.offset = (page - 1) * 10;
  $.http(baseUrl + '?m=Apicloud_live&c=share&a=getCommentList', commentParams, 'GET')
    .then(function (res) {
      const data = res || [];
      if (data.length === 0) return;
      if (newId === data[0].id) return;
      newId = data[0].id;
      data.reverse().forEach(item => {
        var li = document.createElement('li');
        var div = document.createElement('div');
        var span = document.createElement('span');
        var name = document.createElement('span');
        div.setAttribute('class', 'list-item');
        span.setAttribute('class', 'content');
        name.setAttribute('class', 'name');
        span.innerHTML = item.content;
        name.innerHTML = `${item.username}：` || '游客：';
        li.appendChild(div);
        div.appendChild(name);
        div.appendChild(span);
        container.appendChild(li);
      });
      if (data.length < 10) {
        noMoreData = true;
      }
    })
    .then(function () {
    // 定时刷新接口
      timer = setInterval(function () {
        getNewComment();
      }, 3000);
    });
}

// 获取最新评论
function getNewComment () {
  // 公告展示时间
  currentDate = Math.ceil(new Date().getTime() / 1000);
  if (activity.announcement_info) {
    if (Number(activity.announcement_info.end_time) < currentDate) {
      liveNotice[0].classList.add('hide-panel');
    }
  }
  // end
  var params = {
    offset: 0,
    count: 1,
    activity_id: activity.id
  };
  if (newId !== -1) {
    params.last_comment_id = newId;
  }
  $.http(baseUrl + '?m=Apicloud_live&c=share&a=getCommentList', params, 'GET')
    .then(function (res) {
      var data = res || [];
      if (data.length === 0) return;
      if (data[0].id === newId) return;
      var li = document.createElement('li');
      var div = document.createElement('div');
      var span = document.createElement('span');
      var name = document.createElement('span');
      div.setAttribute('class', 'list-item');
      span.setAttribute('class', 'content');
      name.setAttribute('class', 'name');
      span.innerHTML = data[0].content;
      name.innerHTML = `${data[0].username}：` || '游客：';
      li.appendChild(div);
      div.appendChild(name);
      div.appendChild(span);
      container.appendChild(li);
      newId = data[0].id;
    });
}

var timer1;
// 下拉加载更多 评论
function moreData () {
  if (noMoreData) return;
  clearInterval(timer);
  const bottomGutter = container.scrollHeight - container.offsetHeight - container.scrollTop;
  if (bottomGutter < 500) {
    if (timer1) {
      clearTimeout(timer1);
    }
    timer1 = setTimeout(function () {
      page += 1;
      getCommentList();
      timer1 = undefined;
    }, 500);
  };
}

// 展示 评论输入框
function showPanel () {
  if (Number(activity.allow_tourist_comment) !== 1) return;
  document.getElementsByClassName('chat-wrap')[0].classList.remove('hide-panel');
  document.getElementsByClassName('chat-wrap')[0].classList.add('show');
}
function hidePanel () {
  document.getElementsByClassName('chat-wrap')[0].classList.add('hide-panel');
  document.getElementsByClassName('chat-wrap')[0].classList.remove('show');
  input.value = '';
}

// 隐藏/展示 评论列表
function changePanel () {
  const list = document.getElementById('comment').classList;
  const index = list.value.indexOf('hide-panel');
  if (index > 0) {
    document.getElementById('comment').classList.remove('hide-panel');
    document.getElementById('comment').classList.add('show');
    var hideIcon = document.getElementsByClassName('hide-icon');
    hideIcon[0].style.background = "url('./image/hide_icon@2x.png') no-repeat center";
    hideIcon[0].style.backgroundSize = '1.7rem';
    document.getElementsByClassName('send-icon')[0].style.visibility = 'visible';
  } else {
    document.getElementById('comment').classList.remove('show');
    document.getElementById('comment').classList.add('hide-panel');
    document.getElementsByClassName('send-icon')[0].style.visibility = 'hidden';
    var hideIcon = document.getElementsByClassName('hide-icon');
    hideIcon[0].style.background = "url('./image/show.png') no-repeat center";
    hideIcon[0].style.backgroundSize = '1.7rem';
  }
}

// 发送评论
function sendMessage () {
  if (input.value.length === 0) return;
  $.http(baseUrl + '?m=Apicloud_live&c=share&a=comment', {
    content: input.value,
    activity_id: activity.id
  }, 'GET')
    .then(function () {
      document.getElementsByClassName('chat-wrap')[0].classList.remove('show');
      document.getElementsByClassName('chat-wrap')[0].classList.add('hide-panel');
      page = 1;
      noMoreData = false;
      input.value = '';
      getCommentList();
    });
}
