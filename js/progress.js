/**
 * ロードまでの進捗を計算するクラス
 * @author Yuki Sakaguchi
 */
var Progress = (function () {
  var PAR = 100
  var Progress, p, eventName

  eventName = {
    start: 'progressStart',
    update: 'progressUpdate',
    complete: 'progressComplete'
  }

  /**
   * @constructor
   * @param {Object} 設定オブジェクト
   */
  Progress = function (options) {
    // デフォルト設定
    this.progress = 0
    this.options = {
      about: false, // なんちゃってプログレスにする
      target: 'img', // ロードを計測する要素
      minSeconds: 1000, // 早くロードが終わった時も最低かかるロード時間
    }
    // 引数で設定を更新
    if (options) {
      Object.keys(options).forEach(function (key) {
        this.options[key] = options[key]
      }.bind(this))
    }
    // イベントの管理
    this.eventList = {}
    Object.keys(eventName).forEach(function (key) {
      this.eventList[eventName[key]] = this._createEvent(eventName[key])
    }.bind(this))
  }
  
  p = Progress.prototype

  /**
   * プログレス処理スタート
   */
  p.start = function () {
    // スタート前に設定
    var self = this
    var isAbout = self.options.about // なんちゃってかどうか
    var isMinSeconds = this.options.minSeconds ? false : true // 最低秒数の設定がなければ初めからtrue
    var parRate = 1

    // ちゃんと測る場合の設定
    if (!self.options.about) {
      var elTarget = document.querySelectorAll(self.options.target)
      if (elTarget && elTarget.length > 0) {
        // 対象の要素をロードし直して、確かめる
        parRate = Math.floor(PAR / elTarget.length)
      } else {
        isAbout = true // 対象がなかったらなんちゃってで代用
      }
    }

    // 既にロード済みの場合終了
    if (PAR == self.progress) {
      console.warn('[progress.js] ロードは既に完了しています')
      return false
    }

    // 処理スタート
    self._fire(eventName.start)

    // ちゃんと測る場合の処理
    if (!self.options.about) {
      elTarget.forEach(function (e) {
        var t = document.createElement(self.options.target)
        t.addEventListener('load', function () {
          self.progress += parRate
          self._fire(eventName.update)
        })
        t.setAttribute('src', e.getAttribute('src')) // 画像の場合
      })
    }

    // 更新開始
    var progressTimer = setInterval(function () {
      if (self.progress >= PAR-parRate) {
        if (isMinSeconds) {
          // ロード完了
          clearInterval(progressTimer)
          self.progress = PAR
          self._fire(eventName.complete)
        } else if (self.progress < PAR-1) {
          // 読み込みが終わってもまだ最低秒数に達していない場合、99%まで増やす
          self.progress++
          self._fire(eventName.update)  
        }
      } else {
        // なんちゃってロードの場合はこっち
        if (isAbout) self.progress += parRate
        self._fire(eventName.update)
      }
    }, 1)
    
    // 最低秒数が設定されている場合はそれまで完了を待つ
    if (!isMinSeconds) {
      setTimeout(function () {
        isMinSeconds = true
      }, self.options.minSeconds)
    }
  }

  /**
   * イベントを作成
   */
  p._createEvent = function (eventName) {
    var event = document.createEvent('HTMLEvents')
    event.initEvent(eventName, true, false)
    return event
  }

  /**
   * イベントを発火
   */
  p._fire = function (eventName) {
    window.dispatchEvent(this.eventList[eventName])
  }

  return Progress
})()