// pages/teamCreate/teamCreate.js
const app = getApp().globalData;
const api = {
	login: app.base + 'wx/login.do',														//获取userId
	createTeam: app.base + 'together/createTeam.do',						//创建队伍
}
Page({
  data: {
		isLogin: false,
  },
  onLoad: function (options) {
		if (options.cid) {
			this.setData({ cid: options.cid, pid: options.pid });
		} else {
			wx.showModal({
				title: '错误',
				content: '项目不存在！',
				showCancel: false,
				success: res => {
					if (res.confirm) {
						wx.reLaunch({
							url: '/pages/index/index',
						})
					}
				}
			})
			return;
		}
		let uid = wx.getStorageSync('userId');
		if (uid) {
			this.setData({ isLogin: true, userId: uid })
		} else {
			wx.showModal({
				title: '提示',
				content: '请先返回登录',
				showCancel: false,
				success: res => {
					if (res.confirm) {
						wx.reLaunch({
							url: '/pages/teams/teams?cid='+ options.cid + '&pid='+ options.pid,
						})
					}
				}
			})
		}
  },
	getTeamName: function(e) {
		this.setData({ teamName: e.detail.value })
	},
	getTeamSlogan: function(e) {
		this.setData({ teamSlogan: e.detail.value })
	},
	createTeam: function() {
		if (this.flag) {
			return;
		}
		this.flag = true;
		const dd = this.data;
		if (!dd.teamName) {
			this.showError('请填写队伍名称！')
		} else if (!dd.teamSlogan) {
			this.showError('请填写队伍口号！')
		} else {
			wx.showLoading({
				title: '',
			})
			wx.request({
				url: api.createTeam,
				method: 'POST',
				data: { 
					userId: dd.userId, 
					launchName: dd.teamName, 
					content: dd.teamSlogan,
					companyId: dd.cid,
					projectId:  dd.pid,
				},
				header: {
					'content-type': 'application/x-www-form-urlencoded'
				},
				success: res => {
					if (res.data.code == 1) {
						wx.showToast({
							title: '创建成功',
							mask: true,
						})
						let query = '?cid=' + dd.cid + '&pid=' + dd.pid;
						setTimeout(() => {
							wx.redirectTo({
								url: '/pages/teams/teams'+ query,
							})
						}, 2000);
					} else {
						this.showError(res.data.msg);
					}
				},
				complete: () => {
					this.flag = false;
					wx.hideLoading()
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