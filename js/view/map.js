define(['underscore', 'jquery', 'backbone', 'leaflet', 'css!leaflet.css'], function(_, $, Backbone, L) {
	return Backbone.View.extend({
		el: $('#map'),
		map: null,
		layers: [],
		initialize: function() {
			// initialize map and layers
			this.map = L.map(this.el).setView([52, 11], 8);
			this.layers.push(L.tileLayer('http://{s}.tiles.mapbox.com/v3/examples.map-9ijuk24y/{z}/{x}/{y}.png'));
			this.layers.push(L.tileLayer('tiles/transparent/{z}/{x}/{y}.png'));

			// add layers to map
			_.each(this.layers, function(layer) {
				// label and hide broken images
				layer.on('tileerror', function (e) {
					var tile = $(e.tile);
					tile.addClass('mappdf-tile-error').hide();
				});

				// add layer to map
				layer.addTo(this.map);
			}, this);
		},
	});
});
