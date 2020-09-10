/**
 * 工具库 https://github.com/winjo/my-utils
 */

// Promise.finally
(function () {

  "use strict";

  if (typeof Promise.prototype.finally === 'function') return;
  Promise.prototype.finally = function (onFinally) {
    var P = this.constructor;
    var isFunction = typeof onFinally == 'function';
    return this.then(
      isFunction ? function (x) {
        return P.resolve(onFinally()).then(function () { return x; });
      } : onFinally,
      isFunction ? function (e) {
        return P.resolve(onFinally()).then(function () { throw e; });
      } : onFinally
    );
  };
})();

(function (window) {

  "use strict";

  var $,
    doc= window.document,
    arr = [],
    slice = arr.slice;

  /**
   * 选择器
   */
  $ = function (selector) {
    if (typeof selector !== 'string') throw new Error('请传入选择器');
    if (/^#[^\s]*$/.test(selector)) return doc.getElementById(selector.slice(1));
    return doc.querySelectorAll(selector);
  };

  function extend (target, source, deep) {
    var isObj, isArr, src, tgt, key;
    if ($.isUndef(source)) return;
    for (key in source) {
      src = source[key];
      tgt = target[key];
      isObj = $.isPlainObject(src);
      isArr = $.isArray(src);
      if (deep && (isObj || isArr)) {
        if (isObj && !$.isPlainObject(tgt)) {
          target[key] = {};
        }
        if (isArr && !$.isArray(tgt)) {
          target[key] = [];
        }
        extend(target[key], source[key], deep);
      } else if (src !== undefined) {
        target[key] = source[key];
      }
    }
  }

  $.extend = function (target) {
    var deep = false,
      sources = slice.call(arguments, 1);

    if ($.isBoolean(target)) {
      deep = target;
      target = sources.shift();
    }
    if (!sources.length) {
      sources.push(target);
      target = this;
    }
    sources.forEach(function (source) {
      extend(target, source, deep);
    });
    return target;
  };

  function isArrayLike( obj ) {
    var length = !!obj && 'length' in obj && obj.length;
    return $.isArray(obj) || length === 0 || $.isNumber(length) && length > 0 && ( length - 1 ) in obj;
  }

  $.each = function (obj, cb) {
    var i = 0, len;
    if (isArrayLike(obj)) {
      len = obj.length;
      for (; i < len; i++) {
        if (cb.call(obj[i], obj[i], i, obj) === false) {
          break;
        }
      }
    } else {
      for (i in obj ) {
        if (cb.call(obj[i], obj[i], i, obj) === false ) {
          break;
        }
      }
    }
    return obj;
  };

  $.map = function (obj, cb) {
    var i = 0, len, result = [], value;
    if (isArrayLike(obj)) {
      len = obj.length;
      for (; i < len; i++) {
        value = cb.call(obj[i], obj[i], i, obj);
        if ($.isDef(value)) {
          result.push(value);
        }
      }
    } else {
      for (i in obj ) {
        value = cb.call(obj[i], obj[i], i, obj);
        if ($.isDef(value)) {
          result.push(value);
        }
      }
    }
    return result;
  };

  window.Hoge = $;
  window.$ === undefined && (window.$ = $); // jshint ignore:line

})(window);

// 类型判断
(function ($) {

  "use strict";

  var toString = Object.prototype.toString;

  function isUndefined(val) {
    return val === undefined;
  }

  function isNull(val) {
    return val === null;
  }

  function isUndef(val) {
    return val === null || typeof val === 'undefined';
  }

  function isDef(val) {
    return val !== null && typeof val !== 'undefined';
  }

  function isString(val) {
    return typeof val === 'string';
  }

  function isNumber(val) {
    return typeof val === 'number';
  }

  function isBoolean(val) {
    return typeof val === 'boolean';
  }

  function isObject(val) {
    return val !== null && typeof val === 'object';
  }

  function isFunction(val) {
    return typeof val === 'function';
  }

  function isPlainObject(val) {
    return toString.call(val) === '[object Object]';
  }

  function isArray(val) {
    return Array.isArray ? Array.isArray(val) : toString.call(val) === '[object Array]';
  }

  function isDate(val) {
    return toString.call(val) === '[object Date]';
  }

  function isRegExp(val) {
    return toString.call(val) === '[object RegExp]';
  }

  function isFormData(val) {
    return toString.call(val) === '[object FormData]';
  }

  function isPromise(val) {
    return val !== null && typeof val === 'object' && typeof val.then === 'function';
  }

  $.isArray = isArray;
  $.isBoolean = isBoolean;
  $.isDate = isDate;
  $.isDef = isDef;
  $.isFormData = isFormData;
  $.isFunction = isFunction;
  $.isNull = isNull;
  $.isNumber = isNumber;
  $.isObject = isObject;
  $.isPlainObject = isPlainObject;
  $.isPromise = isPromise;
  $.isRegExp = isRegExp;
  $.isString = isString;
  $.isUndef = isUndef;
  $.isUndefined = isUndefined;

})(window.Hoge);

// 格式化日期
(function ($) {

  "use strict";

  /**
   * 固定数字长度
   * @param {String | Number} num 数字
   * @param {Number} len 需要固定的长度
   * @return {String} 固定后的字符串
   */
  function fixSize(num, len) {
    num = num + '';
    var l = num.length;
    var diff = l - len;
    if (diff < 0) { // 长度不够就补0
      return new Array(-diff + 1).join('0') + num;
    } else { // 长度超出接截取
      return num.slice(diff);
    }
  }

  /**
   * 格式化日期
   * @param {Date} [date] [日期对象]
   * @param {String} [formatStr] [格式化字符串形式 如 `yyyy-MM-dd hh:mm:ss`]
   * @return {String} [格式化后的字符串]
   * example: formatDate(new Date, 'yyyy:MM:dd hh:mm:ss.S 第qq季度 星期w or y:M:d h:m:s.S q w')
   * result: 2017:10:05 16:33:06.347 第04季度 星期四 or 2017:10:5 16:33:6.347 4 四
   */

  function formatDate(date, formatStr) {
    var Week = ['日', '一', '二', '三', '四', '五', '六'];
    var regs = {
      'y+': date.getFullYear() + '', // 年份
      'M+': date.getMonth() + 1 + '', // 月份
      'd+': date.getDate() + '', // 日
      'h+': date.getHours() + '', // 小时
      'm+': date.getMinutes() + '', // 分
      's+': date.getSeconds() + '', // 秒
      'q+': Math.floor((date.getMonth() + 3) / 3) + '', // 季度
      'w': Week[date.getDay()], // 周
      'S': date.getMilliseconds() + '' // 毫秒
    };
    Object.keys(regs).forEach(function (rstr) {
      var replaceRegexp = new RegExp(rstr, 'g');
      formatStr = formatStr.replace(replaceRegexp, function(match) {
        var value = regs[rstr];
        var len = match.length;
        return len === 1 ? value : fixSize(value, len); // 模式为1位时直接返回原值
      });
    });
    return formatStr;
  }
  $.formatDate = formatDate;

})(window.Hoge);

// delay
(function ($) {

  "use strict";

  function delay(time) {
    return new Promise(function(resolve) {
      setTimeout(function() {
        resolve(true);
      }, time);
    });
  }

  $.delay = delay;

})(window.Hoge);

// 转义、反转义
(function ($) {

  "use strict";

  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  };

  var unescapeMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'"
  };

  var create = function (map) {
    return function(match) {
      return map[match];
    };
  };

  var escaper = create(escapeMap);

  var unescaper = create(unescapeMap);

  var isUndef = function(val) {
    return val === null || typeof val === 'undefined';
  };

  function escapeHTML(str) {
    str = isUndef(str) ? '' : str + '';
    return str.replace(/[&<>"']/g, escaper);
  }

  function unescapeHTML(str) {
    str = isUndef(str) ? '' : str + '';
    return str.replace(/&(?:amp|lt|gt|quot|apos);/g, unescaper);
  }

  $.escapeHTML = escapeHTML;
  $.unescapeHTML = unescapeHTML;

})(window.Hoge);

// 链式取值
(function ($) {

  "use strict";

  /**
   * [^.[\]]+  |
   * \[(
   *  ?:(-?\d+(?:\.\d+)?)  |
   *  ( ["'] )( ( ?:.)*? )\2
   * )\]
   */
  var REG_PROP = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:.)*?)\2)\]/g;

  /**
   * get({ a: [{ '\\b':{ '-2':{ c: 2 } } }] }, 'a[0]["\\b"][-2].c')
   * @param {Object} obj [取值对象]
   * @param {String} path [路径字符串]
   * @return {*} [属性值或 undefined]
   */
  function get(obj, path) {
    if (obj === null && typeof obj === 'undefined') return;
    var pathArr = (function(pathStr) {
      var result = [];
      if (/^\./.test(pathStr)) result.push('');
      pathStr.replace(REG_PROP, function(match, number, quote, str) {
        result.push(quote ? str : (number || match));
      });
      return result;
    })(path);

    var index = 0;
    var len = pathArr.length;
    while(obj !== null && typeof obj !== 'undefined' && index < len) {
      obj = obj[pathArr[index++]];
    }
    return obj;
  }

  $.get = get;

})(window.Hoge);

