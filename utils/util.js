
//时间戳格式化
const formatTime = (date, c, f) => {
	let year = date.getFullYear();
	let month = date.getMonth() + 1;
	let day = date.getDate();
	let hour = date.getHours();
	let minute = date.getMinutes();
	if (c && !f) {
		let second = date.getSeconds();
		return [year, month, day].map(formatNumber).join(c) + ' ' + [hour, minute, second].map(formatNumber).join(':');
	} else if (c && f) {
		return [year, month, day].map(formatNumber).join(c) + ' ' + [hour, minute].map(formatNumber).join(':');
	} else {
		let second = date.getSeconds();
		return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':');
	}
}

const formatNumber = n => {
	n = n.toString()
	return n[1] ? n : '0' + n
}

//手机号格式验证
const telValidate = tel => {
	const reg = /^(13[0-9]|14[579]|15[0-3,5-9]|166|17[0135678]|18[0-9]|19[89])\d{8}$/;
	if (!reg.test(tel)) {
		return false;
	} else {
		return true;
	}
}

//数字逗号间隔
const numFmt = value => {
	let newValue = '';
	let count = 0;
	let v = value.toString().split('.');	//取小数部分
	let r = '';
	if (v[1]) {
		r = '.' + v[1].substr(0, 2);
	} else { }
	if (value > 999) {
		value = v[0];
		for (let i = value.length - 1; i >= 0; i--) {
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
