function updateCurrentTime() {
    const now = new Date();
    const hours = now.getHours();
    const date = now.toLocaleDateString();
    document.getElementById("current-time").innerText = `${hours}:${now.getMinutes()}:${now.getSeconds()} ${date}`;
  }
  
  
  async function fetchNextRace() {
    try {
      const response = await fetch("https://ergast.com/api/f1/current/next.json");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const race = data.MRData.RaceTable.Races[0];
  
      return {
        season: race.season,
        round: race.round,
        name: `${race.raceName} - ${race.Circuit.circuitName}`,
        date: new Date(`${race.date}T${race.time}`),
        circuit: race.Circuit.circuitName,
        location: `${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`,
        coordinates: [race.Circuit.Location.lat, race.Circuit.Location.long],
        practices: [
          {
            name: "First Practice",
            date: new Date(
              `${race.FirstPractice.date}T${race.FirstPractice.time}`
            )
          },
          {
            name: "Second Practice",
            date: new Date(
              `${race.SecondPractice.date}T${race.SecondPractice.time}`
            )
          },
          {
            name: "Third Practice",
            date: race.ThirdPractice
              ? new Date(`${race.ThirdPractice.date}T${race.ThirdPractice.time}`)
              : null
          }
        ],
        qualifying: new Date(`${race.Qualifying.date}T${race.Qualifying.time}`),
        raceResultsUrl: `https://ergast.com/api/f1/${race.season}/${race.round}/results.json`,
        raceId: `${race.season}/${race.round}`
      };
    } catch (error) {
      console.error("Failed to fetch next race:", error);
      return null;
    }
  }
  
  async function fetchSessionResults(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.MRData.RaceTable.Races[0];
    } catch (error) {
      console.error("Failed to fetch session results:", error);
      return null;
    }
  }
  
  async function fetchLeaderboard() {
    try {
      const [driversResponse, constructorsResponse] = await Promise.all([
        fetch("https://ergast.com/api/f1/current/driverStandings.json"),
        fetch("https://ergast.com/api/f1/current/constructorStandings.json")
      ]);
  
      const driversData = await driversResponse.json();
      const constructorsData = await constructorsResponse.json();
  
      return {
        drivers:
          driversData.MRData.StandingsTable.StandingsLists[0].DriverStandings,
        constructors:
          constructorsData.MRData.StandingsTable.StandingsLists[0]
            .ConstructorStandings
      };
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      return { drivers: [], constructors: [] };
    }
  }
  
  function formatResults(results, driverCode) {
    const result = results.find((result) => result.Driver.code === driverCode);
    return result
      ? `${result.position} (${result.time ? result.time.time : "No time"})`
      : "No result";
  }
  
  async function updateRaceData() {
    const raceData = await fetchNextRace();
  
    if (raceData) {
      // Updating race details
      document.getElementById("season").innerText = `${raceData.season}`;
      document.getElementById("round").innerText = `${raceData.round}`;
      document.getElementById("race-name").innerText = `${raceData.name}`;
      document.getElementById("circuit-name").innerText = `${raceData.circuit}`;
      document.getElementById("location").innerText = `${raceData.location}`;
  
      // Update practice sessions
      const now = new Date();
      document.getElementById("first-practice").innerText =
        raceData.practices[0].date.toLocaleString();
      document.getElementById("second-practice").innerText =
        raceData.practices[1].date.toLocaleString();
      document.getElementById("third-practice").innerText = raceData.practices[2]
        ? raceData.practices[2].date.toLocaleString()
        : "No session";
  
      // Apply the completed session style if the session time is past
      if (raceData.practices[0].date < now)
        document
          .getElementById("first-practice")
          .parentElement.classList.add("completed-session");
      if (raceData.practices[1].date < now)
        document
          .getElementById("second-practice")
          .parentElement.classList.add("completed-session");
      if (raceData.practices[2] && raceData.practices[2].date < now)
        document
          .getElementById("third-practice")
          .parentElement.classList.add("completed-session");
      if (raceData.qualifying < now)
        document
          .getElementById("qualifying")
          .parentElement.classList.add("completed-session");
  
      // Fetch and update race results
      const raceResults = await fetchSessionResults(raceData.raceResultsUrl);
      const mclarenDriverIds = ["NOR", "PIA"]; // Correct driver codes for McLaren: Lando Norris and Oscar Piastri
  
      if (raceResults) {
        const driversResults = raceResults.Results.filter((result) =>
          mclarenDriverIds.includes(result.Driver.code)
        );
        const resultsText = mclarenDriverIds
          .map((driverCode) => {
            const practiceResults = raceData.practices
              .map(
                (practice, index) =>
                  `Practice ${index + 1}: ${formatResults(
                    driversResults,
                    driverCode
                  )}`
              )
              .join(", ");
            const qualifyingResult = `Qualifying: ${formatResults(
              driversResults,
              driverCode
            )}`;
            const raceResult = `Race: ${formatResults(
              driversResults,
              driverCode
            )}`;
  
            return `${driverCode}: ${practiceResults}, ${qualifyingResult}, ${raceResult}`;
          })
          .join(", ");
  
        document.getElementById(
          "race-results"
        ).innerText = `Race Results: ${resultsText}`;
        document.getElementById(
          "first-practice-results"
        ).innerText = `First Practice Results: ${resultsText}`;
        document.getElementById(
          "second-practice-results"
        ).innerText = `Second Practice Results: ${resultsText}`;
        document.getElementById(
          "third-practice-results"
        ).innerText = `Third Practice Results: ${resultsText}`;
        document.getElementById(
          "qualifying-results"
        ).innerText = `Qualifying Results: ${resultsText}`;
  
        // Apply the completed session style to race results if the race is over
        if (now > raceData.date) {
          document
            .querySelectorAll(".race-details-widget td")
            .forEach((td) => td.classList.add("completed-session"));
        }
      }
  
      // Fetch and update the leaderboard
      const leaderboard = await fetchLeaderboard();
  
      const constructorsList = document.getElementById("constructors-list");
      constructorsList.innerHTML = leaderboard.constructors
        .map(
          (construct, index) =>
            `<li style="list-style-type: none;">${index + 1}. ${
              construct.Constructor.name
            } - Points: ${construct.points}</li>`
        )
        .join("");
  
      const driversList = document.getElementById("drivers-list");
      driversList.innerHTML = leaderboard.drivers
        .map(
          (driver, index) =>
            `<li style="list-style-type: none;">${index + 1}. ${
              driver.Driver.familyName
            } - Points: ${driver.points}</li>`
        )
        .join("");
  
      // Initialize Leaflet map
      const map = L.map("map", {
        zoomControl: false,
        attributionControl: false
      }).setView(raceData.coordinates, 13);
  
      const streets = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          tileSize: 512,
          zoomOffset: -1,
          detectRetina: true
        }
      );
  
      const imagery = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          tileSize: 512,
          zoomOffset: -1,
          detectRetina: true
        }
      );
  
      const baseMaps = {
        Streets: streets,
        Satellite: imagery
      };
  
      L.control.layers(baseMaps).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.control.attribution({ position: "bottomleft" }).addTo(map);
  
      streets.addTo(map);
  
      // Add marker to map
      L.marker(raceData.coordinates)
        .addTo(map)
        .bindPopup(`${raceData.circuit}<br>${raceData.location}`)
        .openPopup();
  
      // Add Leaflet Draw Plugin scripts and CSS
      const leafletDrawCSS = document.createElement("link");
      leafletDrawCSS.rel = "stylesheet";
      leafletDrawCSS.href =
        "https://cdn.jsdelivr.net/npm/leaflet-draw@1.0.4/dist/leaflet.draw.css";
      document.head.appendChild(leafletDrawCSS);
  
      const leafletDrawScript = document.createElement("script");
      leafletDrawScript.src =
        "https://cdn.jsdelivr.net/npm/leaflet-draw@1.0.4/dist/leaflet.draw.js";
      document.head.appendChild(leafletDrawScript);
  
      leafletDrawScript.onload = function () {
        let drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
  
        const drawControl = new L.Control.Draw({
          edit: {
            featureGroup: drawnItems,
            remove: true
          },
          draw: {
            polyline: {
              shapeOptions: {
                color: "#ff8700",
                weight: 5
              }
            },
            polygon: {
              shapeOptions: {
                color: "#ff8700",
                weight: 5
              }
            },
            circle: {
              shapeOptions: {
                color: "#ff8700",
                weight: 5
              }
            },
            marker: {
              shapeOptions: {
                color: "#ff8700",
                weight: 5
              }
            },
            rectangle: {
              shapeOptions: {
                color: "#ff8700",
                weight: 5
              }
            }
          }
        });
  
        map.addControl(drawControl);
  
        map.on(L.Draw.Event.CREATED, function (e) {
          const layer = e.layer;
          drawnItems.addLayer(layer);
  
          // Calculate the length of the drawn line
          let length = 0;
          if (layer instanceof L.Polyline) {
            const latlngs = layer.getLatLngs();
            for (let i = 0; i < latlngs.length - 1; i++) {
              length += latlngs[i].distanceTo(latlngs[i + 1]);
            }
          }
  
          // Enable download buttons
          document.getElementById("download-buttons").style.display = "flex";
        });
  
        function downloadData(format) {
          const data = drawnItems.toGeoJSON();
  
          let convertedData;
          let mimeType;
          let fileName = `track.${format}`;
  
          if (format === "geojson") {
            convertedData = JSON.stringify(data);
            mimeType = "application/json";
          } else if (format === "kml") {
            convertedData = tokml(data); // Convert GeoJSON to KML
            mimeType = "application/vnd.google-earth.kml+xml";
          } else if (format === "shp") {
            convertedData = shpwrite.zip(data); // Convert GeoJSON to Shapefile
            mimeType = "application/zip";
          }
  
          const blob = new Blob([convertedData], { type: mimeType });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          link.click();
        }
  
        // Add download buttons
        const downloadContainer = document.createElement("div");
        downloadContainer.id = "download-buttons";
        downloadContainer.innerHTML = `
          <button class="download-button" onclick="downloadData('geojson')">Download as GeoJSON</button>
          <button class="download-button" onclick="downloadData('kml')">Download as KML</button>
          <button class="download-button" onclick="downloadData('shp')">Download as SHP</button>
      `;
        document
          .querySelector(".dashboard-container")
          .appendChild(downloadContainer);
  
        // Initially hide the download buttons
        downloadContainer.style.display = "none";
      };
  
      // Function to convert GeoJSON to KML
      function tokml(geojson) {
        // You'll need to add a library or implement a function to convert GeoJSON to KML.
        // You can use libraries like 'togeojson' or similar to perform this conversion.
        // For simplicity, consider using a pre-built library here.
      }
  
      // Function to convert GeoJSON to Shapefile
      function shpwrite(zipData) {
        // You'll need to add a library or implement a function to convert GeoJSON to SHP.
        // You can use libraries like 'shp-write' or similar to perform this conversion.
        // For simplicity, consider using a pre-built library here.
      }
  
      // Update countdown
      function updateCountdown() {
        const now = new Date().getTime();
        const timeLeft = raceData.date.getTime() - now;
  
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  
        document.getElementById("days").innerText = String(days).padStart(2, "0");
        document.getElementById("hours").innerText = String(hours).padStart(
          2,
          "0"
        );
        document.getElementById("minutes").innerText = String(minutes).padStart(
          2,
          "0"
        );
        document.getElementById("seconds").innerText = String(seconds).padStart(
          2,
          "0"
        );
  
        if (timeLeft < 0) {
          document.getElementById("race-name").innerText = "The race is on!";
          document.getElementById("countdown").style.display = "none";
        }
      }
  
      setInterval(updateCountdown, 1000);
      setInterval(updateCurrentTime, 1000); // Update current time every second
    } else {
      console.error("Race data is not available.");
    }
  }
  
  updateRaceData();
  updateCurrentTime();
  
  
  document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('year').textContent = new Date().getFullYear();
  });
  