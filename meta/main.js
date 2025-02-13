let data = [];
let commits = [];

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    // check data validation
    if (data.length > 0) {
        processCommits();
        // console.log(commits);
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
    createScatterplot();
});

function displayStats() {
    processCommits();

    const metaStats = document.querySelector("#profile-stats .stats-container");
    if (!metaStats) return;
    metaStats.innerHTML = "";

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

    addStat("Commits", totalCommits);
    addStat("Files", numFiles);
    addStat("Total LOC", totalLOC);
    addStat("Max Depth", maxDepth);
    addStat("Longest Line", longestLine);
    addStat("Max Lines", maxLines);
}

function createScatterplot() {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    // Set x scale and within the range
    const xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, usableArea.width])
        .nice();
    xScale.range([usableArea.left, usableArea.right]);

    // Set y scale and within the range
    const yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.height, 0]);
    yScale.range([usableArea.bottom, usableArea.top]);

    // Add SVG Scatter Plot
    const svg = d3
        .select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("overflow", "visible");

    // Add X axis
    const xAxis = d3.axisBottom(xScale);
    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    // Add Y axis
    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');
    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);

    // Add gridlines BEFORE the dots
    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);
    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    //////////DOTS/////////
    const dots = svg.append("g").attr("class", "dots");
    dots.selectAll("circle")
        .data(commits)
        .join("circle")
        .attr("cx", (d) => xScale(d.datetime))
        .attr("cy", (d) => yScale(d.hourFrac))
        .attr("r", 5)
        .attr("fill", "steelblue");
}