// pages/donateSuccess/donateSuccess.js
const app = getApp().globalData;
var dataUrl = {
	getRandomCompanyInfo: app.base + 'donateStep/getRandomCompanyInfo.do'		//获取捐步信息
};
Page({
	data: {
		query: '',
	},
	getDonateInfo: function () {
		const that = this;
		wx.getStorage({
			key: 'userId',
			success: data => {
				wx.request({
					url: dataUrl.getRandomCompanyInfo,
					method: 'GET',
					data: { userId: data.data },
					success: res => {
						if (res.data.code == 2) {
							var r = res.data.result;
							that.setData({
								userImgUrl: r.coverImageurl,
								projectId: r.project.projectId,
								projectTitle: r.project.projectTitle,
								donateSteps: r.stepCount,
								companyImgUrl: r.companyImgUrl,
								companyName: r.name,
								randomMoney: r.userDonatAmount
							});
						} else {
							that.showError('获取捐步信息失败');
							return;
						}
					}
				});
			},
			fail: () => {
				that.showError('获取用户信息失败');
			}
		});
	},
	showError: function (txt) {
		wx.showModal({
			title: '',
			content: txt,
			showCancel: false
		});
	},
	onShareAppMessage: function (res) {
		var that = this;
		var dd = that.data;
		return {
			title: dd.projectTitle,
			path: '/pages/index/index',
			success: res1 => {
				wx.showToast({
					title: '转发成功'
				});
			},
			fail: res1 => {
				that.showError('转发失败');
			}
		};
	},
	onLoad: function (options) {
		if (options.cid) {
			let query = '?cid='+ options.cid + '&pid='+ options.pid;
			this.setData({ query: query });
		}
		this.getDonateInfo();
	}
})