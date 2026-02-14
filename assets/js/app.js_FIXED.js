// Application Logic for Cool Mech Service

// --- Global State ---
let currentView = 'dashboard';
let invoiceItems = []; // For temporary invoice creation
let systemSettings = {
    companyName: 'COOL MECH SERVICES',
    address: 'Colombo, Sri Lanka',
    phone: '0773919281',
    email: 'infocoolmech@gmail.com',
    tagline: 'Make your own weather today',
    warrantyText: 'Warranty subject to terms and conditions.',
    logo: '',
    username: 'admin', // Default username
    password: 'password123', // Default password (insecure but local file based)
    theme: 'light', // Theme preference
    profilePhoto: '' // Base64 or URL
};

// --- Initialization ---
// --- Mobile Sidebar Logic ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');

    // Toggle Translate Class
    sidebar.classList.toggle('-translate-x-full');

    // Toggle Overlay
    if (sidebar.classList.contains('-translate-x-full')) {
        overlay.classList.add('hidden');
    } else {
        overlay.classList.remove('hidden');
    }
}

function closeSidebarOnMobile() {
    // Only if on mobile (screen width < 1024px)
    if (window.innerWidth < 1024) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobile-overlay');
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // Load Settings
    try {
        const storedSettings = await db.settings.get('config');
        if (storedSettings) {
            systemSettings = {
                ...systemSettings,
                ...storedSettings
            };
        } else {
            // Initialize default settings
            await db.settings.put({ id: 'config', ...systemSettings });
        }
    } catch (e) {
        console.error("Settings load error", e);
    }

    // Apply Theme
    document.documentElement.setAttribute('data-theme', systemSettings.theme || 'light');

    // Check Auth
    if (sessionStorage.getItem('coolmech_auth') === 'true') {
        initApp();
    } else {
        renderLoginScreen();
    }

    // Close modal when clicking outside
    window.onclick = function (event) {
        const modal = document.getElementById('main-modal');
        if (event.target == modal) {
            closeModal();
        }
    }
});

async function initApp() {
    document.getElementById('login-screen')?.remove();
    document.getElementById('main-app').classList.remove('hidden');

    // Ensure DB is open
    try {
        await db.open();
    } catch (err) {
        console.error("DB Open Failed", err);
    }

    updateLogoDisplay();
    updateProfileDisplay();
    updateDate();
    renderDashboard();

    // Check storage health after a delay
    setTimeout(checkStorageHealth, 2000);
}

async function checkStorageHealth() {
    // Detect if running from local file system
    const isLocalFile = window.location.protocol === 'file:';
    // Bypass alert if we are on GitHub or a real web host
    const isWebhost = window.location.hostname.includes('github.io') || window.location.hostname !== "";

    if (isLocalFile && !isWebhost) {
        const isPersisted = navigator.storage && navigator.storage.persist ? await navigator.storage.persisted() : false;

        if (!isPersisted) {
            openModal("⚠️ Storage Alert (Data Security)", `
                <div class="text-center space-y-4">
                    <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <i class="fa-solid fa-triangle-exclamation text-3xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800">Machan, ekak kiyanna ona!</h3>
                    <p class="text-sm text-gray-600 leading-relaxed">
                        Oya dan me system eka use karanne <b>Local File</b> එකක් විදිහට. Browser එක සමහර වෙලාවට මේවගේ data delete කරනවා. 
                    </p>
                    <div class="bg-blue-50 p-4 rounded-xl text-left border border-blue-100">
                        <p class="text-xs font-bold text-blue-800 uppercase mb-2">Meka wisadanna krama 2i:</p>
                        <ul class="text-xs text-blue-700 space-y-2 list-disc ml-4">
                            <li>System eka <b>GitHub</b> ekata upload karala use karanna (Hama dama data thiyenawa).</li>
                            <li><b>Settings</b> walata gihin sathiye sarayak <b>Backup</b> ekak ganna.</li>
                        </ul>
                    </div>
                    <button onclick="closeModal()" class="btn btn-primary w-full text-white">Harier mama balannam</button>
                </div>
            `);
        }
    }
}
