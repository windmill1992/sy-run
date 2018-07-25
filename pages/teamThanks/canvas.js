module.exports = {
	makeImage: (ctx, o) => {
		console.log(o);
		// let ctx = wx.createCanvasContext('myCv', this);
		const r = wx.getSystemInfoSync().windowWidth / 375;
		const data = {
			w: 750 * r,
			h: 1230 * r,
		}
		ctx.beginPath();
		ctx.drawImage();
	}
}