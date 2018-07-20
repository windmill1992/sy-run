// pages/trendsInfo/trendsInfo.js
const app = getApp().globalData;
Page({
  data: {
		nav: 0,
		
  },
  onLoad: function (options) {
		this.page1 = 1;
		this.page2 = 1;
		this.$box = wx.createSelectorQuery().select('#navBox');
  },
	getTop: function() {

	},
	getState: function() {

	},
	handleScroll: function(e) {
		this.$box.boundingClientRect(rect => {
			console.log(rect.top);
			if (rect.top <= 0) {
				this.setData({ fixed: true });
			} else {
				this.setData({ fixed: false });
			}
		}).exec();
	},
	changeNav: function(e) {
		let n = e.currentTarget.dataset.nav;
		this.setData({ nav: n });
	},
	loadmore: function() {
		if (this.data.nav == 0) {
			this.page1++;
			this.getTop();
		} else {
			this.page2++;
			this.getState();
		}
	}
})