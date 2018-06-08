
//时间戳格式化
const formatTime = (date, c, f) => {
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const hour = date.getHours();
	const minute = date.getMinutes();
	if (c && !f) {
		const second = date.getSeconds();
		return [year, month, day].map(formatNumber).join(c) + ' ' + [hour, minute, second].map(formatNumber).join(':');
	} else if (c && f) {
		return [year, month, day].map(formatNumber).join(c) + ' ' + [hour, minute].map(formatNumber).join(':');
	} else {
		const second = date.getSeconds();
		return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':');
	}
}

const formatNumber = n => {
	n = n.toString()
	return n[1] ? n : '0' + n
}

//手机号格式验证
const telValidate = tel => {
	const reg = /^(13[0-9]|14[579]|15[0-3,5-9]|17[0135678]|18[0-9])\d{8}$/;
	if (!reg.test(tel)) {
		return false;
	} else {
		return true;
	}
}

//数字逗号间隔
const numFmt = value => {
	var newValue = '';
	var count = 0;
	var v = value.toString().split('.');	//取小数部分
	var r = '';
	if (v[1]) {
		r = '.' + v[1].substr(0, 2);
	} else { }
	if (value > 999) {
		value = v[0];
		for (var i = value.length - 1; i >= 0; i--) {
			count++;
			if (count % 3 == 0 && i > 0) {
				newValue += value[i] + ',';
			} else {
				newValue += value[i];
			}
		}
		newValue = newValue.split('').reverse().join('') + r;
	} else {
		newValue = v[0] + r;
	}
	return newValue;
}

module.exports = {
	formatTime: formatTime,
	telValidate: telValidate,
	numFmt: numFmt
}
