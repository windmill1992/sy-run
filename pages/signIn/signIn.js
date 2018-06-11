// pages/signIn/signIn.js
const app = getApp().globalData;
const api = {
	signIn: app.base + 'activity/sign.do',																	//签到
	getCompanySign: app.base + 'activity/getCompanySign.do',								//查看签到记录
	getSessionKey: app.base + 'wx/getSessionKey.do',												//获取openid
	login: app.base + 'wx/login.do',																				//获取userId
	getUserSignIn: app.base + 'activity/getUserIsOrNotTodaySign.do',				//判断用户今天是否签到
	isActivityVolunteer: app.base + 'activity/isOrNotActivityVolunteer.do'	//判断用户是否已经成为此活动的志愿者
};
var page = 1;
Page({
	data: {
		showSign: true,
		isSignIn: -1,
		hasMore: -1,
		signInRecords: []
	},
	onLoad: function (options) {
		let scene = wx.getStorageSync('scene');
		if (scene != '1011' && scene != '1047') {
			this.showError('请扫码进入！');
			this.setData({ showSign: false });
			return;
		} else {
			this.setData({ scene: scene });
		}
		wx.showLoading({
			title: '加载中...'
		});
		this.setData({ aid: options.activityId });
		this.login();
	},
	login: function () {
		const that = this;
		wx.login({
			success: res => {
				if (res.code) {
					wx.request({
						url: api.getSessionKey,
						method: 'GET',
						data: { js_code: res.code },
						success: res2 => {
							let r = res2.data.result;
							wx.request({
								url: api.login,
								method: 'GET',
								data: {
									openId: r.openId,
									unionId: r.unionId
								},
								success: res3 => {
									if (res3.data.code == 1) {
										let uid = res3.data.result.userId;
										that.isActivityVolunteer(uid);
										that.getCompanySign(page, 20, uid);
										that.setData({ userId: uid });
									} else {
										wx.hideLoading();
										that.showError('获取用户信息失败');
									}
								}
							});
						}
					});
				} else {
					wx.hideLoading();
					that.showError('登录异常，请稍后再试！');
				}
			}
		});
	},
	isActivityVolunteer: function (userId) {
		const that = this;
		let dd = that.data;
		wx.request({
			url: api.isActivityVolunteer,
			method: 'GET',
			data: { userIdWx: userId, activityId: dd.aid },
			success: res => {
				if (res.data.code == 1) {
					that.getUserSignIn(userId);
				} else if (res.data.code == 4) {
					that.setData({ isSignIn: 4 });
				} else if (res.data.code == 6) {
					that.setData({ isSignIn: 6 });
				} else {
					that.showError(res.data.msg);
				}
			}
		});
	},
	getUserSignIn: function (userId) {
		const that = this;
		wx.request({
			url: api.getUserSignIn,
			method: 'GET',
			data: { userId: userId, activityId: that.data.aid },
			success: res => {
				if (res.data.code == 1) {
					that.setData({ isSignIn: 1 });
				} else if (res.data.code == 3) {
					that.setData({ isSignIn: 2 });
				} else {
					that.showError(res.data.msg);
				}
			}
		});
	},
	getCompanySign: function (pageNum, pageSize, userId) {
		const that = this;
		let dd = that.data;
		let day = new Date();
		let y = day.getFullYear();
		let m = day.getMonth() + 1;
		let d = day.getDate();
		m = m < 10 ? ('0' + m) : m;
		d = d < 10 ? ('0' + d) : d;
		let time = y + '-' + m + '-' + d;
		wx.request({
			url: api.getCompanySign,
			method: 'GET',
			data: { activityId: dd.aid, time: time, pageNum: pageNum, pageSize: pageSize, userIdWx: userId },
			success: res => {
				wx.hideLoading();
				if (res.data.code == 1) {
					let r = res.data.result;
					if (r.count == 0) {
						that.setData({ hasMore: 0 });
					} else if (r.count <= pageNum * pageSize) {
						if (page > 1) {
							that.setData({ hasMore: 1 });
						} else {
							that.setData({ hasMore: 3 });
						}
					} else {
						that.setData({ hasMore: 2 });
					}
					let arr = dd.signInRecords.concat(r.data);
					for (let i = 0; i < arr.length; i++) {
						arr[i].signTime = arr[i].signTime.substr(0, 5);
						arr[i].signOutTime = arr[i].signOutTime.substr(0, 5);
					}
					that.setData({ signInRecords: arr });
				} else {
					that.showError(res.data.msg);
				}
			}
		});
	},
	toSignIn: function () {
		const that = this;
		let dd = that.data;
		wx.request({
			url: api.signIn,
			method: 'GET',
			data: { activityId: dd.aid, userId: dd.userId },
			success: res => {
				if (res.data.code == 1) {
					that.setData({ isSignIn: 2 });
					wx.showToast({
						title: '签到成功'
					});
					that.getCompanySign(1, 20, dd.userId);
				} else {
					that.showError(res.data.msg);
				}
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
	loadMore: function () {
		this.getCompanySign(++page, 10);
	},
	onPullDownRefresh: function () {
		const that = this;
		wx.stopPullDownRefresh();
		wx.showLoading({
			title: '正在刷新...'
		});
		this.setData({ signInRecords: [] });
		setTimeout( () => {
			that.getCompanySign(1, 20, that.data.userId);
		}, 500);
	}
})