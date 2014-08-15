define(['underscore', 'jquery', 'backbone', 'jspdf'],
	function(_, $, Backbone, Pdf) {

	return Backbone.Model.extend({
		defaults: {
			format: { width: 52, height: 74 }, // 210 x 297 for DIN A4
			width:      0,
			height:     0,
			dpi:      300,
			ratio:      0,
			doc:     null,
			scale:      1,
            element: null,
		},

        /*
         * Example usage:
         * var print = new Print({
         *     format: { width: 210, height: 74 },
         *     element: §('#map')
         * });
         */
		initialize: function() {
			_.bindAll(this, 'load', 'images', 'fit', 'generate', 'output');

			// Check for library compatibility
			if (jsPDF)
				console.error('Global instance of jsPDF leaked into ' +
					'application');

			// Calculate format from given values
			var format = this.get('format');
			this.set({
				width:  format.width  * this.get('dpi') / 25.4,
				height: format.height * this.get('dpi') / 25.4,
			});
			this.set({
				ratio: this.get('width') / this.get('height'),
			});
		},

		// Load image from url and return its data uri string
		// The url is expected in image.src
		load: function(image) {
			var deferred = $.Deferred();

			// Create image to load from url
			var img = new Image();
			img.setAttribute('crossOrigin', 'anonymous');

			img.onload = function() {
				// Create canvas and draw image
				var canvas = document.createElement('canvas');
				canvas.width  = img.width;
				canvas.height = img.height;
				canvas.getContext('2d').drawImage(img, 0, 0);

				// Get data uri from canvas
				try {
					image.data = canvas.toDataURL('image/jpeg');
					deferred.resolve(image);
				} catch(e) {
					deferred.reject(e);
				}
			}

			// Load image
			try {
				img.src = image.src;
			} catch(e) {
				deferred.reject(e);
			}
			return deferred.promise();
		},

		// Fetches images from map
		images: function() {
			// Find layer offset
			var offset = this.get('element').
				find('.leaflet-tile-container img').
				parent().first().offset();

			var scale  = this.get('scale'),
				width  = this.get('width'),
				height = this.get('height');

			// Fetch all tiles from map
			var images = [];
            this.get('element')
            	.find('.leaflet-tile-container img').each(function() {

				// Skip broken images
				if ($(this).hasClass('mappdf-tile-error'))
					return;

				// Get dimensions and url
				var position = $(this).position();
				var image = ({
					left:   (offset.left + position.left) / scale,
					top:    (offset.top  + position.top ) / scale,
					width:  parseInt($(this).css('width')),
					height: parseInt($(this).css('height')),
					src:    $(this).attr('src'),
				});

				// Perform view culling
				if (image.left + image.width  < 0) return;
				if (image.top  + image.height < 0) return;
				if (image.left > width )           return;
				if (image.top  > height)           return;

				// Add to array
				images.push(image);
			});
			return images;
		},

		// Resize map to fit format
		fit: function() {
			// Resize map to cover every pixel of format
            this.get('element').width(this.get('width'));
            this.get('element').height(this.get('height'));

			// Zoom map so that it fits on screen
			var height = $(window).height(),
				width  = $(window).width(),
				ratio  = width / height;

			// Map is too wide
			if (ratio > this.get('ratio'))
				this.set({ scale: height / this.get('height') });
			// Map is too tall
			else
				this.set({ scale: width / this.get('width') });

			// Apply zoom
            this.get('element').css({
				'-webkit-transform': 'scale(' + this.get('scale') + ')',
				'-moz-transform': 'scale(' + this.get('scale') + ')',
				'transform': 'scale(' + this.get('scale') + ')'
			});
		},

		// Generate document from tiles
		generate: function() {
			// Create a new document
			var width = this.get('width'), height = this.get('height');
			var doc = new Pdf({
				unit: 'pt',
				compress: false,
				format: [ width, height ],
			});
			this.set({ doc: doc });

			// Load all images and give me the promises
			var promises = this.images().map(this.load);

			// Handle individual results
			var doc = this.get('doc');
			promises.map(function(promise) {
				promise.done(function(image) {
					doc.addImage(image.data, 'jpeg',
						image.left,
						image.top,
						image.width,
						image.height
					);
				}).fail(console.log);
			});

			// Handle overall readiness
			$.when.apply($, promises).always(_.bind(function() {
				this.output();
			}, this), console.log);
		},

		// Output generated pdf
		output: function() {
			// Add some text
			var size = parseInt(0.04 * (this.get('width') + this.get('height')) / 2);
			this.get('doc').setFontSize(size);
			this.get('doc').text(document.title, size, 1.5 * size);

			// Output the resulting document
			var pdf = this.get('doc').output('dataurlstring');
			window.open(pdf, 'Document');
		}
	});
});
