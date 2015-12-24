var coordinates = {lat:40.7484444, lng:-73.9878441};
var viewModel = function(){
	var self = this;
	var markerArray = [];
	var autoPlaceOfInt = [];
 	var previousMarker = null;
 	this.showNavMenu = ko.observable(true);
	this.placeOfInt = [];
  	this.filterPlaceArray = ko.observableArray([]);
   	this.location = ko.observable('');

//Input box autocomplete
	this.autoCompleteSource = function( request, response ) {
 		self.filterPlaces(request.term);
        response(self.filterPlaceArray());
    };

//Filter autocomplete list based on input box value
	this.filterPlaces = function(placeName) {
		self.filterPlaceArray([]);
 		autoPlaceOfInt.forEach(function(place){
			var foundMarker = self.findMarker(place.value);
 			if (place.label.toLowerCase().search(placeName.toLowerCase())>=0){
				self.filterPlaceArray().push(place);
				foundMarker.setMap(map);
 			} else {
				foundMarker.setMap(null);
			}
		});
 		if (self.filterPlaceArray().length === 0) {
			self.filterPlaceArray().push({label:"No Match"});
  		}
 		self.filterPlaceArray(self.filterPlaceArray());
	};

	this.findMarker = function(placeId) {
		var foundMarker;
 		markerArray.forEach(function(marker){
			if(marker.id.localeCompare(placeId) === 0){
				foundMarker=marker;
   			}
		});		
		return foundMarker;
  	};

//Display marker based on input box value
	this.showSelectedMarker = function(placeId) {
		markerArray.forEach(function(marker){
			if(marker.id.localeCompare(placeId) === 0){
				marker.setMap(map);
			} else {
				marker.setMap(null);
			}
		});
 	};

//Animate marker based on select list click
    this.animateMarker = function(placeId){
 		markerArray.forEach(function(marker){
 			if(marker.id.localeCompare(placeId) === 0){
				marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
				marker.setAnimation(google.maps.Animation.BOUNCE);
				previousMarker = marker;
   			} else{
				marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
				marker.setAnimation(null);
   			}
		});
 	};

	var map;
	var infowindow;


	this.loadMap = function(coordinates) {
		map = new google.maps.Map(document.getElementById('map'), {
			center: coordinates,
			zoom: 15
		});
 		infowindow = new google.maps.InfoWindow({
			maxWidth: 300
		});
	};


//Map init and load functions
	this.loadPlaces = function(place) {
		var service = new google.maps.places.PlacesService(map);
		service.nearbySearch({
			location: coordinates,
			radius: 500,
			types: [place]
		}, self.callback);
	};

//Create and display markers
	this.callback = function(results, status) {
	  if (status === google.maps.places.PlacesServiceStatus.OK) {
		for (var i = 0; i < results.length; i++) {
		  self.createMarker(results[i]);
 		}
		self.placeOfInt = results.slice();

		results.forEach(function(place){
			autoPlaceOfInt.push({value:place.id, label:place.name, autoPlace:place});
		});
		self.filterPlaceArray(autoPlaceOfInt);
	}
	};
	this.createMarker = function(place) {
		var placeLoc = place.geometry.location;
		var marker = new google.maps.Marker({
			map: map,
			title: place.name,
			id : place.id,
			draggable: true,
 			animation: google.maps.Animation.DROP,
			position: place.geometry.location,
			icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
 		});

 		markerArray.push(marker);
		google.maps.event.addListener(marker,'click',function(position,i) {
			toggleBounce(this);
			toggleBounce(previousMarker);
			previousMarker = this;
			infowindow.close();
 			infowindow.setContent(self.yelpApiList(place.name));
   			infowindow.open(map, this);
   		});
 		google.maps.event.addListener(infowindow,'closeclick',function() {
			previousMarker = null;
			self.showNavMenu(true);//show the nav menu that has location and filter by
 			marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
			marker.setAnimation(null);
 		});
	};
	function toggleBounce(marker){
		if (marker === null){
			return;
		}
		if (marker.getAnimation() !== null){
			marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
			marker.setAnimation(null);
		} else {
			marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
			marker.setAnimation(google.maps.Animation.BOUNCE);
		}
 	}


//Yelp Api function
	this.yelpApiList = function(placeName){
		function nonce_generate() {
		  return (Math.floor(Math.random() * 1e12).toString());
		}
 		var yelpUrl = 'https://api.yelp.com/v2/search';
		var parameters = {
		  oauth_consumer_key: 'KRa7pi6qeawZpto18Hs1ng',
		  oauth_token: 'HLJuTQaKiK8kVAB_Ek8NDpfeNxOgvL2K',
		  term: placeName,
		  ll: '40.7484444,-73.9878441',
		  limit: 1,
		  oauth_nonce: nonce_generate(),
		  oauth_timestamp: Math.floor(Date.now()/1000),
		  oauth_signature_method: 'HMAC-SHA1',
		  oauth_version : '1.0',
		  callback: 'cb'
 		};

		var encodedSignature = oauthSignature.generate('GET',yelpUrl, parameters, 'i8z5jqh2L_CYSUSovUUl4GKWQRo', 'whrb7xLwYoNqj6AdwzRRJwyGcbs');
		parameters.oauth_signature = encodedSignature;

		var request = $.ajax( {
			url: yelpUrl,
			data: parameters,
			jsonCallback: 'cb',
			cache: true,
			dataType: 'jsonp',
			success: function(results) {
				self.showNavMenu(false);//hide the navmenu that has location and filter by
 				//style and display the infowindow
				var name = '<h4 style="background:#853330;color:#ffffff">'+results.businesses[0].name+'</h4>';
 				var rating = '<div><img src="'+results.businesses[0].rating_img_url+'"></div>';

				var location = '<h4>'+results.businesses[0].location.display_address[0]+'</br>'+results.businesses[0].location.display_address[1]+'</br>'+results.businesses[0].location.display_address[2]+'</h4>';
				var phone = '<h5>'+results.businesses[0].display_phone+'</h5>';
				var image = '<img src="'+results.businesses[0].image_url+'"></br>';
				var midDiv = '<div style="width:50%;float:left">'+location+phone+'</div><div style="width:40%;marginLeft:5px;float:right">'+image+'</div>';

				var placeUrl = '<div style="width:100%;float:left"><h5><a href='+'"'+results.businesses[0].mobile_url+'"'+'target="_blank">View more details</a></h5></div>';

				infowindow.setContent(name+rating+midDiv+placeUrl);
  		  }
		}).fail(function( jqXHR, textStatus ) {
 			infowindow.setContent( "Unable to get location information" );
		});
 	};
 };

ko.bindingHandlers.autoc = {
	init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		$(element).autocomplete({
			minLength: 0,
			autoFocus: true,
			source: viewModel.autoCompleteSource,
			select: function (event, ui) {
				event.preventDefault();
				viewModel.location(ui.item.label);
				viewModel.showSelectedMarker(ui.item.value);
 			},
			focus: function(event,ui){
				viewModel.animateMarker(ui.item.value);
			}
		}).focus(function(){
			$(this).autocomplete('search');
		});
	}

};
var vm = new viewModel();
ko.applyBindings(vm);
function initMap() {
  vm.loadMap(coordinates);
  vm.loadPlaces('cafe');
}


