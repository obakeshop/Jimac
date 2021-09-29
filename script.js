const lyricTemplate = `曲名 / アーティスト

ここに歌詞を貼り付けます`;

const jimakuGenerator = Vue.createApp({
  data() {
    return {
      repertory: [], // レパートリー
      target: 1, // 曲ID
      lyric: '', // 歌詞
      jimaku: '', // 字幕テキスト
      jimakuNext: '', // 次の字幕テキスト
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
      db: { // Access to localStorage
        getSongs() {
          return JSON.parse(localStorage.getItem("songs"));
        },
        getSelectedId() {
          return localStorage.getItem("selectedId");
        },
        getSong(id) {
          return JSON.parse(localStorage.getItem(id));
        },
        setSongs(songs) {
          localStorage.setItem("songs", JSON.stringify(songs));
        },
        setSelectedId(id) {
          localStorage.setItem("selectedId", id);
        },
        setSong(songId, data) {
          localStorage.setItem(songId, JSON.stringify({ 
            lyric: data.lyric, 
            jimakuFontSize: data.jimakuFontSize, 
            movieUrl: data.movieUrl, 
            tags: data.tags, 
          }));
        },
      },
    }
  },

  methods: {

    /** Utilities **/
    getlyrics() { return (this.lyric || '').split('\n'); },

    /** Read Methods **/
    loadSong(songId) { // データをローカルストレージから読込み
      const data = this.db.getSong(songId);
      this.target = songId;
      this.lyric = data.lyric;
      this.jimakuFontSize = data.jimakuFontSize;
      this.movieUrl = data.movieUrl;
      this.tags = data.tags;
      $('#lyric').prop('selectionStart', 0); 
      this.changelyric();
    },

    loadRepertory() { // レパートリーを最新状態にする
      this.repertory = this.db.getSongs().map( id => {
        return { 
          id, 
          title: this.db.getSong(id).lyric.split('\n')[0], 
          tags: this.db.getSong(id).tags,
        }; 
      });
    },

    /** Data modifying Methods **/
    createSong() { // データ新規作成
      this.target = Date.now();
      this.lyric = lyricTemplate;
      this.jimakuFontSize = '42pt';
      this.movieUrl = '';
      this.tags = '';
      this.db.setSong(this.target, this.$data);

      this.db.setSongs([this.target].concat(this.db.getSongs() || []));

      this.loadRepertory();
      this.selectSong(this.target);
      return this.target;
    },

    changelyric() { // 歌詞が更新されたときに保存して画面更新
      this.db.setSong(this.target, this.$data);
      this.update();
    },

    deleteSong() { // データ消去

      if (this.lyric !== lyricTemplate && !confirm('本当に消去しますか？')) {
        return;
      }

      // 削除対象のデータをフィルタして上書き保存
      let songs = this.db.getSongs().filter( id => {
        return id !== this.target;
      });
      this.db.setSongs(songs);
      localStorage.removeItem(this.target);

      if (!songs.length) { // 全部消しちゃったら１個新規で作る
        songs.push(this.createSong());
      }
      
      this.selectSong(songs[0]);
      this.update();
    },

    /** Controll Methods **/

    update() {
      this.updateJimaku();
      this.updateMovieUrl();
      this.loadRepertory();
    },

    selectSong(id) { // 指定した曲を表示し、選択状態にする
      this.loadSong(id);
      this.setJimakuIndex(0);
      this.db.setSelectedId(id);
      this.update();
    },
    
    updateJimaku() { // 字幕の更新
      if (this.jimakuAnim) {
        this.jimaku = ""; // Reset animation
      }
      setTimeout(() => {
        this.jimaku = this.getlyrics()[this.jimakuIndex];
        this.jimakuNext = this.getlyrics()[this.jimakuIndex+1];
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
    
    updateMovieUrl() { // 動画情報更新
      this.db.setSong(this.target, this.$data);

      const backup = this.movieUrl;
      const nicoElement = document.getElementById('nico');
      this.movieType = "";
      this.movieUrl = "";
      this.movieSrc = "";
      nicoElement.innerHTML = "";

      setTimeout(() => {
        this.movieUrl = backup;

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
      }, 50); // Refresh delay
    },
    
    updateJimakuFontSize() {
      this.db.setSong(this.target, this.$data);
    },
    
    updateTags() {
      this.db.setSong(this.target, this.$data);
      this.update();
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

  /** Initialize **/
  mounted: function () {
    this.$nextTick(function() {
      if (!localStorage.length) {
        this.createSong();
      } else {
        this.loadRepertory();
        this.selectSong(this.db.getSelectedId());
      }
    })
  },

}).mount('#jimakuGenerator');

// ショートカットキー用のイベント取得
$(window).keyup(function(event) {
  jimakuGenerator.windowKeyEvent(event);
});

new Clipboard('#jimaku'); // clipboard.js