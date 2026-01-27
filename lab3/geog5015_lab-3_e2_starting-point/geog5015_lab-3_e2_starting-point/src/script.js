// The value for 'accessToken' begins with 'pk...'
mapboxgl.accessToken =
  "pk.eyJ1IjoiNTUwNzQ5ODgiLCJhIjoiY21rY2h4NGRqMDBzdjNjczk3Y2x0ZXJ4aCJ9.82pnxxWEN34vjqrmlLb5cw";
//////
const style_2025 = "mapbox://styles/55074988/cmkwkgzcd005801sh748k26qz";
const style_2024 = "mapbox://styles/55074988/cmkwkcm5x002q01sh2peu1tfv";
//////
const map = new mapboxgl.Map({
  container: "map", // container ID
  style: style_2025,
  center: [-0.089932, 51.514441],
  zoom: 14
});

const layerList = document.getElementById("menu");
const inputs = layerList.getElementsByTagName("input");
//On click the radio button, toggle the style of the map.
for (const input of inputs) {
  input.onclick = (layer) => {
    if (layer.target.id == "style_2025") {
      map.setStyle(style_2025);
    }
    if (layer.target.id == "style_2024") {
      map.setStyle(style_2024);
    }
  };
}
