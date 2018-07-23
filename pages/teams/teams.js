// pages/teams/teams.js
Page({
  data: {
		notEnoughShow: false,
		endStep: 10000,
		step: 10040
  },
  onLoad: function (options) {
  
  },
	donateStep: function () {
		const that = this;
		let dt = that.data;
		if (dt.rejectAuth) {
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
				that.setData({ enoughShow: true });
			}
		}
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
})