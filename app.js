//app.js
App({
	onLaunch: function (options) {
		//调用API从本地缓存中获取数据
		wx.setStorageSync('scene', options.scene);
		wx.setStorageSync('query', options.query);
	},
	getUserInfo: function (cb) {
		var that = this;
		if (this.globalData.userInfo) {
			typeof cb == "function" && cb(this.globalData.userInfo);
		} else {
			//调用登录接口
			wx.getSetting({
				success: function (res) {
					if (res.authSetting['scope.userInfo'] !== false) {
						wx.getUserInfo({
							withCredentials: false,
							success: function (res3) {
								that.globalData.userInfo = res3.userInfo;
								typeof cb == "function" && cb(that.globalData.userInfo);
							},
							fail: function () {
								// that.redirect();
							}
						});
					} else {
						// that.redirect();
					}
				}
			});
		}
	},
	redirect: function () {
		var scene = wx.getStorageSync('scene');
		var q = wx.getStorageSync('query');
		if (scene === '1011' || scene === '1047') {
			wx.redirectTo({
				url: '/pages/authorize/authorize?flag=signIn&info=userInfo&activityId=' + q.activityId
			});
		} else {
			wx.redirectTo({
				url: '/pages/authorize/authorize?flag=index&info=userInfo'
			});
		}
	},
	globalData: {
		base: 'https://www.17xs.org/',
		userInfo: null
	}
})
