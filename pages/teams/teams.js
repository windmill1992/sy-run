// pages/teams/teams.js
const app = getApp().globalData;
const api = {
	login: app.base + 'wx/login.do',																					//获取userId
	getUserUpdateRunData: app.base + 'donateStep/getUserUpdateWeRundata.do', 	//判断用户10分钟内是否更新运动数据
	donateStep: app.base + 'donateStep/donateStepNew.do',											//捐步
	getSessionKey: app.base + 'wx/getSessionKey.do',													//获取session_key
	decodeInfo: app.base + 'wx/decodeInfo.do',																//解码获取步数
	addUserWeRundata: app.base + 'donateStep/addUserWeRundata.do',						//添加用户运动信息
	actDetail: app.base + 'donateStep/companyRunIndex.do',										//活动信息
	teamRank: app.base + 'donateStep/teamRanking.do',													//队伍排名
};
const util = require('../../utils/util.js');
Page({
  data: {
		notEnoughShow: false,
		donatedShow: false,
		endStep: 1000,
		step: 0,
		userInfo: {},
		isLogin: false,
		info: {},
		teamList: [],
		defaultTeam: {},
  },
  onLoad: function (options) {
		if (options.cid) {
			this.setData({ cid: options.cid, pid: options.pid, options: options });
		} else {
			wx.showModal({
				title: '错误',
				content: '活动不存在',
				showCancel: false,
				success: res => {
					if (res.confirm) {
						wx.navigateBack()
					}
				}
			})
			return;
		}

		this.setData({ rejectAuth: false });
		
		wx.login({
			success: res => {
				if (res.code) {
					this.setData({ code: res.code });
					this.wxlogin();
				}
			}
		})
  },
	onShow: function() {
		wx.getSetting({
			success: res1 => {
				if (res1 && res1.authSetting['scope.werun'] !== false) {
					this.setData({ rejectAuth: false });
				} else {
					this.setData({ rejectAuth: true });					
				}
			}
		})
		{
			let unionId = wx.getStorageSync('unionId');
			if (unionId) {
				this.setData({ unionId: unionId });
			}
			let userId = wx.getStorageSync('userId');
			if (userId) {
				this.setData({ userId: userId, isLogin: true });
			} else {
				this.setData({ isLogin: false });
			}
			let user = wx.getStorageSync('user');
			if (user) {
				this.setData({ userInfo:user });
			}
			this.getActDetail();
			this.getTeamRank();
		}
	},
	wxlogin: function() {
		wx.showLoading({
			title: '加载中...',
			mask: true,
		})
		wx.getSetting({
			success: res1 => {
				if (res1 && res1.authSetting['scope.werun'] !== false) {
					wx.getWeRunData({
						success: res2 => {
							const wRunEncryptedData = res2.encryptedData;
							this.setData({ encryptedData: wRunEncryptedData, iv: res2.iv });
							this.get3rdSession();
						},
						fail: () => {
							this.setData({ rejectAuth: true });
							wx.hideLoading();
						}
					});
				} else {
					wx.hideLoading();
					let arr = wx.getSystemInfoSync().SDKVersion.split('.');
					if ((arr[0] >= 2 && arr[1] >= 1) || (arr[0] >= 2 && arr[1] == 0 && arr[2] >= 7)) {
						this.setData({ rejectAuth: true, canIUse: true });
					} else {
						this.setData({ rejectAuth: true });
					}
				}
			}
		});
	},
	login: function() {
		const user = this.data.userInfo;
		wx.request({
			url: api.login,
			method: 'GET',
			data: {
				nickName: user.nickName,
				coverImageUrl: user.avatarUrl,
				openId: this.data.openId,
				unionId: this.data.unionId,
			},
			success: res => {
				if (res.data.code == 1) {
					if (!wx.getStorageSync('userId')) {
						this.getActDetail();
						this.getTeamRank();
					}
					const r = res.data.result;
					this.setData({ userId: r.userId, isLogin: true });
					wx.setStorageSync('userId', r.userId);
					if (this.user && this.data.rejectAuth) {
						if (this.create) {
							wx.navigateTo({
								url: '/pages/teamCreate/teamCreate?cid=' + this.data.cid + '&pid=' + this.data.pid,
							})
						}
					} 
				} else {
					this.showError('获取用户信息失败！');
					return;
				}
			}
		});
	},
	get3rdSession: function () {
		wx.request({
			url: api.getSessionKey,
			data: { js_code: this.data.code },
			method: 'GET',
			success: res => {
				if (res.statusCode == 200) {
					let r = res.data.result;
					let sessionId = r.session_key;
					let unionId = r.unionId;
					let openId = r.openId;
					this.setData({ sessionId: sessionId, openId: openId });
					wx.setStorageSync('sessionId', sessionId);
					this.decodeUserInfo({ encryptedData: this.data.encryptedData, iv: this.data.iv });
					if (!unionId || unionId == null || unionId == 'null') {
						
					} else {
						this.setData({ unionId: unionId });
						if (this.data.userInfo.nickName) {
							this.login();
						}
						wx.setStorage({ key: 'openId', data: openId });
						wx.setStorage({ key: 'unionId', data: unionId });
					}
				} else {
					this.showError('服务器错误，请稍后再试！');
				}
			}
		});
	},
	decodeUserInfo: function (data) {
		const that = this;
		wx.request({
			url: api.decodeInfo,
			data: {
				encryptedData: data.encryptedData,
				iv: data.iv,
				js_code: that.data.code
			},
			method: 'GET',
			success: res => {
				if (res.data.code == -1) {
					that.showError('请求错误!' + res.data.msg);
					return;
				} else {
					const r = res.data.result;
					if (r.unionId) {
						that.setData({ unionId: r.unionId, openId: r.openId });
						wx.setStorage({ key: 'openId', data: r.openId });
						wx.setStorage({ key: 'unionId', data: r.unionId });
						this.login();
						if (this.user && this.data.rejectAuth) {
							if (this.donate) {
								this.showError('未授权运动，请再次点击完成授权！');
							}
						} 
					} else {
						let todayStep = r.stepInfoList[30];
						that.setData({ step: todayStep.step, stepFmt: util.numFmt(todayStep.step) });
						if (that.data.userInfo.nickName && that.data.unionId) {
							setTimeout(() => {
									that.addUserRunData();
							}, 1000);
						}
					}
				}
			},
			complete: () => {
				wx.hideLoading()
			}
		});
	},
	addUserRunData: function () {
		wx.request({
			url: api.addUserWeRundata,
			method: 'GET',
			data: {
				unionId: this.data.unionId,
				openId: this.data.openId,
				runData: this.data.step,
				nickName: this.data.userInfo.nickName,
				coverImageUrl: this.data.userInfo.avatarUrl
			},
			success: res => {
				if (res.data.code == 0) {
					this.showError('添加或更新用户运动步数失败!' + res.data.msg);
					return;
				} else if (res.data.code == -1) {
					this.showError('服务器错误,请稍后再试!' + res.data.msg);
				} else { 
					if (this.user && !this.create) {
						this.donateStep();
					}
				}
			}
		});
	},
	openSetting: function (e) {
		if (e.detail.authSetting['scope.werun']) {
			this.onLoad(this.data.options);
		} else {
			this.showError('授权失败');
		}
	},
	getUserInfo: function (e) {
		if (e.detail.userInfo) {
			this.user = true;
			if (e.currentTarget.dataset.donate == 1) {
				this.donate = true;
			} else {
				this.create = true;
			}
			this.setData({ userInfo: e.detail.userInfo });
			this.decodeUserInfo({ encryptedData: e.detail.encryptedData, iv: e.detail.iv });
			this.wxlogin();
			wx.setStorageSync('user', e.detail.userInfo);
		}
	},
	donateStep: function () {
		const that = this;
		let dt = that.data;
		if (dt.donateState) {
			that.setData({ donatedShow: true });
			return;
		}
		if (dt.rejectAuth) {
			wx.openSetting({
				success: res2 => {
					if (res2 && res2.authSetting['scope.werun'] === true) {
						that.setData({ rejectAuth: false });
						wx.login({
							success: res => {
								if (res.code) {
									this.setData({ code: res.code });
									this.wxlogin();
								}
							}
						})
					} else {
						that.showError('授权失败');
						wx.hideLoading();
					}
				}
			});
		} else {
			if (dt.step < dt.endStep) {
				that.setData({ notEnoughShow: true });
				let word = [
					'帅的人已日均万步，丑的人还原地踏步，你选哪个？',
					'一整天都没有运动，别等沙发上的土豆都发了芽',
					'今天运动量还没达标哦~宝宝坚持再走几步吧',
					'还差一点就达标啦，宝宝加油~',
					'就差一点点了哦，再走几步吧~'
				];
				let deg = Math.ceil(parseFloat(dt.step / dt.endStep * 180).toFixed(1));
				if (deg < 18) {
					that.setData({ word: word[0] });
				} else if (deg < 36) {
					that.setData({ word: word[1] });
				} else if (deg < 126) {
					that.setData({ word: word[2] });
				} else if (deg < 162) {
					that.setData({ word: word[3] });
				} else {
					that.setData({ word: word[4] });
				}
				setTimeout(() => {
					that.runProgress(1000, 500, deg);
				}, 100);
			} else {
				wx.request({
					url: api.getUserUpdateRunData,
					method: 'GET',
					data: { userId: dt.userId },
					success: res => {
						if (res.data.code == 1) {
							let r = res.data.result;
							that.setData({ amount: r.amount, enoughShow: true });
						} else {
							that.setData({ amount: 0 });
							that.showError('服务器错误，请稍后再试！');
							return;
						}
					}
				});
				// that.setData({ enoughShow: true });
			}
		}
	},
	toDonate: function () {
		let dd = this.data;
		wx.request({
			url: api.donateStep,
			method: 'POST',
			header: {
				"content-type": "application/x-www-form-urlencoded"
			},
			data: {
				companyId: dd.cid,
				userId: dd.userId,
				projectId: dd.pid,
				amount: dd.amount,
				teamId: 0,
			},
			success: res => {
				if (res.data.code == 1) {
					this.setData({ enoughShow: false });
					wx.showToast({
						title: '捐步成功',
						icon: 'success',
						duration: 1000
					});
					setTimeout(() => {
						wx.navigateTo({
							url: '/pages/teamThanks/teamThanks?cid='+ dd.cid + '&pid='+ dd.pid
						});
					}, 1000);

				} else {
					this.showError('捐步失败' + res.data.msg);
					return;
				}
			}
		});
	},
	getActDetail: function() {
		wx.showLoading({
			title: '加载中...',
			mask: true,
		});
		const dd = this.data;
		let uid = dd.userId ? dd.userId : 0;
		wx.request({
			url: api.actDetail,
			method: 'GET',
			data: {
				companyId: dd.cid,
				projectId: dd.pid,
				userId: uid,
			},
			success: res => {
				if (res.data.code == 1) {
					let r = res.data.result;
					r.percent = Number.parseFloat(Number.parseFloat(r.percent).toFixed(2));
					this.setData({ info: r, donateState: r.isDonate });
					if (r.isDonate) {
						this.setData({ donatedStep: r.donateStep });
					}
					wx.setStorageSync('pTitle', r.projectTitle);
					setTimeout(() => {
						this.setData({ fillShow: true });
					}, 1000)
				} else if (res.statusCode != 200) {
					this.showError('服务器错误，请稍后再试！');
				}
			},
			complete: () => {
				wx.hideLoading()
			}
		})
	},
	getTeamRank: function() {
		const dd = this.data;
		let uid = dd.userId ? dd.userId : 0;
		wx.request({
			url: api.teamRank,
			method: 'GET',
			data: { 
				companyId: dd.cid,
				projectId: dd.pid,
				userId: uid,
				pageNum: 1,
				pageSize: 10,
			},
			success: res => {
				if (res.data.code == 1) {
					const r = res.data.result;
					this.setData({ defaultTeam: r.defaultTeam, teamList: r.data.teamList ? r.data.teamList : [] });
				} else {
					this.showError('查询队伍错误，'+ res.data.msg);
				}
			}
		})
	},
	runProgress: function (dur, del, deg) {
		const that = this;
		let ani1, ani2;
		ani1 = wx.createAnimation({
			duration: dur,
			timingFunction: 'ease',
			delay: del,
			transformOrigin: "400% 50%"
		});
		ani2 = wx.createAnimation({
			duration: dur,
			timingFunction: 'ease',
			delay: del,
			transformOrigin: '50% 100%'
		});
		ani1.rotate(deg).step();
		ani2.rotate(180 + deg).step();
		that.setData({ peopleAni: ani1.export(), progressAni: ani2.export() });
		//步数数字滚动
		that.setData({ stepFmt: 0 });
		let dd = that.data;
		let std = dd.endStep / 40;
		let steps = dd.step;
		let speed = 0;
		if (steps > std) {
			speed = Math.floor(steps / std);
		} else {
			speed = 1;
		}
		if (speed > 20) { speed = 20; } else { }
		let timer = setInterval(() => {
			let num = Number(dd.stepFmt.toString().replace(',', ''));
			let st = '', count = 0;
			if (num > 999) {
				let l = parseInt(num / 1000);
				let r = num % 1000;
				let newNum = '';
				let rn = r + speed;
				let isGreater10 = rn >= 10;
				let isLess100 = rn < 100;
				let isLess10 = rn < 10;
				if (isLess10) {
					newNum = '00' + rn;
				} else if (isGreater10 && isLess100) {
					newNum = '0' + rn;
				} else {
					newNum = rn;
				}
				that.setData({ stepFmt: l + ',' + newNum });
			} else {
				that.setData({ stepFmt: num + speed });
			}
			if (steps > num && (steps - num) < (dd.endStep / 100) && speed > 1) {
				speed--;
			} else { }
			if (num >= steps) {
				clearInterval(timer);
				steps = steps.toString();
				if (steps.length > 3) {
					for (let i = steps.length - 1; i >= 0; i--) {
						st += steps.charAt(i);
						count += 1;
						if (count % 3 == 0) {
							st += ',';
						} else { }
					}
					st = st.split('').reverse().join('');
				} else {
					st = steps;
				}
				that.setData({ stepFmt: st });
			} else { }
		}, 5);
	},
	navtoThanks: function() {
		const dd = this.data;
		this.setData({ donatedShow: false });
		wx.navigateTo({
			url: '/pages/teamThanks/teamThanks?cid='+ dd.cid + '&pid='+ dd.pid,
		})
	},
	onPullDownRefresh: function() {
		wx.stopPullDownRefresh();
		this.getActDetail();
		this.getTeamRank();
		wx.login({
			success: res => {
				if (res.code) {
					this.setData({ code: res.code });
					this.wxlogin();
				}
			}
		})
	},
	openDialog: function (e) {
		let s = e.currentTarget.dataset.dialog;
		this.setData({ [s + 'Show']: true });
	},
	closeDialog: function (e) {
		const that = this;
		let s = e.currentTarget.dataset.dialog;
		let obj = {};
		let show = s + 'Show';
		let hide = s + 'Hide';
		obj[hide] = true;
		that.setData(obj);
		setTimeout(() => {
			obj[show] = false;
			obj[hide] = false;
			that.setData(obj);
			if (s == 'notEnough') {
				that.runProgress(0, 0, 0);
			} else { }
		}, 400);
	},
	showError: function (txt) {
		wx.showModal({
			title: '提示',
			content: txt,
			showCancel: false,
		});
	},
	onShareAppMessage: function() {
		const dd = this.data;
		return {
			title: '一起捐步做公益吧',
			path: '/pages/teams/teams?cid='+ dd.cid + '&pid='+ dd.pid,
			imageUrl: dd.info.projectCoverImageUrl,
		}
	}
})