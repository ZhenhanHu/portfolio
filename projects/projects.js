import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');

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

// Pie Chart
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Function to recalculate data for projects, return data
function recalculateProjects(projectsGiven) {
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year
    );

    return newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });
}

let data = recalculateProjects(projects);

let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data);
let arcs = arcData.map((d) => arcGenerator(d));

// clear old paths and draw new paths
d3.select("svg").selectAll("*").remove();
arcs.forEach((arc, idx) => {
    d3.select('svg')
      .append('path')
      .attr('d', arc)
      .attr("fill", colors(idx))
      .attr("pointer-events", "all");
})

// draw new legends
let legend = d3.select(".legend");
data.forEach((d, idx) => {
    legend.append('li')
          .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
})

///////////////////////////////SELECTION - START///////////////////////////////
// Select and deselect wedge
let selectedIndex = -1;

arcs.forEach((arc, i) => {
    let path = d3.select('svg')
        .append('path')
        .attr('d', arc)
        .attr("fill", colors(i))
        .attr("class", "wedge")
        .on("click", function() {
            d3.selectAll("path").classed("selected", false);
            selectedIndex = (selectedIndex === i) ? -1 : i;

            if (selectedIndex !== -1) {
                // highlight selected slice and selected legend
                d3.select(this).classed("selected", true);
                d3.select(`.legend li:nth-child(${i + 1})`).classed("selected", true);

                // render selected projects
                let selectedYear = data[selectedIndex].label
                // console.log(selectedYear) // Debugging part
                let selectedProjects = projects.filter(project => project.year === selectedYear);
                // console.log(selectedProjects) // Debugging part
                renderProjects(selectedProjects, projectsContainer, 'h2');

                // re-calculate data for year
                let selected_Data = recalculateProjects(selectedProjects);

                // legend adjust for year
                d3.select(".legend").selectAll("li").remove();
                selected_Data.forEach((d, idx) => {
                    legend.append('li')
                        .attr('style', "--color:#d0457c")
                        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
                });

            } else {
                // unhighlight slice and legend
                d3.selectAll("path").classed("selected", false);
                d3.selectAll(".legend li").classed("selected", false);

                // render all projects
                renderProjects(projects, projectsContainer, 'h2');

                // legend adjust for all projects
                d3.select(".legend").selectAll("li").remove();
                data.forEach((d, idx) => {
                    legend.append('li')
                        .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
                        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
                    })
            }
        });
});
///////////////////////////////SELECTION - END/////////////////////////////////


////////////////SEARCH INPUT EVENT LISTENING RECURSIVE - START ////////////////
// Search Field
let query = '';

function setQuery(newQuery) {
    query = newQuery;
    // 1) filter projects based on <query>
    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });
    // 2) return filtered projects
    return filteredProjects;
  }

let searchInput = document.getElementsByClassName('searchBar')[0];

searchInput.addEventListener('input', (event) => {
    // filter projects and render them
    let filteredProjects = setQuery(event.target.value);
    renderProjects(filteredProjects, projectsContainer, 'h2');

    // re-calculate data
    let newData = recalculateProjects(filteredProjects);

    // re-calculate slice generator, arc data, arc, etc.
    let newSliceGenerator = d3.pie().value((d) => d.value);;
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));

    // clear up old paths and
    let newSVG = d3.select('svg');
    newSVG.selectAll('path').remove();

    // update new paths
    newArcs.forEach((arc, idx) => {
        d3.select('svg')
          .append('path')
          .attr('d', arc)
          .attr("fill", colors(idx))
          .attr("pointer-events", "all")
          .attr("class", "wedge")
          .on("click", function() {
            d3.selectAll("path").classed("selected", false);
            selectedIndex = (selectedIndex === idx) ? -1 : idx;

            if (selectedIndex !== -1) { // if selected...
                // highlight selected slice and selected legend
                d3.select(this).classed("selected", true);
                d3.select(`.legend li:nth-child(${idx + 1})`).classed("selected", true);

                // render searched AND selected projects for year
                let selectedYear = newData[selectedIndex].label
                let filteredProjectsForYear = filteredProjects.filter(project => project.year === selectedYear);
                renderProjects(filteredProjectsForYear, projectsContainer, 'h2');

                // re-calculate data for year
                let newData_year = recalculateProjects(filteredProjectsForYear);

                // legend adjust for year
                d3.select(".legend").selectAll("li").remove();
                newData_year.forEach((d, idx) => {
                    legend.append('li')
                        .attr('style', "--color:#d0457c")
                        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
                });
            } else {
                // unhighlight slice and legend
                d3.selectAll("path").classed("selected", false);
                d3.selectAll(".legend li").classed("selected", false);

                // render all searched projects
                renderProjects(filteredProjects, projectsContainer, 'h2');

                // legend adjust for all searched projects
                d3.select(".legend").selectAll("li").remove();
                newData.forEach((d, idx) => {
                    legend.append('li')
                        .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
                        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
                    })
            }
        });
    })

    // clear old legend and update new legend
    let legend = d3.select(".legend");
    legend.selectAll("li").remove();
    newData.forEach((d, idx) => {
        legend.append('li')
            .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
        })
});
///////////////////////////////////////////////////////////////////////////////

// Debugging part
document.querySelectorAll("path").forEach((p) =>
    p.addEventListener("click", () => console.log("Path clicked!")))