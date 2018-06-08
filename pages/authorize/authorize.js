// pages/authorize/authorize.js
Page({
	data: {},
	onLoad: function (options) {
		this.setData({ flag: options.flag, info: options.info });
		if (options.activityId !== null) {
			this.setData({ activityId: options.activityId });
		}
	},
	toAuthorize: function () {
		var that = this;
		var dd = that.data;
		wx.openSetting({
			success: function (res) {
				if (res && res.authSetting['scope.' + dd.info] === true) {
					var args = dd.activityId ? ('?activityId=' + dd.activityId) : '';
					wx.redirectTo({
						url: '/pages/' + dd.flag + '/' + dd.flag + args
					});
				} else {

				}
			}
		});
	}
})