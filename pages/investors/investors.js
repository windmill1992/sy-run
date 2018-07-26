// pages/investors/investors.js
const app = getApp().globalData;
var api = {
	getCompanyDetail: app.base + 'donateStep/getCompanyDetail.do'		//企业详情
};
Page({
	data: {

	},
	viewAllTxt: function () {
		this.setData({ summary: this.data.introduction, showMore: false });
	},
	onLoad: function (options) {
		const that = this;
		if (options.companyId) {
			that.setData({ hasCom: true });
			wx.showLoading({
				title: '加载中...'
			})
			wx.request({
				url: api.getCompanyDetail,
				method: 'GET',
				data: { companyId: options.companyId },
				success: res => {
					if (res.data.code == 1) {
						let r = res.data.result;
						that.setData({
							companyImgUrl: r.companyImageUrl,
							companyName: r.name,
							projectCount: r.projectCount,
							donateAmount: r.donateAmount,
							cid: r.runCompanyId,
							projects: r.project
						});
						let obj = {}, str = '';
						for (let i = 0; i < r.project.length; i++) {
							if (r.project[i].totalStep > 9999999) {
								str = 'projects[' + i + '].totalStep';
								obj[str] = r.project[i].totalStep.toString().substring(0, -4);
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
						let txt = r.introduction;
						if(!txt || txt == ''){
							txt = '无';
						}
						if (txt.length > 60) {
							let sTxt = txt.substr(0, 61);
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
				},
				complete: () => {
					wx.hideLoading()
				}
			});
		} else {
			that.setData({ hasCom: false });
		}
	}
})