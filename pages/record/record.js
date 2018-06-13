// pages/record/record.js
const app = getApp().globalData;
const util = require('../../utils/util.js');
const api = {
	getUserDonateStepRecord: app.base + 'donateStep/getUserDonateStepRecord.do',	//捐步记录分页
	getUserStatistics: app.base + 'donateStep/getUserStatistics.do' 	            //统计（累计捐赠步数，累计捐赠金额）
};
var currentPage = 1;
Page({
	data: {
		totalStep: 0,
		totalMoney: 0,
		state: -1,
		recordList: []
	},
	getUserDonateStepRecord: function (pageNum, pageSize) {
		const that = this;
		let dd = that.data;
		wx.getStorage({
			key: 'userId',
			success: res => {
				wx.showLoading({
					title: '加载中...'
				})
				wx.request({
					url: api.getUserDonateStepRecord,
					method: 'GET',
					data: { userId: res.data, pageNum: pageNum, pageSize: pageSize },
					success: res1 => {
						let r = res1.data.result;
						if (r.length > 0) {
							let more = 0;
							if(res1.data.state == 0){
								more = 1;
							}else{
								more = 2;
							}
							for (let i = 0; i < r.length; i++) {
								r[i].donateTime = util.formatTime(new Date(r[i].donateTime));
							}
							let arr = dd.recordList.concat(r);
							that.setData({ recordList: arr, state: more });
						} else {
							that.setData({ state: 0 });
						}
					},
					complete: () => {
						that.setData({ loading: false });
						wx.hideLoading();
					}
				});
			},
			fail: () => {
				wx.navigateBack();
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
	onReachBottom: function () {
		if(this.data.state == 2 && !this.data.loading){
			this.setData({ loading: true });
			this.getUserDonateStepRecord(++currentPage, 10);
		}
	},
	onLoad: function () {
		this.getUserStatistics();
		this.getUserDonateStepRecord(currentPage, 10);
	},
	onPullDownRefresh: function () {
		const that = this;
		setTimeout( () => {
			wx.stopPullDownRefresh();
			currentPage = 1;
			that.setData({ recordList: [] });
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