

function initializeDashboard() {
    const currentRole = getCurrentUserRole();
    if (!currentRole) {
        window.location.href = '../index.html'; 
        return;
    }

    populateSidebarNav(currentRole);
    populateUserNav(currentRole);
    setupMobileSidebar();
    setActiveNavLink();
    setDashboardHomeLink(); 

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function setDashboardHomeLink() {
    const dashboardHomeLink = document.getElementById('dashboardHomeLink');
    if (!dashboardHomeLink) return;

    const role = getCurrentUserRole();
    const homePageMap = {
        [USER_ROLES.ADMIN]: 'admin.html',
        [USER_ROLES.FACULTY]: 'faculty.html',
        [USER_ROLES.STUDENT]: 'student.html',
        [USER_ROLES.ASSISTANT]: 'assistant.html' // Changed from CR
    };
    dashboardHomeLink.href = homePageMap[role] || '../index.html';
}


function populateSidebarNav(role) {
    const sidebarNav = document.getElementById('sidebarNav');
    if (!sidebarNav) return;

    sidebarNav.innerHTML = ''; 

    const links = NAV_LINKS[role] || COMMON_NAV_LINKS;
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
}

function populateUserNav(role) {
    const userNavContainer = document.getElementById('userNavContainer');
    if (!userNavContainer) return;

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
    if (window.lucide) {
        window.lucide.createIcons();
    }

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

    document.addEventListener('click', (event) => {
        if (userNavDropdown && !userNavContainer.contains(event.target) && userNavDropdown.classList.contains('open')) {
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
    }
     window.addEventListener('resize', () => {
        if (menuButton && sidebar && overlay) {
            if (isMobile()) {
                menuButton.style.display = 'block';
            } else { 
                menuButton.style.display = 'none';
                sidebar.classList.add('open');
                overlay.classList.remove('open');
            }
        }
    });
}

function setActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop(); 
    const navLinks = document.querySelectorAll('.sidebar-nav-link');
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
