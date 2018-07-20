// pages/teamCreate/teamCreate.js
const app = getApp().globalData;
const api = {
	login: app.base + 'wx/login.do',																					//获取userId
}
Page({
  data: {
		isLogin: false,
  },
  onLoad: function (options) {
		let uid = wx.getStorageSync('userId');
		if (uid) {
			this.setData({ isLogin: true, userId: uid })
		} 
  },
	getTeamName: function(e) {
		this.setData({ teamName: e.detail.value })
	},
	getTeamSlogan: function(e) {
		this.setData({ teamSlogan: e.detail.value })
	},
	createTeam: function() {
		const dd = this.data;
		if (!dd.teamName) {
			this.showError('请填写队伍名称！')
		} else if (!dd.teamSlogan) {
			this.showError('请填写队伍口号！')
		} else {
			wx.request({
				url: '',
				method: 'POST',
				data: { userId: dd.userId, teamName: teamName, teamSlogan: teamSlogan },
				success: res => {
					if (res.data.code == 1) {

					} else {
						this.showError(res.data.msg);
					}
				}
			})
		}
	},
	getUserInfo: function(e) {
		if (e.detail.userInfo) {
			let user = e.detail.userInfo;
			wx.request({
				url: api.login,
				method: 'GET',
				data: {
					nickName: user.nickName,
					coverImgUrl: user.avatarUrl,
				},
				success: res => {
					if (res.data.code == 1) {
						const r = res.data.result;
						this.setData({ userId: r.userId });
						wx.setStorageSync('userId', r.userId);
					} else {
						this.showError('获取用户信息失败！');
						return;
					}
				}
			});
		} else {}
	},
	showError: function (txt) {
		wx.showModal({
			title: '',
			content: txt,
			showCancel: false
		});
	},
})