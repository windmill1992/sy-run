// pages/adv/adv.js
const app = getApp().globalData;
Page({
  data: {
		time: 3
  },
  onLoad: function (options) {
		if (options && options.cid) {
			this.setData({ options: options })
		}
		this.countdown();
  },
	toIndex: function () {
		let obj = this.data.options;
		let query = '?cid='+ obj.cid + '&pid='+ obj.pid;
		clearInterval(this.data.timer);
		wx.redirectTo({
			url: '/pages/index/index'+ (query ? query : '')
		})
	},
	countdown: function () {
		let dd = this.data;
		let n = 0;
		let timer = setInterval(() => {
			if (app.update) {
				clearInterval(timer);
				return false;
			}
			n = dd.time;
			n--;
			if(n == -1){
				clearInterval(timer);
				this.toIndex();
				return;
			}
			this.setData({ time: n });
		}, 1500);
		this.setData({ timer: timer })
	}
})