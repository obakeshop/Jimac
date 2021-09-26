Vue.createApp({
  data() {
    return {
      items: [],
      index: 0,
      currentLylic: '',
      backColor: "#00FF00",
      textColor: "#FF3399"
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
        console.log(1)
        this.index = 0;
      } else {
        console.log(2)
        this.index = value;
      }
    },
    moveIndex(i) {
      const newIdx = this.index + i;
      this.index = (0 <= newIdx && newIdx <= this.items.length-1) ? newIdx : 0;
      this.updateLylic();
    },
    updateLylic() {
      this.currentLylic = this.items[this.index].lylic;
      $("#lylic-test").addClass("lylic-style");
    }
  },
  mounted: function () {
    this.$nextTick(function () {
      this.lylics = localStorage.getItem("myCat");
      this.changeLylics();
    })
  },
}).mount('#v-model-textarea')
