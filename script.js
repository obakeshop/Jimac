const lyricTemplate = `曲名 / アーティスト

ここに歌詞を貼り付けます`;

const jimakuGenerator = Vue.createApp({
  data() {
    return {
      repertory: [], // レパートリー
      selectedSong: 1, // 選択中の曲ID
      lyric: '', // 歌詞
      jimaku: '', // 字幕テキスト
      previewText: '', // ヒントテキスト
      jimakuIndex: 0, // 字幕の行番号
      jimakuBackColor: "#00FF00", // 字幕の背景色
      jimakuTextColor: "#3333FF", // 字幕のテキストカラー
      jimakuFontFamily: "'Kiwi Maru', serif", // 字幕フォントファミリー
      jimakuFontSize: "42pt", // 字幕フォントサイズ
      jimakuAnim: "none", // 字幕をアニメーションさせるか
      jimakuOutline: true, // 字幕の縁取り
      preview: false, // プレビューモード
      filter: '', // レパートリー検索条件
      movieType: '', // 動画プラットフォーム
      movieUrl: '', // 動画URL
      movieSrc: '', // 動画埋め込みURL
      tags: '', // 検索用タグ
      hintText: '', // 操作ヒント
    }
  },

  methods: {

    loadRepertory() {
      this.repertory = (JSON.parse(localStorage.getItem("repertory")) || []).map( id => {
        return { 
          id, 
          title: this.getSong(id).lyric.split('\n')[0], 
          tags: this.getSong(id).tags,
        };
      });
    },
    getSong(id) {
      return JSON.parse(localStorage.getItem(id));
    },
    loadSong(id) {
      const data = this.getSong(id);
      this.selectedSong = id;
      this.lyric = data.lyric;
      this.jimakuFontSize = data.jimakuFontSize;
      this.movieUrl = data.movieUrl;
      this.tags = data.tags;
    },
    saveSettings() {
      localStorage.setItem("settings", JSON.stringify({
        jimakuFontFamily: this.jimakuFontFamily,
        jimakuBackColor: this.jimakuBackColor, 
        jimakuTextColor: this.jimakuTextColor,
        jimakuAnim: this.jimakuAnim,
        jimakuOutline: this.jimakuOutline,
        preview: this.preview,
      }));
    },
    createSong() {
      this.selectedSong = Date.now();
      this.lyric = lyricTemplate;
      this.jimakuFontSize = '42pt';
      this.movieUrl = '';
      this.tags = '';
      this.saveSong();
      localStorage.setItem("repertory", JSON.stringify([this.selectedSong].concat((this.repertory || []).map(r => r.id))));
      this.loadRepertory();
    },
    saveSong() {
      localStorage.setItem(this.selectedSong, JSON.stringify({ 
        lyric: this.lyric, 
        jimakuFontSize: this.jimakuFontSize, 
        movieUrl: this.movieUrl, 
        tags: this.tags, 
      }));
    },
    removeSong(target) {
      localStorage.removeItem(target);
      // 削除対象のデータをフィルタして上書き保存
      localStorage.setItem("repertory", JSON.stringify( 
        this.repertory.map(r => r.id).filter( id => {
          return id !== target;
          }
        ))
      );
      this.loadRepertory();
    },

    getlyrics() { return (this.lyric || '').split('\n'); },
    
    async updateJimaku() { // 字幕の更新
      if (this.jimakuAnim) {
        this.jimaku = ""; // Reset animation
      }
      await sleep(50); // Refresh delay
      this.jimaku = this.getlyrics()[this.jimakuIndex];
      this.previewText = this.preview ? this.getlyrics()[this.jimakuIndex+1] : '';
      $("#jimaku-0").addClass("jimaku-0");
      $("#jimaku-1").addClass("jimaku-1");
      $("#jimaku-2").addClass("jimaku-2");
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
    
    async updateMovieUrl() { // 動画情報更新
      const nicoElement = document.getElementById('nico');
      nicoElement.innerHTML = "";

      if (this.movieUrl.indexOf('youtu') !== -1) {
        const match = /[/?=]([-\w]{11})/.exec(this.movieUrl);
        this.movieSrc = `https://www.youtube.com/embed/${ match ? match[1] : '' }`
        this.movieType = 'yt';

      } else if (this.movieUrl.indexOf('nico') !== -1) {
        this.movieType = 'nico';
        // niconico は scriptタグでvueコンポーネントにできないので手動追加
        const nicoId = this.movieUrl.match(/(?:sm|nm|so|ca|ax|yo|nl|ig|na|cw|z[a-e]|om|sk|yk)\d{1,14}\b/)[0];
        const script = document.createElement('script');
        this.movieSrc = `https://embed.nicovideo.jp/watch/${nicoId}/script?w=408&h=230`;
        script.setAttribute('type', 'application/javascript');
        script.setAttribute('src', this.movieSrc);
        nicoElement.appendChild(script);
      }
    },
    
    update() {
      this.updateJimaku();
      this.updateMovieUrl();
      this.loadRepertory();
    },
    
    updateSong() {
      this.saveSong();
      this.update();
    },

    selectSong(id) { // 指定した曲を表示し、選択状態にする
      this.loadSong(id);
      $('#lyric').prop('selectionStart', 0);
      this.updateJimakuIndex();
      this.update();
    },

    deleteSong() { // データ消去
      if (this.lyric !== lyricTemplate && !confirm('本当に消去しますか？')) {
        return;
      }

      this.removeSong(this.selectedSong);

      if (!this.repertory.length) { // 全部消しちゃったら１個新規で作る
        this.createSong();
      } else {
        this.selectSong(this.repertory[0].id);
        this.update();
      }
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

    hint(message) {
      this.hintText = message;
    }
  },

  /** Initialize **/
  mounted: function () {
    this.$nextTick(function() {
      if (!localStorage.length) {
        this.createSong();
      } else {
        this.loadRepertory();
        this.selectSong(this.repertory[0].id);
      }
    })
  },

}).mount('#jimakuGenerator');

async function sleep(ms) {
   return new Promise(r => setTimeout(r, ms));
}

// ショートカットキー用のイベント取得
$(window).keyup(function(event) {
  jimakuGenerator.windowKeyEvent(event);
});

new Clipboard('#jimaku'); // clipboard.js