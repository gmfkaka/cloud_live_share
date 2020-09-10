(function (window) {
  var debug = typeof __DEV__ === 'undefined';

  window.CONFIG = {
    static: debug ? 'http://localhost/cloud_live_admin/' : '/qd/app/'
  }

})(window);
