define(['underscore', 'jquery', 'backbone', 'jspdf'], function(_, $, Backbone, Pdf) {
	return Backbone.Model.extend({
		initialize: function() {
			// console.log(jsPDF);
		},
		image: function(image, success, error) {
			var data, canvas, ctx;
			var img = new Image();
			img.setAttribute('crossOrigin', 'anonymous');
			img.onload = function() {
				// create the canvas element
				canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;
				// get context and draw the image
				ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0, img.width, img.height);
				// get canvas data URL
				try {
					data = canvas.toDataURL('image/jpeg');
					success({ src: image.src, left: image.left, top: image.top, data: data });
				} catch(e) {
					error(e);
				}
			}
			// load image URL
			try {
				img.src = image.src;
			} catch(e) {
				error(e);
			}
		},
		print: function() {
			var doc = new Pdf();

			var images = [];
			for (var y = 0; y < 10; ++y)
				for (var x = 0; x + y < 10; ++x)
						images.push({ src: 'http://c.tiles.mapbox.com/v3/examples.map-9ijuk24y/6/' + (x + 35) + '/' + (y + 20) + '.png', left: x, top: y });

			var size = 15;
			var offset = { left: 10, top: 30 };

			var count = 0;
			for (var i = 0; i < images.length; ++i) {
				this.image(images[i], function(image) {
					var left = offset.left + (size * image.left),
						top  = offset.top  + (size * image.top);
					console.log({ left: left, top: top });
					doc.addImage(image.data, 'jpeg', left, top, size, size);
					count++;
				}, function(e) {
					console.log(e);
				});
			}

			//while (count < images.length);
			setTimeout(function(){
				doc.text('Generated PDF with ' + count + ' tiles', 10, 25);
				doc.output('dataurl');
			}, 1000);
		},
	});
});
