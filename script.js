Vue.createApp({
  data() {
    return {
      items: [],
      index: 0,
      currentLylic: 'a'
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
      if (0 <= newIdx && newIdx <= this.items.length-1) {
        this.index = newIdx;
      }
      this.updateLylic();
    },
    updateLylic() {
      this.currentLylic = this.items[this.index].lylic;
    }
  },
  mounted: function () {
    this.$nextTick(function () {
      this.lylics = localStorage.getItem("myCat");
      this.changeLylics();
    })
  },
}).mount('#v-model-textarea')

$(function() {
	$(".lined").linedtextarea(
		{selectedLine: 18}
	);
});