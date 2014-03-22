window.TypeRacer.Views.Track = Backbone.View.extend({
	template: JST["heats/track"],

	tagName: "table",

	initialize: function(options) {
		var channel = options.channel
		var that = this;
		this.racer_id = $("#current_user").data("id")

    channel.bind('updateBoard', function(data) {
			return that.moveCar(data)
		});
		channel.bind('addCar', function(data) {
			return that.addCar(data)
		});
		this.sendCarData(false);
	},

	addCar: function(data) {
		var content = this.template({
			racer: data
		});
		if (this.findCar(data.racer_id).length == 0) {
			this.sendCarData(data.racer_id);
			(this.racer_id == data.racer_id)
				?  this.$el.prepend(content)
				: this.$el.append(content);
		}
		this.checkTotalPlayers();
	},

	checkTotalPlayers: function() {
		var numRacersNeeded = this.model.collection.heat.get("num_racers");
		var currentTotalRacers = this.$el.find(".racer").length;
		if (currentTotalRacers === numRacersNeeded) {
			$.ajax({
				url: "/heats/start_game",
				type: "GET",
			})
		}
	},

	findCar: function(id) {
		return $("[data-racer-id='"+ id + "']")
	},

	moveCar: function(data) {
		var $car = this.findCar(data.racer_id);
		$car.css("position", "absolute");
		var movement = data.progress;
		$car.css("left", movement * 100 + "px");
	},

	sendCarData: function(returnTo) {
		var that = this;
		var racer_name = this.model.get("user_name") || "Guest"
		var racer = {
					racer_id: this.racer_id,
					racer_name: racer_name,
					return_to: returnTo
			  }
		$.ajax({
			url: "/heats/add_car",
			type: "POST",
			data: racer
		})
	}
})