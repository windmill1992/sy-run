// pages/record/record.js
const app = getApp().globalData;
const util = require('../../utils/util.js');
const api = {
	getUserDonateStepRecord: app.base + 'donateStep/getUserDonateStepRecord.do',	//捐步记录分页
	getUserStatistics: app.base + 'donateStep/getUserStatistics.do' 	            //统计（累计捐赠步数，累计捐赠金额）
};
var currentPage = 1;
Page({
	data: {},
	getUserDonateStepRecord: function (pageNum, pageSize) {
		const that = this;
		wx.getStorage({
			key: 'userId',
			success: res => {
				wx.request({
					url: api.getUserDonateStepRecord,
					method: 'GET',
					data: { userId: res.data, pageNum: pageNum, pageSize: pageSize },
					success: res1 => {
						let r = res1.data.result;
						if (r.length > 0) {
							that.setData({ recordList: r, hasDonateInfo: true });
							for (let i = 0; i < r.length; i++) {
								let obj = {};
								let str = "recordList[" + i + "].donateTime";
								obj[str] = util.formatTime(new Date(r[i].donateTime));
								that.setData(obj);
							}
						} else {
							that.setData({ hasDonateInfo: false });
						}
						if (res1.data.state) {
							that.setData({ state: 2 });
						} else if (currentPage > 1) {
							that.setData({ state: 1 });
						} else {
							that.setData({ state: 0 });
						}
					}
				});
			}
		});
	},
	getUserStatistics: function () {
		const that = this;
		wx.getStorage({
			key: 'userId',
			success: res => {
				wx.request({
					url: api.getUserStatistics,
					method: 'GET',
					data: { userId: res.data },
					success: res1 => {
						if (res1.data.code == 1) {
							let r = res1.data.result;
							that.setData({
								totalStep: r.totalStep,
								totalMoney: r.totalMoney
							});
						} else {
							that.showError('获取捐步信息失败！');
						}
					}
				});
			}
		})
	},
	loadmoreTap: function () {
		this.getUserDonateStepRecord(++currentPage, 10);
	},
	onLoad: function () {
		this.getUserStatistics();
		this.getUserDonateStepRecord(currentPage, 10);
	},
	onPullDownRefresh: function () {
		const that = this;
		setTimeout( () => {
			wx.stopPullDownRefresh();
			that.onLoad();
		}, 1000);
	},
	showError: function (txt) {
		wx.showModal({
			title: '',
			content: txt,
			showCancel: false
		});
	}
})