// pages/signIn/signIn.js
var base = 'https://www.17xs.org/';
var dataUrl = {
	signIn: base + 'activity/sign.do',																	//签到
	getCompanySign: base + 'activity/getCompanySign.do',								//查看签到记录
	getSessionKey: base + 'wx/getSessionKey.do',												//获取openid
	login: base + 'wx/login.do',																				//获取userId
	getUserSignIn: base + 'activity/getUserIsOrNotTodaySign.do',				//判断用户今天是否签到
	isActivityVolunteer: base + 'activity/isOrNotActivityVolunteer.do'	//判断用户是否已经成为此活动的志愿者
};
var app = getApp();
var page = 1;
Page({
	data: {
		showSign: true,
		isSignIn: -1,
		hasMore: -1,
		signInRecords: []
	},
	onLoad: function (options) {
		var scene = wx.getStorageSync('scene');
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
		var that = this;
		wx.login({
			success: function (result) {
				if (result.code) {
					wx.request({
						url: dataUrl.getSessionKey,
						method: 'GET',
						data: { js_code: result.code },
						success: function (result2) {
							var r = result2.data.result;
							wx.request({
								url: dataUrl.login,
								method: 'GET',
								data: {
									openId: r.openId,
									unionId: r.unionId
								},
								success: function (res) {
									if (res.data.code == 1) {
										var uid = res.data.result.userId;
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
		var that = this;
		var dd = that.data;
		wx.request({
			url: dataUrl.isActivityVolunteer,
			method: 'GET',
			data: { userIdWx: userId, activityId: dd.aid },
			success: function (res) {
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
		var that = this;
		wx.request({
			url: dataUrl.getUserSignIn,
			method: 'GET',
			data: { userId: userId, activityId: that.data.aid },
			success: function (res) {
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
		var that = this;
		var dd = that.data;
		var day = new Date();
		var y = day.getFullYear();
		var m = day.getMonth() + 1;
		var d = day.getDate();
		m = m < 10 ? ('0' + m) : m;
		d = d < 10 ? ('0' + d) : d;
		var time = y + '-' + m + '-' + d;
		wx.request({
			url: dataUrl.getCompanySign,
			method: 'GET',
			data: { activityId: dd.aid, time: time, pageNum: pageNum, pageSize: pageSize, userIdWx: userId },
			success: function (res) {
				wx.hideLoading();
				if (res.data.code == 1) {
					var r = res.data.result;
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
					var arr = dd.signInRecords.concat(r.data);
					for (var i = 0; i < arr.length; i++) {
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
		var that = this;
		var dd = that.data;
		app.getUserInfo(function (userinfo) {
			that.setData({ userinfo: userinfo });
			wx.request({
				url: dataUrl.signIn,
				method: 'GET',
				data: { activityId: dd.aid, userId: dd.userId },
				success: function (res) {
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
		var that = this;
		wx.stopPullDownRefresh();
		wx.showLoading({
			title: '正在刷新...'
		});
		this.setData({ signInRecords: [] });
		setTimeout(function () {
			that.getCompanySign(1, 20, that.data.userId);
		}, 500);
	}
})