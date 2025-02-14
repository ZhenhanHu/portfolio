let data = [];
let commits = [];
let xScale, yScale;
let brushSelection = null;

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

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3
        .scaleSqrt()
        .domain([minLines, maxLines])
        .range([2, 30]);

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
 
    // Set x scale and within the range
    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        // .range([0, usableArea.width])
        .nice();
    // xScale.range([usableArea.left, usableArea.right]);

    // Set y scale and within the range
    yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);
    // yScale.range([usableArea.bottom, usableArea.top]);

    // Add SVG Scatter Plot
    const svg = d3
        .select("#chart")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("width", "100%")
        .style("height", "auto")
        .style("max-width", "1000px") 
        .style("display", "block")
        // .attr("width", width)
        // .attr("height", height)
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

    // Add dots
    const dots = svg.append("g").attr("class", "dots");
    dots.selectAll("circle")
        .data(sortedCommits)
        .join("circle")
        .attr("cx", (d) => xScale(d.datetime))
        .attr("cy", (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr("fill", "steelblue")
        .style('fill-opacity', 0.7)
        .on('mouseenter', function (event, commit) {
            d3.select(event.currentTarget).style('fill-opacity', 1);
            updateTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on("mousemove", function (event) {
            updateTooltipPosition(event);
        })
        .on('mouseleave', function (event) {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipContent({});
            updateTooltipVisibility(false);
        });
    
    brushSelector();
}

function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById("commit-time");
    const lines = document.getElementById("commit-lines");
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {dateStyle: 'full'});
    time.textContent = commit.datetime?.toLocaleTimeString('en', {timeStyle: 'short'});
    lines.textContent = commit.totalLines;
  }

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
  }

function brushSelector() {
    const svg = document.querySelector('svg');
    d3.select(svg).call(d3.brush());
    d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
    d3.select(svg).call(d3.brush().on('start brush end', brushed));
}

function isCommitSelected(commit) {
    if (!brushSelection) {
      return false;
    }

    const x_0 = brushSelection[0][0];
    const y_0 = brushSelection[0][1];
    const x_1 = brushSelection[1][0];
    const y_1 = brushSelection[1][1];

    // get dot's x and y positions
    const dot_x = xScale(commit.datetime);
    const dot_y = yScale(commit.hourFrac);

    // check selection boundary and dot position
    return dot_x >= x_0 && dot_x <= x_1 && dot_y >= y_0 && dot_y <= y_1;
}

function updateSelection() {
    // Update visual state of dots based on selection
    d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

function brushed(event) {
    brushSelection = event.selection;
    updateSelection();
    updateSelectionCount();
    updateLanguageBreakdown();
}

function updateSelectionCount() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
  
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
}

function updateLanguageBreakdown() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
    // Create a container for each language row
    const langDiv = document.createElement('div');
    langDiv.classList.add('stat-row');

    langDiv.innerHTML = `
    <div class="stat-label">${language}</div>
    <div class="stat-value">${count} lines</div>
    <div class="stat-percentage">${formatted}</div>`;
    container.appendChild(langDiv);
    }
  
    return breakdown;
}