async function fetchNextRace() {
    const response = await fetch('https://ergast.com/api/f1/current/next.json');
    const data = await response.json();
    const race = data.MRData.RaceTable.Races[0];

    return {
        name: `${race.raceName} - ${race.Circuit.circuitName}`,
        date: new Date(`${race.date}T${race.time}`)
    };
}

function updateCurrentTime() {
    const now = new Date();
    document.getElementById("current-time").innerText = now.toLocaleString();
}

async function updateRaceData() {
    const raceData = await fetchNextRace();

    document.getElementById("race-name").innerText = `Next Race: ${raceData.name}`;

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

    setInterval(updateCountdown, 1000);
    setInterval(updateCurrentTime, 1000); // Update current time every second
}

updateRaceData();
updateCurrentTime();
