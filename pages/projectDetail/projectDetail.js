//projectDetail.js
const app = getApp().globalData;
const api = {
	hostList: app.base + 'project/H5careProjectList.do',												//反馈
	addleaveWord: app.base + 'project/addleaveWord.do',													//添加留言
	donationlist: app.base + 'project/gardendonationlist.do',										//捐助记录和留言
	User_replyLeaveWord: app.base + 'h5ProjectDetails/addNewLeaveWord.do',			//提交评论
	gotoAlterReply: app.base + 'h5ProjectDetails/gotoAlterReply.do',						//留言，回复
	loadMoreLeaveWord: app.base + 'h5ProjectDetails/loadMoreLeaveWord.do',			//加载更多留言
	refleshLeaveWord: app.base + 'h5ProjectDetails/refleshLeaveWord.do',				//刷新评论
	appletPay: app.base + 'visitorAlipay/appletPay.do',                         //获取支付参数
	getProjectDetail: app.base + 'resposibilityReport/getProjectDetail.do',			//获取项目详情
	getProjectContent: app.base + 'resposibilityReport/getProjectContent.do',		//获取详情内容
	getSessionKey: app.base + 'wx/getSessionKey.do',														//获取openid
	login: app.base + 'wx/login.do',																						//获取userId
	getPublisher: app.base + 'project/getProjectFaBuUserInfo.do'								//获取发起人信息
};
const util = require('../../utils/util.js');
const WxParse = require('../../wxParse/wxParse.js');
var itemHeight = [0, 0, 0, 0];
Page({
	data: {
		curTab: 0,
		moneyList: [10, 20, 50, 100, 500, '自定义'],
		selected: 0,
		curMoney: 0,
		checked: true,
		wordValue: '',
		needMoney: 0,
		realName: '',
		mobileNum: '',
		flag_state: false,
		loadState: [false, false, false, false],
		showLoad: false,
		showFoot: false,
		isLogin: false
	},
	onLoad: function (options) {
		const that = this;
		this.page = 1;
		wx.showLoading({
			title: '加载中...',
		});
		let dd = that.data;
		that.setData({ projectId: options.projectId, curMoney: dd.moneyList[dd.selected] });
		if (options.cid) {
			this.setData({ cid: options.cid });
		}
		let user = wx.getStorageSync('user');
		let nickName = '', coverImageUrl = '';
		if(user && user.nickName){
			nickName = user.nickName;
			coverImageUrl = user.avatarUrl;
			this.setData({ isLogin: true, user: { nickName: nickName, coverImageUrl: coverImageUrl } });
		}
		let openId = wx.getStorageSync('openId');
		let unionId = wx.getStorageSync('unionId');

		if (openId == '' || unionId == '') {
			wx.login({
				success: res => {
					if (res.code) {
						wx.request({
							url: api.getSessionKey,
							method: 'GET',
							data: { js_code: res.code },
							success: res2 => {
								let r = res2.data.result;
								openId = r.openId;
								unionId = r.unionId;
								that.setData({ openId: openId, unionId: unionId });
								wx.request({
									url: api.login,
									method: 'GET',
									data: {
										nickName: nickName,
										coverImgUrl: coverImageUrl,
										openId: openId,
										unionId: unionId
									},
									success: res3 => {
										if (res3.data.code == 1) {
											wx.setStorage({
												key: 'userId',
												data: res3.data.result.userId
											});
											that.getProjectDetail(res3.data.result.userId);
										} else {
											that.showError('获取用户信息失败');
										}
									}
								});
							}
						});
					} else {
						that.showError('登录异常，请稍后再试！');
					}
				}
			});
		} else {
			that.setData({ openId: openId, unionId: unionId });
			that.getProjectDetail();
		}
		that.getProjectContent();
	},
	getProjectDetail: function (userId) {
		const that = this;
		if (!userId) {
			userId = wx.getStorageSync('userId');
		}
		wx.request({
			url: api.getProjectDetail,
			method: 'GET',
			data: { projectId: that.data.projectId, userId: userId },
			success: res => {
				if (res.data.code == 1) {
					let r = res.data.result;
					that.setData({
						projectTitle: r.projectTitle,
						projectSubTitle: r.projectSubTitle,
						donatePercent: r.donatePercent,
						donationNum: r.donationNum,
						donatAmount: util.numFmt(r.donatAmount),
						totalMoney: util.numFmt(r.totalMoney),
						projectLogo: r.projectLogo,
						leaveWord: r.leaveWord,
						needMoney: r.totalMomey - r.donatAmount,
						realName: r.realName,
						mobileNum: r.mobileNum
					});
				} else {
					that.showError(res.data.msg);
				}
			}
		});
	},
	getProjectContent: function () {
		const that = this;
		wx.request({
			url: api.getProjectContent,
			method: 'GET',
			data: { projectId: that.data.projectId },
			success: res => {
				if (res.data.code == 1) {
					let r = res.data.result;
					WxParse.wxParse('projectCon', 'html', r.projectContent, that);
					let obj = {}, str = 'loadState[0]';
					obj[str] = true;
					setTimeout(() => {
						wx.createSelectorQuery().select('#list0').boundingClientRect(rect => {
							itemHeight.splice(0, 1, rect.height + 'px');
							obj['itemHeight'] = itemHeight;
							obj['showFoot'] = true;
							that.setData(obj, () => {
								wx.hideLoading();
							});
						}).exec();
					}, 1200);
				} else {
					that.showError(res.data.msg);
				}
			}
		});
	},
	getFaqiren: function () {
		const that = this;
		wx.request({
			url: api.getPublisher,
			method:'GET',
			data:{ projectId: that.data.projectId },
			success: res => {
				if(res.data.code == 1){
					let r = res.data.result;
					that.setData({
						fqr: {
							avatar: 'https://www.17xs.org/res/images/detail/people_avatar.jpg',
							name: r.workUnit != null ? r.workUnit : '无',
							relation: r.linkMan != null ? r.linkMan : '无',
							tel: r.linkMobile != null ? r.linkMobile : '无',
							addr: r.familyAddress != null ? r.familyAddress : '无',
							accept: '宁波市善园公益基金会'
						}
					});
				}else{
					that.setData({
						fqr: {
							avatar: 'https://www.17xs.org/res/images/detail/people_avatar.jpg',
							name: '宁波市善园公益基金会',
							relation: '梁峻兰',
							tel: '0574-87412436',
							addr: '浙江省宁波市鄞州区泰康西路399号',
							accept: '宁波市善园公益基金会'
						}
					});
				}
				let obj = {}, str = 'loadState[1]';
				obj[str] = true;
				setTimeout( () => {
					wx.createSelectorQuery().select('#list1').boundingClientRect( rect => {
						itemHeight.splice(1, 1, rect.height + 'px');
						obj['itemHeight'] = itemHeight;
						obj['showFoot'] = true;
						that.setData(obj);
					}).exec();
				}, 300);
			}
		})
	},
	getDonationList: function (pageSize, pageNum) {
		const that = this;
		if (this.page == 1) {
			wx.showLoading({
				title: '加载中...',
			});
		}
		let dd = that.data;
		let flag = false;
		if (this.page == 1) { flag = true; } else { }
		wx.request({
			url: api.donationlist,
			method: 'GET',
			data: { id: dd.projectId, page: pageSize, pageNum: pageNum, t: new Date().getTime() },
			success: res => {
				wx.hideLoading();
				if (res.data.flag == 1) {
					if (res.data.obj.data.length < 10) {
						that.setData({ hasMoreDonation: false });
					} else {
						that.setData({ hasMoreDonation: true });
					}
					if (res.data.obj.data.length > 0) {
						let arr = [], o = {}, mb = [], imgUrl = '';
						let obj = res.data.obj;
						let total = obj.total, pageNum = obj.pageNum, datas = obj.data, len = datas.length;
						len = len > pageNum ? pageNum : len;
						let leavewords = res.data.obj1;
						for (let i = 0; i < len; i++) {
							if (datas[i].imagesurl != null) {
								imgUrl = datas[i].imagesurl;
							} else {
								imgUrl = app.base + 'res/images/detail/people_avatar.jpg';
							}
							o['avatar'] = imgUrl;
							o['userName'] = datas[i].name;
							o['dMoney'] = datas[i].dMoney;
							o['leaveWord'] = datas[i].leaveWord == null ? '' : datas[i].leaveWord;
							o['showTime'] = datas[i].showTime;
							o['id'] = datas[i].id;

							arr.push(o);
							o = {};
						}
						if (!dd.flag_state) {
							that.setData({ flag_state: true });
						} else if (that.page > 1) {
							that.setData({ flag_state: false });
						}
						let arr2 = [];
						for (let k = 0; k < datas.length; k++) {
							let tt = leavewords[k];
							if (tt.length > 0) {
								if (tt[0].total <= (tt[0].currentPage - 1) * 20 + tt.length) {
									arr2.push(true);
								} else {
									arr2.push(false);
								}
							} else {
								arr2.push(true);
							}
						}
						let tempArr = dd.recordList;
						let tempArr2 = dd.isMore20;
						let tempMb = dd.mboard;
						if (tempArr) {
							arr = tempArr.concat(arr);
						}
						if (tempArr2) {
							arr2 = tempArr2.concat(arr2);
						}
						if (tempMb) {
							mb = tempMb.concat(mb);
						}
						that.setData({ recordList: arr, isMore20: arr2, mboard: mb, showLoad: true });
						let obj2 = {}, str = 'loadState[2]';
						obj2[str] = true;
						setTimeout( () => {
							wx.createSelectorQuery().select('#list2').boundingClientRect( rect => {
								itemHeight.splice(2, 1, rect.height + 'px');
								obj2['itemHeight'] = itemHeight;
								obj2['showFoot'] = true;
								that.setData(obj2);
							}).exec();
						}, 800);
					}
				} else {
					that.showError('网络异常，请稍后再试！');
				}
			}
		});
	},
	hostList: function (page) {
		const that = this;
		wx.showLoading({
			title: '加载中...',
		});
		let dd = that.data;
		wx.request({
			url: api.hostList,
			method: 'GET',
			data: { projectId: dd.projectId },
			success: res => {
				wx.hideLoading();
				let obj = res.data.obj;
				let arr = [], o = {}, total = page = obj.total, currentPage = obj.page, dl = obj.data;
				if (dl.length == 0) {
					that.setData({ status: false });
					return;
				} else {
					that.setData({ status: true });
				}
				for (let i = 0; i < dl.length; i++) {
					if (dl[i].userImageUrl != null) {
						o['userImgUrl'] = dl[i].userImageUrl;
					} else {
						if (dl[i].uName != null) {
							o['userImgUrl'] = base + 'res/images/detail/people_avatar.jpg';
						} else {
							o['userImgUrl'] = base + 'res/images/h5/images/kefu_hulu.jpg';
						}
					}
					o['cTime'] = util.formatTime(new Date(dl[i].cTime), '/', 1);
					if (dl[i].source == 'home' || dl[i].uName != null) {
						o['uName'] = dl[i].uName;
					} else if (dl[i].source == 'admin' || dl[i].uName == null) {
						o['uName'] = '善园基金会';
					} else { }
					let imgs = dl[i].imgs, o1 = {};
					o['imgs'] = [];
					if (imgs && imgs.length > 0) {
						o['content'] = dl[i].content;
						o['imgs'].push(true);
						o['imgList'] = [];
						for (let j = 0; j < imgs.length; j++) {
							o['imgList'].push(imgs[j]);
						}
					} else {
						o['imgs'].push(false);
					}
					arr.push(o);
					o = {};
				}
				that.setData({ hostList: arr });
				let obj2 = {}, str = 'loadState[3]';
				obj2[str] = true;
				setTimeout( () => {
					wx.createSelectorQuery().select('#list3').boundingClientRect( rect => {
						itemHeight.splice(3, 1, rect.height + 'px');
						obj2['itemHeight'] = itemHeight;
						that.setData(obj2);
					}).exec();
				}, 300);
			}
		});
	},
	getUserInfo: function(e) {
		if(e.detail.userInfo){
			let user = e.detail.userInfo;
			let obj = {
				nickName: user.nickName,
				coverImageUrl: user.avatarUrl
			}
			this.setData({ payShow: true, maskShow: true, isLogin: true, user: obj });
			wx.setStorageSync('user', user);
		}else{
			this.showError('授权失败！');
		}
	},
	changeTab: function (e) {
		let cur = e.detail.current;
		this.setData({ curTab: cur });
		if (!this.data.loadState[cur] && cur == 0) {
			this.getProjectContent();
		} else if (!this.data.loadState[cur] && cur == 1) {
			this.getFaqiren();
		} else if (!this.data.loadState[cur] && cur == 2) {
			this.getDonationList(this.page, 10);
		} else if (!this.data.loadState[cur] && cur == 3) {
			this.hostList(1);
		}
	},
	switchTab: function (e) {
		let cur = e.currentTarget.dataset.cur;
		this.setData({ curTab: cur });
	},
	loadmore: function (e) {
		const that = this;
		that.setData({ showFoot: false });
		wx.showLoading({
			title: '加载中...',
		});
		setTimeout( () => {
			that.getDonationList(++this.page, 10);
		}, 500);
	},
	preview: function (e) {
		let ds = e.currentTarget.dataset;
		let idx = ds.idx;
		let index = ds.index;
		let dd = this.data;
		wx.previewImage({
			current: dd.hostList[index].imgList[idx],
			urls: dd.hostList[index].imgList
		});
	},
	switchMoney: function (e) {
		let dd = e.currentTarget.dataset;
		if (dd.index == this.data.selected) {
			return;
		} else {
			this.setData({ selected: dd.index });
			if (dd.num != '自定义') {
				this.setData({ curMoney: dd.num, diy: false });
			} else {
				this.setData({ curMoney: 0, diy: true });
			}
		}
	},
	getDiyMoney: function (e) {
		let v = e.detail.value;
		v = Number(parseFloat(v).toFixed(2));
		if (isNaN(v)) {
			this.setData({ curMoney: 0 });
		} else {
			this.setData({ curMoney: v });
		}
	},
	donateMoney: function (e) {
		const that = this;
		let dd = that.data;
		let vv = e.detail.value;
		let word = '';
		let check = that.data.checked;
		let money = that.data.curMoney;
		if (money <= 0) {
			that.showError('捐款金额不能低于0.01元');
			return;
		} else if (money > that.data.needMoney) {
			that.showError('最多捐款金额' + that.data.needMoney);
			return;
		} else if (vv.mobile && !util.telValidate(vv.mobile)) {
			that.showError('手机号格式不正确！');
			that.setData({ telFocus: true });
			return;
		} else if (vv.donateWord == '') {
			word = dd.leaveWord;
		} else {
			word = vv.donateWord;
		}
		if (!check) {
			that.showError('请先同意捐助协议！');
			return;
		} else {
			let obj = {
				openId: dd.openId,
				unionId: dd.unionId,
				money: money,
				word: word,
				vv: vv
			};
			obj = Object.assign({}, obj, this.data.user);
			that.pay(obj);
		}
	},
	pay: function (o) {
		const that = this;
		let dd = that.data;
		if (!o.nickName || !o.coverImageUrl) {
			that.showError('获取用户信息失败！');
			return;
		} else {
			wx.request({
				url: api.appletPay,
				method: 'GET',
				data: {
					openid: o.openId,
					unionId: o.unionId,
					nickName: o.nickName,
					coverImageUrl: o.coverImageUrl,
					projectId: dd.projectId,
					amount: o.money,
					realName: o.vv.realName,
					mobileNum: o.vv.mobile,
					donateWord: o.word,
					slogans: 'applet'
				},
				success: res => {
					if (res.data.code == 1) {
						let r = res.data.result;
						wx.requestPayment({
							timeStamp: r.timestamp,
							nonceStr: r.noncestr,
							package: r.packageValue,
							signType: r.paysignType,
							paySign: r.paySign,
							success: () => {
								wx.redirectTo({
									url: '/pages/projectDetail/projectDetail?projectId=' + dd.projectId
								});
							}
						});
					} else {
						that.showError('服务器错误，请稍后重试！');
					}
				}
			});
		}
	},
	getName: function (e) {
		let realName = e.detail.value;
		this.setData({ realName: realName });
	},
	getMobile: function (e) {
		let tel = e.detail.value;
		this.setData({ mobile: tel });
	},
	getWord: function (e) {
		let str = e.detail.value;
		if (str == '') {
			this.setData({ word: '' });
		} else {
			this.setData({ word: str });
		}
	},
	checkprop: function (e) {
		let checked = e.detail.value.length > 0;
		this.setData({ checked: checked });
	},
	donateTap: function () {
		const that = this;
		if(this.data.isLogin){
			that.setData({ payShow: true, maskShow: true });
		}else{
			wx.getSetting({
				success: res => {
					if (res && res.authSetting['scope.userInfo'] !== false) {
						wx.getUserInfo({
							success: res1 => {
								let user = res1.userInfo, obj = {};
								obj['nickName'] = user.nickName;
								obj['coverImageUrl'] = user.avatarUrl;
								that.setData({ payShow: true, maskShow: true, user: obj });
							},
							fail: () => {
								that.showError('获取用户信息失败！');
							}
						});
					} else {
						wx.openSetting({
							success: res2 => {
								if (res2 && res2.authSetting['scope.userInfo'] === true) {
									wx.getUserInfo({
										success: res3 => {
											let user = res3.userInfo, obj = {};
											obj['nickName'] = user.nickName;
											obj['coverImageUrl'] = user.avatarUrl;
											that.setData({ payShow: true, maskShow: true, user: obj });
										}
									});
								} else {
									that.showError('获取用户信息失败！');
								}
							}
						});
					}
				}
			});
		}
	},
	closeDialog: function (e) {
		const that = this;
		that.setData({ payHide: true, maskShow: false });
		setTimeout( () => {
			that.setData({ payShow: false, payHide: false });
		}, 1000);
	},
	stopmove: function () { },
	showError: function (txt) {
		wx.showModal({
			title: '',
			content: txt,
			showCancel: false
		});
	},
	onShareAppMessage: function () {
		const that = this;
		let dd = that.data;
		return {
			title: dd.projectTitle,
			path: '/pages/projectDetail/projectDetail?projectId=' + dd.projectId,
			imageUrl: dd.projectLogo
		}
	}
})