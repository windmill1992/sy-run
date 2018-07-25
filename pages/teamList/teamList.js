// pages/teamList/teamList.js
const app = getApp().globalData;
const api = {
	teamRank: app.base + 'donateStep/teamRanking.do',								//队伍排名
	actDetail: app.base + 'donateStep/companyRunIndex.do',					//活动信息
}
Page({
  data: {
		teamList: [],
		total: 0,
  },
  onLoad: function (options) {
		if (options.cid) {
			this.page = 1;
			this.setData({ cid: options.cid, pid: options.pid });
			this.getActDetail();
			this.getTeamRank();
		} else {
			wx.showModal({
				title: '提示',
				content: '项目不存在',
				showCancel: false,
				success: res => {
					if (res.confirm) {
						wx.navigateBack();
					}
				}
			})
		}
  },
	getActDetail: function () {
		const dd = this.data;
		wx.request({
			url: api.actDetail,
			method: 'GET',
			data: {
				companyId: dd.cid,
				projectId: dd.pid,
				userId: 0,
			},
			success: res => {
				if (res.data.code == 1) {
					let r = res.data.result;
					this.setData({ info: r });
				} else {
					this.showError('查询项目错误，'+ res.data.msg);
				}
			}
		})
	},
	getTeamRank: function () {
		const dd = this.data;
		wx.showLoading({
			title: '加载中...',
			mask: true,
		})
		wx.request({
			url: api.teamRank,
			method: 'GET',
			data: {
				companyId: dd.cid,
				projectId: dd.pid,
				userId: 0,
				pageNum: this.page,
				pageSize: 10,
			},
			success: res => {
				console.log(res.data);
				if (res.data.code == 1) {
					const r = res.data.result;
					let a = -1;
					if (r.data.count == 0) {
						a = 0;
					} else if (r.data.isOrNotPageNext) {
						a = 2;
					} else {
						a = 1;
					}
					let arr = [...dd.teamList, ...r.data.teamList];
					this.setData({ defaultTeam: r.defaultTeam, teamList: arr, hasmore: a, total: r.data.count });
				} else {
					this.showError('查询队伍错误，' + res.data.msg);
				}
			},
			complete: () => {
				wx.hideLoading()
			}
		})
	},
	loadmore: function() {
		this.page++;
		this.getTeamRank();
	},
	showError: function (txt) {
		wx.showModal({
			title: '提示',
			content: txt,
			showCancel: false,
		});
	},
})