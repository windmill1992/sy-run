// pages/trendsInfo/trendsInfo.js
const app = getApp().globalData;
Page({
  data: {
		nav: 0,
		
  },
  onLoad: function (options) {
		this.page1 = 1;
		this.page2 = 1;
		this.flag = true;
		this.r = wx.getSystemInfoSync().windowWidth / 375;
  },
	getTop: function() {

	},
	getState: function() {

	},
	handleScroll: function(e) {
		if (e.detail.scrollTop >= 89 * this.r && this.flag) {
			this.setData({ fixed: true });
			this.flag = false;
		} else if (e.detail.scrollTop < 89 * this.r && !this.flag) {
			this.setData({ fixed: false });
			this.flag = true;
		}
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