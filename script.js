const vue = Vue.createApp({
  data() {
    return {
      songId: 1, // 曲ID
      lylic: `曲名 / アーティスト

ここに歌詞を貼り付けます`, // 歌詞
      lylics: [], // 歌詞を行ごとに分解したデータ
      jimaku: '', // 字幕のテキスト
      jimakuIndex: 0, // 字幕の行番号
      jimakuBackColor: "#00FF00", // 字幕の背景色
      jimakuTextColor: "#3333FF", // 字幕のテキストカラー
      jimakuFontFamily: "'Kiwi Maru', serif", // 字幕フォントファミリー
      jimakuFontSize: "42pt", // 字幕フォントサイズ
      jimakuAnim: false // 字幕をアニメーションさせるか
    }
  },

  methods: {
    loadSong(songId) { // データをローカルストレージから読込み
      if (localStorage.length) {
        this.lylic = localStorage.getItem(songId);
        this.changeLylic();
      }
    },

    changeLylic() { // 歌詞が更新されたときに保存して画面更新
      localStorage.setItem(this.songId, this.lylic);
      this.lylics = (this.lylic || '').split('\n');
      this.updateJimaku();
    },

    moveEditorCousor(e) { // エディター内で十字キーまたはエンターを押した時に字幕の行番号を更新
      switch (e.keyCode) {
        case 13: 
        case 37: 
        case 38: 
        case 39: 
        case 40: 
          this.updateJimakuIndex();
          break;
      }
    },

    setJimakuIndex(value) { // 字幕行番号の変更→字幕更新
      if (this.jimakuIndex === value) {
        return;
      }

      if (!value || value < 0 || this.lylics.length-1 < value) {
        this.jimakuIndex = 0;
      } else {
        this.jimakuIndex = value;
      }
      this.updateJimaku();
    },

    updateJimakuIndex() { // 字幕行番号をカーソルの位置に更新
      if (document.activeElement.tagName !== "TEXTAREA") {
        return;
      }
      const match = this.lylic.substr(0, document.activeElement.selectionStart).match(/\n/g);
      const jimakuIndex = match ? match.length : 0;
      this.setJimakuIndex(jimakuIndex);
    },

    updateJimaku() { // 字幕の更新
      if (this.jimakuAnim) {
        this.jimaku = ""; // Reset animation
      }
      setTimeout(() => {
        this.jimaku = this.lylics[this.jimakuIndex];
        $("#jimaku-0").addClass("jimaku-0");
        $("#jimaku-1").addClass("jimaku-1");
        $("#jimaku-2").addClass("jimaku-2");
      }, 50); // Animation waiting
    },

    windowKeyEvent(event) { // ショートカットキー制御
      const tagName = document.activeElement.tagName; 
      if (["INPUT", "TEXTAREA"].includes(tagName)) {
        return;
      }

      switch (event.keyCode) {
        case 37: this.setJimakuIndex(this.jimakuIndex-1); break;
        case 39: this.setJimakuIndex(this.jimakuIndex+1); break;
      }
    },

  },
  mounted: function () { // ウィンドウ読込み時の初期化
    this.$nextTick(function () {
      this.loadSong(this.songId);
    })
  },
}).mount('#jimakuGenerator');

// ショートカットキー用のイベント取得
$(window).keyup(function(event){
  vue.windowKeyEvent(event);
});