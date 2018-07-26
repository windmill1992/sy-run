// pages/teamThanks/teamThanks.js
const app = getApp().globalData;
const api = {
	companyInfo: app.base + 'donateStep/companyRunIndex.do',		//获取企业项目信息
}
// const canvas = require('./canvas.js')
Page({
  data: {
		donatedStep: 0,
		donateMoney: 0.0
  },
  onLoad: function (options) {
		if (options.cid) {
			let user = wx.getStorageSync('user');
			this.setData({ cid: options.cid, pid: options.pid, userInfo: user });
			this.getInfo();
		}
  },
	getInfo: function() {
		const dd = this.data;
		let uid = wx.getStorageSync('userId');
		wx.request({
			url: api.companyInfo,
			method: 'GET',
			data: {
				companyId: dd.cid,
				projectId: dd.pid,
				userId: uid,
			},
			success: res => {
				if (res.data.code == 1) {
					const r = res.data.result;
					this.setData({ info: r, donateState: r.isDonate, donatedStep: r.donateStep, donateMoney: r.donateMoney });
				} else {
					wx.showModal({
						title: '提示',
						content: '服务器错误，请稍后再试！',
						showCancel: false,
					})
				}
			}
		})
	},
	make: function(o) {
		let ctx = wx.createCanvasContext('myCv', this);
		const r = wx.getSystemInfoSync().windowWidth / 375;
		const data = {
			w: 750 * r,
			h: 1230 * r,
		}
		ctx.beginPath();
		ctx.drawImage(o.projectCoverImageUrl, 0, 0, data.w, data.h / 3);
		ctx.closePath();

		ctx.beginPath();
		ctx.drawImage(o.companyCoverImageUrl, (data.w - 112 * r) / 2, data.h / 3 - 56 * r, 112 * r, 112 * r);
		ctx.closePath();

		ctx.beginPath();
		ctx.setFontSize = 36 * r;
		ctx.fillText('1111');
		ctx.closePath();

		ctx.draw(() => {
			wx.canvasToTempFilePath({
				canvasId: 'myCv',
				success: res => {
					this.setData({ imgSrc: res.tempFilePath });
				},
				fail: res => {
					console.log(res);
				}
			}, this)
		});
		
	},
	navtoTeams: function() {
		const dd = this.data;
		wx.navigateTo({
			url: '/pages/teams/teams?cid='+ dd.cid + '&pid='+ dd.pid,
		})
	},
	onShareAppMessage: function() {
		const dd = this.data;
		let query = '?cid='+ dd.cid + '&pid='+ dd.pid;
		return {
			title: '一起捐步做公益吧',
			path: '/pages/teams/teams' + query,
			imageUrl: dd.info.projectCoverImageUrl,
		}
	}
})