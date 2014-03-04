define(['underscore', 'jquery', 'backbone', 'jspdf'], function(_, $, Backbone, Pdf) {
	return Backbone.Model.extend({
		initialize: function() {
			if (jsPDF)
				console.error('Global instance of jsPDF leaked into application');
		},

		// load image from url and return its data uri string
		// url is expected in image.src
		load: function(image) {
			var deferred = $.Deferred();
			// create image to load from url
			var img = new Image();
			img.setAttribute('crossOrigin', 'anonymous');
			img.onload = function() {
				// create canvas and draw image
				var canvas = document.createElement('canvas');
				canvas.width  = img.width;
				canvas.height = img.height;
				canvas.getContext('2d').drawImage(img, 0, 0);
				// get data uri from canvas
				try {
					deferred.resolve({
						src:  image.src,
						left: image.left,
						top:  image.top,
						data: canvas.toDataURL('image/jpeg'),
					});
				} catch(e) {
					deferred.reject(e);
				}
			}
			// load image
			try {
				img.src = image.src;
			} catch(e) {
				deferred.reject(e);
			}
			return deferred.promise();
		},

		// generates an array of example images
		images: function() {
			var images = [];
			// loop over an interesting shape
			for (var y = 0; y < 10; ++y)
				for (var x = 0; x + y < 10; ++x)
					// get url and add current image
					images.push({
						src: 'http://c.tiles.mapbox.com/v3/examples.map-9ijuk24y/6/' + (x + 35) + '/' + (y + 20) + '.png',
						left: x,
						top: y
					});
			return images;
		},

		// generate document from tiles
		print: function() {
			// create a new document
			var doc = new Pdf();

			// set parameters
			var offset = { left: 10, top: 30 };
			var size = 15;

			// load all images and give me the promises
			var promises = this.images().map(this.load);

			// handle individual results
			promises.map(function(promise) {
				promise.done(function(e) {
					// find coordinates from grid
					var left = offset.left + (size * e.left),
						top  = offset.top  + (size * e.top);
					// add image to document
					doc.addImage(e.data, 'jpeg', left, top, size, size);
				}).fail(console.log);
			});

			// handle overall readiness
			$.when.apply($, promises).done(function() {
				// add some text
				doc.text('Printable Leaflet Map', 10, 25);
				// output the resulting document
				var pdf = doc.output('dataurlstring');
				window.open(pdf, 'Document');
			}, console.log);
		},
	});
});
