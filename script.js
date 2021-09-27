const jimakuGenerator = Vue.createApp({
  data() {
    return {
      songId: 1, // 曲ID
      lyric: `曲名 / アーティスト

ここに歌詞を貼り付けます`, // 歌詞
      jimaku: '', // 字幕のテキスト
      jimakuIndex: 0, // 字幕の行番号
      jimakuBackColor: "#00FF00", // 字幕の背景色
      jimakuTextColor: "#3333FF", // 字幕のテキストカラー
      jimakuFontFamily: "'Kiwi Maru', serif", // 字幕フォントファミリー
      jimakuFontSize: "42pt", // 字幕フォントサイズ
      jimakuAnim: false, // 字幕をアニメーションさせるか
      jimakuOutline: true, // 字幕の縁取り
    }
  },

  methods: {
    
    loadSong(songId) { // データをローカルストレージから読込み
      this.songId = songId
      this.lyric = localStorage.getItem(songId);
      document.getElementById('lyric').selectionStart = 0;
      this.changelyric();
    },

    save(sondId, lyric) {
      this.songId = sondId;
      this.lyric = lyric;
      localStorage.setItem(this.songId, this.lyric);
    },

    changelyric() { // 歌詞が更新されたときに保存して画面更新
      this.save(this.songId, this.lyric);
      this.updateJimaku();
      repertory.load();
    },

    getlyrics() { return (this.lyric || '').split('\n'); },

    moveEditorCousor(e) { // エディター内で十字キーまたはエンターを押した時に字幕の行番号を更新
      if ([13,37,38,39,40].includes(e.keyCode)) {
        this.updateJimakuIndex();
      }
    },

    setJimakuIndex(value) { // 字幕行番号の変更→字幕更新
      if (this.jimakuIndex === value) {
        return;
      }

      const invalid = v => !v || v < 0 || this.getlyrics().length-1 < v;
      this.jimakuIndex = invalid(value) ? 0 : value;
      this.updateJimaku();
    },

    updateJimakuIndex() { // 字幕行番号をカーソルの位置に更新
      if (document.activeElement.tagName !== "TEXTAREA") {
        return;
      }
      const match = this.lyric.substr(0, document.activeElement.selectionStart).match(/\n/g);
      this.setJimakuIndex(match ? match.length : 0);
    },

    updateJimaku() { // 字幕の更新
      if (this.jimakuAnim) {
        this.jimaku = ""; // Reset animation
      }
      setTimeout(() => {
        this.jimaku = this.getlyrics()[this.jimakuIndex];
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

    deleteSong() { // データ消去
      let songs = JSON.parse(localStorage.getItem("songs")).filter( e => {
        return e.id !== this.songId;
      });
      localStorage.setItem("songs", JSON.stringify(songs));
      localStorage.removeItem(this.sondId);

      if (!songs.length) {
        repertory.addSong();
      }

      repertory.load();
      repertory.select(songs[0].id);
    },

    createSong() { // データ新規作成
      this.save(
        Date.now(), 
        `曲名 / アーティスト

ここに歌詞を貼り付けます`);
      const song = { id: this.songId, title: this.getlyrics()[0] };
      let songs = JSON.parse(localStorage.getItem("songs")) || [];
      songs.push(song);
      localStorage.setItem("songs", JSON.stringify(songs));
      return song;
    }
  },

}).mount('#jimakuGenerator');

const repertory = Vue.createApp({
  data() {
    return {
      repertory: [],
    }
  },
  methods: {
    select(id) {
      jimakuGenerator.loadSong(id);
      localStorage.setItem("selectedId", id);
      
    },
    addSong() {
      const song = jimakuGenerator.createSong();
      localStorage.setItem("selectedId", song.id);
      this.load();
      this.select(localStorage.getItem("selectedId"));
    },
    getTitle(songId) {
      const title = localStorage.getItem(songId).split('\n')[0];
      return title.length <= 13 ? title : title.substr(0, 13) + '...';
    },
    load() {
      this.repertory = JSON.parse(localStorage.getItem("songs")).map( e => { 
        return { id: e.id, title: this.getTitle(e.id) }; 
      });
    }
  },
  mounted: function () { // ウィンドウ読込み時の初期化
    this.$nextTick(function() {
      if (!localStorage.length) {
        this.addSong();
      } else {
        this.load();
      }
      this.select(localStorage.getItem("selectedId"));
    })
  },
}).mount('#repertory');

// ショートカットキー用のイベント取得
$(window).keyup(function(event) {
  jimakuGenerator.windowKeyEvent(event);
});

new Clipboard('#jimaku');