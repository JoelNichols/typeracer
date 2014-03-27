window.TypeRacer.Views.Track = Backbone.View.extend({
	template: JST["heats/track"],
	modalTemplate: JST["heats/share_modal"],
	className: "raceTracks .col-md-6",

	GIFS: [
    "crash.gif",
	  "megaman.gif",
		"samus.gif",
		"sonic.gif",
		"yoshi.gif",
		"kirby.gif"
	],

	PLACES: [
	"First",
	"Second",
	"Third",
	"Fourth",
	"Fifth",
	"Sixth",
	"Seventh",
	"Eighth"
	],

	initialize: function(options) {
		this.gameType = options.gameType;
		this.addImage();
		this.racer_id = $("#current_user").data("id");

		this.model.set("progress", 0);
		this.sendCarData(false);
		this.setupGameTypes(options);
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
		this.moveCar(data);
		this.checkTotalPlayers();
	},

	addImage: function() {
		this.raceImg = this.model.img
		  ||  this.GIFS[Math.floor(Math.random() * this.GIFS.length)];
	},

	checkTotalPlayers: function() {
		var currentTotalRacers = this.$el.find(".racer").length;
		if (currentTotalRacers >= 2 || this.gameType == "practice") {
			var gameChannel = this.gameChannel || (Date.now() + 15000).toString();
			$.ajax({
				url: "/heats/start_game",
				type: "POST",
				data: {
					channel: gameChannel,
					sendTo: this.gameType == "normal" ? "game_lobby" : this.gameType,
					text: this.model.collection.heat.get("text"),
					race_id: this.model.collection.heat.get("race_id")
				}
			})
		}
	},

	endTrack: function($car) {
		var place = this.PLACES[this.$el.find(".finished").length]
		$car.find(".racer_car")
		    .html("<span class='finished btn btn-success'>" + place + "!</span>")
	},

	findCar: function(id) {
		return $("[data-racer-id='"+ id + "']")
	},

	moveCar: function(data) {
		var $car = this.findCar(data.racer_id);
		var trackSize = $car.parent().width()
		var movement = data.progress * .9;
		$car.animate({ "margin-left": movement * trackSize + "px" }, 100);

		var wpm = data.wpm || 0;
		$car.parent().parent().find(".race_wpm").html(wpm + " WPM")
		if (data.progress == 1) { this.endTrack($car) }
	},

	sendCarData: function(returnTo) {
		var that = this;
		var racer_name = this.model.get("user_name") || "Guest"
		var racer = {
					racer_id: this.racer_id,
					racer_name: racer_name,
					sendTo: this.gameType == "normal" ? "game_lobby" : this.gameType,
					return_to: returnTo,
					racer_img: this.raceImg,
					progress: this.model.get("progress")
			  }
		$.ajax({
			url: "/heats/add_car",
			type: "POST",
			data: racer,
			success: function() {
				that.addCar(racer);
			}
		})
	},

	setupGameTypes: function(options) {
		if (options.gameType == "practice") {
			this.setupGameChannel({
				channel: $("#current_user").data("id")
			})
		} else {
			var that = this;
			var channel = options.channel;
			channel.bind('initiateCountDown', function(data) {
				return that.setupGameChannel(data)
			});
			channel.bind('addCar', function(data) {
				return that.addCar(data)
			});
			if (this.gameType !== "normal") {this.showModal(); }
		}
	},

	setupGameChannel: function(data) {
		var that = this;
		if (!this.gameChannel) {
			this.gameChannel = TypeRacer.pusher.subscribe(data.channel);
	    this.gameChannel.bind('updateBoard', function(data) {
				if (data && data.racer_id) { return that.moveCar(data) }
			});
		}
	},

	showModal: function() {
		var content = this.modalTemplate({ path: this.gameType })
		$('body').append(content);
		$("#share-link").modal("show");
	},
});