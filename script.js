'use strict'
const lyricsFirstValue = `曲名 / アーティスト

ここに歌詞を貼り付けます`;

const activationHashes = [
  '962540c1187c0cd1d4a624c124b3842d61ef1654a4957d5afa4bdbd8bf4e561d',
  '2cdc1139506cd061a18ccf12e99f9bee6f16a75a9f371906ce94386180cb5d6c',
  '029b2ecc824c018d8a3ff3998aaa8e82024a24f6952ee993aaf27e9a4ef22c7e',
];

const jimac = Vue.createApp({
  data() {
    return {
      songIds: [], // 曲一覧
      repertory: [], // フルレパートリー
      filteredRepertory: [], // フィルタ済みレパートリー
      selectedSong: 1, // 選択中の曲ID
      lyrics: '', // 歌詞
      jimaku: '', // 字幕テキスト
      previewText: '', // ヒントテキスト
      jimakuIndex: 0, // 字幕の行番号
      jimakuBackColor: "", // 字幕の背景色
      jimakuTextColor: "", // 字幕のテキストカラー
      jimakuFontFamily: "", // 字幕フォントファミリー
      jimakuFontSize: "", // 字幕フォントサイズ
      jimakuAnim: "none", // 字幕をアニメーションさせるか
      jimakuOutline: true, // 字幕の縁取り
      preview: false, // プレビューモード
      searchText: '', // レパートリー検索条件
      movieUrl: '', // 動画URL
      tags: '', // 検索用タグ
      hintText: '', // 操作ヒント
      activationCode: '', // 有料機能解除コード
      isActivated: false,
    }
  },

  computed: {
    selectedIndexFromFilteredRepertory: function() { return this.filteredRepertory.map(r => r.id).findIndex(id => id === this.selectedSong) },
    splitedLyrics: function() { return (this.lyrics || '').split('\n') },
    title: function() { return this.splitedLyrics[0] },
    canShiftUp: function() { return this.selectedIndexFromFilteredRepertory !== 0 },
    canShiftDown: function() { return this.selectedIndexFromFilteredRepertory !== this.filteredRepertory.length-1 },
    ytMovieSrc: function() {
      const match = /[/?=]([-\w]{11})/.exec(this.movieUrl);
      return `https://www.youtube.com/embed/${ match ? match[1] : '' }`
    },
    nicoMovieSrc: function() { 
      const nicoId = this.movieUrl.match(/(?:sm|nm|so|ca|ax|yo|nl|ig|na|cw|z[a-e]|om|sk|yk)\d{1,14}\b/)[0];
      return `https://embed.nicovideo.jp/watch/${nicoId}/script?w=408&h=230`;
    },
    isLocked: function() {
      return this.songIds.length >= 5 && !this.isActivated 
    }
  },

  watch: {
    songIds: {
      handler() {
        localStorage.setItem("songIds", JSON.stringify(this.songIds));
        this.updateRepertory();
      },
      deep: true
    },

    repertory: function() {
      this.repertoryFiltering();
    },

    selectedSong: function() {
      this.loadSong(this.selectedSong);
      $('#lyrics').prop('selectionStart', 0);
      this.updateJimaku();
    },

    lyrics: function() {
      if (!this.isActivated && this.splitedLyrics.length > 71) {
        this.lyrics = this.splitedLyrics.slice(0, 71).join("\n");
        return;
      }
      this.saveSong();
      this.updateRepertory();
      this.updateJimaku();
    },
    
    jimakuIndex: function() {
      this.updateJimaku();
    },

    jimakuBackColor: function() { this.saveSettings(); },
    jimakuTextColor: function() { this.saveSettings(); },
    jimakuFontFamily: function() { this.saveSettings(); },
    jimakuFontSize: function() { this.saveSong(); },
    jimakuAnim: function() { this.saveSettings(); },
    jimakuOutline: function() { this.saveSettings(); },
    preview: function() { this.saveSettings(); },

    searchText: function() {
      this.repertoryFiltering();
      this.selectedSong = this.filteredRepertory[0].id;
    },
 
    movieUrl: function() {
      this.saveSong();
      const video = document.getElementById('video');
      video.innerHTML = "";

      this.$nextTick(function() { // Waiting for reset
        if (this.movieUrl.indexOf('youtu') !== -1) { // youtube
          const element = document.createElement('iframe');
          element.setAttribute("type", "text/html");
          element.setAttribute("width", "409");
          element.setAttribute("height", "230");
          element.setAttribute("src", this.ytMovieSrc);
          element.setAttribute("frameborder", "0");
          element.setAttribute("style", "border-radius: 4px;");
          video.appendChild(element);

        } else if (this.movieUrl.indexOf('nico') !== -1) { // niconico
          const element = document.createElement('script');
          element.setAttribute('type', 'application/javascript');
          element.setAttribute('src', this.nicoMovieSrc);
          video.appendChild(element);
        }
      });
    },
    
    tags: function() {
      if (!this.isActivated && this.tags.length > 20) {
        this.tags = this.tags.substr(0, 20);
        return;
      }
      this.saveSong();
      this.updateRepertory();
    },

    activationCode: async function() {
      this.saveSettings();
      this.isActivated = activationHashes.includes(await sha256(this.activationCode));
    },
    
    isActivated: function() {
      this.saveSettings();
    },
  },

  methods: {
    createSettings() {
      localStorage.setItem("settings", JSON.stringify({
        jimakuBackColor: "#00FF00", 
        jimakuTextColor: "#3333FF",
        jimakuFontFamily: "'Kiwi Maru', serif",
        jimakuAnim: "none",
        jimakuOutline: true,
        preview: false,
        activationCode: '',
        isActivated: false,
      }));
      this.loadSettings();
    },
    createSong() {
      const newId = Date.now();
      localStorage.setItem(newId, JSON.stringify({ 
        lyrics: lyricsFirstValue, 
        jimakuFontSize: '42pt', 
        movieUrl: '', 
        tags: '', 
      }));
      this.songIds = [newId].concat((this.songIds || []));
      this.selectedSong = newId;
    },

    getSong(id) {
      return JSON.parse(localStorage.getItem(id));
    },
    loadRepertory() {
      this.songIds = (JSON.parse(localStorage.getItem("songIds")) || []);
    },
    loadSettings() {
      const settings = JSON.parse(localStorage.getItem("settings"));
      this.jimakuFontFamily = settings.jimakuFontFamily;
      this.jimakuBackColor = settings.jimakuBackColor;
      this.jimakuTextColor = settings.jimakuTextColor;
      this.jimakuAnim = settings.jimakuAnim;
      this.jimakuOutline = settings.jimakuOutline;
      this.preview = settings.preview;
      this.activationCode = settings.activationCode;
      this.isActivated = settings.isActivated;
    },
    loadSong(id) {
      const data = this.getSong(id);
      this.selectedSong = id;
      this.lyrics = data.lyrics;
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
        activationCode: this.activationCode,
        isActivated: this.isActivated,
      }));
    },
    saveSong() {
      localStorage.setItem(this.selectedSong, JSON.stringify({ 
        lyrics: this.lyrics, 
        jimakuFontSize: this.jimakuFontSize, 
        movieUrl: this.movieUrl, 
        tags: this.tags, 
      }));
    },
    shiftSong(songIdA, songIdB) {
      const ids = this.songIds;
      const a = ids.findIndex(id => id === songIdA);
      const b = ids.findIndex(id => id === songIdB);
      ids[a]=[ids[b],ids[b]=ids[a]][0];
      this.songIds = ids;
    },
    removeSong(target) {
      localStorage.removeItem(target);
      this.songIds = this.songIds.filter( id => id !== target ); // 削除対象のデータをフィルタして上書き保存
    },

    updateRepertory() {
      this.repertory = this.songIds.map( id => {
        return {
          id,
          title: this.getSong(id).lyrics.split('\n')[0],
          tags: this.getSong(id).tags,
        };
      });
    },

    selectSong(id) {
      this.selectedSong = id;
    },

    updateJimaku() {
      if (this.jimakuAnim) {
        this.jimaku = ""; // Reset animation
      }
      this.$nextTick(function() { // Waiting for reset animation
        this.jimaku = this.splitedLyrics[this.jimakuIndex];
        this.previewText = this.preview ? this.splitedLyrics[this.jimakuIndex+1] : '';
        $("#jimaku-0").addClass("jimaku-0");
        $("#jimaku-1").addClass("jimaku-1");
        $("#jimaku-2").addClass("jimaku-2");
      });
    },

    setJimakuIndex(i) {
      this.jimakuIndex = (0 <= i &&  i < this.splitedLyrics.length) ? i : 0;
    },

    updateJimakuIndexToCursor() { // 字幕行番号をカーソルの位置に更新 #lyrics@focus@click
      const match = this.lyrics.substr(0, $('#lyrics').prop('selectionStart')).match(/\n/g);
      this.jimakuIndex = match ? match.length : 0;
    },

    moveEditorCousor(e) { // 字幕の行番号を更新 #lyrics@keyup
      if ([13,37,38,39,40].includes(e.keyCode)) { // 十字キーまたはエンターを押した時
        this.updateJimakuIndexToCursor();
      }
    },

    addSong() {
      this.searchText = "";
      this.createSong();
    },

    deleteSong() { // データ消去
      if (this.lyrics !== lyricsFirstValue && !confirm('本当に消去しますか？')) {
        return;
      }

      this.removeSong(this.selectedSong);

      this.$nextTick(function() {
        if (!this.songIds.length) { // 全部消しちゃったら１個新規で作る
          this.createSong();
        } else {
          this.selectedSong = this.filteredRepertory[0].id;
        }
      });
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

    repertoryFiltering() {
      let filteredRepertory = this.repertory;
      this.searchText.split(" ").forEach(word => {
        if (!word || word === "-") {
          return;
        }
        const isInverted = word.split("")[0] === "-";
        filteredRepertory = filteredRepertory.filter(r => {
          const matched = (r.title+r.tags).indexOf(isInverted ? word.substr(1) : word) > -1;
          return isInverted ? !matched : matched; // 先頭 "-" でマイナス検索
        });
      });
      this.filteredRepertory = filteredRepertory;
    },

    shiftSongForFilteredRepertory(dist) {
      const targetIndex = this.selectedIndexFromFilteredRepertory+dist;
      this.shiftSong(this.selectedSong, this.filteredRepertory[targetIndex].id);
    },

    hint(message) {
      this.hintText = message;
    },
    
    dataExport() {
      var result = {};
      for(var i = 0; i < localStorage.length; i++) {
        result[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
      }
      const blob = new Blob([JSON.stringify(result)], { type: 'application/octet-stream' });
      const aTag = document.createElement('a');
      aTag.href = URL.createObjectURL(blob);
      aTag.target = '_blank';
      aTag.download = `jimac_export_${Date.now()}.json`;
      aTag.click();
      URL.revokeObjectURL(aTag.href);
    },
    
    dataImport(e) {
      const r = new FileReader();
      r.readAsText(e.files[0]);
      r.onload = () => {
        const datas = JSON.parse(r.result);
        for (const key in datas) {
          localStorage.setItem(key, datas[key]);
        }
        location.reload();
      };
    },

    dataReset() {
      if (confirm("本当にデータを消去しますか？")) {
        localStorage.clear();
        location.reload();
      }
    }
  },

  /** Initialize **/
  mounted: function() {
    this.$nextTick(function() {
      if (!localStorage.length) {
        this.createSettings();
        this.createSong();
      } else {
        this.loadSettings();
        this.loadRepertory();
        this.selectedSong = this.songIds[0];
      }
    })
  },

}).mount('#jimac');

// ショートカットキー用のイベント取得
$(window).keyup(function(event) {
  jimac.windowKeyEvent(event);
});

/**
 * アクティベート用ハッシュ計算
 */
async function sha256(str) {
  const buff = new Uint8Array([].map.call(str, (c) => c.charCodeAt(0))).buffer;
  const digest = await crypto.subtle.digest('SHA-256', buff);
  return [].map.call(new Uint8Array(digest), x => ('00' + x.toString(16)).slice(-2)).join('');
}

new Clipboard('.clipboard'); // clipboard.js