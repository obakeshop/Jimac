const lyricTemplate = `曲名 / アーティスト

ここに歌詞を貼り付けます`;

const jimakuGenerator = Vue.createApp({
  data() {
    return {
      repertory: [], // レパートリー
      songId: 1, // 曲ID
      lyric: '', // 歌詞
      jimaku: '', // 字幕のテキスト
      jimakuIndex: 0, // 字幕の行番号
      jimakuBackColor: "#00FF00", // 字幕の背景色
      jimakuTextColor: "#3333FF", // 字幕のテキストカラー
      jimakuFontFamily: "'Kiwi Maru', serif", // 字幕フォントファミリー
      jimakuFontSize: "42pt", // 字幕フォントサイズ
      jimakuAnim: "none", // 字幕をアニメーションさせるか
      jimakuOutline: true, // 字幕の縁取り
    }
  },

  methods: {

    loadRepertory() { // レパートリーを最新状態にする
      const getTitle = (songId) => {
        const title = localStorage.getItem(songId).split('\n')[0];
        return title.length <= 13 ? title : title.substr(0, 13) + '...';
      };
      this.repertory = JSON.parse(localStorage.getItem("songs")).map( id => {
        return { id, title: getTitle(id) }; 
      });
    },
    
    loadSong(songId) { // データをローカルストレージから読込み
      this.songId = songId
      this.lyric = localStorage.getItem(songId);
      $('#lyric').prop('selectionStart', 0); 
      this.changelyric();
    },
    
    saveSong(songId, lyric) {
      this.songId = songId;
      this.lyric = lyric;
      localStorage.setItem(this.songId, this.lyric);
    },
    
    selectSong(id) { // 指定した曲を表示し、選択状態にする
      this.loadSong(id);
      this.setJimakuIndex(0);
      localStorage.setItem("selectedId", id);
    },

    createSong() { // データ新規作成
      this.songId = Date.now();
      this.lyric = lyricTemplate;
      localStorage.setItem(this.songId, this.lyric);

      let songs = JSON.parse(localStorage.getItem("songs")) || [];
      songs.push(this.songId);
      localStorage.setItem("songs", JSON.stringify(songs));

      this.loadRepertory();
      this.selectSong(this.songId);
      return this.songId;
    },

    changelyric() { // 歌詞が更新されたときに保存して画面更新
      localStorage.setItem(this.songId, this.lyric);
      this.updateJimaku();
      this.loadRepertory();
    },

    getlyrics() { return (this.lyric || '').split('\n'); },

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

    setJimakuIndex(value) { // 字幕行番号の変更
      if (this.jimakuIndex !== value) {
        const invalid = v => !v || v < 0 || this.getlyrics().length-1 < v;
        this.jimakuIndex = invalid(value) ? 0 : value;
        this.updateJimaku();
      }
    },

    updateJimakuIndex() { // 字幕行番号をカーソルの位置に更新 #lyric@focus@click
      const match = this.lyric.substr(0, $('#lyric').prop('selectionStart')).match(/\n/g);
      this.setJimakuIndex(match ? match.length : 0);
    },

    moveEditorCousor(e) { // 字幕の行番号を更新 #lyric@keyup
      if ([13,37,38,39,40].includes(e.keyCode)) { // 十字キーまたはエンターを押した時
        this.updateJimakuIndex();
      }
    },

    deleteSong() { // データ消去
      // 削除対象のデータをフィルタして上書き保存
      let songs = JSON.parse(localStorage.getItem("songs")).filter( id => {
        return id !== this.songId;
      });
      localStorage.setItem("songs", JSON.stringify(songs));
      localStorage.removeItem(this.songId);

      if (!songs.length) { // 全部消しちゃったら１個新規で作る
        songs.push(this.createSong());
      }
      
      this.loadRepertory();
      this.selectSong(songs[0]);
      this.updateJimaku();
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
    this.$nextTick(function() {
      if (!localStorage.length) {
        this.createSong();
      } else {
        this.loadRepertory();
        this.selectSong(localStorage.getItem("selectedId"));
      }
    })
  },

}).mount('#jimakuGenerator');

// ショートカットキー用のイベント取得
$(window).keyup(function(event) {
  jimakuGenerator.windowKeyEvent(event);
});

new Clipboard('#jimaku');