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
      textAnim: false
    }
  },
  methods: {
    changeLylics(e) {
      console.log(1);
      localStorage.setItem('myCat', this.lylics);
      this.items = (this.lylics || "").split('\n').map(e => { return { lylic: e }; });
      this.updateLylic();
    },
    setIndex(value) {
      if (this.index === value) {
        return;
      }

      if (!value || value < 0 || this.items.length-1 < value) {
        this.index = 0;
      } else {
        this.index = value;
      }
      this.updateLylic();
    },
    updateLylic() {
      if (this.textAnim) {
        this.currentLylic = ""; // Reset animation
      }
      setTimeout(() => {
        this.currentLylic = this.items[this.index].lylic;
        $("#lylic-test-after").addClass("lylic-style after");
        $("#lylic-test-main").addClass("lylic-style main");
        $("#lylic-test-before").addClass("lylic-style before");
      }, 50); // Animation waiting
    },
    keyEvent(event) {
      const tagName = document.activeElement.tagName; 
      if (tagName === "INPUT") {
        return;

      } else if (tagName === "TEXTAREA") {
        switch (event.keyCode) {
          case 13: 
          case 37: 
          case 38: 
          case 39: 
          case 40: 
            this.updateIndex();
            break;
        }

      } else {
        console.log(1);
        switch (event.keyCode) {
          case 37: this.setIndex(this.index-1); break;
          case 39: this.setIndex(this.index+1); break;
        }
      }
    },
    updateIndex() {
      if (document.activeElement.tagName !== "TEXTAREA") {
        return;
      }
      const match = this.lylics.substr(0, document.activeElement.selectionStart).match(/\n/g);
      const index = match ? match.length : 0;
      this.setIndex(index);
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
}).mount('#jimakuGenerator');

$(window).keyup(function(event){
  vue.keyEvent(event);
});