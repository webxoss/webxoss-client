'use strict';

function StateBitmap (url) {
	var bitmap = new createjs.Bitmap(url);
	bitmap.width = Card.WIDTH;
	bitmap.height = Card.HEIGHT;
	return bitmap;
}