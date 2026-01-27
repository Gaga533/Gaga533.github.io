// The value for 'accessToken' begins with 'pk...'
mapboxgl.accessToken =
  "pk.eyJ1IjoiNTUwNzQ5ODgiLCJhIjoiY21rY2h4NGRqMDBzdjNjczk3Y2x0ZXJ4aCJ9.82pnxxWEN34vjqrmlLb5cw";
//Before map
const beforeMap = new mapboxgl.Map({
  container: "before",
  style: "mapbox://styles/55074988/cmkwkcm5x002q01sh2peu1tfv",
  center: [-0.089932, 51.514441],
  zoom: 14
});
//After map
const afterMap = new mapboxgl.Map({
  container: "after",
  style: "mapbox://styles/55074988/cmkwkgzcd005801sh748k26qz",
  center: [-0.089932, 51.514441],
  zoom: 14
});
//////
const container = "#comparison-container";
const map = new mapboxgl.Compare(beforeMap, afterMap, container, {});
//////
