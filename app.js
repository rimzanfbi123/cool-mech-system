
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

function renderLoginScreen() {
    document.getElementById('main-app').classList.add('hidden');

    const loginDiv = document.createElement('div');
    loginDiv.id = 'login-screen';
    loginDiv.className = 'fixed inset-0 bg-gray-100 flex items-center justify-center z-50 animate-fade-in';

    loginDiv.innerHTML = `
        <div class="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 text-center">
            <div class="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <i class="fa-solid fa-lock text-4xl"></i>
            </div>
            <h2 class="text-3xl font-black text-gray-800 mb-2 uppercase tracking-tight">Secure Login</h2>
            <p class="text-gray-400 text-sm mb-8 font-medium">System Secured</p>
            
            <form onsubmit="handleLogin(event)" class="space-y-5">
                <div class="form-control text-left">
                    <label class="label text-xs font-bold text-gray-400 uppercase ml-1">Username</label>
                    <input type="text" id="login-user" class="input input-bordered w-full bg-gray-50 focus:bg-white transition-all font-bold" required>
                </div>
                <div class="form-control text-left">
                    <label class="label text-xs font-bold text-gray-400 uppercase ml-1">Password</label>
                    <input type="password" id="login-pass" class="input input-bordered w-full bg-gray-50 focus:bg-white transition-all font-bold" required>
                </div>
                <button type="submit" class="btn btn-primary w-full text-white font-black text-lg h-14 mt-4 shadow-xl shadow-blue-100">
                    Log In <i class="fa-solid fa-arrow-right ml-2"></i>
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(loginDiv);
}

function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    if (user === systemSettings.username && pass === systemSettings.password) {
        sessionStorage.setItem('coolmech_auth', 'true');
        initApp();
    } else {
        alert("Machan, password eka hari na wage. Aayith balanna!");
    }
}

function logout() {
    sessionStorage.removeItem('coolmech_auth');
    location.reload();
}

function toggleTheme() {
    systemSettings.theme = systemSettings.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', systemSettings.theme);
    db.settings.put({ id: 'config', ...systemSettings });
}

function updateLogoDisplay() {
    const sidebarLogo = document.getElementById('sidebar-logo-container');
    if (systemSettings.logo) {
        sidebarLogo.innerHTML = `<img src="${systemSettings.logo}" class="max-h-16 mx-auto mb-2 rounded-lg shadow-sm">`;
    } else {
        sidebarLogo.innerHTML = '';
    }
}

function updateProfileDisplay() {
    const profile = document.getElementById('sidebar-profile');
    profile.innerHTML = `
        <div class="px-6 py-4 flex items-center gap-4 bg-gray-50/50 border-y border-gray-100/50 mb-2">
            <div class="avatar">
                <div class="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                    ${systemSettings.profilePhoto ? `<img src="${systemSettings.profilePhoto}">` : `<i class="fa-solid fa-user-tie text-xl"></i>`}
                </div>
            </div>
            <div class="overflow-hidden">
                <p class="font-bold text-gray-800 truncate">${systemSettings.username}</p>
                <p class="text-[10px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1">
                    <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                </p>
            </div>
        </div>
    `;
}

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').innerText = new Date().toLocaleDateString(undefined, options);
}

// --- Navigation ---
function setActiveNav(id) {
    // UI Update
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
        el.classList.add('text-gray-600');
    });
    const activeEl = document.getElementById(id);
    if (activeEl) {
        activeEl.classList.remove('text-gray-600');
        activeEl.classList.add('bg-blue-600', 'text-white', 'shadow-md');
    }
}

// --- Dashboard Component ---
async function renderDashboard() {
    setActiveNav('nav-dashboard');
    document.getElementById('page-title').innerText = 'Dashboard Overview';
    const content = document.getElementById('app-content');

    const customers = await db.customers.toArray();
    const invoices = await db.invoices.toArray();
    const services = await db.services.toArray();
    const expenses = await db.expenses.toArray();

    const revenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const pendingInvoices = invoices.filter(inv => inv.status === 'Pending').length;
    const lowStock = services.filter(s => s.inventory <= 5);

    content.innerHTML = `
        <div class="animate-fade-in space-y-8">
            <!-- Summary Stats -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="stat glass-card p-6 border-b-4 border-blue-500">
                    <div class="stat-figure text-blue-500">
                        <i class="fa-solid fa-wallet text-3xl"></i>
                    </div>
                    <div class="stat-title text-gray-500 font-medium">Total Revenue</div>
                    <div class="stat-value text-gray-800 text-3xl font-bold">LKR ${revenue.toLocaleString()}</div>
                    <div class="stat-desc text-green-500 font-bold">↑ 12% vs last month</div>
                </div>

                <div class="stat glass-card p-6 border-b-4 border-orange-500">
                    <div class="stat-figure text-orange-500">
                        <i class="fa-solid fa-clock-rotate-left text-3xl"></i>
                    </div>
                    <div class="stat-title text-gray-500 font-medium">Pending Invoices</div>
                    <div class="stat-value text-gray-800 text-3xl font-bold">${pendingInvoices}</div>
                    <div class="stat-desc text-orange-500 font-bold">${pendingInvoices > 0 ? 'Needs attention' : 'All clear'}</div>
                </div>

                <div class="stat glass-card p-6 border-b-4 border-green-500">
                    <div class="stat-figure text-green-500">
                        <i class="fa-solid fa-users text-3xl"></i>
                    </div>
                    <div class="stat-title text-gray-500 font-medium">Total Customers</div>
                    <div class="stat-value text-gray-800 text-3xl font-bold">${customers.length}</div>
                    <div class="stat-desc text-gray-400">Manage directory</div>
                </div>

                 <div class="stat glass-card p-6 ${lowStock.length > 0 ? 'bg-red-50 border-red-200 border-b-4 border-red-500' : 'border-b-4 border-purple-500'}">
                    <div class="stat-figure text-purple-500">
                        <i class="fa-solid fa-boxes-stacked text-3xl"></i>
                    </div>
                    <div class="stat-title text-gray-500 font-medium">Inventory Alerts</div>
                    <div class="stat-value text-gray-800 text-3xl font-bold">${lowStock.length}</div>
                    <div class="stat-desc text-red-500 font-bold">${lowStock.length > 0 ? 'Low Stock Items!' : 'All good'}</div>
                </div>
            </div>

            <!-- Storage Health Bar -->
            <div id="storage-health-bar"></div>

            <!-- Recent Activity Section -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="glass-card p-6 lg:col-span-2">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <i class="fa-solid fa-receipt text-blue-500"></i> Recent Invoices
                        </h3>
                        <button onclick="renderInvoices()" class="btn btn-ghost btn-xs text-blue-500">View All</button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="table w-full">
                            <thead>
                                <tr class="text-gray-400 border-b border-gray-100 uppercase text-[10px]">
                                    <th class="bg-transparent font-black">Invoice #</th>
                                    <th class="bg-transparent font-black">Customer</th>
                                    <th class="bg-transparent font-black">Amount</th>
                                    <th class="bg-transparent font-black text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody class="text-sm font-medium">
                                ${invoices.slice(-5).reverse().map(inv => `
                                    <tr class="hover:bg-gray-50 transition-colors border-b border-gray-50">
                                        <td><span class="font-black text-gray-400">INV-${inv.id}</span></td>
                                        <td>${inv.customerName}</td>
                                        <td class="font-bold">LKR ${inv.total.toLocaleString()}</td>
                                        <td class="text-center">
                                            <span class="badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'} badge-sm text-[10px] font-black">${inv.status}</span>
                                        </td>
                                    </tr>
                                `).join('')}
                                ${invoices.length === 0 ? '<tr><td colspan="4" class="text-center py-8 text-gray-400">No invoices found. Add your first one!</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="glass-card p-6 bg-blue-600 text-white shadow-xl shadow-blue-200">
                    <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
                        <i class="fa-solid fa-bolt-lightning text-yellow-300 animate-pulse"></i> Quick Actions
                    </h3>
                    <div class="space-y-3">
                        <button onclick="renderCreateInvoice()" class="btn border-none bg-white text-blue-600 hover:bg-gray-100 w-full justify-start gap-4 h-14">
                            <i class="fa-solid fa-plus-circle text-xl"></i>
                            <div class="text-left">
                                <div class="font-bold">Create Invoice</div>
                                <div class="text-[10px] opacity-70">Add a new job entry</div>
                            </div>
                        </button>
                        <button onclick="openAddCustomerModal()" class="btn border-none bg-blue-500 text-white hover:bg-blue-400 w-full justify-start gap-4 h-14">
                            <i class="fa-solid fa-user-plus text-xl"></i>
                             <div class="text-left">
                                <div class="font-bold">Add Customer</div>
                                <div class="text-[10px] opacity-70">New business lead</div>
                            </div>
                        </button>
                         <button onclick="renderReports()" class="btn border-none bg-blue-500 text-white hover:bg-blue-400 w-full justify-start gap-4 h-14">
                            <i class="fa-solid fa-file-export text-xl"></i>
                             <div class="text-left">
                                <div class="font-bold">Summary Report</div>
                                <div class="text-[10px] opacity-70">Weekly profit check</div>
                            </div>
                        </button>
                        <button onclick="logout()" class="btn btn-ghost btn-sm w-full font-bold opacity-60 hover:opacity-100 mt-4 underline decoration-2">Sign Out</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- Customer Component ---
async function renderCustomers() {
    setActiveNav('nav-customers');
    document.getElementById('page-title').innerText = 'Customer Directory';
    const content = document.getElementById('app-content');
    const customers = await db.customers.toArray();

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div class="relative w-full max-w-xs">
                    <i class="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input type="text" placeholder="Search customers..." class="input input-bordered w-full pl-12 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500/50">
                </div>
                <button onclick="openAddCustomerModal()" class="btn btn-primary text-white gap-2 font-black shadow-lg shadow-blue-100">
                    <i class="fa-solid fa-plus font-black"></i> New Customer
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${customers.map(c => `
                    <div class="glass-card p-6 border-l-4 border-blue-500 hover:scale-[1.02] transition-transform duration-300">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xl shadow-sm uppercase">
                                ${c.name.charAt(0)}
                            </div>
                            <div class="dropdown dropdown-end">
                                <label tabindex="0" class="btn btn-ghost btn-circle btn-sm"><i class="fa-solid fa-ellipsis-vertical"></i></label>
                                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-100 rounded-box w-52 border border-gray-100">
                                    <li><a onclick="editCustomer(${c.id})"><i class="fa-solid fa-pen text-blue-500"></i> Edit Details</a></li>
                                    <li><a onclick="openMessageModal('${c.name}', '${c.phone}')"><i class="fa-solid fa-message text-green-500"></i> Send SMS</a></li>
                                    <li><a onclick="deleteCustomer(${c.id})" class="text-red-500 font-black"><i class="fa-solid fa-trash"></i> Remove Customer</a></li>
                                </ul>
                            </div>
                        </div>

                        <h3 class="text-lg font-black text-gray-800 mb-1">${c.name}</h3>
                        <div class="space-y-1 text-sm font-medium text-gray-500">
                            <p class="flex items-center gap-2"><i class="fa-solid fa-phone text-blue-400 text-xs"></i> ${c.phone}</p>
                            <p class="flex items-center gap-2 truncate"><i class="fa-solid fa-envelope text-blue-400 text-xs"></i> ${c.email || 'No email'}</p>
                            <p class="flex items-center gap-2 truncate text-xs"><i class="fa-solid fa-location-dot text-blue-400 text-[10px]"></i> ${c.address}</p>
                        </div>

                        <div class="mt-6 flex gap-2">
                            <a href="tel:${c.phone}" class="btn btn-outline btn-sm flex-1 rounded-lg gap-2 font-bold hover:bg-blue-600 hover:border-blue-600"><i class="fa-solid fa-phone"></i> Call</a>
                            <button onclick="openMessageModal('${c.name}', '${c.phone}')" class="btn btn-primary btn-sm flex-1 rounded-lg gap-2 text-white font-bold"><i class="fa-solid fa-paper-plane"></i> SMS</button>
                        </div>
                    </div>
                `).join('')}
                 ${customers.length === 0 ? `
                    <div class="col-span-full py-20 text-center">
                        <div class="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                             <i class="fa-solid fa-user-slash text-3xl"></i>
                        </div>
                        <p class="text-gray-400 font-bold uppercase tracking-widest text-sm">No Customers Found</p>
                        <p class="text-gray-300 text-xs">Click the blue button above to add a business lead.</p>
                    </div>` : ''}
            </div>
        </div>
    `;
}

// --- Customer CRUD ---
function openAddCustomerModal() {
    openModal('New Business Lead', `
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Full Name</span></label>
            <input type="text" id="cust-name" placeholder="Machan's Name" class="input input-bordered w-full" />
        </div>
        <div class="flex gap-4">
             <div class="form-control w-1/2">
                <label class="label"><span class="label-text">Phone Number</span></label>
                <input type="text" id="cust-phone" placeholder="071..." class="input input-bordered w-full" />
            </div>
            <div class="form-control w-1/2">
                <label class="label"><span class="label-text">Email (Optional)</span></label>
                <input type="email" id="cust-email" placeholder="example@gmail.com" class="input input-bordered w-full" />
            </div>
        </div>
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Address</span></label>
            <textarea id="cust-address" class="textarea textarea-bordered" placeholder="Colombo..."></textarea>
        </div>
    `, 'saveCustomer()');
}

async function saveCustomer() {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const email = document.getElementById('cust-email').value;
    const address = document.getElementById('cust-address').value;

    if (!name || !phone) return alert("Required fields missing");

    await db.customers.add({ name, phone, email, address });
    closeModal();
    renderCustomers();
}

async function deleteCustomer(id) {
    if (confirm('Meka delete karannada? Sure da?')) {
        await db.customers.delete(id);
        renderCustomers();
    }
}

// --- Communication Logic ---
async function logCommunication(type, targetName, targetContact, details = '') {
    await db.logs.add({
        type: type,
        target: targetName,
        contact: targetContact,
        details: details,
        date: new Date().toISOString()
    });
}

function openMessageModal(name, phone) {
    const template = `Hello ${name}, me COOL MECH eken katha karanne. Oyage service eka gana kiyanna...`;
    openModal('Send Quick Message', `
        <div class="space-y-4">
            <div class="form-control">
                <label class="label text-xs font-bold text-gray-400 uppercase">To: ${name}</label>
                <input type="text" disabled value="${phone}" class="input input-bordered opacity-60">
            </div>
            <div class="form-control">
                <label class="label text-xs font-bold text-gray-400 uppercase">Message Content</label>
                <textarea id="sms-body" class="textarea textarea-bordered h-32 font-bold">${template}</textarea>
            </div>
        </div>
    `, `sendSMS('${phone}')`);
}

function sendSMS(phone) {
    const body = document.getElementById('sms-body').value;
    const url = `sms:${phone}?body=${encodeURIComponent(body)}`;
    logCommunication('sms', 'Customer', phone, body);
    window.location.href = url;
    closeModal();
}

// --- Service & Stock Component ---
async function renderServices() {
    setActiveNav('nav-services');
    document.getElementById('page-title').innerText = 'Stock & Services';
    const content = document.getElementById('app-content');
    const services = await db.services.toArray();

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                 <div class="flex gap-2">
                    <span class="badge badge-info h-8 font-bold px-4 uppercase text-[10px]">All Parts: ${services.length}</span>
                    <span class="badge badge-error h-8 font-bold px-4 uppercase text-[10px]">Restock Needed: ${services.filter(s => s.inventory <= 5).length}</span>
                 </div>
                <button onclick="openAddServiceModal()" class="btn btn-primary text-white gap-2 font-black shadow-lg shadow-blue-100">
                    <i class="fa-solid fa-plus font-black"></i> Add Stock/Service
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${services.map(s => `
                    <div class="glass-card overflow-hidden group hover:border-blue-400 transition-colors">
                        <div class="p-5">
                            <div class="flex justify-between items-start mb-4">
                                <div class="badge ${s.inventory > 5 ? 'badge-success' : 'badge-error'} badge-sm rounded uppercase text-[10px] font-black h-6 px-3">
                                    ${s.inventory > 5 ? 'In Stock' : 'Low Stock'}
                                </div>
                                <div class="dropdown dropdown-end">
                                    <label tabindex="0" class="btn btn-ghost btn-circle btn-xs opacity-40 group-hover:opacity-100"><i class="fa-solid fa-ellipsis-vertical"></i></label>
                                    <ul tabindex="0" class="dropdown-content z-[2] menu p-2 shadow-2xl bg-base-100 rounded-box w-40 border border-gray-100">
                                        <li><a onclick="editService(${s.id})"><i class="fa-solid fa-pen text-blue-500"></i> Edit</a></li>
                                        <li><a onclick="deleteService(${s.id})" class="text-red-500 font-bold"><i class="fa-solid fa-trash"></i> Delete</a></li>
                                    </ul>
                                </div>
                            </div>
                            <h3 class="font-black text-gray-800 text-lg mb-1 truncate">${s.name}</h3>
                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">${s.type}</p>
                            
                            <div class="flex justify-between items-end border-t pt-4 border-gray-50">
                                <div>
                                    <p class="text-[10px] text-gray-400 font-black uppercase">Service Price</p>
                                    <p class="text-xl font-black text-blue-600 leading-none">LKR ${s.price.toLocaleString()}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-[10px] text-gray-400 font-black uppercase">Qty</p>
                                    <p class="text-xl font-black text-gray-800 leading-none">${s.inventory}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
                ${services.length === 0 ? '<div class="col-span-full py-10 text-center text-gray-400">Inventory eka empty machan. Parts add karala patan ganna.</div>' : ''}
            </div>
        </div>
    `;
}

function openAddServiceModal() {
    openModal('Stock / Service Item', `
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Item/Service Name</span></label>
            <input type="text" id="svc-name" placeholder="e.g. Capacitor 25uF" class="input input-bordered w-full" />
        </div>
        <div class="flex gap-4">
             <div class="form-control w-1/2">
                <label class="label"><span class="label-text">Type</span></label>
                <select id="svc-type" class="select select-bordered">
                    <option>Part / Inventory</option>
                    <option>Repair / Labour</option>
                    <option>Transportation</option>
                    <option>Other</option>
                </select>
            </div>
            <div class="form-control w-1/2">
                <label class="label"><span class="label-text">Price (LKR)</span></label>
                <input type="number" id="svc-price" class="input input-bordered" />
            </div>
        </div>
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Quantity (Inventory Only)</span></label>
            <input type="number" id="svc-inv" value="0" class="input input-bordered" />
        </div>
    `, 'saveService()');
}

async function saveService() {
    const name = document.getElementById('svc-name').value;
    const type = document.getElementById('svc-type').value;
    const price = parseFloat(document.getElementById('svc-price').value);
    const inventory = parseInt(document.getElementById('svc-inv').value);

    if (!name || isNaN(price)) return alert("Fields missing");

    await db.services.add({ name, type, price, inventory });
    closeModal();
    renderServices();
}

async function deleteService(id) {
    if (confirm('Meka ain karannada?')) {
        await db.services.delete(id);
        renderServices();
    }
}

// --- Invoice Components ---
async function renderInvoices() {
    setActiveNav('nav-invoices');
    document.getElementById('page-title').innerText = 'Invoices & Quotes';
    const content = document.getElementById('app-content');
    const invoices = await db.invoices.toArray();

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div class="flex gap-4">
                     <button onclick="renderCreateInvoice()" class="btn btn-primary text-white gap-2 font-black shadow-lg shadow-blue-100">
                        <i class="fa-solid fa-file-invoice"></i> Create New
                    </button>
                </div>
            </div>

            <div class="glass-card overflow-hidden">
                <table class="table w-full">
                    <thead>
                        <tr class="text-gray-400 border-b border-gray-100 uppercase text-[10px]">
                            <th class="bg-transparent py-4 font-black">ID</th>
                            <th class="bg-transparent py-4 font-black">Date</th>
                            <th class="bg-transparent py-4 font-black">Customer</th>
                            <th class="bg-transparent py-4 font-black">Total</th>
                            <th class="bg-transparent py-4 font-black">Status</th>
                            <th class="bg-transparent py-4 font-black text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm font-medium">
                        ${invoices.reverse().map(inv => `
                            <tr class="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                                <td class="font-black text-gray-400">INV-${inv.id}</td>
                                <td>${new Date(inv.date).toLocaleDateString()}</td>
                                <td class="font-bold text-gray-800">${inv.customerName}</td>
                                <td class="text-blue-600 font-black">LKR ${inv.total.toLocaleString()}</td>
                                <td><span class="badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'} badge-sm font-black text-[10px]">${inv.status}</span></td>
                                <td class="text-right flex justify-end gap-2">
                                    <button onclick="printInvoice(${inv.id})" class="btn btn-ghost btn-xs text-blue-500"><i class="fa-solid fa-print"></i></button>
                                    <button onclick="deleteInvoice(${inv.id})" class="btn btn-ghost btn-xs text-red-500"><i class="fa-solid fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                        ${invoices.length === 0 ? '<tr><td colspan="6" class="text-center py-20 text-gray-400 italic uppercase tracking-widest font-black">No invoices yet</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function renderCreateInvoice() {
    setActiveNav('nav-invoices');
    document.getElementById('page-title').innerText = 'New Invoice';
    const content = document.getElementById('app-content');
    const customers = await db.customers.toArray();
    const services = await db.services.toArray();
    invoiceItems = [];

    content.innerHTML = `
        <div class="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
                <!-- Step 1: Customer & Details -->
                <div class="glass-card p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <i class="fa-solid fa-1 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"></i> Customer Details
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-control">
                            <label class="label text-xs font-bold uppercase text-gray-400">Select Customer</label>
                            <select id="inv-cust" class="select select-bordered w-full font-bold">
                                <option disabled selected>Viyaparakayage nama thoranna</option>
                                ${customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label text-xs font-bold uppercase text-gray-400">Job Description</label>
                            <input type="text" id="inv-desc" placeholder="e.g. AC Repair & Service" class="input input-bordered w-full">
                        </div>
                    </div>
                </div>

                <!-- Step 2: Line Items -->
                <div class="glass-card p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <i class="fa-solid fa-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"></i> Line Items
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-xl">
                        <div class="form-control">
                             <label class="label text-xs font-bold uppercase text-gray-400">Select Item/Part</label>
                            <select id="item-select" class="select select-bordered w-full">
                                <option disabled selected>Item ekak thoranna</option>
                                ${services.map(s => `<option value="${s.id}">${s.name} - LKR ${s.price}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label text-xs font-bold uppercase text-gray-400">Quantity</label>
                            <input type="number" id="item-qty" value="1" class="input input-bordered font-bold">
                        </div>
                        <div class="form-control self-end">
                            <button onclick="addInvoiceItem()" class="btn btn-primary text-white font-black">Add Item</button>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="table w-full">
                            <thead>
                                <tr class="text-gray-400 border-b border-gray-100 uppercase text-[10px]">
                                    <th class="bg-transparent font-black">Description</th>
                                    <th class="bg-transparent font-black">Price</th>
                                    <th class="bg-transparent font-black">Qty</th>
                                    <th class="bg-transparent font-black">Subtotal</th>
                                    <th class="bg-transparent font-black"></th>
                                </tr>
                            </thead>
                            <tbody id="invoice-items-body" class="text-sm font-medium">
                                <!-- Dynamic Items -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                 <div class="glass-card p-6 bg-blue-600 text-white shadow-xl shadow-blue-100">
                    <h3 class="text-xl font-bold mb-6">Invoice Summary</h3>
                    <div class="space-y-4 border-b border-blue-400/50 pb-4 mb-4">
                        <div class="flex justify-between">
                            <span class="opacity-70 font-medium">Subtotal</span>
                            <span id="summary-subtotal" class="font-bold">LKR 0</span>
                        </div>
                         <div class="flex justify-between">
                            <span class="opacity-70 font-medium">Tax/Other</span>
                            <span class="font-bold">LKR 0</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center mb-8">
                        <span class="text-sm font-black uppercase tracking-widest text-blue-200">Grand Total</span>
                        <span id="summary-total" class="text-3xl font-black">LKR 0</span>
                    </div>

                    <div class="form-control mb-6">
                         <label class="label cursor-pointer justify-start gap-4">
                            <input type="checkbox" id="inv-paid" class="checkbox checkbox-white border-2 border-white/50" />
                            <span class="label-text text-white font-bold">Mark as Fully Paid</span>
                        </label>
                    </div>

                    <button onclick="saveInvoice()" class="btn bg-white text-blue-600 border-none hover:bg-gray-100 w-full h-14 text-lg font-black shadow-xl shadow-blue-800/20">
                        Generate Invoice <i class="fa-solid fa-check-circle ml-2"></i>
                    </button>
                </div>

                <button onclick="renderInvoices()" class="btn btn-ghost w-full font-bold opacity-60">Cancel & Go Back</button>
            </div>
        </div>
    `;
}

async function addInvoiceItem() {
    const serviceId = parseInt(document.getElementById('item-select').value);
    const qty = parseInt(document.getElementById('item-qty').value);

    if (isNaN(serviceId)) return alert("Item ekak thoranna machan.");

    const service = await db.services.get(serviceId);
    if (!service) return;

    invoiceItems.push({
        serviceId: service.id,
        name: service.name,
        price: service.price,
        qty: qty,
        subtotal: service.price * qty
    });

    updateInvoicePreview();
}

function removeInvoiceItem(index) {
    invoiceItems.splice(index, 1);
    updateInvoicePreview();
}

function updateInvoicePreview() {
    const body = document.getElementById('invoice-items-body');
    const subtotalDisplay = document.getElementById('summary-subtotal');
    const totalDisplay = document.getElementById('summary-total');

    let total = 0;
    body.innerHTML = invoiceItems.map((item, index) => {
        total += item.subtotal;
        return `
            <tr class="border-b border-gray-50">
                <td class="font-bold text-gray-800">${item.name}</td>
                <td>LKR ${item.price.toLocaleString()}</td>
                <td><span class="badge badge-ghost font-black border-none">${item.qty}</span></td>
                <td class="font-bold">LKR ${item.subtotal.toLocaleString()}</td>
                <td class="text-right">
                    <button onclick="removeInvoiceItem(${index})" class="btn btn-ghost btn-xs text-red-500"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    subtotalDisplay.innerText = `LKR ${total.toLocaleString()}`;
    totalDisplay.innerText = `LKR ${total.toLocaleString()}`;
}

async function saveInvoice() {
    const customerId = parseInt(document.getElementById('inv-cust').value);
    const description = document.getElementById('inv-desc').value;
    const isPaid = document.getElementById('inv-paid').checked;

    if (isNaN(customerId)) return alert("Viyaparakayage nama thoranna machan.");
    if (invoiceItems.length === 0) return alert("Item ekak wath nathuwa bill ekak gahanna ba machan.");

    const customer = await db.customers.get(customerId);
    const total = invoiceItems.reduce((sum, item) => sum + item.subtotal, 0);

    const invoiceId = await db.invoices.add({
        customerId,
        customerName: customer.name,
        jobDescription: description,
        items: invoiceItems,
        total,
        status: isPaid ? 'Paid' : 'Pending',
        date: new Date().toISOString()
    });

    alert("Invoice Successfully Created! ✅");
    renderInvoices();
}

async function printInvoice(id) {
    const invoice = await db.invoices.get(id);
    if (!invoice) return;

    const printWindow = window.open('', '_blank');
    const docTitle = (invoice.status === 'Paid') ? 'INVOICE' : 'QUOTATION';

    printWindow.document.write(`
        <html>
        <head>
            <title>${docTitle} - ${invoice.id}</title>
            <link href="https://cdn.jsdelivr.net/npm/daisyui@3.9.4/dist/full.css" rel="stylesheet" type="text/css" />
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                @media print {
                    .no-print { display: none; }
                    body { font-size: 12px; }
                }
            </style>
        </head>
        <body class="p-10 bg-white">
            <div class="max-w-4xl mx-auto border p-8 rounded-lg shadow-sm">
                <div class="flex justify-between items-start mb-10 pb-10 border-b">
                    <div>
                        <h1 class="text-4xl font-black text-blue-600 uppercase mb-2">${systemSettings.companyName}</h1>
                        <p class="text-gray-500 font-bold uppercase tracking-widest text-sm mb-4">${systemSettings.tagline}</p>
                        <div class="text-xs text-gray-500 space-y-1 font-medium">
                            <p>${systemSettings.address}</p>
                            <p>Phone: ${systemSettings.phone}</p>
                            <p>Email: ${systemSettings.email || ''}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <h2 class="text-5xl font-black text-gray-800 uppercase mb-2">${docTitle}</h2>
                        <div class="bg-gray-100 p-4 rounded-xl inline-block text-left">
                            <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest">Document No</p>
                            <p class="text-xl font-black text-gray-800 mb-2">${docTitle.substring(0, 3)}-${invoice.id}</p>
                            <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest">Date Issued</p>
                            <p class="text-sm font-bold">${new Date(invoice.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                <div class="mb-10">
                    <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Bill To</p>
                    <p class="text-2xl font-black text-gray-800 uppercase mb-1">${invoice.customerName}</p>
                    <p class="text-gray-500 font-bold italic">${invoice.jobDescription || 'Standard functionality check & service'}</p>
                </div>

                <table class="table w-full mb-10">
                    <thead>
                        <tr class="bg-gray-50 border-y-2 border-gray-100 uppercase text-[10px] font-black">
                            <th class="py-4">Description</th>
                            <th class="text-center py-4">Price</th>
                            <th class="text-center py-4">Qty</th>
                            <th class="text-right py-4">Total</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm font-bold">
                        ${invoice.items.map(item => `
                            <tr class="border-b border-gray-50">
                                <td class="py-4">${item.name}</td>
                                <td class="text-center py-4">LKR ${item.price.toLocaleString()}</td>
                                <td class="text-center py-4">${item.qty}</td>
                                <td class="text-right py-4 font-black">LKR ${item.subtotal.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="flex justify-end mb-10">
                    <div class="w-64 space-y-3">
                         <div class="flex justify-between text-sm opacity-50 font-bold uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span>LKR ${invoice.total.toLocaleString()}</span>
                        </div>
                        <div class="flex justify-between text-2xl font-black text-blue-600 border-t pt-2">
                            <span>Grand Total</span>
                            <span>LKR ${invoice.total.toLocaleString()}</span>
                        </div>
                        ${invoice.status === 'Paid' ? `
                            <div class="mt-4 border-2 border-green-500 text-green-500 font-black text-center py-2 rounded-lg rotate-[-5deg] inline-block px-10">
                                FULLY PAID
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-20 pt-10 mt-10 border-t items-end">
                    <div class="text-[10px] text-gray-400">
                        <p class="font-black uppercase tracking-widest mb-4">Terms & Conditions</p>
                        <p class="leading-relaxed font-medium">${systemSettings.warrantyText ? systemSettings.warrantyText.replace(/\n/g, '<br>') : 'Warranty covers manufacturing defects only. Service calls are billable after 30 days. Logos and brands are properties of their respective owners.'}</p>
                    </div>
                    <div class="text-center border-t-2 border-gray-100 pt-4">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authorized Signature</p>
                    </div>
                </div>

                <div class="text-center mt-20 no-print">
                    <button onclick="window.print()" class="btn btn-primary btn-lg text-white font-black px-12 rounded-full shadow-2xl shadow-blue-200">Print Now <i class="fa-solid fa-print ml-4"></i></button>
                     <p class="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">"${systemSettings.tagline || 'Thank you for your business!'}"</p>
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

async function deleteInvoice(id) {
    if (confirm('Delete invoice?')) {
        await db.invoices.delete(id);
        renderInvoices();
    }
}

// --- Expenses Component ---
async function renderExpenses() {
    setActiveNav('nav-expenses');
    document.getElementById('page-title').innerText = 'Expense Tracking';
    const content = document.getElementById('app-content');
    const expenses = await db.expenses.toArray();

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <button onclick="openAddExpenseModal()" class="btn btn-error text-white gap-2 font-black shadow-lg shadow-red-100">
                    <i class="fa-solid fa-minus-circle"></i> New Expense
                </button>
            </div>

            <div class="glass-card overflow-hidden">
                <table class="table w-full">
                    <thead>
                        <tr class="text-gray-400 border-b border-gray-100 uppercase text-[10px]">
                            <th class="bg-transparent py-4 font-black">Date</th>
                            <th class="bg-transparent py-4 font-black">Description</th>
                            <th class="bg-transparent py-4 font-black text-center">Category</th>
                            <th class="bg-transparent py-4 font-black text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm font-medium">
                        ${expenses.reverse().map(e => `
                            <tr class="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                                <td>${e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}</td>
                                <td class="font-bold text-gray-800">${e.description}</td>
                                <td class="text-center"><span class="badge badge-ghost badge-sm uppercase text-[9px] font-bold">${e.category || 'Other'}</span></td>
                                <td class="text-red-500 font-black text-right">LKR ${e.amount.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openAddExpenseModal() {
    openModal('Add Expense', `
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Description</span></label>
            <input type="text" id="exp-desc" placeholder="e.g. Fuel, Tools" class="input input-bordered w-full" />
        </div>
        <div class="flex gap-4">
             <div class="form-control w-1/2">
                <label class="label"><span class="label-text">Amount</span></label>
                <input type="number" id="exp-amt" class="input input-bordered w-full" />
            </div>
            <div class="form-control w-1/2">
                <label class="label"><span class="label-text">Date</span></label>
                <input type="date" id="exp-date" class="input input-bordered w-full" />
            </div>
        </div>
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Category</span></label>
            <select id="exp-cat" class="select select-bordered w-full">
                <option>Fuel / Transport</option>
                <option>Shop Rent</option>
                <option>Electricity/Water</option>
                <option>Spare Parts</option>
                <option>Salary</option>
                <option>Marketing</option>
                <option>Other</option>
            </select>
        </div>
    `, 'saveExpense()');
}

async function saveExpense() {
    const description = document.getElementById('exp-desc').value;
    const amount = parseFloat(document.getElementById('exp-amt').value);
    const date = document.getElementById('exp-date').value;
    const category = document.getElementById('exp-cat').value;

    if (!description || isNaN(amount)) return alert("Fields missing");

    await db.expenses.add({ description, amount, date, category });
    closeModal();
    renderExpenses();
}

// --- Settings Component ---
function renderSettings() {
    setActiveNav('nav-settings');
    const content = document.getElementById('app-content');

    content.innerHTML = `
        <div class="animate-fade-in max-w-3xl mx-auto">
            <div class="glass-card p-8">
                <h2 class="text-3xl font-black text-gray-800 mb-8 flex items-center gap-4">
                    <i class="fa-solid fa-gear text-blue-600 animate-spin-slow"></i> System Settings
                </h2>
                <div class="space-y-12">
                     <section>
                        <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-2">Business Branding</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div class="form-control">
                                <label class="label text-xs font-extrabold uppercase ml-1">Company Name</label>
                                <input type="text" id="set-name" value="${systemSettings.companyName}" class="input input-bordered font-bold focus:border-blue-500">
                            </div>
                            <div class="form-control">
                                <label class="label text-xs font-extrabold uppercase ml-1">Official Phone</label>
                                <input type="text" id="set-phone" value="${systemSettings.phone}" class="input input-bordered font-bold">
                            </div>
                            <div class="form-control md:col-span-2">
                                <label class="label text-xs font-extrabold uppercase ml-1">Office Address</label>
                                <textarea id="set-addr" class="textarea textarea-bordered font-bold h-24">${systemSettings.address}</textarea>
                            </div>
                             <div class="form-control">
                                <label class="label text-xs font-extrabold uppercase ml-1">Company Tagline</label>
                                <input type="text" id="set-tagline" value="${systemSettings.tagline}" class="input input-bordered font-bold">
                            </div>
                             <div class="form-control">
                                <label class="label text-xs font-extrabold uppercase ml-1">Logo URL (Base64/Link)</label>
                                <input type="text" id="set-logo" value="${systemSettings.logo}" class="input input-bordered font-bold">
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-2 text-red-500 border-red-100">User & Security</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-red-50/50 p-6 rounded-2xl border border-red-100">
                            <div class="form-control">
                                <label class="label text-xs font-extrabold uppercase ml-1 text-red-400">Username</label>
                                <input type="text" id="set-user" value="${systemSettings.username}" class="input input-bordered font-bold">
                            </div>
                            <div class="form-control">
                                <label class="label text-xs font-extrabold uppercase ml-1 text-red-400">Password</label>
                                <input type="password" id="set-pass" value="${systemSettings.password}" class="input input-bordered font-bold">
                            </div>
                        </div>
                    </section>

                    <section class="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-100">
                        <h3 class="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                            <i class="fa-solid fa-shield-halved text-yellow-300"></i> Lifetime Data Security
                        </h3>
                        <p class="text-xs opacity-70 leading-relaxed font-bold mb-6">Machan, me system eka phone eke local storage eke thama save wenne. Phone eka format kaloth hari, tab eka delete kaloth hari data yana nisa aniwa sathiye sarayak me backup eka ganna.</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onclick="exportData()" class="btn border-none bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-black h-14">
                                <i class="fa-solid fa-download"></i> BACKUP DATA NOW
                            </button>
                            <button onclick="triggerImport()" class="btn border-none bg-blue-500 hover:bg-blue-400 text-white font-black h-14">
                                <i class="fa-solid fa-file-import"></i> RESTORE FROM BACKUP
                            </button>
                        </div>
                    </section>

                    <div class="flex gap-4 pt-10">
                        <button onclick="saveSettings()" class="btn btn-primary flex-1 h-14 text-white font-black text-xl shadow-lg shadow-blue-100">UDA SAVE KARANNA <i class="fa-solid fa-check ml-2"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function saveSettings() {
    systemSettings.companyName = document.getElementById('set-name').value;
    systemSettings.phone = document.getElementById('set-phone').value;
    systemSettings.address = document.getElementById('set-addr').value;
    systemSettings.tagline = document.getElementById('set-tagline').value;
    systemSettings.logo = document.getElementById('set-logo').value;
    systemSettings.username = document.getElementById('set-user').value;
    systemSettings.password = document.getElementById('set-pass').value;

    await db.settings.put({ id: 'config', ...systemSettings });
    updateLogoDisplay();
    updateProfileDisplay();
    alert("Settings Saved Successfully! ✅");
}

// --- Modal System ---
function openModal(title, contentHTML, actionOnConfirm = null) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
        <div id="main-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-slide-up">
                <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 class="font-black text-gray-800 uppercase tracking-tight">${title}</h3>
                    <button onclick="closeModal()" class="btn btn-ghost btn-circle btn-sm"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="p-8 max-h-[70vh] overflow-y-auto">
                    ${contentHTML}
                </div>
                <div class="p-6 bg-gray-50/80 border-t border-gray-100 flex gap-3">
                    <button onclick="closeModal()" class="btn btn-ghost flex-1 font-bold">Cancel</button>
                    ${actionOnConfirm ? `<button onclick="${actionOnConfirm}" class="btn btn-primary flex-1 text-white font-black shadow-lg shadow-blue-100">Confirm Action</button>` : ''}
                </div>
            </div>
        </div>
    `;
}

function closeModal() {
    document.getElementById('modal-container').innerHTML = '';
}

// --- Manual File Backup System (Lifetime Reliable) ---
async function exportData() {
    try {
        const data = {
            customers: await db.customers.toArray(),
            services: await db.services.toArray(),
            invoices: await db.invoices.toArray(),
            expenses: await db.expenses.toArray(),
            settings: await db.settings.toArray(),
            logs: await db.logs.toArray(),
            version: '2.0',
            exportedAt: new Date().toLocaleString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fileName = `CMS_Backup_${new Date().toISOString().split('T')[0]}.json`;

        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        openModal("✅ Backup Successful!", `
            <div class="text-center space-y-4">
                <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fa-solid fa-cloud-arrow-down text-3xl"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800">File eka download una macahn!</h3>
                <div class="bg-yellow-50 p-4 rounded-xl text-left border border-yellow-100 text-sm">
                    <p class="font-black text-yellow-800 uppercase mb-2">⚠️ Sathiye sarayak meka karanna:</p>
                    <p class="text-yellow-700">Me download una file eka danma oyage <b>Google Drive</b> ekata hari, <b>Email</b> ekakata hari upload karala thiyaganna. Ethakota phone eka nathi unath data okkoma safe!</p>
                </div>
                <button onclick="closeModal()" class="btn btn-primary w-full text-white font-bold">Harier Machan 👍</button>
            </div>
        `);

    } catch (error) {
        console.error("Export Failed", error);
        alert("Backup Failed: " + error.message);
    }
}

function triggerImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) handleImport(file);
    };
    input.click();
}

async function handleImport(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedData = JSON.parse(e.target.result);

            if (!importedData.customers || !importedData.invoices) {
                alert("Invalid Backup File! Please check the file.");
                return;
            }

            if (confirm("Restore karannada? Dan thiyena data okkoma delete wela backup eke thiyena dewal danna yanne. Sure da?")) {
                await db.transaction('rw', db.customers, db.services, db.invoices, db.expenses, db.settings, db.logs, async () => {
                    await db.customers.clear();
                    await db.services.clear();
                    await db.invoices.clear();
                    await db.expenses.clear();
                    await db.settings.clear();
                    await db.logs.clear();

                    await db.customers.bulkAdd(importedData.customers);
                    await db.services.bulkAdd(importedData.services);
                    await db.invoices.bulkAdd(importedData.invoices);
                    await db.expenses.bulkAdd(importedData.expenses);
                    await db.settings.bulkAdd(importedData.settings);
                    if (importedData.logs) await db.logs.bulkAdd(importedData.logs);
                });

                alert("System Successfully Restored! ✅");
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            alert("Restore Failed: " + err.message);
        }
    };
    reader.readAsText(file);
}
