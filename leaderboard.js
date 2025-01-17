function loadLeaderboard() {
    console.log("Loading leaderboard...");

    const url = 'https://api.sheety.co/fd10818c1eae04caf0980564586d4c52/pcfLeaderboard/sheet1';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("Leaderboard data:", data); // Check the response
            const leaderboard = data.sheet1;

            if (Array.isArray(leaderboard)) {
                const sortedLeaderboard = leaderboard.sort((a, b) => b.score - a.score);
                const leaderboardTableBody = document.querySelector("#leaderboard tbody");
                leaderboardTableBody.innerHTML = "";

                sortedLeaderboard.forEach((entry, index) => {
                    const row = document.createElement("tr");

                    const rankCell = document.createElement("td");
                    rankCell.textContent = index + 1;
                    row.appendChild(rankCell);

                    const nicknameCell = document.createElement("td");
                    nicknameCell.textContent = entry.nickname;
                    row.appendChild(nicknameCell);

                    const scoreCell = document.createElement("td");
                    scoreCell.textContent = entry.score;
                    row.appendChild(scoreCell);

                    const twitterCell = document.createElement("td");

                    // Check if the entry.twitter starts with 'http' (to confirm it's a full URL)
                    // If not, prepend the base URL 'https://www.x.com/'
                    const twitterURL = entry.twitter.startsWith('http') ? entry.twitter : `https://www.x.com/${entry.nickname.replace(/^@/, '')}`;

                    // Create an anchor tag for the Twitter link
                    const twitterLink = document.createElement("a");
                    twitterLink.href = twitterURL;  // Set the href to the Twitter URL
                    twitterLink.textContent = entry.twitter;  // Display the Twitter URL as text
                    twitterLink.target = "_blank";  // Open the link in a new tab
                    twitterLink.style.color = "#66ccff";  // Set the link color to light blue (you can customize this)
                    twitterLink.style.textDecoration = "none";  // Remove underline

                    // Append the anchor tag to the twitterCell
                    twitterCell.appendChild(twitterLink);

                    // Append the twitterCell to the row
                    row.appendChild(twitterCell);



                    leaderboardTableBody.appendChild(row);
                });
            } else {
                console.error("Leaderboard data is not in expected array format:", leaderboard);
            }
        })
        .catch((error) => {
            console.error("Error loading leaderboard:", error);
        });
}

document.addEventListener("DOMContentLoaded", () => {
    loadLeaderboard(); // This ensures the leaderboard is loaded on page load
});