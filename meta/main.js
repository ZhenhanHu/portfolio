let data = [];
let commits = [];

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        // date: new Date(row.date + 'T00:00' + row.timezone), 
        date: new Date(`${row.date}T00:00:00${row.timezone}`),
        datetime: new Date(row.datetime),
    }));

    if (data.length > 0) {
        processCommits();
        console.log(commits);
    } else {
        console.error("CSV data failed to load!");
    }

    displayStats();
}

function processCommits() {
    commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
            id: commit,
            url: 'https://github.com/ZhenhanHu/portfolio/commit/' + commit,
            author,
            date,
            time,
            timezone,
            datetime,
            hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
            totalLines: lines.length,
        };

        Object.defineProperty(ret, 'lines', {
            value: lines,
            enumerable: false
        });

        return ret;
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});

function displayStats() {
    processCommits();

    const metaStats = document.querySelector("#profile-stats .stats-container");
    if (!metaStats) return;
    metaStats.innerHTML = ""; // Clear existing content

    // statistics
    const totalLOC = data.length;
    const totalCommits = commits.length;
    const numFiles = d3.group(data, d => d.file).size;
    const maxDepth = d3.max(data, d => d.depth);
    const longestLine = d3.max(data, d => d.length);
    const maxLines = d3.max(commits, d => d.totalLines);

    function addStat(label, value) {
        const statDiv = document.createElement("div");
        statDiv.classList.add("stat");

        const labelSpan = document.createElement("span");
        labelSpan.classList.add("stat-label");
        labelSpan.textContent = label;

        const valueSpan = document.createElement("span");
        valueSpan.classList.add("stat-value");
        valueSpan.textContent = value;

        statDiv.appendChild(labelSpan);
        statDiv.appendChild(valueSpan);
        metaStats.appendChild(statDiv);
    }

    // Add stats dynamically
    addStat("Commits", totalCommits);
    addStat("Files", numFiles);
    addStat("Total LOC", totalLOC);
    addStat("Max Depth", maxDepth);
    addStat("Longest Line", longestLine);
    addStat("Max Lines", maxLines);
}
