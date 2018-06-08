//index.js
//获取应用实例
var app = getApp();
var base = 'https://www.17xs.org/';
var dataUrl = {
	login: base + 'wx/login.do',																					//获取userId
	getDonateStepRank: base + 'donateStep/getDonateStepRank.do',					//企业排行分页，按照捐赠金额排序
	getUserUpdateRunData: base + 'donateStep/getUserUpdateWeRundata.do', 	//判断用户10分钟内是否更新运动数据
	getRandomCompanyInfo: base + 'donateStep/getRandomCompanyInfo.do',		//随机选取企业，从企业选取一个项目
	getStatisticsData: base + 'donateStep/getStatisticsData.do',					//统计(总捐步人数，参与企业数，总金额)
	donateStep: base + 'donateStep/donateStep.do',												//捐步
	getRandomProjectInfo: base + 'donateStep/getRandomProjectInfo.do',		//换项目
	getSessionKey: base + 'wx/getSessionKey.do',													//获取session_key
	decodeInfo: base + 'wx/decodeInfo.do',																//解码获取步数
	addUserWeRundata: base + 'donateStep/addUserWeRundata.do'							//添加用户运动信息
};
var util = require('../../utils/util.js');
var page = 1;
Page({
	data: {
		userInfo: {},
		step: 0,
		endStep: 1000,
		endStepCn: '千',
		flag: [false, false, false],
		hasMore: 2
	},
	//随机企业和项目,已捐获取捐赠时的企业和项目
	getRandomCompany: function () {
		var that = this;
		var user = that.data.userInfo;
		wx.request({
			url: dataUrl.login,
			method: 'GET',
			data: {
				nickName: user.nickName,
				coverImgUrl: user.avatarUrl,
				openId: that.data.openId,
				unionId: that.data.unionId
			},
			success: function (res) {
				if (res.data.code == 1) {
					var userId = res.data.result.userId;
					that.setData({ userId: userId });
					wx.setStorage({
						key: 'userId',
						data: userId
					});
					wx.request({
						url: dataUrl.getRandomCompanyInfo,
						data: { userId: userId },
						success: function (res1) {
							wx.hideLoading();
							if (res1.data.code == 1) {
								var result = res1.data.result;
								that.setData({
									projectId: result.project.projectId,
									projectTitle: result.project.projectTitle,
									projectLogo: result.project.projectImgUrl,
									bgUrl: 'url(' + result.project.projectImgUrl + ')',
									donateState: false,
									randomCompany: {
										donateAmount: parseFloat(result.donateAmount / 10000).toFixed(2),
										companyName: result.name,
										slogan: result.slogan,
										companyId: result.companyId,
										companyImgUrl: result.companyImgUrl
									}
								});
							} else if (res1.data.code == 2) {
								var result = res1.data.result;
								that.setData({
									projectId: result.project.projectId,
									projectTitle: result.project.projectTitle,
									projectLogo: result.project.projectImgUrl,
									bgUrl: 'url(' + result.project.projectImgUrl + ')',
									donateState: true,
									lastDonated: {
										userName: result.nickName,
										companyId: result.companyId,
										cLogo: result.companyImgUrl,
										cName: result.name,
										amount: result.userDonatAmount,
										projTitle: result.project.projectTitle,
										projId: result.project.projectId,
										steps: result.stepCount
									}
								});
							}
						}
					});
				} else {
					that.showError('获取用户信息失败！');
					return;
				}
			}
		});
	},
	//随机项目
	getRandomProjectInfo: function () {
		var that = this;
		var cId = '';
		var cc = that.data.randomCompany;
		if (!cc) {
			cId = that.data.lastDonated.companyId;
		} else {
			cId = cc.companyId;
		}
		wx.request({
			url: dataUrl.getRandomProjectInfo,
			method: 'GET',
			data: { companyId: cId },
			success: function (res) {
				if (res.data.code == 1) {
					var result = res.data.result.project;
					that.setData({
						projectLogo: result.projectImgUrl,
						bgUrl: 'url(' + result.projectImgUrl + ')',
						projectTitle: result.projectTitle,
						projectId: result.projectId
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
		var that = this;
		wx.request({
			url: dataUrl.getStatisticsData,
			method: 'GET',
			success: function (res) {
				if (res.data.code == 1) {
					var result = res.data.result;
					var arr = [result.peopleNum, result.companyNum, Math.round(result.donatedTotalMony)];
					var patt1 = new RegExp('万');
					for (var i = 0; i < arr.length; i++) {
						var snr = arr[i].toString();
						var obj = {}, obj2 = {};
						var str1 = "billboard[" + i + "].unit";
						var str11 = "billboardInit[" + i + "].unit";
						var str2 = "billboard[" + i + "].num";
						var str22 = "billboardInit[" + i + "].num";
						if (snr.length < 6) {
							obj[str1] = '';
						} else {
							snr = snr.substr(0, snr.length - 4);
							obj[str1] = '万';
						}
						obj[str2] = snr.split('');
						obj2[str22] = [];
						for (var j = 0; j < obj[str2].length; j++) {
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
		var that = this;
		wx.request({
			url: dataUrl.getDonateStepRank,
			method: 'GET',
			data: { pageNum: pageNum, pageSize: pageSize },
			success: function (res) {
				var result = res.data.result;
				if (result.length > 0) {
					that.setData({ hasData: true });
					var arr = [];
					for (var i = 0; i < result.length; i++) {
						arr.push({
							donateAmount: util.numFmt(result[i].donateAmount),		//企业捐赠金额
							companyImgUrl: result[i].companyImgUrl,		          	//企业logo
							donateNum: util.numFmt(result[i].donateNum),					//慈善家数量
							companyName: result[i].companyName,				          	//企业名称
							companyId: result[i].companyId						          	//企业id
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
		var that = this;
		var dt = that.data;
		if (dt.step < dt.endStep) {
			that.setData({ notEnoughShow: true });
			var word = [
				'帅的人已日均万步，丑的人还原地踏步，你选哪个？',
				'一整天都没有运动，别等沙发上的土豆都发了芽',
				'今天运动量还没达标哦~宝宝坚持再走几步吧',
				'还差一点就达标啦，宝宝加油~',
				'就差一点点了哦，再走几步吧~'
			];
			var deg = Math.ceil(parseFloat(dt.step / dt.endStep * 180).toFixed(1));
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
			setTimeout(function () {
				that.runProgress(1000, 500, deg);
			}, 100);
		} else {
			wx.request({
				url: dataUrl.getUserUpdateRunData,
				method: 'GET',
				data: { userId: dt.userId },
				success: function (res) {
					if (res.data.code == 1) {
						var result = res.data.result;
						that.setData({ amount: result.amount });
						that.setData({ enoughShow: true });
					} else {
						that.setData({ amount: 0 });
						that.showError('服务器错误，请稍后再试！');
						return;
					}
				}
			});
		}
	},
	toDonate: function () {
		var that = this;
		var dd = that.data;
		wx.request({
			url: dataUrl.donateStep,
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
			success: function (res) {
				if (res.data.code == 1) {
					wx.showToast({
						title: '捐步成功',
						icon: 'success',
						duration: 1000
					});
					setTimeout(function () {
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
		var s = e.currentTarget.dataset.dialog;
		var obj = {};
		var show = s + 'Show';
		obj[show] = true;
		this.setData(obj);
	},
	closeDialog: function (e) {
		var that = this;
		var s = e.currentTarget.dataset.dialog;
		var obj = {};
		var show = s + 'Show';
		var hide = s + 'Hide';
		obj[hide] = true;
		that.setData(obj);
		setTimeout(function () {
			obj[show] = false; obj[hide] = false;
			that.setData(obj);
			if (s == 'notEnough') {
				that.runProgress(0, 0, 0);
			} else { }
		}, 400);
	},
	runProgress: function (dur, del, deg) {
		var that = this;
		var ani1, ani2;
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
		var dd = that.data;
		var std = dd.endStep / 40;
		var steps = dd.step;
		if (steps > std) {
			var speed = Math.floor(steps / std);
		} else {
			speed = 1;
		}
		if (speed > 20) { speed = 20; } else { }
		var timer = setInterval(function () {
			var num = Number(dd.stepFmt.toString().replace(',', ''));
			var st = '', count = 0;
			if (num > 999) {
				var l = parseInt(num / 1000);
				var r = num % 1000;
				var newNum = '';
				var rn = r + speed;
				var isGreater10 = rn >= 10;
				var isLess100 = rn < 100;
				var isLess10 = rn < 10;
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
					for (var i = steps.length - 1; i >= 0; i--) {
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
		var that = this;
		var t = [false, false, false];
		for (var j = 0; j <= i; j++) {
			t[j] = true;
		}
		that.setData({ flag: t });
		var data = this.data.billboard;
		var a = [data[0].num, data[1].num, data[2].num];
		for (var k = 0; k < a[i].length; k++) {
			var obj = {};
			(function (j) {
				var n = Number(a[i][j]), c = 0;
				const timer = setInterval(function () {
					var str = "billboardInit[" + i + "].num[" + j + "]";
					obj = {};
					var o = c;
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
		var that = this;
		wx.request({
			url: dataUrl.getSessionKey,
			data: { js_code: that.data.code },
			method: 'GET',
			success: function (res) {
				var r = res.data.result;
				var sessionId = r.session_key;
				var unionId = r.unionId;
				var openId = r.openId;
				that.setData({ sessionId: sessionId, unionId: unionId, openId: openId });
				wx.setStorageSync('sessionId', sessionId);
				wx.setStorage({ key: 'unionId', data: unionId });
				wx.setStorage({ key: 'openId', data: openId });
				that.getRandomCompany();
				that.decodeUserInfo();
			}
		});
	},
	decodeUserInfo: function () {
		var that = this;
		wx.request({
			url: dataUrl.decodeInfo,
			data: {
				encryptedData: that.data.encryptedData,
				iv: that.data.iv,
				js_code: that.data.code
			},
			method: 'GET',
			success: function (res) {
				if (res.data.code == -1) {
					that.showError('请求错误!' + res.data.msg);
					return;
				} else {
					setTimeout(function () {
						var todayStep = res.data.result.stepInfoList[30];
						that.setData({ step: todayStep.step, stepFmt: util.numFmt(todayStep.step) });
						that.addUserRunData();
					}, 1000);
				}
			}
		});
	},
	addUserRunData: function () {
		var that = this;
		wx.request({
			url: dataUrl.addUserWeRundata,
			method: 'GET',
			data: {
				unionId: that.data.unionId,
				openId: that.data.openId,
				runData: that.data.step,
				nickName: that.data.userInfo.nickName,
				coverImageUrl: that.data.userInfo.avatarUrl
			},
			success: function (res) {
				if (res.code == 0) {
					that.showError('添加或更新用户运动步数失败!' + res.data.msg);
					return;
				} else if (res.code == -1) {
					that.showError('服务器错误,请稍后再试!' + res.data.msg);
				} else { }
			}
		});
	},
	onLoad: function () {
		var that = this;
		wx.showLoading({
			title: '加载中...',
			mask: true
		});
		that.setData({ flag: [false, false, false] });
		wx.login({
			success: function (res) {
				if (res.code) {
					wx.getSystemInfo({
						success: function (res) {
							that.setData({ height: res.screenHeight + 'px' });
						},
					});
					that.getStatisticsData();
					var dd = new Date();
					that.setData({ code: res.code, year: dd.getFullYear(), month: dd.getMonth() + 1, day: dd.getDate() });
					wx.getSetting({
						success: function (res1) {
							if (res1 && res1.authSetting['scope.werun'] !== false) {
								wx.getWeRunData({
									success: function (res2) {
										const wRunEncryptedData = res2.encryptedData;
										that.setData({ encryptedData: wRunEncryptedData, iv: res2.iv });
										that.get3rdSession();
									},
									fail: function () {
										wx.hideLoading();
										wx.redirectTo({
											url: '/pages/authorize/authorize?flag=index&info=werun'
										});
									}
								});
							} else {
								wx.openSetting({
									success: function (res2) {
										if (res2 && res2.authSetting['scope.werun'] === true) {
											wx.getWeRunData({
												success: function (res3) {
													const wRunEncryptedData = res3.encryptedData;
													that.setData({ encryptedData: wRunEncryptedData, iv: res3.iv });
													that.get3rdSession();
												}
											});
										} else {
											wx.hideLoading();
											wx.redirectTo({
												url: '/pages/authorize/authorize?flag=index&info=werun'
											});
										}
									}
								});
							}
						}
					});
				} else {
					that.showError('获取用户登录状态失败!' + res.errMsg);
				}
			}
		});
		//调用应用实例的方法获取全局数据
		app.getUserInfo(function (userInfo) {
			//更新数据
			that.setData({ userInfo: userInfo });
		});
	},
	onPageScroll: function (e) {
		var that = this;
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
		var that = this;
		wx.stopPullDownRefresh();
		wx.showToast({
			title: '加载中...',
			icon: 'loading',
			duration: 2000
		});
		that.onLoad();
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
		var that = this;
		var dd = that.data;
		return {
			title: dd.projectTitle,
			path: '/pages/index/index',
			imageUrl: dd.projectLogo,
			success: function (res1) {
				wx.showToast({
					title: '转发成功'
				});
			},
			fail: function (res1) {
				that.showError('转发失败');
			}
		};
	}
})
