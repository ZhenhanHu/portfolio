import { fetchJSON, renderProjects } from '../global.js';

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