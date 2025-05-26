
function initializeDashboard() {
    console.log('[dashboard.js] Initializing dashboard...');

    if (typeof window.API_BASE_URL === 'undefined' || typeof window.USER_ROLES === 'undefined' || typeof window.NAV_LINKS === 'undefined') {
        console.error('[dashboard.js] CRITICAL ERROR: API_BASE_URL, USER_ROLES, or NAV_LINKS not defined. constants.js might not have loaded correctly or has errors.');
        alert('Critical application error: Dashboard configuration missing. Please contact support. (dashboard.js)');
        // Potentially redirect to login or show a static error message
        // window.location.href = '../index.html'; // Avoid redirect if this script itself is on login page somehow
        const pageContent = document.querySelector('.page-content') || document.body;
        if (pageContent) {
            pageContent.innerHTML = '<div class="custom-card p-6 text-center"><h1 class="custom-card-title text-2xl text-red-600">Application Error</h1><p class="text-muted-foreground mt-2">Dashboard cannot be loaded due to a configuration issue. Please try again later or contact support.</p></div>';
        }
        return; // Halt further execution
    }
    console.log('[dashboard.js] API_BASE_URL:', window.API_BASE_URL);
    console.log('[dashboard.js] USER_ROLES:', window.USER_ROLES);
    console.log('[dashboard.js] NAV_LINKS:', window.NAV_LINKS);


    const currentRole = getCurrentUserRole();
    console.log('[dashboard.js] Current user role from localStorage:', currentRole);

    if (!currentRole) {
        console.log('[dashboard.js] No role found in initializeDashboard, redirecting to login.');
        window.location.href = '../index.html'; 
        return;
    }

    populateSidebarNav(currentRole);
    populateUserNav(currentRole);
    setupMobileSidebar();
    setActiveNavLink();
    setDashboardHomeLink(); 

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        console.log('[dashboard.js] Calling lucide.createIcons() at the end of initializeDashboard.');
        window.lucide.createIcons();
    } else {
        console.warn('[dashboard.js] Lucide library not found or createIcons not a function on window.');
    }
}

function setDashboardHomeLink() {
    const dashboardHomeLink = document.getElementById('dashboardHomeLink');
    if (!dashboardHomeLink) {
        console.warn('[dashboard.js] dashboardHomeLink element not found.');
        return;
    }

    const role = getCurrentUserRole();
    if (!role || !window.USER_ROLES) { 
        console.warn('[dashboard.js] Cannot set home link: role or window.USER_ROLES missing.');
        dashboardHomeLink.href = '../index.html'; 
        return;
    }
    const homePageMap = {
        [window.USER_ROLES.ADMIN]: 'admin.html',
        [window.USER_ROLES.FACULTY]: 'faculty.html',
        [window.USER_ROLES.STUDENT]: 'student.html',
        [window.USER_ROLES.ASSISTANT]: 'assistant.html'
    };
    dashboardHomeLink.href = homePageMap[role] || '../index.html';
    console.log(`[dashboard.js] Dashboard home link set to: ${dashboardHomeLink.href}`);
}


