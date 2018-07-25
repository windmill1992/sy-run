// pages/trendsInfo/trendsInfo.js
const app = getApp().globalData;
const api = {
	stepRank: app.base + 'together/stepTeamRank.do',		//捐步排行
	stepDynamic: app.base + 'together/stepDynamic.do',	//捐步动态
}
Page({
  data: {
		nav: 0,
		topList: [],
		stateList: [],
  },
  onLoad: function (options) {
		if (options.tid) {
			this.page1 = 1;
			this.page2 = 1;
			this.setData({ cid: options.cid, pid: options.pid, tid: options.tid });
			this.getTop();
		}
		this.flag = true;
		this.r = wx.getSystemInfoSync().windowWidth / 375;
		let pTitle = wx.getStorageSync('pTitle');
		this.setData({ pTitle: pTitle });
  },
	getTop: function() {
		wx.showLoading({
			title: '加载中...',
		})
		const dd = this.data;
		wx.request({
			url: api.stepRank,
			method: 'GET',
			data: {
				companyId: dd.cid,
				projectId: dd.pid,
				teamId: dd.tid,
				pageNum: this.page1,
				pageSize: 10,
			},
			success: res => {
				if (res.data.code == 1) {
					const r = res.data.result;
					let a = -1;
					if (r.stepData.length == 0) {
						a = 0;
					} else if (r.isOrNotNextPage) {
						a = 2;
					} else {
						a = 1;
					}
					let arr = [...dd.topList, ...r.stepData];
					this.setData({ topList: arr, hasmore1: a });
				} else if (res.data.code == 3) {
					this.setData({ hasmore1: 1 });
				} else {
					this.showError(res.data.msg);
				}
			},
			complete: () => {
				wx.hideLoading()
			}
		})
	},
	getState: function() {
		wx.showLoading({
			title: '加载中...',
		})
		const dd = this.data;
		wx.request({
			url: api.stepDynamic,
			method: 'GET',
			data: {
				companyId: dd.cid,
				projectId: dd.pid,
				teamId: dd.tid,
				pageNum: this.page2,
				pageSize: 10,
			},
			success: res => {
				if (res.data.code == 1) {
					const r = res.data.result;
					let a = -1;
					if (r.stepData.length == 0) {
						a = 0;
					} else if (r.isOrNotNextPage) {
						a = 2;
					} else {
						a = 1;
					}
					let arr = [...dd.stateList, ...r.stepData];
					this.setData({ stateList: arr, hasmore2: a });
				}
			},
			complete: () => {
				wx.hideLoading()
			}
		})
	},
	handleScroll: function(e) {
		if (e.detail.scrollTop >= 62 * this.r && this.flag) {
			this.setData({ fixed: true });
			this.flag = false;
		} else if (e.detail.scrollTop < 62 * this.r && !this.flag) {
			this.setData({ fixed: false });
			this.flag = true;
		}
	},
	changeNav: function(e) {
		let n = e.currentTarget.dataset.nav;
		this.setData({ nav: n });
		if (this.data.stateList.length == 0 && n == 1) {
			this.getState();
		} else if (this.data.topList.length == 0 && n == 0) {
			this.getTop();
		}
	},
	loadmore: function() {
		if (this.data.nav == 0) {
			this.setData({ hasmore1: -1 });
			this.page1++;
			this.getTop();
		} else {
			this.setData({ hasmore2: -1 });
			this.page2++;
			this.getState();
		}
	},
	showError: function(txt) {
		wx.showModal({
			title: '',
			content: txt,
			showCancel: false,
		});
	}
})