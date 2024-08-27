async function fetchRaceResults() {
    try {
        const response = await fetch("https://ergast.com/api/f1/current/last/results.json");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const race = data.MRData.RaceTable.Races[0];
        const results = race.Results;

        // Display the race name
        const raceNameElement = document.querySelector("#race-name");
        raceNameElement.textContent = `${race.raceName} - ${race.Circuit.circuitName}`;

        const tableBody = document.querySelector("#results-table tbody");
        tableBody.innerHTML = results.map(result => {
            // Define color mapping for some example constructors
            const teamColors = {
                "Mercedes": "#00D2BE",
                "Red Bull": "#1E41FF",
                "Ferrari": "#DC0000",
                "McLaren": "#FF8700",
                "Alpine F1 Team": "#0090FF",
                "Aston Martin": "#4B92DB",
                "Haas F1 Team": "#DC0000",
                "RB F1 Team": "#2E2E2E",
                "Williams": "#005AFF",
                "Sauber": "green",
                "Porsche": "#F4C542",
                "Audi": "#DA0A9E"
            };
            const color = teamColors[result.Constructor.name] || "#CCC"; // Default color if team not found

            return `
                <tr>
                    <td>${result.position}</td>
                    <td>${result.number}</td>
                    <td>${result.Driver.givenName} ${result.Driver.familyName}</td>
                    <td style="background-color: ${color}; color: #fff;">${result.Constructor.name}</td>
                    <td>${result.laps}</td>
                    <td>${result.grid}</td>
                    <td>${result.time ? result.time.time : "N/A"}</td>
                    <td>${result.status}</td>
                    <td>${result.points}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Failed to fetch race results:", error);
    }
}

// Fetch and display the results when the page loads
document.addEventListener("DOMContentLoaded", fetchRaceResults);
