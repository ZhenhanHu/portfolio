// Data from projects.json are loaded and rendered
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 4);
const projectsContainer = document.querySelector('.projects');

// check projects
if (latestProjects.length === 0) {
    projectsContainer.innerHTML = "<p>No projects available at the moment.</p>";
} else {
    renderProjects(latestProjects, projectsContainer, 'h3');
}

const githubData = await fetchGitHubData('zhenhanhu');
console.log(githubData);
const profileStats = document.querySelector('#profile-stats');
if (profileStats) {
    profileStats.innerHTML = `
        <h2>My GitHub Stats</h2>
        <div class="stats-container">
            <div class="stat">
                <span class="stat-label">FOLLOWERS</span>
                <span class="stat-value">${githubData.followers}</span>
            </div>
            <div class="stat">
                <span class="stat-label">FOLLOWING</span>
                <span class="stat-value">${githubData.following}</span>
            </div>
            <div class="stat">
                <span class="stat-label">PUBLIC REPOS</span>
                <span class="stat-value">${githubData.public_repos}</span>
            </div>
            <div class="stat">
                <span class="stat-label">PUBLIC GISTS</span>
                <span class="stat-value">${githubData.public_gists}</span>
            </div>
        </div>
    `;
}
