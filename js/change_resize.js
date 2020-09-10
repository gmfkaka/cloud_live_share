// 参考 https://github.com/amfe/lib-flexible/blob/2.0/index.js、https://gist.github.com/xiaojue/0615797dd6a7160177bd
// jshint ignore:start
(function (win) {
  var doc = win.document
  var docEl = doc.documentElement
  var dpr = window.devicePixelRatio || 1

  /**
   * 设置 body 的 fontSize 大小，便于元素继承，避免默认字体过大
   */
  function setBodyFontSize () {
    if (document.body) {
      document.body.style.fontSize = (12 * dpr) + 'px'
    } else {
      document.addEventListener('DOMContentLoaded', setBodyFontSize)
    }
  }
  /**
   * 设置 rem，实际的 rem 用 px 尺寸除以 100 即可
   */
  function setRemUnit () {
    var rem = 100 * (docEl.clientWidth / 375)
    docEl.style.fontSize = rem + 'px'
  }

  setBodyFontSize()
  setRemUnit()
  window.addEventListener('resize', setRemUnit, false)
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) setRemUnit()
  }, false)

  // detect 0.5px supports
  // 如果支持 0.5px 元素可以设置 0.5px 宽
  if (dpr >= 2) {
    var fakeBody = document.createElement('body')
    var testElement = document.createElement('div')
    testElement.style.border = '.5px solid transparent'
    fakeBody.appendChild(testElement)
    docEl.appendChild(fakeBody)
    if (testElement.offsetHeight === 1) {
      docEl.classList.add('hairlines')
    }
    docEl.removeChild(fakeBody)
  }
})(window)
