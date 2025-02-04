import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');

// count number of projects
if (projectsTitle) {
    projectsTitle.textContent = projects.length;
}

// check projectsContainer
if (!projectsContainer) {
    console.error("Projects container not found!");
}

// check projects
if (projects.length === 0) {
    projectsContainer.innerHTML = "<p>No projects available at the moment.</p>";
} else {
    renderProjects(projects, projectsContainer, 'h2');
}

// Pie chart 
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let selectedIndex = -1;

// function to recalculate data for current given projects, return data
function recalculate(projectsGiven) {
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year
    );

    return newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });
}

// function to update legend
function updateLegend(data, highlightIndex = -1) {
    let legend = d3.select(".legend");
    legend.selectAll("li").remove();
    data.forEach((d, idx) => {
        // console.log(highlightIndex); // debugging
        // console.log(idx); // compare and debugging
        let item = legend.append("li")
            .attr("style", `--color:${highlightIndex === idx ? "#d0457c" : colors(idx)}`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);

        if (highlightIndex === idx) item.classed("selected", true);
    });
}

// function to update the pie chart
function updatePieChart(data, projects) {
    let svg = d3.select("svg");
    svg.selectAll("*").remove(); // clear old chart

    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(data);
    let arcs = arcData.map((d) => arcGenerator(d));

    arcs.forEach((arc, idx) => {
        svg.append("path")
            .attr("d", arc)
            .attr("fill", colors(idx))
            .attr("class", "wedge")
            .on("click", function () {
                d3.selectAll("path").classed("selected", false);
                selectedIndex = (selectedIndex === idx) ? -1 : idx;

                if (selectedIndex !== -1) {
                    d3.select(this).classed("selected", true);
                    let selectedYear = data[selectedIndex].label;
                    let selectedProjects = projects.filter(p => p.year === selectedYear);

                    // render projects and count how many
                    renderProjects(selectedProjects, projectsContainer, 'h2');
                    updateProjectCount(selectedProjects.length);

                    // calculate data and adjust legend
                    let newDataYear = recalculate(selectedProjects)
                    // updateLegend(newDataYear, selectedIndex);
                    let legend = d3.select(".legend");
                    d3.select(".legend").selectAll("li").remove();
                    newDataYear.forEach((d, idx) => {
                        legend.append('li')
                            .attr('style', "--color:#d0457c")
                            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
                    });
                } else {
                    // render projects and count how many
                    renderProjects(projects, projectsContainer, 'h2');
                    updateProjectCount(projects.length);
                    updateLegend(data);
                }
            });
    });
    updateLegend(data);
}

// function to update number of currently displayed projects
function updateProjectCount(count) {
    const projectsTitle = document.querySelector('.projects-title');
    if (projectsTitle) {
        projectsTitle.textContent = count;
    }
}

// initial pie chart
let data = recalculate(projects);
updatePieChart(data, projects);

// SEARCH INPUT EVENT LISTENING RECURSIVE
let query = "";
document.querySelector(".searchBar").addEventListener("input", (event) => {
    query = event.target.value.toLowerCase();
    let filteredProjects = projects.filter(p => Object.values(p).join('\n').toLowerCase().includes(query));
    renderProjects(filteredProjects, projectsContainer, 'h2');
    updateProjectCount(filteredProjects.length);

    let newData = recalculate(filteredProjects);
    updatePieChart(newData, filteredProjects);
});