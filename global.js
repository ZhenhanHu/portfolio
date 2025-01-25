console.log('IT’S ALIVE!');

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

const IS_LOCALHOST = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const BASE_PATH = IS_LOCALHOST ? "/" : "/portfolio/";
document.write(`<base href="${BASE_PATH}">`);

let nav = document.createElement('nav');
document.body.prepend(nav); 
const ARE_WE_HOME = document.documentElement.classList.contains('home');

// All pages
let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume' },
    { url: 'contact/', title: 'Contact' },
    { url: 'https://github.com/ZhenhanHu', title: 'GitHub' }
];

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    // Homepage detection
    const ARE_WE_HOME = document.documentElement.classList.contains('home');
    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;

    // Create link
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    // Current page detection
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }

    // Open external links in a new tab
    if (a.host !== location.host) {
        a.target = '_blank';
    }
    nav.append(a);
}

// Color Scheme
document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
        Theme:
        <select>
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>
    `
);

const select = document.querySelector('.color-scheme select');

function setColorScheme(scheme) {
    document.documentElement.style.setProperty('color-scheme', scheme);
    localStorage.colorScheme = scheme;
}
select.addEventListener('input', function (event) {
    setColorScheme(event.target.value);
});

if (localStorage.colorScheme) {
    setColorScheme(localStorage.colorScheme);
    select.value = localStorage.colorScheme;
}

// select.addEventListener('input', (event) => {
//     const selectedScheme = event.target.value;
//     localStorage.colorScheme = selectedScheme;
//     document.documentElement.style.setProperty('color-scheme', event.target.value);
//     console.log('Color scheme changed to', event.target.value);
// });

// Current Page
const navLinks = $$('nav a');
const currentLink = navLinks.find(
    (a) => a.host === location.host && a.pathname === location.pathname
);
currentLink?.classList.add('current');