// http 请求
(function ($) {

  "use strict";

  /**
   * 编码字符串
   * @param {Sting} val
   */
  function encode(val) {
    return encodeURIComponent(val).replace(/%20/g, '+');
  }

  /**
   * 解码字符串
   * @param {Sting} val
   */
  function decode(val) {
    return decodeURIComponent(val.replace(/\+/g, '%20'));
  }

  /**
   * 序列化查询参数
   * @param {Object} obj
   * @return {String}
   */
  function serialize(obj) {
    if (!obj || typeof obj !== 'object') return '';
    var toString = Object.prototype.toString;
    var pairs = [];
    Object.keys(obj).forEach(function (key) {
      var val = obj[key];
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (toString.call(val) !== '[object Array]') {
        val = [val];
      }

      val.forEach(function (v) {
        if (toString.call(v) === '[object Date]') {
          v = v.toISOString();
        } else if (typeof v === 'object') {
          v = JSON.stringify(v);
        }
        pairs.push(encode(key) + '=' + encode(v));
      });
    });
    return pairs.join('&');
  }

  /**
   * 反序列化查询参数
   * @param  {String?} querystring 查询字符串
   * @return {Object} 解析后的查询字符串对象
   */
  function deserialize(querystring) {
    querystring = querystring || window.location.search.slice(1);
    var query = {}, key, value;
    querystring.split('&').forEach(function (pair) {
      var pos = pair.indexOf('=');
      if (pos >= 0) {
        key = decode(pair.slice(0, pos));
        value = decode(pair.slice(pos + 1));
        if (query.hasOwnProperty(key)) {
          query[key] = [].concat(query[key]);
          query[key].push(value);
        } else {
          query[key] = value;
        }
      }
    });
    return query;
  }

  /**
   * http 请求
   * @param {String} url 请求的 url
   * @param {Object | null} data 发送的数据
   * @param {String} method 请求的方法
   * @param {Object?} config 配置项
   * @return {Promise} promise 对象
   */
  function http(url, data, method, config) {
    return new Promise(function (resolve, reject) {
      method = method ? method.toUpperCase() : 'GET';
      config = config || {};

      var headers = config.headers || {};

      if (method === 'GET' && data !== null) {
        var queryString = serialize(data);
        if (queryString !== '') {
          url += (url.indexOf('?') === -1 ? '?' : '&') + queryString;
        }
      } else if (data) {
        var toString = Object.prototype.toString;
        if (toString.call(data) === '[object Object]') {
          data = JSON.stringify(data);
          headers['Content-Type'] = 'application/json;charset=utf-8';
        } else if (typeof data === 'string') {
          headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
        }
      }

      var xhr = new XMLHttpRequest();

      xhr.open(method, url, true);

      xhr.timeout = config.timeout || 0;

      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            var result = !config.responseType || config.responseType === 'text' ? xhr.responseText : xhr.response;
            if (typeof result === 'string') {
              try {
                result = JSON.parse(result);
              } catch (e) {}
            }
            resolve(result);
          } else {
            reject(new Error('Request failed with status code ' + xhr.status));
          }
        }
      };

      xhr.onerror = function () {
        reject(new Error('Network Error'));
        xhr = null;
      };

      xhr.ontimeout = function () {
        reject(new Error('timeout of ' + config.timeout + 'ms exceeded'));
        xhr = null;
      };

      if ('setRequestHeader' in xhr) {
        Object.keys(headers).forEach(function (key) {
          if (method === 'GET' && key.toLowerCase() === 'content-type') {
            delete headers[key];
          } else {
            xhr.setRequestHeader(key, headers[key]);
          }
        });
      }

      if (config.withCredentials) {
        xhr.withCredentials = true;
      }

      if (config.responseType) {
        try {
          xhr.responseType = config.responseType;
        } catch (e) {
          if (config.responseType !== 'json') {
            throw e;
          }
        }
      }

      xhr.send(data);
    });
  }

  $.serialize = serialize;
  $.deserialize = deserialize;
  $.http = http;

})(window.Hoge);

