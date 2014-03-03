define(['underscore', 'jquery', 'backbone', 'leaflet', 'css!leaflet.css'], function(_, $, Backbone, L) {
	return Backbone.View.extend({
		el: $('#map'),
		initialize: function() {
			_.bindAll(this, 'render');

			var map = L.map(this.el).setView([53, 10], 6);
			L.tileLayer('http://{s}.tiles.mapbox.com/v3/examples.map-9ijuk24y/{z}/{x}/{y}.png').addTo(map);
		},
	});
});
