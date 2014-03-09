define(['underscore', 'jquery', 'backbone', 'jspdf'], function(_, $, Backbone, Pdf) {
	return Backbone.Model.extend({
		defaults: {
			format: { width: 210, height: 297 },
			width: 0,
			height: 0,
			dpi: 300,
			ratio: 0,
		},

		initialize: function() {
			_.bindAll(this, 'load', 'images', 'fit', 'generate');

			// check for library compatibility
			if (jsPDF) console.error('Global instance of jsPDF leaked into application');

			// calculate format from given values
			var format = this.get('format');
			this.set({
				width:  format.width  * this.get('dpi') / 25.4,
				height: format.height * this.get('dpi') / 25.4,
			});
			this.set({
				ratio: this.get('width') / this.get('height'),
			});
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
					image.data = canvas.toDataURL('image/jpeg');
					deferred.resolve(image);
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

		// fetches images from map
		images: function() {
			// calculate scale factor
			var scale = this.get('width') / $('#map').width();
			// fetch all tiles from map
			var images = [];
			$('.leaflet-tile-container img').each(function() {
				// get dimensions and url
				images.push({
					left:   scale * parseInt($(this).css('left')),
					top:    scale * parseInt($(this).css('top')),
					width:  scale * parseInt($(this).css('width')),
					height: scale * parseInt($(this).css('height')),
					src:    $(this).attr('src'),
				});
			});
			return images;
		},

		// resize map to fit format
		fit: function() {
			var height = $('#map').height(),
				width  = $('#map').width(),
				ratio  = width / height;
			// map is too wide, decrease its width
			if (ratio > this.get('ratio'))
				$('#map').width(height * this.get('ratio'));
			// map is too tall, decrease its height
			else
				$('#map').height(width / this.get('ratio'));
		},

		// generate document from tiles
		generate: function() {

			// create a new document
			var width = this.get('width'), height = this.get('height');
			var doc = new Pdf({
				unit: 'pt',
				compress: false,
				format: [ width, height ],
			});

			// load all images and give me the promises
			var promises = this.images().map(this.load);

			// handle individual results
			promises.map(function(promise) {
				promise.done(function(image) {
					doc.addImage(image.data, 'jpeg', image.left, image.top, image.width, image.height);
				}).fail(console.log);
			});

			// handle overall readiness
			$.when.apply($, promises).done(function() {
				// add some text
				doc.setFontSize(100);
				doc.text(document.title, 50, 100);
				// output the resulting document
				var pdf = doc.output('dataurlstring');
				window.open(pdf, 'Document');
			}, console.log);
		},
	});
});