// 模板字符串
(function ($) {

  "use strict";

  /**
   * 模板字符串，编译诸如 "a = ${b}"的模板
   * 不存在属性以及属性为null编译为空字符串
   * ${}内容为空的直接取作用域对象
   * @type {String} [模板]
   * @type {Object?} [作用域]
   * @return {String|Function} [编译完成的字符串或编译函数]
   */
  var INTERPOLATE = /\$\{([^\}]*)\}/g;
  function tmpl(str, data) {
    var tmpl = "var __ = [];" +
      "with(scope || {}){" +
        "__.push('" +
        str.trim()
          .replace(/([\\'])/g, "\\$1")
          .replace(/[\r\t\n]/g, " ")
          .replace(INTERPOLATE, function(all, target) {
            target = target.replace(/\\'/g, "'").replace(/\\\\/g, "\\").trim();
            var expr = target || "scope";
            return "');" +
              "if (" + (target ? "typeof " + target + " !== 'undefined' && " + target + " != null" : "true") + ") {" +
              "__.push(" + expr + ")" + "}" +
              "__.push('";
          }) + "');" +
      "}" +
      "return __.join('');";
    var fn = new Function('scope', tmpl); // jshint ignore:line
    return data ? fn(data) : fn;
  }

  $.tmpl = tmpl;

})(window.Hoge);

// 正则字符串转义
(function ($) {

  "use strict";

  /**
   * 转义正则字符串，方便书写
   */
  function escape (str) {
    return String(str).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  $.escape = escape;

})(window.Hoge);

// 地址拼接
function filterUrl(obj) {
  let url = '';
  if (obj instanceof Object) {
    if (obj.host && obj.dir && obj.filepath && obj.filename) {
      url = `${obj.host}${obj.dir}${obj.filepath}${obj.filename}`;
    }
  } else if (obj instanceof String) {
    url = obj;
  }
  return url;
};

// 图片url拼接处理
function cutImg (obj, width, height) {
  const imgwidth = width || obj.imgwidth;
  const imgheight = height || obj.imgheight;
  if(obj && Object.keys(obj).length > 0) {
    var url = obj.host + obj.dir + obj.filepath + obj.filename;
  }
  url = url.replace('{$hgPicSizeStart}', '').replace('{$hgPicSizeWidth}', imgwidth).replace('{$hgPicSizeHeight}', imgheight).replace('{$hgPicSizeEnd}', '');
  return url;
}