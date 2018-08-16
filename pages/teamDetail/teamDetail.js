// pages/teamDetail/teamDetail.js
const app = getApp().globalData;
const api = {
	userUpdateRunData: app.base + '/donateStep/getUserUpdateWeRundata.do', 		//判断用户10分钟内是否更新运动数据
	teamDetail: app.base + 'donateStep/teamDetail.do',												//队伍信息
	login: app.base + 'wx/login.do',																					//获取userId
	donateStep: app.base + 'donateStep/donateStepNew.do',											//捐步
	getSessionKey: app.base + 'wx/getSessionKey.do',													//获取session_key
	decodeInfo: app.base + 'wx/decodeInfo.do',																//解码获取步数
	addUserWeRundata: app.base + 'donateStep/addUserWeRundata.do',						//添加用户运动信息
}
const util = require('../../utils/util.js');
Page({
  data: {
		notEnoughShow: false,
		endStep: 1000,
		step: 0,
		total: 0,
		userInfo: {},
  },
  onLoad: function (options) {
		if (options.tid) {
			let rank = options.rank ? Number(options.rank) + 1 : 0;
			this.setData({ tid: options.tid, cid: options.cid, pid: options.pid, rank: rank, rejectAuth: false });
			if (options.share == 1) {
				this.setData({ shareShow: true });
			}
		} else if (decodeURIComponent(options.scene)) {
			const arr = decodeURIComponent(options.scene).split('&');
			let cid = 0;
			let pid = 0;
			let tid = 0;
			for (let v of arr) {
				if (v.includes('cid')) {
					cid = v.split('=')[1];
				}
				if (v.includes('pid')) {
					pid = v.split('=')[1];
				}
				if (v.includes('tid')) {
					tid = v.split('=')[1];
				}
			}
			this.setData({ cid: cid, pid: pid, tid: tid, rejectAuth: false });
		} else {
			let url = '';
			if (options.cid) {
				url = '/pages/teams/teams?cid='+ options.cid + '&pid='+ options.pid;
			} else {
				url = '/pages/index/index';
			}
			wx.showModal({
				title: '提示',
				content: '队伍不存在，点击返回',
				showCancel: false,
				success: res => {
					if (res.confirm) {
						wx.reLaunch({
							url: url,
						})
					}
				}
			})
			return;
		}
		wx.login({
			success: res => {
				if (res.code) {
					this.setData({ code: res.code });
					this.wxlogin();
				}
			}
		})
  },
	onShow: function () {
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
				this.setData({ userInfo: user });
			}
			this.getTeamDetail();
		}
	},
	getTeamDetail: function() {
		const dd = this.data;
		let uid = dd.userId ? dd.userId: 0;
		wx.request({
			url: api.teamDetail,
			method: 'GET',
			data: {
				companyId: dd.cid,
				projectId: dd.pid,
				userId: uid,
				teamId: dd.tid,
			},
			success: res => {
				if (res.data.code == 1) {
					const r = res.data.result;
					let obj = {
						projectName: r.projectName,
						projectSubTitle: r.projectSubTitle,
						projectCoverImageUrl: r.projectCoverImageUrl,
						content: r.content,
						createPeople: r.createPeople,
						teamName: r.teamName,
						totalMoney: r.totalMoney,
						totalStep: r.totalStep,
						companyName: r.companyName,
						imageUrl: r.imageUrl,
					}
					this.setData({ info: obj, stepList: r.data, total: r.count, donateState: r.isDonate });
					if (r.isDonate) {
						this.setData({ donatedStep: r.donateStep });
						if (this.user) {
							this.setData({ donatedShow: true });
						}
					} else {
						if (this.user && this.data.rejectAuth) {
							this.showError('未授权运动，请再次点击完成授权！');
						} 
					}
					wx.setStorageSync('pTitle', r.projectName);
				}
			}
		})
	},
	wxlogin: function () {
		wx.showLoading({
			title: '加载中...',
			mask: true,
		});
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
		})
	},
	login: function () {
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
					const r = res.data.result;
					if (r.userId && r.userId != null && r.userId != 'null') {
						this.setData({ userId: r.userId, isLogin: true });
						wx.setStorageSync('userId', r.userId);
						if (this.data.step) {
							this.addUserRunData();
						}
					} else {
						this.setData({ isLogin: false })
					}
					this.getTeamDetail();
				} else {
					this.showError('获取用户信息失败！');
					return;
				}
			}
		})
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
					wx.setStorage({ key: 'openId', data: openId });
					this.decodeUserInfo({ encryptedData: this.data.encryptedData, iv: this.data.iv });
					if (!unionId || unionId == null || unionId == 'null') {
						console.log('unionId is null.');
					} else {
						this.setData({ unionId: unionId });
						wx.setStorage({ key: 'unionId', data: unionId });
					}
				} else {
					this.showError('服务器错误，请稍后再试！');
				}
			}
		})
	},
	decodeUserInfo: function (data) {
		const that = this;
		wx.request({
			url: api.decodeInfo,
			data: {
				encryptedData: data.encryptedData,
				iv: data.iv,
				js_code: that.data.code,
			},
			method: 'GET',
			success: res => {
				if (res.data.code == -1) {
					wx.login({
						success: res => {
							if (res.code) {
								this.setData({ code: res.code });
								this.wxlogin();
							}
						}
					})
					return;
				} else {
					const r = res.data.result;
					if (r.unionId) {
						that.setData({ unionId: r.unionId, openId: r.openId });
						wx.setStorage({ key: 'openId', data: r.openId });
						wx.setStorage({ key: 'unionId', data: r.unionId });
						this.login();
					} else {
						let todayStep = r.stepInfoList[30];
						that.setData({ step: todayStep.step, stepFmt: util.numFmt(todayStep.step) });
						if (this.data.userInfo.nickName) {
							this.login();
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
					this.showError('添加或更新步数失败，' + res.data.msg);
					return;
				} else if (res.data.code == -1) {
					this.showError('服务器错误,请稍后再试，' + res.data.msg);
				} else { 
					if (this.user) {
						this.user = false;
						this.donateStep();
					}
				}
			}
		});
	},
	openSetting: function (e) {
		if (e.detail.authSetting['scope.werun']) {
			wx.login({
				success: res => {
					if (res.code) {
						this.setData({ code: res.code });
						this.wxlogin();
					}
				}
			})
		} else {
			wx.hideLoading()
		}
	},
	getUserInfo: function (e) {
		if (e.detail.userInfo) {
			this.setData({ userInfo: e.detail.userInfo });
			this.decodeUserInfo({ encryptedData: e.detail.encryptedData, iv: e.detail.iv });
			this.user = true;
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
						wx.login({
							success: res => {
								if (res.code) {
									this.setData({ code: res.code });
									this.wxlogin();
								}
							}
						})
					} else {
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
					that.setData({ word: word[0] })
				} else if (deg < 36) {
					that.setData({ word: word[1] })
				} else if (deg < 126) {
					that.setData({ word: word[2] })
				} else if (deg < 162) {
					that.setData({ word: word[3] })
				} else {
					that.setData({ word: word[4] })
				}
				setTimeout(() => {
					that.runProgress(1000, 500, deg)
				}, 100)
			} else {
				wx.request({
					url: api.userUpdateRunData,
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
				})
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
				teamId: dd.tid,
			},
			success: res => {
				if (res.statusCode == 200) {
					if (res.data.code == 1) {
						this.setData({ enoughShow: false });
						wx.showToast({
							title: '捐步成功',
							icon: 'success',
							duration: 1000,
						});
						setTimeout( () => {
							wx.navigateTo({
								url: '/pages/teamThanks/teamThanks?cid='+ dd.cid + '&pid='+ dd.pid,
							});
						}, 1000);
					} else {
						this.showError('捐步失败，' + res.data.msg);
						return;
					}
				} else {
					this.showError('未知异常！');
				}
			}
		});
	},
	runProgress: function (dur, del, deg) {
		const that = this;
		let ani1, ani2;
		ani1 = wx.createAnimation({
			duration: dur,
			timingFunction: 'ease',
			delay: del,
			transformOrigin: "400% 50%",
		});
		ani2 = wx.createAnimation({
			duration: dur,
			timingFunction: 'ease',
			delay: del,
			transformOrigin: '50% 100%',
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
		speed = speed > 20 ? speed : 20;
		let timer = setInterval( () => {
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
	navtoThanks: function () {
		const dd = this.data;
		this.setData({ donatedShow: false });
		wx.navigateTo({
			url: '/pages/teamThanks/teamThanks?cid=' + dd.cid + '&pid=' + dd.pid,
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
	showQRCode: function () {
		wx.previewImage({
			urls: [this.data.info.imageUrl],
		})
		// this.setData({ qrcodeShow: true });
	},
	showError: function (txt) {
		wx.showModal({
			title: '提示',
			content: txt,
			showCancel: false,
		});
	},
	onShareAppMessage: function () {
		const dd = this.data;
		return {
			title: '和'+ dd.info.companyName+ '一起捐步为爱做公益吧~',
			path: '/pages/teamDetail/teamDetail?cid=' + dd.cid + '&pid=' + dd.pid + '&tid='+ dd.tid,
			imageUrl: dd.info.projectCoverImageUrl,
		}
	}
})