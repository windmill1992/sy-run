// pages/record/record.js
var util = require('../../utils/util.js');
var base = 'https://www.17xs.org/';
var dataUrl = {
	getUserDonateStepRecord: base + 'donateStep/getUserDonateStepRecord.do',	//捐步记录分页
	getUserStatistics: base + 'donateStep/getUserStatistics.do' 	            //统计（累计捐赠步数，累计捐赠金额）
};
var currentPage = 1;
Page({
	data: {},
	getUserDonateStepRecord: function (pageNum, pageSize) {
		var that = this;
		wx.getStorage({
			key: 'userId',
			success: function (res) {
				wx.request({
					url: dataUrl.getUserDonateStepRecord,
					method: 'GET',
					data: { userId: res.data, pageNum: pageNum, pageSize: pageSize },
					success: function (res1) {
						var result = res1.data.result;
						if (result.length > 0) {
							that.setData({ recordList: result, hasDonateInfo: true });
							for (var i = 0; i < result.length; i++) {
								var obj = {};
								var str = "recordList[" + i + "].donateTime";
								obj[str] = util.formatTime(new Date(result[i].donateTime));
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
		var that = this;
		wx.getStorage({
			key: 'userId',
			success: function (res) {
				wx.request({
					url: dataUrl.getUserStatistics,
					method: 'GET',
					data: { userId: res.data },
					success: function (res1) {
						if (res1.data.code == 1) {
							var result = res1.data.result;
							that.setData({
								totalStep: result.totalStep,
								totalMoney: result.totalMoney
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
  /**
   * 生命周期函数--监听页面加载
   */
	onLoad: function () {
		this.getUserStatistics();
		this.getUserDonateStepRecord(currentPage, 10);
	},
	onPullDownRefresh: function () {
		var that = this;
		setTimeout(function () {
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