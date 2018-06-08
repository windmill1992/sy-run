
var base = 'https://www.17xs.org/';
var dataUrl = {
	hostList: base + 'project/H5careProjectList.do',												//反馈
	addleaveWord: base + 'project/addleaveWord.do',													//添加留言
	donationlist: base + 'project/gardendonationlist.do',										//捐助记录和留言
	User_replyLeaveWord: base + 'h5ProjectDetails/addNewLeaveWord.do',			//提交评论
	gotoAlterReply: base + 'h5ProjectDetails/gotoAlterReply.do',						//留言，回复
	loadMoreLeaveWord: base + 'h5ProjectDetails/loadMoreLeaveWord.do',			//加载更多留言
	refleshLeaveWord: base + 'h5ProjectDetails/refleshLeaveWord.do',				//刷新评论
	appletPay: base + 'visitorAlipay/appletPay.do',                         //获取支付参数
	getProjectDetail: base + 'resposibilityReport/getProjectDetail.do',			//获取项目详情
	getProjectContent: base + 'resposibilityReport/getProjectContent.do',		//获取详情内容
	getSessionKey: base + 'wx/getSessionKey.do',														//获取openid
	login: base + 'wx/login.do',																						//获取userId
	getPublisher: base + 'project/getProjectFaBuUserInfo.do'								//获取发起人信息
};
var util = require('../../utils/util.js');
var WxParse = require('../../wxParse/wxParse.js');
var page = 1, itemHeight = [0, 0, 0, 0];
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
		showFoot: false
	},
  /**
   * 生命周期函数--监听页面加载
   */
	onLoad: function (options) {
		var that = this;
		wx.showLoading({
			title: '加载中...',
		});
		var dd = that.data;
		that.setData({ projectId: options.projectId, curMoney: dd.moneyList[dd.selected] });
		var openId = wx.getStorageSync('openId');
		var unionId = wx.getStorageSync('unionId');
		var nickName = '', coverImageUrl = '';
		if (openId == '' || unionId == '') {
			wx.login({
				success: function (result) {
					if (result.code) {
						wx.request({
							url: dataUrl.getSessionKey,
							method: 'GET',
							data: { js_code: result.code },
							success: function (result2) {
								var r = result2.data.result;
								openId = r.openId;
								unionId = r.unionId;
								that.setData({ openId: openId, unionId: unionId });
								wx.request({
									url: dataUrl.login,
									method: 'GET',
									data: {
										nickName: nickName,
										coverImgUrl: coverImageUrl,
										openId: openId,
										unionId: unionId
									},
									success: function (res) {
										if (res.data.code == 1) {
											wx.setStorage({
												key: 'userId',
												data: res.data.result.userId,
											});
											that.getProjectDetail(res.data.result.userId);
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
		var that = this;
		if (!userId) {
			userId = wx.getStorageSync('userId');
		}
		wx.request({
			url: dataUrl.getProjectDetail,
			method: 'GET',
			data: { projectId: that.data.projectId, userId: userId },
			success: function (res) {
				if (res.data.code == 1) {
					var r = res.data.result;
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
		var that = this;
		wx.request({
			url: dataUrl.getProjectContent,
			method: 'GET',
			data: { projectId: that.data.projectId },
			success: function (res) {
				if (res.data.code == 1) {
					var r = res.data.result;
					WxParse.wxParse('projectCon', 'html', r.projectContent, that);
					var obj = {}, str = 'loadState[0]';
					obj[str] = true;
					setTimeout(function () {
						wx.createSelectorQuery().select('#list0').boundingClientRect(function (rect) {
							itemHeight.splice(0, 1, rect.height + 'px');
							obj['itemHeight'] = itemHeight;
							obj['showFoot'] = true;
							that.setData(obj, function () {
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
		var that = this;
		wx.request({
			url: dataUrl.getPublisher,
			method:'GET',
			data:{projectId:that.data.projectId},
			success:function(res){
				if(res.data.code == 1){
					var r = res.data.result;
					that.setData({
						fqr: {
							avatar: 'http://www.17xs.org/res/images/detail/people_avatar.jpg',
							name: r.workUnit!=null?r.workUnit:'无',
							relation: r.linkMan!=null?r.linkMan:'无',
							tel: r.linkMobile!=null?r.linkMobile:'无',
							addr: r.familyAddress!=null?r.familyAddress:'无',
							accept: '宁波市善园公益基金会'
						}
					});
				}else{
					that.setData({
						fqr: {
							avatar: 'http://www.17xs.org/res/images/detail/people_avatar.jpg',
							name: '宁波市善园公益基金会',
							relation: '梁峻兰',
							tel: '0574-87412436',
							addr: '浙江省宁波市鄞州区泰康西路399号',
							accept: '宁波市善园公益基金会'
						}
					});
				}
				var obj = {}, str = 'loadState[1]';
				obj[str] = true;
				setTimeout(function () {
					wx.createSelectorQuery().select('#list1').boundingClientRect(function (rect) {
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
		var that = this;
		if (page == 1) {
			wx.showLoading({
				title: '加载中...',
			});
		}
		var dd = that.data;
		var flag = false;
		if (page == 1) { flag = true; } else { }
		wx.request({
			url: dataUrl.donationlist,
			method: 'GET',
			data: { id: dd.projectId, page: pageSize, pageNum: pageNum, t: new Date().getTime() },
			success: function (res) {
				wx.hideLoading();
				if (res.data.flag == 1) {
					if (res.data.obj.data.length < 10) {
						that.setData({ hasMoreDonation: false });
					} else {
						that.setData({ hasMoreDonation: true });
					}
					if (res.data.obj.data.length > 0) {
						var arr = [], o = {}, mb = [], imgUrl = '';
						var obj = res.data.obj;
						var total = obj.total, pageNum = obj.pageNum, datas = obj.data, len = datas.length;
						len = len > pageNum ? pageNum : len;
						var leavewords = res.data.obj1;
						for (var i = 0; i < len; i++) {
							if (datas[i].imagesurl != null) {
								imgUrl = datas[i].imagesurl;
							} else {
								imgUrl = base + 'res/images/detail/people_avatar.jpg';
							}
							o['avatar'] = imgUrl;
							o['userName'] = datas[i].name;
							o['dMoney'] = datas[i].dMoney;
							o['leaveWord'] = datas[i].leaveWord == null ? '' : datas[i].leaveWord;
							o['showTime'] = datas[i].showTime;
							o['id'] = datas[i].id;

							var items = leavewords[i];
							if (items.length > 0) {
								mb.push(true);
								o['boardList'] = [];
								var o1 = {};
								for (var j = items.length - 1; j >= 0; j--) {
									o1['userId'] = items[j].leavewordUserId;
									o1['projDonateId'] = items[j].projectDonateId;
									o1['leavewordName'] = items[j].leavewordName;
									o1['content'] = items[j].content;
									if (items[j].replyUserId == null) {
										o1['reply'] = false;
									} else {
										o1['reply'] = true;
										o1['replyName'] = items[j].replyName;
									}
									o['boardList'].push(o1);
									o1 = {};
								}
								o['total'] = items[0].total;
							} else {
								mb.push(false);
								o['total'] = 0;
							}
							arr.push(o);
							o = {};
						}
						if (!dd.flag_state) {
							that.setData({ flag_state: true });
						} else if (page > 1) {
							that.setData({ flag_state: false });
						}
						var arr2 = [];
						for (var k = 0; k < datas.length; k++) {
							var tt = leavewords[k];
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
						var tempArr = dd.recordList;
						var tempArr2 = dd.isMore20;
						var tempMb = dd.mboard;
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
						var obj = {}, str = 'loadState[2]';
						obj[str] = true;
						setTimeout(function () {
							wx.createSelectorQuery().select('#list2').boundingClientRect(function (rect) {
								itemHeight.splice(2, 1, rect.height + 'px');
								obj['itemHeight'] = itemHeight;
								obj['showFoot'] = true;
								that.setData(obj);
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
		var that = this;
		wx.showLoading({
			title: '加载中...',
		});
		var dd = that.data;
		wx.request({
			url: dataUrl.hostList,
			method: 'GET',
			data: { projectId: dd.projectId },
			success: function (res) {
				wx.hideLoading();
				var obj = res.data.obj;
				var arr = [], o = {}, total = page = obj.total, currentPage = obj.page, dl = obj.data;
				if (dl.length == 0) {
					that.setData({ status: false });
					return;
				} else {
					that.setData({ status: true });
				}
				for (var i = 0; i < dl.length; i++) {
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
					var imgs = dl[i].imgs, o1 = {};
					o['imgs'] = [];
					if (imgs && imgs.length > 0) {
						o['content'] = dl[i].content;
						o['imgs'].push(true);
						o['imgList'] = [];
						for (var j = 0; j < imgs.length; j++) {
							o['imgList'].push(imgs[j]);
						}
					} else {
						o['imgs'].push(false);
					}
					arr.push(o);
					o = {};
				}
				that.setData({ hostList: arr });
				var obj = {}, str = 'loadState[3]';
				obj[str] = true;
				setTimeout(function () {
					wx.createSelectorQuery().select('#list3').boundingClientRect(function (rect) {
						itemHeight.splice(3, 1, rect.height + 'px');
						obj['itemHeight'] = itemHeight;
						that.setData(obj);
					}).exec();
				}, 300);
			}
		});
	},
	changeTab: function (e) {
		var cur = e.detail.current;
		this.setData({ curTab: cur });
		if (!this.data.loadState[cur] && cur == 0) {
			this.getProjectContent();
		} else if (!this.data.loadState[cur] && cur == 1) {
			this.getFaqiren();
		} else if (!this.data.loadState[cur] && cur == 2) {
			this.getDonationList(page, 10);
		} else if (!this.data.loadState[cur] && cur == 3) {
			this.hostList(1);
		}
	},
	switchTab: function (e) {
		var cur = e.currentTarget.dataset.cur;
		this.setData({ curTab: cur });
	},
	donateLeaveWord: function (e) {
		var that = this;
		var dd = that.data;
		var ds = e.currentTarget.dataset;
		var arr = [];
		that.setData({ wordShow: true, isToleaveWord: true });
		wx.request({
			url: dataUrl.gotoAlterReply,
			method: 'GET',
			data: { type: 1, projectId: dd.projectId, projectDonateId: ds.id },
			success: function (res) {
				arr.push(ds.id);
				arr.push(ds.index);
				if (res.data.flag == '201') {
					var obj = res.data.obj;
					arr.push(obj.leavewordName);
					arr.push(obj.leavewordUserId);
				} else if (res.data.flag == '202') {
					var obj = res.data.obj;
					arr.push(obj.leavewordName);
					arr.push(obj.replyUserId);
					arr.push(obj.replyName);
					arr.push(obj.leavewordUserId);
				} else {
					that.showError('请求失败');
					return;
				}
				arr.push('no_reply');
				wx.setStorage({
					key: 'tempArr',
					data: arr
				});
			}
		});
	},
	donateReply: function (e) {
		var that = this;
		var dd = that.data;
		var ds = e.currentTarget.dataset;
		var arr = [];
		wx.request({
			url: dataUrl.gotoAlterReply,
			method: 'GET',
			data: { type: 1, projectId: dd.projectId, projectDonateId: ds.projDonateId, leavewordUserId: ds.userId },
			success: function (res) {
				arr.push(ds.projDonateId);
				arr.push(ds.userId);
				arr.push(ds.idx);
				arr.push(ds.index);
				if (res.data.flag == '101' || res.data.flag == '201') {
					var obj = res.data.obj;
					arr.push(obj.leavewordName);
				} else if (res.data.flag == '102' || res.data.flag == '202') {
					var obj = res.data.obj;
					arr.push(obj.leavewordName);
					arr.push(obj.replyUserId);
					arr.push(obj.replyName);
					arr.push(obj.leavewordUserId);
				} else {
					that.showError('请求错误');
				}
			}
		});
		var arr = [dd.projDonateId, dd.userId, dd.idx, dd.index];
		try {
			wx.removeStorageSync('tempArr');
		} catch (e) { }
		wx.setStorage({
			key: 'tempArr',
			data: arr
		});
	},
	donateLoadMore: function (e) {
		var that = this;
		var ds = e.currentTarget.dataset;
		var dd = that.data;
		wx.request({
			url: dataUrl.loadMoreLeaveWord,
			method: 'GET',
			data: { type: 0, projectId: dd.projectId, projectDonateId: projectDonateId, currentPage: 1, surplusTotal: ds.total },
			success: function (res) {
				console.log(res);
			}
		});
	},
	loadmore: function (e) {
		var that = this;
		that.setData({ showFoot: false });
		wx.showLoading({
			title: '加载中...',
		});
		setTimeout(function () {
			that.getDonationList(++page, 10);
		}, 500);
	},
	cancelWord: function (e) {
		this.closeWordDialog();
	},
	sureWord: function (e) {
		var that = this;
		var txt = e.detail.value.wordArea;
		if (txt == '') {
			that.showError('请输入评论！');
			return;
		} else {
			that.verify(txt);
			wx.showToast({
				title: '发表成功',
				duration: 1000
			});
			setTimeout(function () {
				that.setData({ wordValue: '' });
				that.closeWordDialog();
			}, 1100);
		}
	},
	verify: function (txt) {
		var that = this;
		var dd = that.data;
		wx.getStorage({
			key: 'tempArr',
			success: function (result) {
				var arr = result.data;
				var projectDonateId = null, projectFeedbackId = null, leavewordUserId = null,
					replyUserId = null, leavewordName = null, replyName = null, index = 0, idx = 0;
				if (arr.length == 2) {
					leavewordUserId = arr[0];
					index = arr[1];
				} else {
					projectDonateId = arr[0];
					leavewordUserId = arr[1];
					idx = arr[2];
					index = arr[3];
				}
				wx.request({
					url: dataUrl.User_replyLeaveWord,
					method: 'GET',
					data: {
						projectId: dd.projectId,
						projectDonateId: projectDonateId,
						projectFeedbackId: projectFeedbackId,
						leavewordUserId: leavewordUserId,
						replyUserId: replyUserId,
						leavewordName: leavewordName,
						replyName: replyName,
						content: txt
					},
					success: function (res) {
						wx.removeStorage({
							key: 'tempArr',
							success: function (res1) { }
						});
						if (res.data.errorCode == '0000') {
							that.closeWordDialog();
							var datas = {}, flags = 0;
							if (projectDonateId == null && projectFeedbackId != null && projectFeedbackId != '') {
								datas = { type: 0, projectId: dd.projectId, projectFeedbackId: projectFeedbackId, currentPage: 1 };
							} else if (projectDonateId != null && projectDonateId != '' && projectFeedbackId == null) {
								datas = { type: 0, projectId: dd.projectId, projectDonateId: projectDonateId, currentPage: 1 };
								flags = 1;
							}
							wx.request({
								url: dataUrl.refleshLeaveWord,
								method: 'GET',
								data: datas,
								success: function (res2) {
									if (res2.data.flag == '1') {
										var obj = res2.data.obj;
										var aa = [], oo = {};
										for (var i = 0; i < obj.length; i++) {
											oo['leavewordUserId'] = obj[i].leavewordUserId;
											oo['projectFeedbackId'] = obj[i].projectFeedbackId;
											oo['replyIndex'] = index;
											oo['leavewordName'] = obj[i].leavewordName;
											oo['content'] = obj[i].content;
											if (obj[i].replyUserId == null) {
												oo['reply'] = false;
											} else {
												oo['reply'] = true;
												oo['replyName'] = obj[i].replyName;
											}
											aa.push(oo);
											oo = {};
										}
										var bb = [];
										if (obj.length > 0) {
											if (obj[0].total <= (obj[0].currentPage - 1) * 20 + obj.length) {
												bb.push(false);
											} else {
												bb.push(true);
											}
										} else { }
										if (flags == 1) {
											that.setData({ boardList: aa, isMore20: bb });
										} else {
											that.setData({ replyList: aa, isMore20: bb });
										}
									} else {
										that.showError(res2.data.errorMsg);
										return;
									}
								}
							});
						} else {
							that.showError(res2.errorMsg);
							return;
						}
					}
				});
			}
		});
	},
	closeWordDialog: function () {
		var that = this;
		that.setData({ wordHide: true });
		setTimeout(function () {
			that.setData({ wordShow: false, wordHide: false });
		}, 400);
	},
	preview: function (e) {
		var ds = e.currentTarget.dataset;
		var idx = ds.idx;
		var index = ds.index;
		var dd = this.data;
		wx.previewImage({
			current: dd.hostList[index].imgList[idx],
			urls: dd.hostList[index].imgList
		});
	},
	switchMoney: function (e) {
		var dd = e.currentTarget.dataset;
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
		var v = e.detail.value;
		v = Number(parseFloat(v).toFixed(2));
		if (isNaN(v)) {
			this.setData({ curMoney: 0 });
		} else {
			this.setData({ curMoney: v });
		}
	},
	donateMoney: function (e) {
		var that = this;
		var dd = that.data;
		var vv = e.detail.value;
		var word = '';
		var check = that.data.checked;
		var money = that.data.curMoney;
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
			var obj = {
				openId: dd.openId,
				unionId: dd.unionId,
				money: money,
				word: word,
				vv: vv
			};
			wx.getSetting({
				success: function (res) {
					if (res && res.authSetting['scope.userInfo'] !== false) {
						wx.getUserInfo({
							success: function (res1) {
								var user = res1.userInfo;
								obj['nickName'] = user.nickName;
								obj['coverImgUrl'] = user.avatarUrl;
								that.pay(obj);
							},
							fail: function () {
								that.showError('获取用户信息失败！');
							}
						});
					} else {
						wx.openSetting({
							success: function (res2) {
								if (res2 && res2.authSetting['scope.userInfo'] === true) {
									wx.getUserInfo({
										success: function (res3) {
											var user = res3.userInfo;
											obj['nickName'] = user.nickName;
											obj['coverImgUrl'] = user.avatarUrl;
											that.pay(obj);
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
	pay: function (o) {
		var that = this;
		var dd = that.data;
		if (!o.nickName || !o.coverImgUrl) {
			that.showError('获取用户信息失败！');
			return;
		} else {
			wx.request({
				url: dataUrl.appletPay,
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
				success: function (res) {
					if (res.data.code == 1) {
						var r = res.data.result;
						wx.requestPayment({
							timeStamp: r.timestamp,
							nonceStr: r.noncestr,
							package: r.packageValue,
							signType: r.paysignType,
							paySign: r.paySign,
							success: function (res1) {
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
		var realName = e.detail.value;
		this.setData({ realName: realName });
	},
	getMobile: function (e) {
		var tel = e.detail.value;
		this.setData({ mobile: tel });
	},
	getWord: function (e) {
		var str = e.detail.value;
		if (str == '') {
			this.setData({ word: '' });
		} else {
			this.setData({ word: str });
		}
	},
	checkprop: function (e) {
		var checked = e.detail.value.length > 0;
		this.setData({ checked: checked });
	},
	donateTap: function () {
		var that = this;
		that.setData({ payShow: true, maskShow: true });
	},
	closeDialog: function (e) {
		var that = this;
		that.setData({ payHide: true, maskShow: false });
		setTimeout(function () {
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
		var that = this;
		var dd = that.data;
		return {
			title: dd.projectTitle,
			path: '/pages/projectDetail/projectDetail?projectId=' + dd.projectId,
			imageUrl: dd.projectLogo,
			success: function () {
				wx.showToast({
					title: '转发成功'
				});
			},
			fail: function () {
				that.showError('转发失败');
			}
		};
	}
})