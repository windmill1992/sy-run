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
		const that = this;
		let dd = that.data;
		wx.openSetting({
			success: res => {
				if (res && res.authSetting['scope.' + dd.info] === true) {
					let args = dd.activityId ? ('?activityId=' + dd.activityId) : '';
					wx.redirectTo({
						url: '/pages/' + dd.flag + '/' + dd.flag + args
					});
				} else { }
			}
		});
	}
})