function populateSidebarNav(role) {
    const sidebarNav = document.getElementById('sidebarNav');
    if (!sidebarNav) {
        console.warn('[dashboard.js] sidebarNav element not found.');
        return;
    }

    sidebarNav.innerHTML = ''; 
    console.log(`[dashboard.js] Populating sidebar for role: ${role}`);

    const links = window.NAV_LINKS[role] || []; 
    if (links.length === 0) {
        console.warn(`[dashboard.js] No NAV_LINKS found for role: ${role}`);
    }
    
    links.forEach(link => {
        const li = document.createElement('li');
        li.className = 'sidebar-nav-item';
        
        const a = document.createElement('a');
        a.href = link.href.startsWith('http') ? link.href : `${link.href}`; 
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

    if (window.COMMON_NAV_LINKS && window.COMMON_NAV_LINKS.length > 0) {
        console.log('[dashboard.js] Adding COMMON_NAV_LINKS to sidebar.');
        window.COMMON_NAV_LINKS.forEach(link => {
            const li = document.createElement('li');
            li.className = 'sidebar-nav-item';
            
            const a = document.createElement('a');
            a.href = link.href.startsWith('http') ? link.href : `${link.href}`;
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
    console.log('[dashboard.js] Sidebar navigation populated.');
}

function populateUserNav(role) {
    const userNavContainer = document.getElementById('userNavContainer');
    if (!userNavContainer) {
        console.warn('[dashboard.js] userNavContainer element not found.');
        return;
    }
    console.log(`[dashboard.js] Populating user navigation for role: ${role}`);

    const email = localStorage.getItem('userEmail') || 'user@example.com';
    const name = localStorage.getItem('userName') || email.split('@')[0] || role; 
    const userInitial = name.charAt(0).toUpperCase();

    userNavContainer.innerHTML = `
        <button type="button" class="user-avatar-button" id="userAvatarButton" title="User menu">${userInitial}</button>
        <div class="user-nav-dropdown" id="userNavDropdown">
            <div class="user-nav-label">
                <p>${name}</p>
                <p>${email} (${role})</p>
            </div>
            <a href="profile.html" class="user-nav-item"> 
                <i data-lucide="user-circle"></i>
                <span>Profile</span>
            </a>
            <hr class="user-nav-separator">
            <div class="user-nav-item" id="logoutButton" style="color: red; cursor: pointer;">
                <i data-lucide="log-out"></i>
                <span>Log out</span>
            </div>
        </div>
    `;
    
    const userAvatarButton = document.getElementById('userAvatarButton');
    const userNavDropdown = document.getElementById('userNavDropdown');
    const logoutButton = document.getElementById('logoutButton');

    if (userAvatarButton && userNavDropdown) {
        userAvatarButton.addEventListener('click', (e) => {
            e.stopPropagation(); 
            userNavDropdown.classList.toggle('open');
        });
    } else {
        console.warn('[dashboard.js] User avatar button or dropdown not found for event listener attachment.');
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            console.log('[dashboard.js] Logout button clicked.');
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userId');
            localStorage.removeItem('userDepartment');
            window.location.href = '../index.html'; 
        });
    } else {
         console.warn('[dashboard.js] Logout button not found.');
    }

    document.addEventListener('click', (event) => {
        if (userNavDropdown && userNavContainer && !userNavContainer.contains(event.target) && userNavDropdown.classList.contains('open')) {
            userNavDropdown.classList.remove('open');
        }
    });
    console.log('[dashboard.js] User navigation populated and event listeners attached.');
}

function setupMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuButton = document.getElementById('mobileMenuButton');

    if (menuButton && sidebar && overlay) {
        console.log('[dashboard.js] Setting up mobile sidebar.');
        if(isMobile()){
            menuButton.style.display = 'block';
            sidebar.classList.remove('open'); 
            overlay.classList.remove('open');
        } else {
            sidebar.classList.add('open'); 
            menuButton.style.display = 'none';
        }

        menuButton.addEventListener('click', (e) => {
            e.stopPropagation(); 
            sidebar.classList.toggle('open');
            overlay.classList.toggle('open');
        });
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        });

        window.addEventListener('resize', () => {
            if (isMobile()) {
                menuButton.style.display = 'block';
            } else { 
                menuButton.style.display = 'none';
                sidebar.classList.add('open'); 
                overlay.classList.remove('open'); 
            }
        });
        console.log('[dashboard.js] Mobile sidebar setup complete.');
    } else {
        console.warn('[dashboard.js] Mobile sidebar elements (button, sidebar, or overlay) not all found.');
    }
}

function setActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop(); 
    const navLinks = document.querySelectorAll('.sidebar-nav-link');
    console.log(`[dashboard.js] Setting active nav link for path: ${currentPath}`);
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function createFeatureCard(feature) {
    const card = document.createElement('div');
    card.className = 'custom-card text-center'; 
    card.innerHTML = `
        <div class="custom-card-content flex flex-col items-center" style="padding-bottom: 1rem;">
            <i data-lucide="${feature.icon}" style="height: 2.5rem; width: 2.5rem; color: #14997A; margin-bottom: 0.75rem;"></i>
            <h3 class="custom-card-title" style="font-size: 1.25rem; margin-bottom: 0.5rem;">${feature.title}</h3>
            <p class="text-sm text-muted-foreground mb-4" style="font-size: 0.875rem; color: #6B7A88; flex-grow: 1;">${feature.description}</p>
        </div>
        <div class="custom-card-footer" style="padding-top:0; justify-content: center;">
            <a href="${feature.href.startsWith('http') ? feature.href : `${feature.href}`}" class="button button-primary" style="width: auto;">
                ${feature.label}
            </a>
        </div>
    `;
    return card;
}
