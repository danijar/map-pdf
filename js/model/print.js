define(['underscore', 'jquery', 'backbone', 'jspdf'], function(_, $, Backbone, Pdf) {
	return Backbone.Model.extend({
		defaults: {
			format: { width: 52, height: 74 }, // 210 x 297 for A4
			width:      0,
			height:     0,
			dpi:      300,
			ratio:      0,
			doc:     null,
			scale:      1,
            element: null,
		},

        /*
         * Example construction:
         * var print = new Print({ format: { width: 210, height: 74 }, element: §('#map') });
         */
		initialize: function() {
			_.bindAll(this, 'load', 'images', 'fit', 'generate', 'output');

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
			// find layer offset
			var offset = this.get('element').find('.leaflet-tile-container img').parent().first().offset();

			var scale  = this.get('scale'),
				width  = this.get('width'),
				height = this.get('height');

			// fetch all tiles from map
			var images = [];
            this.get('element').find('.leaflet-tile-container img').each(function() {
				// skip broken images
				if ($(this).hasClass('mappdf-tile-error'))
					return;

				// get dimensions and url
				var position = $(this).position();
				var image = ({
					left:   (offset.left + position.left) / scale,
					top:    (offset.top  + position.top ) / scale,
					width:  parseInt($(this).css('width')),
					height: parseInt($(this).css('height')),
					src:    $(this).attr('src'),
				});

				// perform view culling
				if (image.left + image.width  < 0) return;
				if (image.top  + image.height < 0) return;
				if (image.left > width )           return;
				if (image.top  > height)           return;

				// add to array
				images.push(image);
			});
			return images;
		},

		// resize map to fit format
		fit: function() {
			// resize map to cover every pixel of format
            this.get('element').width(this.get('width'));
            this.get('element').height(this.get('height'));

			// zoom map so that it fits on screen
			var height = $(window).height(),
				width  = $(window).width(),
				ratio  = width / height;

			// map is too wide
			if (ratio > this.get('ratio'))
				this.set({ scale: height / this.get('height') });
			// map is too tall
			else
				this.set({ scale: width / this.get('width') });

			// apply zoom
            this.get('element').css({
				'-webkit-transform': 'scale(' + this.get('scale') + ')',
				'-moz-transform': 'scale(' + this.get('scale') + ')',
				'transform': 'scale(' + this.get('scale') + ')'
			});
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
			this.set({ doc: doc });

			// load all images and give me the promises
			var promises = this.images().map(this.load);

			// handle individual results
			var doc = this.get('doc');
			promises.map(function(promise) {
				promise.done(function(image) {
					doc.addImage(image.data, 'jpeg', image.left, image.top, image.width, image.height);
				}).fail(console.log);
			});

			// handle overall readiness
			$.when.apply($, promises).always(_.bind(function() {
				this.output();
			}, this), console.log);
		},

		// output generated pdf
		output: function() {
			// add some text
			var size = parseInt(0.04 * (this.get('width') + this.get('height')) / 2);
			this.get('doc').setFontSize(size);
			this.get('doc').text(document.title, size, 1.5 * size);

			// output the resulting document
			var pdf = this.get('doc').output('dataurlstring');
			window.open(pdf, 'Document');
		}
	});
});
