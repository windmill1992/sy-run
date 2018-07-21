//index.js
//获取应用实例
const app = getApp().globalData;
const api = {
	login: app.base + 'wx/login.do',																					//获取userId
	getDonateStepRank: app.base + 'donateStep/getDonateStepRank.do',					//企业排行分页，按照捐赠金额排序
	getUserUpdateRunData: app.base + 'donateStep/getUserUpdateWeRundata.do', 	//判断用户10分钟内是否更新运动数据
	getRandomCompanyInfo: app.base + 'donateStep/getRandomCompanyInfo.do',		//随机选取企业，从企业选取一个项目
	getStatisticsData: app.base + 'donateStep/getStatisticsData.do',					//统计(总捐步人数，参与企业数，总金额)
	donateStep: app.base + 'donateStep/donateStep.do',												//捐步
	getRandomProjectInfo: app.base + 'donateStep/getRandomProjectInfo.do',		//换项目
	getSessionKey: app.base + 'wx/getSessionKey.do',													//获取session_key
	decodeInfo: app.base + 'wx/decodeInfo.do',																//解码获取步数
	addUserWeRundata: app.base + 'donateStep/addUserWeRundata.do'							//添加用户运动信息
};
const util = require('../../utils/util.js');
var page = 1;
Page({
	data: {
		userInfo: {},
		step: 0,
		endStep: 1000,
		endStepCn: '千',
		flag: [false, false, false],
		hasMore: 2,
		isLogin: false,
		cid: 0,
		pid: 0,
	},
	//随机企业和项目,已捐获取捐赠时的企业和项目
	getRandomCompany: function () {
		const that = this;
		const user = that.data.userInfo;
		wx.request({
			url: api.login,
			method: 'GET',
			data: {
				nickName: user.nickName,
				coverImageUrl: user.avatarUrl,
				openId: that.data.openId,
				unionId: that.data.unionId,
			},
			success: res => {
				if (res.data.code == 1) {
					const r = res.data.result;
					let userId = r.userId;
					that.setData({ userId: userId });
					wx.setStorage({
						key: 'userId',
						data: userId
					});
					that.getRandomCompanyInfo(userId);
				} else {
					that.showError('获取用户信息失败！');
					return;
				}
			}
		});
	},
	getRandomCompanyInfo: function(userId){
		userId = userId ? userId : 0;
		wx.request({
			url: api.getRandomCompanyInfo,
			method: 'GET',
			data: { 
				userId: userId,
				companyId: this.data.cid,
				projectId: this.data.pid,
			},
			success: res1 => {
				wx.hideLoading();
				if (res1.data.code == 1) {
					let r = res1.data.result;
					this.setData({
						projectId: r.project.projectId,
						projectTitle: r.project.projectTitle,
						projectLogo: r.project.projectImgUrl,
						bgUrl: r.project.projectImgUrl,
						donateState: false,
						randomCompany: {
							donateAmount: parseFloat(r.donateAmount / 10000).toFixed(2),
							companyName: r.name,
							slogan: r.slogan,
							companyId: r.companyId,
							companyImgUrl: r.companyImgUrl
						}, 
						state: r.state
					});
				} else if (res1.data.code == 2) {
					let r = res1.data.result;
					let user = wx.getStorageSync('user');
					if (user && user.nickName) {
						r.nickName = user.nickName;
					}
					this.setData({
						projectId: r.project.projectId,
						projectTitle: r.project.projectTitle,
						projectLogo: r.project.projectImgUrl,
						bgUrl: r.project.projectImgUrl,
						donateState: true,
						lastDonated: {
							userName: r.nickName,
							companyId: r.companyId,
							cLogo: r.companyImgUrl,
							cName: r.name,
							amount: r.userDonatAmount,
							projTitle: r.project.projectTitle,
							projId: r.project.projectId,
							steps: r.stepCount
						}
					});
				}
			}
		});
	},
	//随机项目
	getRandomProjectInfo: function () {
		const that = this;
		let cId = '';
		let cc = that.data.randomCompany;
		if (!cc) {
			cId = that.data.lastDonated.companyId;
		} else {
			cId = cc.companyId;
		}
		wx.request({
			url: api.getRandomProjectInfo,
			method: 'GET',
			data: { companyId: cId },
			success: res => {
				if (res.data.code == 1) {
					let r = res.data.result.project;
					that.setData({
						projectLogo: r.projectImgUrl,
						bgUrl: r.projectImgUrl,
						projectTitle: r.projectTitle,
						projectId: r.projectId
					});
				} else {
					that.showError('请求错误！' + res.data.msg);
					return;
				}
			}
		});
	},
	//获取成果榜单数据
	getStatisticsData: function () {
		const that = this;
		wx.request({
			url: api.getStatisticsData,
			method: 'GET',
			success: res => {
				if (res.data.code == 1) {
					let r = res.data.result;
					let arr = [r.peopleNum, r.companyNum, Math.round(r.donatedTotalMony)];
					let patt1 = new RegExp('万');
					for (let i = 0; i < arr.length; i++) {
						let snr = arr[i].toString();
						let obj = {}, obj2 = {};
						let str1 = "billboard[" + i + "].unit";
						let str11 = "billboardInit[" + i + "].unit";
						let str2 = "billboard[" + i + "].num";
						let str22 = "billboardInit[" + i + "].num";
						if (snr.length < 6) {
							obj[str1] = '';
						} else {
							snr = snr.substr(0, snr.length - 4);
							obj[str1] = '万';
						}
						obj[str2] = snr.split('');
						obj2[str22] = [];
						for (let j = 0; j < obj[str2].length; j++) {
							obj2[str22].push(0);
						}
						that.setData(obj);
						that.setData(obj2);
					}
				} else {
					that.showError('服务器错误，请稍后再试！' + res.data.msg);
					return;
				}
			}
		})
	},
	//企业排行分页
	effectList: function (pageNum, pageSize) {
		const that = this;
		wx.request({
			url: api.getDonateStepRank,
			method: 'GET',
			data: { pageNum: pageNum, pageSize: pageSize },
			success: res => {
				let r = res.data.result;
				if (r.length > 0) {
					that.setData({ hasData: true });
					let arr = [];
					for (let i = 0; i < r.length; i++) {
						arr.push({
							donateAmount: util.numFmt(r[i].donateAmount),		//企业捐赠金额
							companyImgUrl: r[i].companyImgUrl,		          //企业logo
							donateNum: util.numFmt(r[i].donateNum),					//慈善家数量
							companyName: r[i].companyName,				          //企业名称
							companyId: r[i].companyId						          	//企业id
						});
					}
					that.setData({ effectLists: arr });
				} else {
					that.setData({ hasData: false, hasMore: 1 });
				}
				if (!res.data.state) {
					that.setData({ hasMore: 0 });
				} else { }
			}
		});
	},
	donateStep: function () {
		const that = this;
		let dt = that.data;
		if(dt.rejectAuth){
			wx.openSetting({
				success: res2 => {
					if (res2 && res2.authSetting['scope.werun'] === true) {
						that.onLoad();
					} else {
						that.showError('授权失败');
						wx.hideLoading();
					}
				}
			});
		}else{
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
							that.setData({ amount: r.amount });
							that.setData({ enoughShow: true });
						} else {
							that.setData({ amount: 0 });
							that.showError('服务器错误，请稍后再试！');
							return;
						}
					}
				});
			}
		}
	},
	toDonate: function () {
		const that = this;
		let dd = that.data;
		wx.request({
			url: api.donateStep,
			method: 'POST',
			header: {
				"content-type": "application/x-www-form-urlencoded"
			},
			data: {
				extensionPeople: dd.randomCompany.companyId,
				userId: dd.userId,
				projectId: dd.projectId,
				amount: dd.amount
			},
			success: res => {
				if (res.data.code == 1) {
					wx.showToast({
						title: '捐步成功',
						icon: 'success',
						duration: 1000
					});
					setTimeout(() => {
						wx.navigateTo({
							url: '/pages/donateSuccess/donateSuccess'
						});
					}, 1000);

				} else {
					that.showError('捐步失败' + res.data.msg);
					return;
				}
			}
		});
	},
	loadmore: function () {
		if (this.data.hasMore == 2) {
			this.effectList(++page, 10);
		} else {
			return;
		}
	},
	toProjectDetail: function () {
		wx.navigateTo({
			url: '/pages/projectDetail/projectDetail?projectId=' + this.data.projectId,
		});
	},
	openDialog: function (e) {
		let s = e.currentTarget.dataset.dialog;
		let obj = {};
		let show = s + 'Show';
		obj[show] = true;
		this.setData(obj);
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
	showBillboard: function (i) {
		const that = this;
		let t = [false, false, false];
		for (let j = 0; j <= i; j++) {
			t[j] = true;
		}
		that.setData({ flag: t });
		let data = this.data.billboard;
		let a = [data[0].num, data[1].num, data[2].num];
		for (let k = 0; k < a[i].length; k++) {
			let obj = {};
			(function (j) {
				let n = Number(a[i][j]), c = 0;
				const timer = setInterval(function () {
					let str = "billboardInit[" + i + "].num[" + j + "]";
					obj = {};
					let o = c;
					o++;
					if (o > n) {
						o = n;
						obj[str] = o;
						that.setData(obj);
						clearInterval(timer);
					} else {
						obj[str] = o;
						that.setData(obj);
						c = o;
					}
				}, 150);
			})(k);
		}
	},
	get3rdSession: function () {
		wx.request({
			url: api.getSessionKey,
			data: { js_code: this.data.code },
			method: 'GET',
			success: res => {
				let r = res.data.result;
				let sessionId = r.session_key;
				let unionId = r.unionId;
				let openId = r.openId;
				this.setData({ sessionId: sessionId, unionId: unionId, openId: openId });
				wx.setStorageSync('sessionId', sessionId);
				this.decodeUserInfo({ encryptedData: this.data.encryptedData, iv: this.data.iv });
				if (!unionId || unionId == null || unionId == 'null') {
					
				} else {
					wx.setStorage({ key: 'openId', data: openId });
					wx.setStorage({ key: 'unionId', data: unionId });
				}
				if (this.data.userInfo.nickName) {
					this.getRandomCompany();
				} else {
					this.getRandomCompanyInfo(0);
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
					} else {
						setTimeout(() => {
							let todayStep = r.stepInfoList[30];
							that.setData({ step: todayStep.step, stepFmt: util.numFmt(todayStep.step) });
							if (that.data.userInfo.nickName) {
								that.addUserRunData();
							}
						}, 1000);
					}
				}
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
				} else { }
			}
		});
	},
	onLoad: function (options) {
		const that = this;
		if(options && options.cid){
			this.setData({ cid: options.cid, pid: options.pid, options: options });
		}
		wx.showLoading({
			title: '加载中...',
			mask: true
		});
		that.setData({ flag: [false, false, false], rejectAuth: false });
		wx.login({
			success: res => {
				if (res.code) {
					wx.getSystemInfo({
						success: res => {
							that.setData({ height: res.screenHeight + 'px' });
						},
					});
					that.getStatisticsData();
					let dd = new Date();
					that.setData({ code: res.code, year: dd.getFullYear(), month: dd.getMonth() + 1, day: dd.getDate() });
					wx.getSetting({
						success: res1 => {
							if (res1 && res1.authSetting['scope.werun'] !== false) {
								wx.getWeRunData({
									success: res2 => {
										const wRunEncryptedData = res2.encryptedData;
										that.setData({ encryptedData: wRunEncryptedData, iv: res2.iv });
										that.get3rdSession();
									},
									fail: () => {
										that.setData({ rejectAuth: true });
										that.getRandomCompanyInfo();
										wx.hideLoading();
									}
								});
							} else {
								wx.hideLoading();
								that.getRandomCompanyInfo();
								let arr = wx.getSystemInfoSync().SDKVersion.split('.');
								if((arr[0] >= 2 && arr[1] >= 1) || (arr[0] >= 2 && arr[1] == 0 && arr[2] >= 7)){
									that.setData({ rejectAuth: true, canIUse: true });
								}else{
									that.setData({ rejectAuth: true });
								}
							}
						}
					});
				} else {
					that.showError('获取用户登录状态失败!' + res.errMsg);
				}
			}
		});
		if(wx.getStorageSync('user')){
			this.setData({ userInfo: wx.getStorageSync('user') });
		}
	},
	openSetting: function(e){
		if(e.detail.authSetting['scope.werun']){
			this.onLoad(this.data.options);
		}else{
			this.showError('授权失败');
		}
	},
	getUserInfo: function(e) {
		if(e.detail.userInfo){
			this.setData({ userInfo: e.detail.userInfo });
			this.onLoad(this.data.options);
			this.decodeUserInfo({ encryptedData: e.detail.encryptedData, iv: e.detail.iv });
			wx.setStorageSync('user', e.detail.userInfo);
		}
	},
	onPageScroll: function (e) {
		const that = this;
		if (e.scrollTop >= 105 && !that.data.flag[0]) {
			that.showBillboard(0);
		} else { }
		if (e.scrollTop >= 150 && !that.data.flag[1]) {
			that.showBillboard(1);
		} else { }
		if (e.scrollTop >= 195 && !that.data.flag[2]) {
			that.showBillboard(2);
			that.effectList(page, 10);
		} else { }
	},
	onPullDownRefresh: function () {
		wx.stopPullDownRefresh();
		wx.showToast({
			title: '加载中...',
			icon: 'loading',
			duration: 2000
		});
		this.onLoad(this.data.options);
	},
	stopmove: function () { },
	showError: function (txt) {
		wx.showModal({
			title: '',
			content: txt,
			showCancel: false
		});
	},
	onShareAppMessage: function (res) {
		const that = this;
		let dd = that.data;
		return {
			title: dd.projectTitle,
			path: '/pages/index/index',
			imageUrl: dd.projectLogo
		};
	}
})
