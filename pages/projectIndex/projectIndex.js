// pages/projectIndex/projectIndex.js
const app = getApp().globalData;
const api = {
	projectList: app.base + 'project/list_h5.do',										//项目列表
	latestdonationlist: app.base + 'project/latestdonationlist.do'		//最新
};
var page = 1;
Page({
	data: {
		itemLists: [
			['全部分类', '医疗救助', '教育救助', '贫困救助', '灾害救助', '特殊群体'],
			['最新发布', '关注最多', '捐助最多', '最新反馈'],
			['全部状态', '发布中', '已完成']
		],
		itemData: [
			[null, 'disease', 'education', 'povertyAlleviation', 'disasterRelief', 'elderly', 'publicinterest'],
			['2', '1', '4', '3'],
			['0', '1', '2']
		],
		projectLists: [],
		tab: ['on', '', ''],
		allKinds: '全部分类',
		newPublish: '最新发布',
		allState: '全部状态',
		kindData: '',
		sortData: '2',
		statusData: '0',
		hasMore: -1
	},
	onLoad: function () {
		let dd = this.data;
		let a = { 'typeName': dd.kindData, 'sortType': dd.sortData, 'status': dd.statusData };
		this.getProjectList(1, 10, a);
	},
	switchTab: function (e) {
		const that = this;
		let dd = that.data;
		let i = Number(e.currentTarget.dataset.idx);
		let obj = {}, str = '';
		wx.showActionSheet({
			itemList: dd.itemLists[i],
			itemColor: '#333',
			success: res => {
				if (!res.cancel) {
					that.setData({ projectLists: [] });
					for (let j = 0; j < dd.tab.length; j++) {
						if (dd.tab[j] == 'on') {
							str = 'tab[' + j + ']';
							obj[str] = '';
							that.setData(obj);
							obj = {}; str = '';
							break;
						}
					}
					str = 'tab[' + i + ']';
					obj[str] = 'on';
					that.setData(obj);
					let x = res.tapIndex;
					let a = {};
					switch (i) {
						case 0:
							that.setData({ allKinds: dd.itemLists[0][x], kindData: dd.itemData[0][x] });
							break;
						case 1:
							that.setData({ newPublish: dd.itemLists[1][x], sortData: dd.itemData[1][x] });
							break;
						case 2:
							that.setData({ allState: dd.itemLists[2][x], statusData: dd.itemData[2][x] });
							break;
						default: return;
					}
					page = 1;
					a['typeName'] = dd.kindData;
					a['sortType'] = dd.sortData;
					a['status'] = dd.statusData;
					wx.pageScrollTo({
						scrollTop: 0
					});
					that.getProjectList(1, 10, a);
				}
			}
		});
	},
	loadMore: function () {
		let dd = this.data;
		let a = { 'typeName': dd.kindData, 'sortType': dd.sortData, 'status': dd.statusData };
		this.getProjectList(++page, 10, a);
	},
	getProjectList: function (pageNum, pageSize, args) {
		wx.showLoading({
			title: '加载中...'
		});
		const that = this;
		let dd = that.data;
		wx.request({
			url: api.projectList,
			method: 'GET',
			data: {
				typeName: args.typeName, sortType: args.sortType, status: args.status, page: pageNum, len: pageSize, t: new Date().getTime()
			},
			success: res => {
				let num = pageNum * pageSize;
				if (res.data.result != 1 && res.data.result != 2) {
					let dt = res.data.items, datas = dt;
					let o = {}, arr = [];
					for (let i = 0; i < dt.length; i++) {
						o['projectId'] = dt[i].itemId;
						if (dt[i].imageurl == null) {
							o['projectLogo'] = 'https://www.17xs.org/res/images/logo-def.jpg';
						} else {
							o['projectLogo'] = dt[i].imageurl;
						}
						if (dt[i].donaAmount >= dt[i].cryMoney) {
							o['corner'] = true;
							o['cornerImg'] = 'https://www.17xs.org/res/images/h5/images/corner_success.png';
						} else if (dt[i].state == 260) {
							o['corner'] = true;
							o['cornerImg'] = 'https://www.17xs.org/res/images/h5/images/corner_finish.png';
						} else {
							o['corner'] = false;
						}
						o['projectTitle'] = dt[i].title;
						o['cryMoney'] = dt[i].cryMoney;
						o['process'] = dt[i].process;
						arr.push(o);
						o = {};
					}
					if (dd.projectLists.length > 0) {
						arr = dd.projectLists.concat(arr);
					}
					that.setData({ projectLists: arr }, () => {
						wx.hideLoading();
					});
					if (num >= res.data.total) {
						that.setData({ hasMore: 1 });
					} else {
						that.setData({ hasMore: 2 });
					}
				} else {
					that.setData({ hasMore: 0 });
				}
			}
		});
	},
	onPullDownRefresh: function () {
		const that = this;
		wx.stopPullDownRefresh();
		wx.showToast({
			title: '加载中...',
			icon: 'loading',
			duration: 2000
		});
		setTimeout( () => {
			that.onLoad();
		}, 2000);
	},
	onReachBottom: function () {
		let dd = this.data;
		let a = { 'typeName': dd.kindData, 'sortType': dd.sortData, 'status': dd.statusData };
		this.getProjectList(++page, 10, a);
	}
})