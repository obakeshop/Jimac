const vue = Vue.createApp({
  data() {
    return {
      items: [],
      index: 0,
      currentLylic: '',
      backColor: "#00FF00",
      textColor: "#3333FF",
      fontFamily: "'Kiwi Maru', serif",
      fontSize: "42pt",
      textAnim: true
    }
  },
  methods: {
    changeLylics(e) {
      localStorage.setItem('myCat', this.lylics);
      this.items = (this.lylics || "").split('\n').map(e => { return { lylic: e }; });
      this.updateLylic();
    },
    setIndex(e) {
      const value = parseInt(e.target.value);
      if (!value || value < 0 || this.items.length < value) {
        this.index = 0;
      } else {
        this.index = value;
      }
    },
    moveIndex(i) {
      const newIdx = this.index + i;
      this.index = (0 <= newIdx && newIdx <= this.items.length-1) ? newIdx : 0;
      this.updateLylic();
    },
    updateLylic() {
      this.currentLylic = ""; 
      setTimeout(() => {
        this.currentLylic = this.items[this.index].lylic;
        $("#lylic-test-after").addClass("lylic-style after");
        $("#lylic-test-main").addClass("lylic-style main");
        $("#lylic-test-before").addClass("lylic-style before");
      }, 50);
    },
    keyEvent(event) {
      const tagName = document.activeElement.tagName; 
      if (tagName === "TEXTAREA" || tagName === "INPUT") {
        return;
      }
      switch (event.keyCode) {
        case 37: this.moveIndex(-1); break;
        case 39: this.moveIndex(+1); break;
      }
    }
  },
  filters: {
    cnvSpace: function (t) {
      console.log(t);
      return t;
    }
  },
  mounted: function () {
    this.$nextTick(function () {
      this.lylics = localStorage.getItem("myCat");
      this.changeLylics();
    })
  },
}).mount('#jimakuGenerator')

$(window).keydown(function(event){
  vue.keyEvent(event);
});