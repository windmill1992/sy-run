//app.js
App({
	onLaunch: function (options) {
		//调用API从本地缓存中获取数据
		if (!wx.getStorageSync('prod1')) {
			wx.clearStorageSync();
			wx.setStorageSync('prod1', '1');
		} 
		wx.setStorageSync('scene', options.scene);
		wx.setStorageSync('query', options.query);
		if (wx.getUpdateManager) {
			const updateManager = wx.getUpdateManager();
			updateManager.onCheckForUpdate((res) => {
				if (res.hasUpdate) {
					console.log('update');
					updateManager.onUpdateReady(() => {
						this.globalData.update = true;
						wx.showModal({
							title: '更新提示',
							content: '新版本已经准备好，是否重启应用？',
							success: res => {
								if (res.confirm) {
									// 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
									updateManager.applyUpdate()
								} else {
									wx.redirectTo({
										url: '/pages/index/index'
									})
								}
							}
						})
					})
				}
			})
		}
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
