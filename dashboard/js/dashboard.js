
function initializeDashboard() {
    const currentRole = getCurrentUserRole();
    if (!currentRole) {
        window.location.href = '../index.html'; // Redirect to login if no role
        return;
    }

    populateSidebarNav(currentRole);
    populateUserNav(currentRole);
    setupMobileSidebar();
    setActiveNavLink();

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function populateSidebarNav(role) {
    const sidebarNav = document.getElementById('sidebarNav');
    if (!sidebarNav) return;

    sidebarNav.innerHTML = ''; // Clear existing items

    const links = NAV_LINKS[role] || COMMON_NAV_LINKS;
    links.forEach(link => {
        const li = document.createElement('li');
        li.className = 'sidebar-nav-item';
        
        const a = document.createElement('a');
        a.href = link.href.startsWith('http') ? link.href : `../dashboard/${link.href}`; // Adjust path for dashboard/*
        a.className = 'sidebar-nav-link';
        a.title = link.label;

        if (link.icon) {
            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', link.icon);
            a.appendChild(icon);
        }
        a.appendChild(document.createTextNode(link.label));
        li.appendChild(a);
        sidebarNav.appendChild(li);
    });
}

function populateUserNav(role) {
    const userNavContainer = document.getElementById('userNavContainer');
    if (!userNavContainer) return;

    const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
    const userName = localStorage.getItem('userName') || 'Optimized Lab Management System User';
    const userInitial = userName.charAt(0).toUpperCase() || role.charAt(0).toUpperCase() || 'U';

    userNavContainer.innerHTML = `
        <button class="user-avatar-button" id="userAvatarButton" title="User menu">${userInitial}</button>
        <div class="user-nav-dropdown" id="userNavDropdown">
            <div class="user-nav-label">
                <p>${userName}</p>
                <p>${userEmail} (${role})</p>
            </div>
            <a href="../dashboard/profile.html" class="user-nav-item">
                <i data-lucide="user-circle"></i>
                <span>Profile</span>
            </a>
            <hr class="user-nav-separator">
            <div class="user-nav-item" id="logoutButton" style="color: red;">
                <i data-lucide="log-out"></i>
                <span>Log out</span>
            </div>
        </div>
    `;

    const userAvatarButton = document.getElementById('userAvatarButton');
    const userNavDropdown = document.getElementById('userNavDropdown');
    const logoutButton = document.getElementById('logoutButton');

    userAvatarButton.addEventListener('click', () => {
        userNavDropdown.classList.toggle('open');
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        window.location.href = '../index.html';
    });

    // Close dropdown if clicked outside
    document.addEventListener('click', (event) => {
        if (!userNavContainer.contains(event.target) && userNavDropdown.classList.contains('open')) {
            userNavDropdown.classList.remove('open');
        }
    });
}

function setupMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuButton = document.getElementById('mobileMenuButton');

    if (menuButton && sidebar && overlay) {
        if(isMobile()){
            menuButton.style.display = 'block';
        } else {
            sidebar.classList.add('open'); // Keep open on desktop
            menuButton.style.display = 'none';
        }

        menuButton.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('open');
        });
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        });
    }
     window.addEventListener('resize', () => {
        if (menuButton && sidebar) {
            if (isMobile()) {
                menuButton.style.display = 'block';
                // Ensure sidebar is not forced open if it was closed by user
                if (!sidebar.classList.contains('user-closed-on-mobile')) {
                     // sidebar.classList.remove('open'); // It might be open
                }
            } else {
                menuButton.style.display = 'none';
                sidebar.classList.add('open');
                sidebar.classList.remove('user-closed-on-mobile');
                if (overlay) overlay.classList.remove('open');
            }
        }
    });
}

function setActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop(); // Get the current HTML file name
    const navLinks = document.querySelectorAll('.sidebar-nav-link');
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        if (linkPath === currentPath) {
            link.classList.add('active');
        }
    });
}


// Helper to create feature cards (used on dashboard homepages)
function createFeatureCard(feature) {
    const card = document.createElement('div');
    card.className = 'custom-card text-center'; // Added text-center for overall card alignment
    card.innerHTML = `
        <div class="custom-card-content flex flex-col items-center" style="padding-bottom: 1rem;">
            <i data-lucide="${feature.icon}" style="height: 2.5rem; width: 2.5rem; color: #007BFF; margin-bottom: 0.75rem;"></i>
            <h3 class="custom-card-title" style="font-size: 1.25rem; margin-bottom: 0.5rem;">${feature.title}</h3>
            <p class="text-sm text-muted-foreground mb-4" style="font-size: 0.875rem; color: #4A5568; flex-grow: 1;">${feature.description}</p>
        </div>
        <div class="custom-card-footer" style="padding-top:0; justify-content: center;">
            <a href="${feature.href.startsWith('http') ? feature.href : `../dashboard/${feature.href}`}" class="button button-primary" style="width: auto;">
                ${feature.label}
            </a>
        </div>
    `;
    return card;
}
