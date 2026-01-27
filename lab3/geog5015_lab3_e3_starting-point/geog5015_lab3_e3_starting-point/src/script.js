// The value for 'accessToken' begins with 'pk...'

mapboxgl.accessToken =
  "pk.eyJ1IjoiNTUwNzQ5ODgiLCJhIjoiY21rY2h4NGRqMDBzdjNjczk3Y2x0ZXJ4aCJ9.82pnxxWEN34vjqrmlLb5cw";

const map = new mapboxgl.Map({
  container: "map", // container element id
  style: "mapbox://styles/mapbox/light-v10",
  center: [-0.089932, 51.514442],
  zoom: 14
});

const data_url =
  "https://api.mapbox.com/datasets/v1/55074988/cmkwog3z0do9y1mmx6tlxvhmr/features?access_token=pk.eyJ1IjoiNTUwNzQ5ODgiLCJhIjoiY21rY2h4NGRqMDBzdjNjczk3Y2x0ZXJ4aCJ9.82pnxxWEN34vjqrmlLb5cw";
///
map.on("load", () => {
  map.addLayer({
    id: "crimes",
    type: "circle",
    source: {
      type: "geojson",
      data: data_url
    },
    paint: {
      "circle-radius": 10,
      "circle-color": "#eb4d4b",
      "circle-opacity": 0.9
    }
  });
  //Initialise the map filter
  filterMonth = ["==", ["get", "Month"], "2024-01"];
  filterType = ["!=", ["get", "Crime type"], "placeholder"];

  map.setFilter("crimes", ["all", filterMonth, filterType]);

  //Slider interaction code goes below
  document.getElementById("slider").addEventListener("input", (event) => {
    //Get the month value from the slider
    const month = parseInt(event.target.value);
    // get the correct format for the data
    formatted_month = "2024-" + ("0" + month).slice(-2);
    //Create a filter
    filterMonth = ["==", ["get", "Month"], formatted_month];
    //set the map filter
    map.setFilter("crimes", ["all", filterMonth, filterType]);
    // update text in the UI
    document.getElementById("active-month").innerText = month;
    //Radio button interaction code goes below
    document.getElementById("filters").addEventListener("change", (event) => {
      const type = event.target.value;
      console.log(type);
      // update the map filter
      if (type == "all") {
        filterType = ["!=", ["get", "Crime type"], "placeholder"];
      } else if (type == "shoplifting") {
        filterType = ["==", ["get", "Crime type"], "Shoplifting"];
      } else if (type == "drugs") {
        filterType = ["==", ["get", "Crime type"], "Drugs"];
      } else {
        console.log("error");
      }
      map.setFilter("crimes", ["all", filterMonth, filterType]);
    });
  });
});

///
map.on("click", (event) => {
  // If the user clicked on one of your markers, get its information.
  const features = map.queryRenderedFeatures(event.point, {
    layers: ["crimes"]
    // replace with your layer name
  });
  if (!features.length) {
    return;
  }
  const feature = features[0];

  ///
  const popup = new mapboxgl.Popup({ offset: [0, -15] })
    .setLngLat(feature.geometry.coordinates)
    .setHTML(
      `<h3>Month: ${feature.properties.Month}</h3>
      <h3>Crime type: ${feature.properties["Crime type"]}</h3>`
    )
    .addTo(map);
});
