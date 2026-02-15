mapboxgl.accessToken =
  "pk.eyJ1IjoiY25tNTUwNzQ5ODgiLCJhIjoiY21sbW16ejUwMGpsYzNkczl3eHJhNzFwdSJ9.dTVeo8xaF_qB6G3bl7Oqpg";

////// style + data //////
const STYLE_URL = "mapbox://styles/cnm55074988/cmlmur0aj001f01sceyyi4d6u";
const GEOJSON_URL = "https://raw.githubusercontent.com/Gaga533/Gaga533.github.io/main/foof.geojson";

////// City Centre (Glasgow) approx //////
const CITY_CENTRE = [-4.2518, 55.8642];

////// km to degrees (rough) //////
function circlePolygon(lng, lat, radiusKm, steps = 64) {
  const coords = [];
  const rLat = radiusKm / 110.574;
  const rLng = radiusKm / (111.320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    coords.push([lng + rLng * Math.cos(a), lat + rLat * Math.sin(a)]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coords] } };
}

////// point in polygon (ray casting) //////
function pointInPoly(pt, poly) {
  const x = pt[0], y = pt[1];
  const vs = poly.coordinates[0];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

////// map //////
const map = new mapboxgl.Map({
  container: "map",
  style: STYLE_URL,
  center: CITY_CENTRE,
  zoom: 12
});

map.addControl(new mapboxgl.NavigationControl(), "top-right");

////// UI refs //////
const typeFilter = document.getElementById("typeFilter");
const textFilter = document.getElementById("textFilter");
const locateBtn = document.getElementById("locateBtn");
const randomBtn = document.getElementById("randomBtn");
const ccToggle = document.getElementById("ccToggle");
const countNow = document.getElementById("countNow");
const countTotal = document.getElementById("countTotal");
const hint = document.getElementById("hint");

const resultsList = document.getElementById("resultsList");
const showingNow = document.getElementById("showingNow");

////// hover popup //////
let hoverPopup = null;

////// keep loaded data for stats & random pick //////
let loadedData = null;

////// active click popup //////
let activePopup = null;

function setHint(text) {
  hint.textContent = text;
}

////// filtered list from loadedData //////
function getFilteredFeatures() {
  if (!loadedData || !loadedData.features) return [];

  const typeVal = typeFilter.value;
  const textVal = (textFilter.value || "").trim().toLowerCase();
  const useCC = ccToggle.checked;

  const ccGeom = useCC ? circlePolygon(CITY_CENTRE[0], CITY_CENTRE[1], 2, 64).geometry : null;

  const out = [];
  for (const f of loadedData.features) {
    const p = f.properties || {};
    const name = (p.name || "").toLowerCase();
    const fclass = (p.fclass || "").toLowerCase();

    if (typeVal !== "all" && fclass !== typeVal) continue;
    if (textVal && !name.includes(textVal)) continue;

    if (useCC) {
      const pt = f.geometry && f.geometry.coordinates;
      if (!pt || !pointInPoly(pt, ccGeom)) continue;
    }

    out.push(f);
  }
  return out;
}

function updateCounts() {
  const now = getFilteredFeatures().length;
  countNow.textContent = String(now);
}

////// opacity: selected category stays strong, others fade //////
function opacityExpr() {
  const v = typeFilter.value;
  if (v === "all") {
    return ["interpolate", ["linear"], ["zoom"], 11, 0.78, 16, 0.95];
  }
  return [
    "case",
    ["==", ["downcase", ["to-string", ["get", "fclass"]]], v],
    ["interpolate", ["linear"], ["zoom"], 11, 0.90, 16, 0.99],
    ["interpolate", ["linear"], ["zoom"], 11, 0.18, 16, 0.30]
  ];
}

////// results list UI //////
function badgeClass(fclass) {
  if (fclass === "restaurant") return "badge-restaurant";
  if (fclass === "pub") return "badge-pub";
  if (fclass === "cafe") return "badge-cafe";
  if (fclass === "fast_food") return "badge-fast_food";
  return "badge-other";
}

function openPopupForFeature(feature, titlePrefix = "") {
  const p = feature.properties || {};
  const coords = feature.geometry.coordinates;

  const title = (p.name || "Unnamed");
  const cat = (p.fclass || "-");
  const osm = (p.osm_id || "-");

  const html =
    "<div style='font-family:system-ui;min-width:240px'>" +
    "<div style='font-weight:900;font-size:15px;margin-bottom:6px'>" +
    (titlePrefix ? titlePrefix + " " : "") + title +
    "</div>" +
    "<div style='font-size:13px;opacity:.88;line-height:1.35'>" +
    "<div><b>Category:</b> " + cat + "</div>" +
    "<div><b>OSM ID:</b> " + osm + "</div>" +
    "</div></div>";

  if (activePopup) activePopup.remove();
  activePopup = new mapboxgl.Popup({ closeButton: true })
    .setLngLat(coords)
    .setHTML(html)
    .addTo(map);

  map.easeTo({ center: coords, zoom: Math.max(map.getZoom(), 15) });
}

function renderResultsList() {
  if (!resultsList || !showingNow) return;

  const list = getFilteredFeatures();
  const LIMIT = 50;
  const shown = list.slice(0, LIMIT);

  showingNow.textContent = String(shown.length);
  resultsList.innerHTML = "";

  if (!shown.length) {
    const empty = document.createElement("div");
    empty.style.padding = "10px";
    empty.style.fontSize = "13px";
    empty.style.fontWeight = "800";
    empty.style.opacity = "0.7";
    empty.textContent = "No results. Try changing filters.";
    resultsList.appendChild(empty);
    return;
  }

  for (const f of shown) {
    const p = f.properties || {};
    const name = p.name || "Unnamed";
    const cat = (p.fclass || "-").toLowerCase();

    const item = document.createElement("div");
    item.className = "resultItem";

    const left = document.createElement("div");
    left.className = "resultName";
    left.textContent = name;

    const right = document.createElement("div");
    right.className = "resultCat " + badgeClass(cat);
    right.textContent = cat.replace("_", " ");

    item.appendChild(left);
    item.appendChild(right);

    item.addEventListener("click", () => {
      openPopupForFeature(f, "✅ Selected:");
    });

    resultsList.appendChild(item);
  }
}

////// apply filters to map (logic unchanged) + update opacity + update UI list //////
function applyMapFilter() {
  const typeVal = typeFilter.value;
  const textVal = (textFilter.value || "").trim().toLowerCase();
  const useCC = ccToggle.checked;

  const base = ["!", ["has", "point_count"]];

  let typeExpr = true;
  if (typeVal !== "all") {
    typeExpr = ["==", ["downcase", ["to-string", ["get", "fclass"]]], typeVal];
  }

  let textExpr = true;
  if (textVal) {
    textExpr = ["in", textVal, ["downcase", ["to-string", ["get", "name"]]]];
  }

  let ccExpr = true;
  if (useCC) ccExpr = ["within", "cc-area"];

  const finalFilter = ["all", base, typeExpr, textExpr, ccExpr];

  if (map.getLayer("eat-points")) map.setFilter("eat-points", finalFilter);
  if (map.getLayer("eat-label")) map.setFilter("eat-label", finalFilter);

  if (map.getLayer("eat-points")) map.setPaintProperty("eat-points", "circle-opacity", opacityExpr());

  updateCounts();
  renderResultsList();
}

map.on("load", async () => {
  ////// load geojson //////
  const res = await fetch(GEOJSON_URL);
  const data = await res.json();
  loadedData = data;

  countTotal.textContent = String(data.features.length);
  countNow.textContent = String(data.features.length);

  ////// city centre polygon source //////
  map.addSource("cc-area", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [circlePolygon(CITY_CENTRE[0], CITY_CENTRE[1], 2, 64)] }
  });

  map.addLayer({
    id: "cc-outline",
    type: "line",
    source: "cc-area",
    layout: { visibility: "none" },
    paint: { "line-width": 2, "line-opacity": 0.7 }
  });

  ////// source with clustering //////
  map.addSource("eat", {
    type: "geojson",
    data,
    cluster: true,
    clusterRadius: 55,
    clusterMaxZoom: 14
  });

  ////// clusters //////
  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "eat",
    filter: ["has", "point_count"],
    paint: {
      "circle-radius": ["step", ["get", "point_count"], 16, 30, 20, 80, 26, 200, 32],
      "circle-opacity": 0.75
    }
  });

  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "eat",
    filter: ["has", "point_count"],
    layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": "rgba(0,0,0,0.35)",
      "text-halo-width": 1.2
    }
  });

  ////// points: zoom-based lightening + vivid colors //////
  map.addLayer({
    id: "eat-points",
    type: "circle",
    source: "eat",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 3.8, 16, 7.6],

      "circle-color": [
        "match",
        ["get", "fclass"],

        "restaurant",
        ["interpolate", ["linear"], ["zoom"], 11, "rgba(11,107,58,1)", 16, "rgba(32,179,96,1)"],

        "pub",
        ["interpolate", ["linear"], ["zoom"], 11, "rgba(122,30,58,1)", 16, "rgba(212,74,124,1)"],

        "cafe",
        ["interpolate", ["linear"], ["zoom"], 11, "rgba(177,90,26,1)", 16, "rgba(255,160,74,1)"],

        "fast_food",
        ["interpolate", ["linear"], ["zoom"], 11, "rgba(210,45,45,1)", 16, "rgba(255,112,112,1)"],

        ["interpolate", ["linear"], ["zoom"], 11, "rgba(85,85,85,1)", 16, "rgba(170,170,170,1)"]
      ],

      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1.6,

      "circle-opacity": opacityExpr()
    }
  });

  ////// hover highlight layer //////
  map.addLayer({
    id: "eat-hover",
    type: "circle",
    source: "eat",
    filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "osm_id"], "___none___"]],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 6.5, 16, 11],
      "circle-opacity": 0.25,
      "circle-stroke-width": 2
    }
  });

  ////// labels (zoomed in only) + colored by category //////
  map.addLayer({
    id: "eat-label",
    type: "symbol",
    source: "eat",
    minzoom: 15,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "text-field": ["get", "name"],
      "text-size": 12,
      "text-offset": [0, 1.2],
      "text-anchor": "top",
      "text-allow-overlap": false
    },
    paint: {
      "text-color": [
        "match",
        ["get", "fclass"],
        "restaurant", "#0B6B3A",
        "pub", "#7A1E3A",
        "cafe", "#B15A1A",
        "fast_food", "#D22D2D",
        "#2B2B2B"
      ],
      "text-halo-color": "rgba(255,255,255,0.95)",
      "text-halo-width": 1.6,
      "text-halo-blur": 0.2
    }
  });

  ////// click cluster to zoom //////
  map.on("click", "clusters", (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
    const clusterId = features[0].properties.cluster_id;
    map.getSource("eat").getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      map.easeTo({ center: features[0].geometry.coordinates, zoom });
    });
  });

  ////// click point popup //////
  map.on("click", "eat-points", (e) => {
    openPopupForFeature(e.features[0]);
  });

  ////// hover preview //////
  map.on("mousemove", "eat-points", (e) => {
    map.getCanvas().style.cursor = "pointer";
    const f = e.features[0];
    const p = f.properties || {};
    const osmId = String(p.osm_id || "");

    map.setFilter("eat-hover", ["all", ["!", ["has", "point_count"]], ["==", ["to-string", ["get", "osm_id"]], osmId]]);

    const c =
      (p.fclass === "restaurant") ? "#0B6B3A" :
      (p.fclass === "pub") ? "#7A1E3A" :
      (p.fclass === "cafe") ? "#B15A1A" :
      (p.fclass === "fast_food") ? "#D22D2D" : "#2B2B2B";

    if (hoverPopup) hoverPopup.remove();
    hoverPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 12 })
      .setLngLat(f.geometry.coordinates)
      .setHTML("<div style='font-family:system-ui'><b style='color:" + c + "'>" +
               (p.name || "Unnamed") + "</b><br/>" + (p.fclass || "-") + "</div>")
      .addTo(map);

    setHint("Preview: " + (p.name || "Unnamed") + " (" + (p.fclass || "-") + ")");
  });

  map.on("mouseleave", "eat-points", () => {
    map.getCanvas().style.cursor = "";
    map.setFilter("eat-hover", ["all", ["!", ["has", "point_count"]], ["==", ["get", "osm_id"], "___none___"]]);
    if (hoverPopup) hoverPopup.remove();
    hoverPopup = null;
    setHint("Hover a point to preview. Click for details.");
  });

  ////// UI events //////
  typeFilter.addEventListener("change", applyMapFilter);
  textFilter.addEventListener("input", applyMapFilter);

  ccToggle.addEventListener("change", () => {
    map.setLayoutProperty("cc-outline", "visibility", ccToggle.checked ? "visible" : "none");
    applyMapFilter();
    if (ccToggle.checked) map.easeTo({ center: CITY_CENTRE, zoom: Math.max(map.getZoom(), 13) });
  });

  locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      setHint("Geolocation not supported in this browser.");
      return;
    }
    setHint("Locating… please allow location access.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lng = pos.coords.longitude;
        const lat = pos.coords.latitude;

        new mapboxgl.Popup({ closeButton: false })
          .setLngLat([lng, lat])
          .setHTML("<b>You are here</b>")
          .addTo(map);

        map.easeTo({ center: [lng, lat], zoom: 15 });
        setHint("Location found. You can explore nearby places.");
      },
      () => setHint("Location access denied or unavailable."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });

  ////// Random meal //////
  randomBtn.addEventListener("click", () => {
    const list = getFilteredFeatures();
    if (!list.length) {
      setHint("No results in current filter. Try changing filters.");
      return;
    }
    const pick = list[Math.floor(Math.random() * list.length)];
    openPopupForFeature(pick, "🍽 Random pick:");
    setHint("Random pick selected. Enjoy your meal!");
  });

  ////// initial //////
  applyMapFilter();
});