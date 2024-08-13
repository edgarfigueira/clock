async function fetchNextRace() {
    const response = await fetch('https://ergast.com/api/f1/current/next.json');
    const data = await response.json();
    const race = data.MRData.RaceTable.Races[0];

    return {
        name: `${race.raceName} - ${race.Circuit.circuitName}`,
        date: new Date(`${race.date}T${race.time}`),
        circuit: race.Circuit.circuitName,
        location: `${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`,
        coordinates: [race.Circuit.Location.lat, race.Circuit.Location.long],
        practices: [
            { name: "First Practice", date: new Date(`${race.FirstPractice.date}T${race.FirstPractice.time}`) },
            { name: "Second Practice", date: new Date(`${race.SecondPractice.date}T${race.SecondPractice.time}`) },
            { name: "Third Practice", date: new Date(`${race.ThirdPractice.date}T${race.ThirdPractice.time}`) },
        ],
        qualifying: new Date(`${race.Qualifying.date}T${race.Qualifying.time}`)
    };
}

function updateCurrentTime() {
    const now = new Date();
    document.getElementById("current-time").innerText = now.toLocaleString();
}

async function updateRaceData() {
    const raceData = await fetchNextRace();

    document.getElementById("race-name").innerText = `Next Race: ${raceData.name}`;
    document.getElementById("circuit-name").innerText = `Circuit: ${raceData.circuit}`;
    document.getElementById("location").innerText = `Location: ${raceData.location}`;
    document.getElementById("first-practice").innerText = `First Practice: ${raceData.practices[0].date.toLocaleString()}`;
    document.getElementById("second-practice").innerText = `Second Practice: ${raceData.practices[1].date.toLocaleString()}`;
    document.getElementById("third-practice").innerText = `Third Practice: ${raceData.practices[2].date.toLocaleString()}`;
    document.getElementById("qualifying").innerText = `Qualifying: ${raceData.qualifying.toLocaleString()}`;

    function updateCountdown() {
        const now = new Date().getTime();
        const timeLeft = raceData.date.getTime() - now;

        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        document.getElementById("days").innerText = String(days).padStart(2, '0');
        document.getElementById("hours").innerText = String(hours).padStart(2, '0');
        document.getElementById("minutes").innerText = String(minutes).padStart(2, '0');
        document.getElementById("seconds").innerText = String(seconds).padStart(2, '0');

        if (timeLeft < 0) {
            document.getElementById("race-name").innerText = "The race is on!";
            document.getElementById("countdown").style.display = "none";
        }
    }

    // Initialize Leaflet map
    const map = L.map('map').setView(raceData.coordinates, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add marker to map
    L.marker(raceData.coordinates).addTo(map)
        .bindPopup(`${raceData.circuit}<br>${raceData.location}`)
        .openPopup();

    setInterval(updateCountdown, 1000);
    setInterval(updateCurrentTime, 1000); // Update current time every second
  
  
}

updateRaceData();
updateCurrentTime();

