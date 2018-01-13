let buildings;  // array of Georgia Tech building objects we get from Georgia Tech API

/* This is the function called after Google Map API has loaded the map. This function fetches
data from a 3rd party API (Georgia Tech API) to get an array of objects representing all the buildings
on the Georgia Tech college campus.*/
function initBuildings() {
  let url = 'https://m.gatech.edu/api/gtplaces/buildings';
  fetch(url).then(function(response) {
    if (!response.ok) { // Error handling for fetch request
      throw Error(response.statusText);
    }
    return response.json();
  }).then(function(json) {
    buildings = json;
    initMap(); // Initialize map when buildings array obtained from API
    ko.applyBindings(new ViewModel()); // Activates knockout.js - need to do here because of asynchronous data fetching
  });
}

let map;
let markers = []; // array that will store markers

/* This function is called after place data from 3rd party API has loaded. This displays the map and all the buildings on the map.
Also adds info windows and animations for marker click events. */
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 33.7768205, lng: -84.4002898}, // center map around Georgia Tech
    zoom: 15
  });

  buildings.forEach(function(building, ind) { // loop through buildings array, and get the lat, long, and name to create markers
    let marker = new google.maps.Marker({
      position: {lat: parseFloat(building.latitude), lng: parseFloat(building.longitude)},
      map: map,
      animation: google.maps.Animation.DROP,
      title: building.name
    });
    let contentString = `<p>${building.name}</p><p>${building.address}</p><p>${building.phone_num}</p>`; // content for infowindow
    let infowindow = new google.maps.InfoWindow({
        content: contentString
    });
    marker.addListener('click', function() { // when you click on a marker it will either bounce or stop bouncing
      if (marker.getAnimation() !== null) {
          marker.setAnimation(null);
        } else {
          marker.setAnimation(google.maps.Animation.BOUNCE);
      }
      infowindow.open(map, marker); // when you click on a marker it's infowindow is also displayed
    });
    markers.push(marker);
  });
}

/* This is the viewmodel where we define our Knockout observables. Keeps track of whether menu
showing location list is visible and also keeps track of the array containing all the currently displayed buildings. */
function ViewModel() {
  let self = this;

  self.menuShown = ko.observable(false); // initially menu is not shown
  self.toggleMenu = function() { // menu state can get toggled with this
    self.menuShown(!(self.menuShown()));
  };

  self.displayed = ko.observableArray(); // observable array of building objects that are currently displayed

  self.resetDisplayed = function() { // use this to add all the buildings to observable array again (display everything again)
    self.displayed.removeAll();
    for (let building of buildings) {
      self.displayed.push(building);
    }
  };

  self.resetDisplayed(); // begin with all buildings displayed

  self.showInfoWindow = function(buildObj) { // function that gets called when user clicks on place name in menu
    for (let marker of markers) {
      if (buildObj.name===marker.title) {
        if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
          } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
        }
        let infoWindow = new google.maps.InfoWindow({
          content: `<p>${buildObj.name}</p><p>${buildObj.address}</p><p>${buildObj.phone_num}</p>`
        });
        infoWindow.open(map, marker);
      }
    }
  };

  self.update = function() { // function that gets called when user types a name into menu search input to filter places
    self.resetDisplayed(); // start with all places
    let userText = document.getElementById('search-bar').value;
    for (let marker of markers) {
      marker.setMap(null); // stop displaying all current markers
    }
    markers = [];
    for (let i=self.displayed().length-1; i>=0; i--) { // loop through all the buildings and see which ones match what user has typed in
      // loop backwards through array because we are going to be deleting as we go
      let building = self.displayed()[i];
      if (building.name.toLowerCase().includes(userText)) { // compare user input with building name, if substring then display that marker
        let marker = new google.maps.Marker({
          position: {lat: parseFloat(building.latitude), lng: parseFloat(building.longitude)},
          map: map,
          title: building.name
        });
        let contentString = `<p>${building.name}</p><p>${building.address}</p><p>${building.phone_num}</p>`;
        let infowindow = new google.maps.InfoWindow({
            content: contentString
        });
        marker.addListener('click', function() {
          infowindow.open(map, marker);
        });
        markers.push(marker);
      } else { // if user input is not substring of that building name then remove that building from currently displayed buildings
        self.displayed.remove(building);
      }
    }
  }
}
