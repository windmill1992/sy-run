// pages/investors/investors.js

var base = 'https://www.17xs.org/';
var dataUrl = {
	getCompanyDetail: base + 'donateStep/getCompanyDetail.do'		//企业详情
};
Page({
	data: {

	},
	viewAllTxt: function () {
		this.setData({ summary: this.data.introduction, showMore: false });
	},

  /**
   * 生命周期函数--监听页面加载
   */
	onLoad: function (options) {
		var that = this;
		if (options.companyId) {
			that.setData({ hasCom: true });
			wx.request({
				url: dataUrl.getCompanyDetail,
				method: 'GET',
				data: { companyId: options.companyId },
				success: function (res) {
					if (res.data.code == 1) {
						var result = res.data.result;
						that.setData({
							companyImgUrl: result.companyImageUrl,
							companyName: result.name,
							projectCount: result.projectCount,
							donateAmount: result.donateAmount,
							projects: result.project
						});
						var obj = {}, str = '';
						for (var i = 0; i < result.project.length; i++) {
							if (result.project[i].totalStep > 9999999) {
								str = 'projects[' + i + '].totalStep';
								obj[str] = result.project[i].totalStep.toString().substring(0, -4);
								str = 'projects[' + i + '].unit';
								obj[str] = '万';
								that.setData(obj);
								obj = {};
							} else {
								str = 'projects[' + i + '].unit';
								obj[str] = '';
								that.setData(obj);
								obj = {};
							}
						}
						var txt = result.introduction;
						if (txt.length > 60) {
							var sTxt = txt.substr(0, 61);
							that.setData({ summary: sTxt, showMore: true, introduction: txt });
						} else {
							that.setData({ summary: txt });
						}
					} else {
						that.setData({ hasCom: false });
						wx.showToast({
							title: '获取企业信息失败',
							image: '../../images/error.png',
							duration: 2000
						});
					}
				}
			});
		} else {
			that.setData({ hasCom: false });
		}
	}
})