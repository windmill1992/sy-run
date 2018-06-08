// pages/donateSuccess/donateSuccess.js

var base = 'https://www.17xs.org/';
var dataUrl = {
	getRandomCompanyInfo: base + 'donateStep/getRandomCompanyInfo.do'		//获取捐步信息
};
Page({
	data: {},
	getDonateInfo: function () {
		var that = this;
		wx.getStorage({
			key: 'userId',
			success: function (data) {
				wx.request({
					url: dataUrl.getRandomCompanyInfo,
					method: 'GET',
					data: { userId: data.data },
					success: function (res) {
						if (res.data.code == 2) {
							var result = res.data.result;
							that.setData({
								userImgUrl: result.coverImageurl,
								projectId: result.project.projectId,
								projectTitle: result.project.projectTitle,
								donateSteps: result.stepCount,
								companyImgUrl: result.companyImgUrl,
								companyName: result.name,
								randomMoney: result.userDonatAmount
							});
						} else {
							that.showError('获取捐步信息失败');
							return;
						}
					}
				});
			},
			fail: function () {
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
			success: function (res1) {
				wx.showToast({
					title: '转发成功'
				});
			},
			fail: function (res1) {
				that.showError('转发失败');
			}
		};
	},
  /**
   * 生命周期函数--监听页面加载
   */
	onLoad: function () {
		this.getDonateInfo();
	}
})