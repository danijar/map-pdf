define(['underscore', 'jquery', 'backbone', 'leaflet', 'css!leaflet.css'],
	function(_, $, Backbone, L) {

	return Backbone.View.extend({
		el: $('#map'),
		map: null,
		layers: [],
		initialize: function() {
			// Initialize map and layers
			this.map = L.map(this.el).setView([52, 11], 8);
			this.layers.push(L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png'));

			// Add layers to map
			_.each(this.layers, function(layer) {
				// Label and hide broken images
				layer.on('tileerror', function (e) {
					var tile = $(e.tile);
					tile.addClass('mappdf-tile-error').hide();
				});

				// Add layer to map
				layer.addTo(this.map);
			}, this);
		},
	});
});
