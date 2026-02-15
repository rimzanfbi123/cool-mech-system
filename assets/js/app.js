// Application Logic for Cool Mech Service - Professional Overhaul

// --- Global State ---
let currentView = 'dashboard';
let invoiceItems = [];
let systemSettings = {
    companyName: 'COOL MECH SERVICES',
    address: 'Colombo, Sri Lanka',
    phone: '0773919281',
    email: 'info@coolmech.com',
    tagline: 'Make your own weather today',
    warrantyText: 'Warranty subject to terms and conditions.',
    logo: '',
    username: 'admin',
    password: 'password123',
    theme: 'light',
    profilePhoto: '',
    themeConfig: {
        primaryColor: '#2563eb',
        fontSize: '14px',
        backgroundImg: ''
    }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // Load Settings
    try {
        const storedSettings = await db.settings.get('config');
        if (storedSettings) {
            systemSettings = { ...systemSettings, ...storedSettings };
        } else {
            await db.settings.put({ id: 'config', ...systemSettings });
        }
    } catch (e) { console.error("Settings load error", e); }

    // Apply Settings
    applyThemeSettings();

    // Check Auth
    if (sessionStorage.getItem('coolmech_auth') === 'true') {
        initApp();
    } else {
        renderLoginScreen();
    }

    // Modal Close Logic
    window.onclick = (e) => {
        const modal = document.getElementById('main-modal');
        if (e.target == modal) closeModal();
    }
});

function applyThemeSettings() {
    document.documentElement.setAttribute('data-theme', systemSettings.theme || 'light');
    const root = document.documentElement;
    if (systemSettings.themeConfig.primaryColor) {
        root.style.setProperty('--primary', systemSettings.themeConfig.primaryColor);
        root.style.setProperty('--primary-focus', systemSettings.themeConfig.primaryColor + 'ee');
    }
    document.body.style.fontSize = systemSettings.themeConfig.fontSize || '14px';
    if (systemSettings.themeConfig.backgroundImg) {
        document.body.style.backgroundImage = `url(${systemSettings.themeConfig.backgroundImg})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundAttachment = 'fixed';
    } else {
        document.body.style.backgroundImage = 'none';
    }
}

async function initApp() {
    document.getElementById('login-screen')?.remove();
    document.getElementById('main-app').classList.remove('hidden');

    try { await db.open(); } catch (err) { console.error("DB Open Failed", err); }

    updateUIElements();
    renderDashboard();
    initCalculator();
    setTimeout(checkStorageHealth, 2000);
}

function updateUIElements() {
    updateLogoDisplay();
    updateProfileDisplay();
    updateDate();
}

// --- Auth Section ---
function renderLoginScreen() {
    const loginDiv = document.createElement('div');
    loginDiv.id = 'login-screen';
    loginDiv.className = 'fixed inset-0 bg-blue-600 flex items-center justify-center z-[200] p-4 text-center';
    loginDiv.innerHTML = `
        <div class="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md animate-slide-up relative overflow-hidden">
            <div class="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full"></div>
            <div class="mb-8 relative">
                <div class="w-24 h-24 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <i class="fa-solid fa-shield-halved text-4xl"></i>
                </div>
                <h2 class="text-3xl font-black text-gray-800 tracking-tighter uppercase">${systemSettings.companyName}</h2>
                <p class="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Secure Control Panel v2.0</p>
            </div>
            <form onsubmit="handleLogin(event)" class="space-y-4">
                <div class="form-control text-left">
                    <label class="label text-xs font-black text-gray-400 uppercase ml-2">Internal Username</label>
                    <input type="text" id="login-user" placeholder="Enter username" class="input input-bordered h-14 bg-gray-50 border-2 focus:border-blue-500 rounded-2xl font-bold" required />
                </div>
                <div class="form-control text-left">
                    <label class="label text-xs font-black text-gray-400 uppercase ml-2">Access Key</label>
                    <input type="password" id="login-pass" placeholder="••••••••" class="input input-bordered h-14 bg-gray-50 border-2 focus:border-blue-500 rounded-2xl font-bold" required />
                </div>
                <button type="submit" class="btn btn-primary w-full h-16 text-white text-lg font-black shadow-xl shadow-blue-200 mt-6 rounded-2xl uppercase tracking-widest">
                    Unlock System <i class="fa-solid fa-arrow-right ml-2"></i>
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
        alert("Access Denied: Invalid credentials. Please try again.");
    }
}

function handleLogout() {
    sessionStorage.removeItem('coolmech_auth');
    window.location.reload();
}

// --- Layout Helpers ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    sidebar.classList.toggle('-translate-x-full');
    if (sidebar.classList.contains('-translate-x-full')) overlay.classList.add('hidden');
    else overlay.classList.remove('hidden');
}

function closeSidebarOnMobile() {
    if (window.innerWidth < 1024) {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        document.getElementById('mobile-overlay').classList.add('hidden');
    }
}

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-US', options);
}

function updateLogoDisplay() {
    const sidebarLogo = document.getElementById('sidebar-logo-container');
    if (systemSettings.logo) {
        sidebarLogo.innerHTML = `<img src="${systemSettings.logo}" class="max-h-20 mx-auto rounded-xl shadow-lg border-2 border-white">`;
    }
}

function updateProfileDisplay() {
    const profile = document.getElementById('sidebar-profile');
    profile.innerHTML = `
        <div class="px-6 py-4 flex items-center gap-4 bg-gray-50/80 border-y border-gray-100 mb-4 cursor-pointer hover:bg-white transition-colors" onclick="renderSettings()">
            <div class="avatar">
                <div class="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg overflow-hidden">
                    ${systemSettings.profilePhoto ? `<img src="${systemSettings.profilePhoto}">` : `<i class="fa-solid fa-user-gear text-xl"></i>`}
                </div>
            </div>
            <div class="overflow-hidden">
                <p class="font-bold text-gray-800 truncate">${systemSettings.username}</p>
                <p class="text-[10px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1">
                    <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Authorized
                </p>
            </div>
        </div>
    `;
}

function setActiveNav(id) {
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('bg-primary', 'text-white', 'shadow-md');
        el.classList.add('text-gray-600');
    });
    const activeEl = document.getElementById(id);
    if (activeEl) {
        activeEl.classList.remove('text-gray-600');
        activeEl.classList.add('bg-primary', 'text-white', 'shadow-md');
    }
}

// --- Dashboard Section ---
async function renderDashboard() {
    setActiveNav('nav-dashboard');
    document.getElementById('page-title').innerText = 'System Dashboard';
    const content = document.getElementById('app-content');

    const customers = await db.customers.toArray();
    const invoices = await db.invoices.toArray();
    const services = await db.services.toArray();
    const jobs = await db.jobs.toArray();

    const revenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const pendingJobs = jobs.filter(j => j.status === 'Pending').length;
    const lowStock = services.filter(s => (s.inventory || 0) <= 5);

    content.innerHTML = `
        <div class="animate-fade-in space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="stat glass-card p-6 border-b-4 border-blue-500">
                    <div class="stat-figure text-blue-500"><i class="fa-solid fa-wallet text-3xl"></i></div>
                    <div class="stat-title text-gray-500 font-medium uppercase text-xs">Lifetime Revenue</div>
                    <div class="stat-value text-gray-800 text-3xl font-black">LKR ${revenue.toLocaleString()}</div>
                    <div class="stat-desc text-green-500 font-bold">↑ Accurate Tracking</div>
                </div>
                <div class="stat glass-card p-6 border-b-4 border-orange-500">
                    <div class="stat-figure text-orange-500"><i class="fa-solid fa-screwdriver-wrench text-3xl"></i></div>
                    <div class="stat-title text-gray-500 font-medium uppercase text-xs">Pending Jobs</div>
                    <div class="stat-value text-gray-800 text-3xl font-black">${pendingJobs}</div>
                    <div class="stat-desc text-orange-500 font-bold">${pendingJobs > 0 ? 'Action Required' : 'All Caught Up'}</div>
                </div>
                <div class="stat glass-card p-6 border-b-4 border-green-500">
                    <div class="stat-figure text-green-500"><i class="fa-solid fa-user-group text-3xl"></i></div>
                    <div class="stat-title text-gray-500 font-medium uppercase text-xs">Total Customers</div>
                    <div class="stat-value text-gray-800 text-3xl font-black">${customers.length}</div>
                    <div class="stat-desc text-gray-400">Database Size</div>
                </div>
                <div class="stat glass-card p-6 ${lowStock.length > 0 ? 'bg-red-50 border-red-500' : 'border-purple-500'} border-b-4">
                    <div class="stat-figure text-purple-500"><i class="fa-solid fa-boxes-stacked text-3xl"></i></div>
                    <div class="stat-title text-gray-500 font-medium uppercase text-xs">Stock Alerts</div>
                    <div class="stat-value text-gray-800 text-3xl font-black">${lowStock.length}</div>
                    <div class="stat-desc text-red-500 font-bold">${lowStock.length > 0 ? 'Refill Inventory' : 'Healthy Levels'}</div>
                </div>
            </div>

            <div id="storage-health-bar"></div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 space-y-8">
                    <div class="glass-card p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-xl font-black text-gray-800"><i class="fa-solid fa-bolt text-yellow-500 mr-2"></i> Active Job Cards</h3>
                            <button onclick="renderJobs()" class="btn btn-ghost btn-xs text-primary font-black">SEE ALL</button>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="table w-full">
                                <thead>
                                    <tr class="text-gray-400 border-b uppercase text-[10px] font-black">
                                        <th>Job ID</th><th>Customer</th><th>Status</th><th>Last Update</th>
                                    </tr>
                                </thead>
                                <tbody class="text-sm font-bold">
                                    ${jobs.slice(-5).reverse().map(j => `
                                        <tr class="hover:bg-gray-50 border-b border-gray-50">
                                            <td><span class="text-gray-400">#${j.jobNumber}</span></td>
                                            <td>${j.customerName}</td>
                                            <td><span class="badge ${getStatusBadgeClass(j.status)} badge-sm font-black text-[9px] uppercase">${j.status}</span></td>
                                            <td class="text-gray-400 text-xs">${new Date(j.lastUpdate).toLocaleDateString()}</td>
                                        </tr>
                                    `).join('')}
                                    ${jobs.length === 0 ? '<tr><td colspan="4" class="text-center py-10 opacity-30 italic">No active jobs found.</td></tr>' : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="glass-card p-8 bg-primary text-white shadow-2xl relative overflow-hidden group">
                         <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full group-hover:scale-150 transition-transform"></div>
                         <h3 class="text-xl font-black uppercase tracking-widest mb-2 italic">Quick Command</h3>
                         <p class="text-xs opacity-70 mb-8 font-bold uppercase tracking-tighter">Business Flow Management</p>
                         <div class="space-y-3 relative z-10">
                            <button onclick="openAddJobModal()" class="btn bg-white text-primary border-none w-full font-black h-14 rounded-2xl hover:scale-105 transition-transform"><i class="fa-solid fa-plus-circle mr-2"></i> OPEN JOB CARD</button>
                            <button onclick="renderCreateInvoice()" class="btn btn-primary bg-primary-focus border-white/20 w-full font-black h-14 rounded-2xl"><i class="fa-solid fa-file-signature mr-2"></i> NEW INVOICE</button>
                         </div>
                    </div>
                    
                    <div id="mini-calculator" class="glass-card p-6 bg-gray-800 text-white min-h-[300px]">
                        <!-- Injected by initCalculator -->
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Pending': return 'badge-warning';
        case 'Closed': return 'badge-success';
        case 'Postponed': return 'badge-error';
        case 'Rescheduled': return 'badge-info';
        default: return 'badge-ghost';
    }
}

// --- Customer Components ---
async function renderCustomers() {
    setActiveNav('nav-customers');
    document.getElementById('page-title').innerText = 'Customer Directory';
    const content = document.getElementById('app-content');
    const customers = await db.customers.toArray();

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <p class="text-sm font-bold text-gray-500 ml-2 uppercase tracking-widest"><i class="fa-solid fa-address-book text-primary mr-2"></i> Record Count: ${customers.length}</p>
                <button onclick="openAddCustomerModal()" class="btn btn-primary text-white font-black shadow-lg"> <i class="fa-solid fa-user-plus mr-2"></i> ADD CUSTOMER </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${customers.map(c => `
                    <div class="glass-card hover:border-primary transition-all p-6 group relative overflow-hidden bg-white">
                         <div class="flex justify-between items-start mb-4 relative z-10">
                            <div class="w-12 h-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center text-xl font-black group-hover:bg-primary group-hover:text-white transition-colors">
                                ${c.name.charAt(0)}
                            </div>
                            <div class="dropdown dropdown-end">
                                <label tabindex="0" class="btn btn-ghost btn-circle btn-xs opacity-50"><i class="fa-solid fa-ellipsis-vertical"></i></label>
                                <ul tabindex="0" class="dropdown-content z-[2] menu p-2 shadow-2xl bg-base-100 rounded-xl w-48 border border-gray-100 font-bold">
                                    <li><a onclick="editCustomer(${c.id})"><i class="fa-solid fa-user-pen text-blue-500"></i> Edit Details</a></li>
                                    <li><a href="https://wa.me/${c.phone}" target="_blank" class="text-green-600"><i class="fa-brands fa-whatsapp"></i> Chat WhatsApp</a></li>
                                    <li><a onclick="deleteCustomer(${c.id})" class="text-red-500"><i class="fa-solid fa-user-minus"></i> Remove Record</a></li>
                                </ul>
                            </div>
                        </div>
                        <h3 class="font-black text-gray-800 text-xl mb-1 truncate">${c.name}</h3>
                        <p class="text-primary font-black text-sm mb-4"><i class="fa-solid fa-phone mr-1"></i> ${c.phone}</p>
                        <div class="space-y-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
                            <p class="truncate"><i class="fa-solid fa-envelope w-4"></i> ${c.email || 'NO EMAIL SAVED'}</p>
                            <p class="truncate"><i class="fa-solid fa-map-pin w-4"></i> ${c.address || 'NO ADDRESS SAVED'}</p>
                        </div>
                        <div class="mt-6 flex gap-2">
                             <a href="tel:${c.phone}" class="btn btn-sm btn-outline btn-primary flex-1 font-black rounded-xl text-[10px] uppercase">Direct Call</a>
                             <button onclick="openAddJobModal(${c.id})" class="btn btn-sm btn-primary text-white flex-1 font-black rounded-xl text-[10px] uppercase">Open Job</button>
                        </div>
                    </div>
                `).join('')}
                ${customers.length === 0 ? '<div class="col-span-full py-20 text-center opacity-30 italic font-black uppercase tracking-widest">No customers registered yet.</div>' : ''}
            </div>
        </div>
    `;
}

function openAddCustomerModal() {
    openModal('Register New Customer', `
        <div class="space-y-4">
            <div class="form-control">
                <label class="label text-xs font-black uppercase text-gray-400 m-1">Full Name / Business Name</label>
                <input type="text" id="cust-name" placeholder="John Doe or ABC Shop" class="input input-bordered w-full font-bold h-12 rounded-xl" required />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control">
                    <label class="label text-xs font-black uppercase text-gray-400 m-1">Contact Phone</label>
                    <input type="text" id="cust-phone" placeholder="07XXXXXXXX" class="input input-bordered w-full font-bold h-12 rounded-xl" required />
                </div>
                <div class="form-control">
                    <label class="label text-xs font-black uppercase text-gray-400 m-1">Email Address</label>
                    <input type="email" id="cust-email" placeholder="john@example.com" class="input input-bordered w-full font-bold h-12 rounded-xl" />
                </div>
            </div>
            <div class="form-control">
                <label class="label text-xs font-black uppercase text-gray-400 m-1">Mailing Address</label>
                <textarea id="cust-addr" placeholder="No 123, Main Street, Colombo" class="textarea textarea-bordered w-full font-bold h-24 rounded-xl"></textarea>
            </div>
        </div>
    `, 'saveCustomer()');
}

async function saveCustomer() {
    const data = {
        name: document.getElementById('cust-name').value.trim(),
        phone: document.getElementById('cust-phone').value.trim(),
        email: document.getElementById('cust-email').value.trim(),
        address: document.getElementById('cust-addr').value.trim()
    };
    if (!data.name || !data.phone) return alert("Error: Name and Phone are mandatory!");
    await db.customers.add(data);
    closeModal(); renderCustomers();
}

async function deleteCustomer(id) {
    if (confirm("System Alert: Are you sure you want to permanently delete this customer? This action cannot be undone!")) {
        await db.customers.delete(id); renderCustomers();
    }
}

// --- Job Card Components ---
async function renderJobs() {
    setActiveNav('nav-jobs');
    document.getElementById('page-title').innerText = 'Job Card Management';
    const list = await db.jobs.toArray();
    const content = document.getElementById('app-content');

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div class="flex gap-4">
                    <span class="badge border-none bg-orange-100 text-orange-600 font-bold uppercase text-[10px] p-4">${list.filter(j => j.status === 'Pending').length} Pending Tasks</span>
                    <span class="badge border-none bg-green-100 text-green-600 font-bold uppercase text-[10px] p-4">${list.filter(j => j.status === 'Closed').length} Completed</span>
                </div>
                <button onclick="openAddJobModal()" class="btn btn-primary text-white font-black shadow-lg shadow-blue-100"> <i class="fa-solid fa-folder-plus mr-2"></i> OPEN NEW JOB CARD </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${list.reverse().map(j => `
                    <div class="glass-card p-6 bg-white border-l-8 ${getStatusBorderClass(j.status)} relative">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <p class="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Job Number</p>
                                <p class="text-xl font-black text-gray-800 tracking-tighter">#${j.jobNumber}</p>
                            </div>
                            <span class="badge ${getStatusBadgeClass(j.status)} font-black uppercase text-[9px] border-none px-3 py-3">${j.status}</span>
                        </div>
                        <h3 class="font-black text-gray-800 text-lg mb-1 truncate">${j.customerName}</h3>
                        <p class="text-xs text-blue-600 font-bold mb-4 italic">Type: ${j.type}</p>
                        
                        <div class="bg-gray-50 p-4 rounded-xl text-xs text-gray-600 font-medium min-h-[60px] mb-4 border border-gray-100">
                            ${j.details || 'No specific technical details provided.'}
                        </div>
                        
                        <div class="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase mb-6">
                            <span>Started: ${new Date(j.startDate).toLocaleDateString()}</span>
                            <span>Updated: ${new Date(j.lastUpdate).toLocaleDateString()}</span>
                        </div>
                        
                        <div class="flex gap-2">
                            <button onclick="editJob(${j.id})" class="btn btn-xs btn-ghost text-primary font-black uppercase">Update Status</button>
                            ${j.status !== 'Closed' ? `<button onclick="renderCreateInvoice(${j.id})" class="btn btn-xs btn-primary text-white font-black uppercase">Invoice Items</button>` : ''}
                            <button onclick="deleteJob(${j.id})" class="btn btn-xs btn-ghost text-red-300 hover:text-red-500 ml-auto"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `).join('')}
                ${list.length === 0 ? '<div class="col-span-full py-40 text-center opacity-30 italic font-black uppercase tracking-widest">No job cards found.</div>' : ''}
            </div>
        </div>
    `;
}

function getStatusBorderClass(status) {
    switch (status) {
        case 'Pending': return 'border-orange-500';
        case 'Closed': return 'border-green-500';
        case 'Postponed': return 'border-red-500';
        case 'Rescheduled': return 'border-blue-500';
        default: return 'border-gray-300';
    }
}

async function openAddJobModal(customerId = null) {
    const custs = await db.customers.toArray();
    openModal('Open New Job Card', `
        <div class="space-y-4">
            <div class="form-control">
                <label class="label text-xs font-black uppercase text-gray-400">Select Customer</label>
                <select id="job-cust" class="select select-bordered w-full font-bold h-12 rounded-xl">
                    <option disabled ${!customerId ? 'selected' : ''}>Choose customer...</option>
                    ${custs.map(c => `<option value="${c.id}" ${parseInt(customerId) === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control">
                    <label class="label text-xs font-black uppercase text-gray-400">Job Type</label>
                    <input type="text" id="job-type" placeholder="e.g. AC Repair" class="input input-bordered w-full font-bold h-12 rounded-xl" />
                </div>
                <div class="form-control">
                    <label class="label text-xs font-black uppercase text-gray-400">Initial Status</label>
                    <select id="job-status" class="select select-bordered w-full font-bold h-12 rounded-xl">
                        <option>Pending</option><option>Postponed</option><option>Rescheduled</option>
                    </select>
                </div>
            </div>
            <div class="form-control">
                <label class="label text-xs font-black uppercase text-gray-400">Technical Details / Symptoms</label>
                <textarea id="job-details" placeholder="What is the problem or task?" class="textarea textarea-bordered w-full font-bold h-24 rounded-xl"></textarea>
            </div>
        </div>
    `, 'saveJob()');
}

async function saveJob() {
    const cId = parseInt(document.getElementById('job-cust').value);
    if (isNaN(cId)) return alert("Error: Please select a valid customer.");
    const cust = await db.customers.get(cId);
    const count = await db.jobs.count();
    const data = {
        customerId: cId,
        customerName: cust.name,
        jobNumber: `JOB-${(count + 1).toString().padStart(4, '0')}`,
        type: document.getElementById('job-type').value || 'Service',
        status: document.getElementById('job-status').value,
        details: document.getElementById('job-details').value,
        startDate: new Date().toISOString(),
        lastUpdate: new Date().toISOString()
    };
    await db.jobs.add(data);
    closeModal(); renderJobs();
}

async function editJob(id) {
    const job = await db.jobs.get(id);
    openModal(`Update Job Status: #${job.jobNumber}`, `
        <div class="space-y-6">
            <div class="form-control">
                <label class="label text-xs font-black uppercase text-gray-400">Current Status</label>
                <select id="job-status-edit" class="select select-bordered w-full font-bold h-14 rounded-2xl text-xl">
                    <option ${job.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option ${job.status === 'Closed' ? 'selected' : ''}>Closed</option>
                    <option ${job.status === 'Postponed' ? 'selected' : ''}>Postponed</option>
                    <option ${job.status === 'Rescheduled' ? 'selected' : ''}>Rescheduled</option>
                </select>
            </div>
            <div class="form-control">
                <label class="label text-xs font-black uppercase text-gray-400">Update Technical Notes</label>
                <textarea id="job-details-edit" class="textarea textarea-bordered w-full font-bold h-32 rounded-2xl" placeholder="Update progress or reasons for status change...">${job.details || ''}</textarea>
            </div>
        </div>
    `, `updateJob(${id})`);
}

async function updateJob(id) {
    const status = document.getElementById('job-status-edit').value;
    const details = document.getElementById('job-details-edit').value;
    await db.jobs.update(id, { status, details, lastUpdate: new Date().toISOString() });
    closeModal(); renderJobs();
}

async function deleteJob(id) {
    if (confirm("Warning: Permanent removal of this job card. Confirm?")) {
        await db.jobs.delete(id); renderJobs();
    }
}

// --- Stock / Services Components ---
async function renderServices() {
    setActiveNav('nav-services');
    document.getElementById('page-title').innerText = 'Inventory & Service Pricing';
    const services = await db.services.toArray();
    const content = document.getElementById('app-content');

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div class="flex gap-2">
                    <span class="badge badge-lg border-none bg-blue-50 text-primary font-black uppercase text-[10px] p-4">${services.length} Registered Items</span>
                </div>
                <button onclick="openAddServiceModal()" class="btn btn-primary text-white font-black shadow-lg"> <i class="fa-solid fa-plus-circle mr-2"></i> ADD TO INVENTORY </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${services.map(s => `
                    <div class="glass-card p-6 bg-white hover:border-primary transition-all group overflow-hidden">
                        <div class="flex justify-between items-start mb-4">
                            <span class="badge ${s.inventory > 5 ? 'badge-success' : 'badge-error'} badge-sm font-black text-[9px] uppercase border-none px-3 py-3">${s.inventory > 5 ? 'In Stock' : 'Low Stock'}</span>
                            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick="editService(${s.id})" class="text-blue-400 hover:text-blue-600"><i class="fa-solid fa-pen-to-square"></i></button>
                                <button onclick="deleteService(${s.id})" class="text-red-300 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                        <h3 class="font-black text-gray-800 text-lg mb-1 truncate uppercase tracking-tighter">${s.name}</h3>
                        <p class="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-4">${s.type || 'Miscellaneous'}</p>
                        
                        <div class="flex justify-between items-end border-t pt-4">
                            <div>
                                <p class="text-[9px] font-black text-gray-400 uppercase">Unit Price</p>
                                <p class="text-xl font-black text-primary italic">LKR ${s.price.toLocaleString()}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[9px] font-black text-gray-400 uppercase">Stock Level</p>
                                <p class="text-xl font-black ${s.inventory < 5 ? 'text-red-500 animate-pulse' : 'text-gray-800'}">${s.inventory || 0}</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
                ${services.length === 0 ? '<div class="col-span-full py-40 text-center opacity-30 italic font-black uppercase">No inventory items found.</div>' : ''}
            </div>
        </div>
    `;
}

function openAddServiceModal() {
    openModal('Stock / Service Regsitry', `
        <div class="space-y-4 text-left">
            <div class="form-control">
                <label class="label text-xs font-black uppercase text-gray-400">Part Name / Service Title</label>
                <input type="text" id="svc-name" placeholder="e.g. Capacitator 2.5uF" class="input input-bordered h-14 rounded-2xl font-bold" required />
            </div>
            <div class="form-control">
                <label class="label text-xs font-black uppercase text-gray-400">Classification</label>
                <select id="svc-type" class="select select-bordered h-14 rounded-2xl font-bold">
                    <option>Inventory / Spare Part</option>
                    <option>Labour / Service Charge</option>
                    <option>Consultation / Inspection</option>
                </select>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control">
                    <label class="label text-xs font-black uppercase text-gray-400">Selling Price (LKR)</label>
                    <input type="number" id="svc-price" placeholder="0.00" class="input input-bordered h-14 rounded-2xl font-bold" required />
                </div>
                <div class="form-control">
                    <label class="label text-xs font-black uppercase text-gray-400">Initial Stock Count</label>
                    <input type="number" id="svc-inv" placeholder="0" class="input input-bordered h-14 rounded-2xl font-bold" />
                </div>
            </div>
        </div>
    `, 'saveService()');
}

async function saveService() {
    const name = document.getElementById('svc-name').value.trim();
    const type = document.getElementById('svc-type').value;
    const price = parseFloat(document.getElementById('svc-price').value);
    const inventory = parseInt(document.getElementById('svc-inv').value) || 0;
    if (!name || isNaN(price)) return alert("Error: Basic item information missing!");
    await db.services.add({ name, type, price, inventory });
    closeModal(); renderServices();
}

async function updateTaskProgress() {
    const list = await db.jobs.toArray();
    console.log("Job logic verified.");
}

// --- Quotes & Invoices Modules ---
async function renderQuotes() {
    setActiveNav('nav-quotes');
    document.getElementById('page-title').innerText = 'Official Quotes';
    const quotes = await db.quotes.toArray();
    const content = document.getElementById('app-content');

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <p class="text-sm font-black text-gray-500 uppercase tracking-widest"><i class="fa-solid fa-file-invoice text-primary mr-2"></i> Open Quotes: ${quotes.length}</p>
                <button onclick="renderCreateQuote()" class="btn btn-primary text-white font-black shadow-lg"> <i class="fa-solid fa-plus mr-2"></i> CREATE NEW QUOTE </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${quotes.reverse().map(q => `
                    <div class="glass-card p-6 bg-white hover:border-blue-400 transition-all">
                        <div class="flex justify-between items-start mb-4">
                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Draft Estimate</span>
                            <div class="dropdown dropdown-end">
                                <label tabindex="0" class="btn btn-ghost btn-circle btn-xs opacity-50"><i class="fa-solid fa-ellipsis-vertical"></i></label>
                                <ul tabindex="0" class="dropdown-content z-[2] menu p-2 shadow-2xl bg-base-100 rounded-xl w-48 border border-gray-100 font-bold">
                                    <li><a onclick="previewDocument('quote', ${q.id})"><i class="fa-solid fa-eye text-blue-500"></i> Full Preview</a></li>
                                    <li><a onclick="convertQuoteToInvoice(${q.id})" class="text-green-600"><i class="fa-solid fa-arrow-right-arrow-left"></i> Convert to Invoice</a></li>
                                    <li><a onclick="deleteQuote(${q.id})" class="text-red-500"><i class="fa-solid fa-trash"></i> Delete Quote</a></li>
                                </ul>
                            </div>
                        </div>
                        <h3 class="font-black text-gray-800 text-lg truncate">${q.customerName}</h3>
                        <p class="text-xs text-gray-400 font-bold mb-4 italic">${new Date(q.date).toLocaleDateString()}</p>
                        <div class="flex justify-between items-center border-t pt-4">
                            <p class="text-sm font-black text-gray-500 uppercase">Estimated Total</p>
                            <p class="text-xl font-black text-primary">LKR ${q.total.toLocaleString()}</p>
                        </div>
                        <button onclick="previewDocument('quote', ${q.id})" class="btn btn-primary btn-sm w-full mt-6 rounded-xl font-black text-[10px]">VIEW & PRINT</button>
                    </div>
                `).join('')}
                ${quotes.length === 0 ? '<div class="col-span-full py-20 text-center opacity-30 italic font-black uppercase">No quotes generated.</div>' : ''}
            </div>
        </div>
    `;
}

async function renderInvoices() {
    setActiveNav('nav-invoices');
    document.getElementById('page-title').innerText = 'Sales & Billing';
    const invoices = await db.invoices.toArray();
    const content = document.getElementById('app-content');

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                 <div class="flex gap-4">
                    <span class="badge border-none bg-blue-50 text-blue-600 font-bold uppercase text-[10px] p-4">${invoices.length} Records</span>
                    <span class="badge border-none bg-green-50 text-green-600 font-bold uppercase text-[10px] p-4">Revenue: LKR ${invoices.reduce((s, i) => s + i.total, 0).toLocaleString()}</span>
                </div>
                <button onclick="renderCreateInvoice()" class="btn btn-primary text-white font-black shadow-lg"> <i class="fa-solid fa-file-invoice-dollar mr-2"></i> GENERATE INVOICE </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${invoices.reverse().map(inv => `
                    <div class="glass-card p-6 bg-white hover:border-green-400 transition-all">
                        <div class="flex justify-between items-start mb-4">
                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Tax Invoice</span>
                            <span class="badge badge-success badge-sm font-black uppercase text-[9px] px-2">PAID</span>
                        </div>
                        <h3 class="font-black text-gray-800 text-lg truncate">${inv.customerName}</h3>
                        <p class="text-xs text-gray-400 font-bold mb-4 italic">${new Date(inv.date).toLocaleDateString()}</p>
                        <div class="flex justify-between items-center border-t pt-4">
                            <p class="text-sm font-black text-gray-500 uppercase">Gross Amount</p>
                            <p class="text-xl font-black text-green-600">LKR ${inv.total.toLocaleString()}</p>
                        </div>
                        <div class="flex gap-2 mt-6">
                            <button onclick="previewDocument('invoice', ${inv.id})" class="btn btn-primary btn-sm flex-1 rounded-xl font-black text-[10px]">VIEW / REPRINT</button>
                            <button onclick="deleteInvoice(${inv.id})" class="btn btn-ghost btn-sm text-red-300 hover:text-red-500"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `).join('')}
                ${invoices.length === 0 ? '<div class="col-span-full py-20 text-center opacity-30 italic font-black uppercase">No invoices found.</div>' : ''}
            </div>
        </div>
    `;
}

// --- Creation Logic (Joint UI) ---
async function renderCreateInvoice(jobId = null) {
    invoiceItems = [];
    const customers = await db.customers.toArray();
    const services = await db.services.toArray();
    let job = null;
    if (jobId) job = await db.jobs.get(jobId);

    const content = document.getElementById('app-content');
    content.innerHTML = `
        <div class="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            <div class="lg:col-span-2 space-y-6">
                <div class="glass-card p-8 bg-white">
                    <h3 class="text-xl font-black text-gray-800 mb-6 uppercase tracking-widest border-b pb-4 italic">Billiing Details</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="form-control">
                            <label class="label text-[10px] font-black uppercase text-gray-400">Customer Selection</label>
                            <select id="inv-cust" class="select select-bordered h-14 rounded-2xl font-bold bg-gray-50 border-2">
                                <option disabled ${!job ? 'selected' : ''}>-- Select Customer --</option>
                                ${customers.map(c => `<option value="${c.id}" ${job && job.customerId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label text-[10px] font-black uppercase text-gray-400">Transaction Date</label>
                            <input type="date" id="inv-date" class="input input-bordered h-14 rounded-2xl font-bold bg-gray-50 border-2" value="${new Date().toISOString().split('T')[0]}" />
                        </div>
                    </div>
                </div>

                <div class="glass-card p-8 bg-white">
                    <h3 class="text-xl font-black text-gray-800 mb-6 uppercase tracking-widest border-b pb-4 italic">Inventory Search</h3>
                    <div class="flex gap-4">
                        <select id="inv-item-select" class="select select-bordered flex-1 h-14 rounded-2xl font-bold bg-gray-50 border-2">
                            <option disabled selected>-- Search Stock / Services --</option>
                            ${services.map(s => `<option value="${s.id}">${s.name.toUpperCase()} (LKR ${s.price}) [Qty: ${s.inventory}]</option>`).join('')}
                        </select>
                        <input type="number" id="inv-qty" value="1" class="input input-bordered w-24 h-14 rounded-2xl font-bold text-center bg-gray-50 border-2" />
                        <button onclick="addItemToInvoice()" class="btn btn-primary h-14 w-14 rounded-2xl text-xl font-black shadow-lg shadow-blue-100"> + </button>
                    </div>
                    
                    <div class="mt-8 overflow-x-auto">
                        <table class="table w-full">
                            <thead>
                                <tr class="text-[10px] text-gray-400 border-b uppercase font-black">
                                    <th>Product/Service</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th>
                                </tr>
                            </thead>
                            <tbody id="invoice-items-body" class="font-bold text-sm">
                                <!-- Dynamic Items -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="glass-card p-8 bg-black text-white shadow-2xl sticky top-24">
                    <h3 class="text-xs font-black uppercase tracking-[0.3em] opacity-50 mb-8 border-b border-white/10 pb-4 italic">Summary Totals</h3>
                    <div class="space-y-6 pb-10">
                         <div class="flex justify-between items-center">
                            <span class="text-xs font-bold text-gray-400 uppercase">Sub-Total</span>
                            <span class="text-lg font-bold" id="inv-subtotal">LKR 0.00</span>
                         </div>
                         <div class="flex justify-between items-center border-t border-white/10 pt-4">
                            <span class="text-xs font-black uppercase text-blue-400 italic">Grand Total</span>
                            <span class="text-4xl font-black tracking-tighter" id="inv-grandtotal">LKR 0</span>
                         </div>
                    </div>
                    <div class="space-y-3">
                        <button onclick="saveDocument('invoice', ${jobId})" class="btn bg-blue-600 hover:bg-blue-700 border-none w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/50 uppercase tracking-widest">
                            Issue Invoice <i class="fa-solid fa-check-double ml-2"></i>
                        </button>
                        <button onclick="saveDocument('quote')" class="btn btn-ghost border-white/20 hover:bg-white/10 w-full h-14 rounded-2xl font-black uppercase tracking-wider">
                            Save as Quote Estimate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function renderCreateQuote() { renderCreateInvoice(); document.getElementById('page-title').innerText = 'Generate New Quote'; }

async function addItemToInvoice() {
    const sId = parseInt(document.getElementById('inv-item-select').value);
    const qty = parseInt(document.getElementById('inv-qty').value);
    if (isNaN(sId) || qty <= 0) return;

    const svc = await db.services.get(sId);
    invoiceItems.push({ ...svc, qty, subtotal: svc.price * qty });
    updateInvoiceTable();
}

function updateInvoiceTable() {
    const body = document.getElementById('invoice-items-body');
    if (!body) return;
    body.innerHTML = invoiceItems.map((item, idx) => `
        <tr class="border-b border-gray-50 hover:bg-gray-50">
            <td class="uppercase tracking-tight">${item.name}</td>
            <td class="text-gray-400 italic">LKR ${item.price}</td>
            <td>${item.qty}</td>
            <td class="text-primary font-black">LKR ${item.subtotal.toLocaleString()}</td>
            <td><button onclick="removeItemFromInvoice(${idx})" class="text-red-300 hover:text-red-500"><i class="fa-solid fa-circle-xmark"></i></button></td>
        </tr>
    `).join('');

    const total = invoiceItems.reduce((s, i) => s + i.subtotal, 0);
    document.getElementById('inv-subtotal').innerText = `LKR ${total.toLocaleString()}`;
    document.getElementById('inv-grandtotal').innerText = `LKR ${total.toLocaleString()}`;
}

function removeItemFromInvoice(idx) { invoiceItems.splice(idx, 1); updateInvoiceTable(); }

async function saveDocument(type, jobId = null) {
    const cId = parseInt(document.getElementById('inv-cust').value);
    const date = document.getElementById('inv-date').value;
    if (isNaN(cId) || invoiceItems.length === 0) return alert("System Alert: Data Incomplete. Select customer and items.");

    const cust = await db.customers.get(cId);
    const total = invoiceItems.reduce((s, i) => s + i.subtotal, 0);

    const data = {
        customerId: cId,
        customerName: cust.name,
        date: date,
        total: total,
        items: JSON.parse(JSON.stringify(invoiceItems)),
        status: type === 'invoice' ? 'Paid' : 'Pending'
    };

    if (type === 'invoice') {
        const id = await db.invoices.add(data);
        for (let item of invoiceItems) {
            const svc = await db.services.get(item.id);
            if (svc && svc.inventory) { await db.services.update(item.id, { inventory: svc.inventory - item.qty }); }
        }
        if (jobId) await db.jobs.update(jobId, { status: 'Closed', lastUpdate: new Date().toISOString() });
        previewDocument('invoice', id);
    } else {
        await db.quotes.add(data);
        renderQuotes();
    }
}

async function convertQuoteToInvoice(id) {
    const quote = await db.quotes.get(id);
    if (!quote) return;
    const invId = await db.invoices.add({ ...quote, status: 'Paid', date: new Date().toISOString().split('T')[0] });
    for (let item of quote.items) {
        const svc = await db.services.get(item.id);
        if (svc && svc.inventory) { await db.services.update(item.id, { inventory: svc.inventory - item.qty }); }
    }
    await db.quotes.delete(id);
    previewDocument('invoice', invId);
}

async function previewDocument(type, id) {
    const doc = type === 'invoice' ? await db.invoices.get(id) : await db.quotes.get(id);
    const cust = await db.customers.get(doc.customerId);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html><head><title>${type.toUpperCase()} #${id}</title><link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></head><body class="bg-gray-50 p-12"><div class="max-w-4xl mx-auto bg-white p-12 shadow-2xl border-t-8 border-blue-900"><div class="flex justify-between mb-12"><div><h1 class="text-4xl font-black text-blue-900">${systemSettings.companyName}</h1><p class="text-gray-400 font-bold uppercase">${systemSettings.tagline}</p></div><div class="text-right text-blue-900"><h2 class="text-5xl font-black uppercase">${type}</h2><p class="font-bold">#${id}</p></div></div><div class="grid grid-cols-2 gap-8 mb-12"><div class="bg-gray-50 p-6 rounded-2xl"><h4 class="text-xs font-black text-gray-400 uppercase">Provider</h4><p class="font-black">${systemSettings.companyName}</p><p class="text-xs">${systemSettings.address}<br>Tel: ${systemSettings.phone}</p></div><div class="bg-blue-900 p-6 rounded-2xl text-white"><h4 class="text-xs font-black text-white/30 uppercase">Client</h4><p class="font-black">${cust.name}</p><p class="text-xs">${cust.address || ''}<br>Contact: ${cust.phone}</p></div></div><table class="w-full mb-12 text-blue-900"><thead><tr class="bg-blue-900 text-white uppercase text-xs"><th class="p-4 text-left">Description</th><th>Price</th><th>Qty</th><th class="p-4 text-right">Total</th></tr></thead><tbody>${doc.items.map(i => `<tr class="border-b"><td class="p-4">${i.name}</td><td class="text-center">${i.price}</td><td class="text-center">${i.qty}</td><td class="p-4 text-right font-black">LKR ${i.subtotal}</td></tr>`).join('')}</tbody></table><div class="text-right"><p class="text-4xl font-black text-blue-900">Total: LKR ${doc.total.toLocaleString()}</p></div><div class="mt-12 text-center text-[10px] text-gray-400 font-bold uppercase"><p>${systemSettings.warrantyText}</p></div><div class="no-print mt-12 flex gap-4 justify-center"><button onclick="window.print()" class="bg-blue-900 text-white px-8 py-4 rounded-xl font-black">PRINT</button><button onclick="window.close()" class="bg-gray-100 px-8 py-4 rounded-xl font-black">CLOSE</button></div></div></body></html>
    `);
    printWindow.document.close();
}

async function deleteInvoice(id) { if (confirm("System Alert: Permanent deletion. Proceed?")) { await db.invoices.delete(id); renderInvoices(); } }
async function deleteQuote(id) { if (confirm("System Alert: Delete this quote?")) { await db.quotes.delete(id); renderQuotes(); } }

// --- Expense Tracking ---
async function renderExpenses() {
    setActiveNav('nav-expenses');
    document.getElementById('page-title').innerText = 'Expense Control';
    const expenses = await db.expenses.toArray();
    const content = document.getElementById('app-content');

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <p class="text-sm font-black text-gray-500 uppercase tracking-widest ml-2"><i class="fa-solid fa-receipt text-red-500 mr-2"></i> Total Outflow: LKR ${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</p>
                <button onclick="openAddExpenseModal()" class="btn btn-error text-white font-black shadow-lg"> <i class="fa-solid fa-minus-circle mr-2"></i> RECORD EXPENSE </button>
            </div>
            <div class="glass-card bg-white p-6">
                <table class="table w-full">
                    <thead><tr class="text-[10px] text-gray-400 border-b uppercase font-black"><th>Date</th><th>Category</th><th>Description</th><th class="text-right">Amount</th><th></th></tr></thead>
                    <tbody class="text-xs font-bold">
                        ${expenses.reverse().map(e => `
                            <tr class="border-b border-gray-50 hover:bg-gray-50"><td>${new Date(e.date).toLocaleDateString()}</td><td>${e.category}</td><td class="uppercase">${e.description}</td><td class="text-right text-red-500 font-black">LKR ${e.amount.toLocaleString()}</td><td class="text-right"><button onclick="deleteExpense(${e.id})" class="text-gray-200 hover:text-red-400"><i class="fa-solid fa-circle-minus"></i></button></td></tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function openAddExpenseModal() {
    const custs = await db.customers.toArray();
    openModal('Record Business Expense', `
        <div class="space-y-4 text-left">
            <div class="form-control"><label class="label text-xs font-black text-gray-400">Classification</label><select id="exp-cat" class="select select-bordered h-14 rounded-2xl font-bold"><option>General Business</option><option>Utilities / Bills</option><option>Spare Parts Purchase</option><option>Customer Specific Spare</option></select></div>
            <div id="customer-link-container" class="form-control hidden"><label class="label text-xs font-black text-gray-400">Link Customer</label><select id="exp-cust-link" class="select select-bordered h-14 rounded-2xl font-bold">${custs.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
            <div class="form-control"><label class="label text-xs font-black text-gray-400">Description</label><input type="text" id="exp-desc" class="input input-bordered h-14 rounded-2xl font-bold" required /></div>
            <div class="grid grid-cols-2 gap-4"><div class="form-control"><label class="label text-xs font-black text-gray-400">Amount</label><input type="number" id="exp-amt" class="input input-bordered h-14 rounded-2xl font-bold text-red-600" required /></div><div class="form-control"><label class="label text-xs font-black text-gray-400">Date</label><input type="date" id="exp-date" class="input input-bordered h-14 rounded-2xl font-bold" value="${new Date().toISOString().split('T')[0]}" /></div></div>
        </div>
    `, 'saveExpense()');
    document.getElementById('exp-cat').addEventListener('change', (e) => { document.getElementById('customer-link-container').classList.toggle('hidden', e.target.value !== 'Customer Specific Spare'); });
}

async function saveExpense() {
    const data = { description: document.getElementById('exp-desc').value.trim(), amount: parseFloat(document.getElementById('exp-amt').value), category: document.getElementById('exp-cat').value, date: document.getElementById('exp-date').value, linkedCustomerId: document.getElementById('exp-cust-link').value || null };
    if (!data.description || isNaN(data.amount)) return alert("Error: details incomplete.");
    await db.expenses.add(data); closeModal(); renderExpenses();
}
async function deleteExpense(id) { if (confirm("Delete record?")) { await db.expenses.delete(id); renderExpenses(); } }

// --- Reports Section ---
async function renderReports() {
    setActiveNav('nav-reports');
    document.getElementById('page-title').innerText = 'Financial Intelligence';
    const content = document.getElementById('app-content');
    const invoices = await db.invoices.toArray();
    const expenses = await db.expenses.toArray();
    const totalRev = invoices.reduce((s, i) => s + i.total, 0);
    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = totalRev - totalExp;

    content.innerHTML = `
        <div class="animate-fade-in space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="glass-card p-8 bg-blue-50">Revenue: LKR ${totalRev.toLocaleString()}</div>
                <div class="glass-card p-8 bg-red-50">Expense: LKR ${totalExp.toLocaleString()}</div>
                <div class="glass-card p-8 ${netProfit >= 0 ? 'bg-green-600' : 'bg-orange-600'} text-white">Profit: LKR ${netProfit.toLocaleString()}</div>
            </div>
            <div class="glass-card p-8 bg-white h-80"><canvas id="main-report-chart"></canvas></div>
        </div>
    `;
    setTimeout(() => initReportChart(invoices, expenses), 100);
}

function initReportChart(inv, exp) {
    const ctx = document.getElementById('main-report-chart')?.getContext('2d');
    if (!ctx) return;
    const labels = []; const dataRev = []; const dataExp = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        labels.push(d.toLocaleString('en-US', { month: 'short' }));
        dataRev.push(inv.filter(x => new Date(x.date).getMonth() === d.getMonth()).reduce((s, x) => s + x.total, 0));
        dataExp.push(exp.filter(x => new Date(x.date).getMonth() === d.getMonth()).reduce((s, x) => s + x.amount, 0));
    }
    new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Revenue', data: dataRev, backgroundColor: '#2563eb' }, { label: 'Expense', data: dataExp, backgroundColor: '#ef4444' }] }, options: { responsive: true, maintainAspectRatio: false } });
}

// --- Settings & Utilities ---
async function renderSettings() {
    setActiveNav('nav-settings');
    document.getElementById('page-title').innerText = 'System Configuration';
    const content = document.getElementById('app-content');
    content.innerHTML = `
        <div class="animate-fade-in space-y-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="glass-card p-8 bg-white space-y-4">
                <h3 class="font-black border-b pb-2 uppercase">Business Info</h3>
                <div class="form-control"><label class="label text-xs uppercase font-black">Company Name</label><input type="text" id="set-name" value="${systemSettings.companyName}" class="input input-bordered h-12 rounded-xl font-bold uppercase" /></div>
                <div class="form-control"><label class="label text-xs uppercase font-black">Address</label><input type="text" id="set-addr" value="${systemSettings.address}" class="input input-bordered h-12 rounded-xl font-bold" /></div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-control"><label class="label text-xs uppercase font-black">Phone</label><input type="text" id="set-phone" value="${systemSettings.phone}" class="input input-bordered h-12 rounded-xl font-bold" /></div>
                    <div class="form-control"><label class="label text-xs uppercase font-black">Theme</label><select id="set-theme" class="select select-bordered h-12 rounded-xl font-bold"><option value="light" ${systemSettings.theme === 'light' ? 'selected' : ''}>Light</option><option value="dark" ${systemSettings.theme === 'dark' ? 'selected' : ''}>Dark</option></select></div>
                </div>
                <button onclick="saveSettings()" class="btn btn-primary w-full h-14 rounded-xl font-black uppercase text-white mt-4">Save All Configuration</button>
            </div>
            <div class="glass-card p-8 bg-white text-center">
                 <h3 class="font-black border-b pb-2 uppercase mb-6">Logo & Branding</h3>
                 <div class="avatar mb-6"><div class="w-24 h-24 rounded-3xl bg-gray-50 flex items-center justify-center border-2 border-dashed overflow-hidden">${systemSettings.logo ? `<img src="${systemSettings.logo}">` : '<i class="fa-solid fa-cloud-arrow-up text-3xl text-gray-200"></i>'}</div></div>
                 <label class="btn btn-outline btn-sm font-black uppercase rounded-xl">Upload Logo <input type="file" class="hidden" onchange="handleFileUpload(this, 'logo')" /></label>
            </div>
        </div>
    `;
}

function handleFileUpload(input, key) { const file = input.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function (e) { systemSettings[key] = e.target.result; renderSettings(); updateUIElements(); }; reader.readAsDataURL(file); }
async function saveSettings() {
    systemSettings.companyName = document.getElementById('set-name').value;
    systemSettings.address = document.getElementById('set-addr').value;
    systemSettings.phone = document.getElementById('set-phone').value;
    systemSettings.theme = document.getElementById('set-theme').value;
    await db.settings.put({ id: 'config', ...systemSettings });
    applyThemeSettings(); updateUIElements(); alert("Settings saved.");
}

function initCalculator() {
    const calc = document.getElementById('calculator-container');
    calc.innerHTML = `<button onclick="toggleFloatCalc()" class="w-14 h-14 bg-blue-900 text-white rounded-full shadow-2lg flex items-center justify-center text-xl font-black border-2 border-white/20"><i class="fa-solid fa-calculator"></i></button><div id="float-calc-box" class="hidden absolute bottom-20 right-0 bg-gray-900 p-4 rounded-3xl w-64 shadow-2xl border border-white/10"><input type="text" id="calc-display" class="w-full bg-black/50 text-right text-2xl font-black text-green-400 p-4 rounded-xl mb-4" readonly><div class="grid grid-cols-4 gap-2">${['C', '/', '*', 'DEL', 7, 8, 9, '-', 4, 5, 6, '+', 1, 2, 3, '=', 0, '.'].map(k => `<button class="btn btn-ghost text-white text-lg font-bold" onclick="calcAction('${k}')">${k}</button>`).join('')}</div></div>`;
}

function toggleFloatCalc() { document.getElementById('float-calc-box').classList.toggle('hidden'); }
let calcValue = '';
function calcAction(val) {
    const disp = document.getElementById('calc-display');
    if (val === 'C') calcValue = '';
    else if (val === '=') { try { calcValue = eval(calcValue).toString(); } catch (e) { calcValue = 'Error'; } }
    else if (val === 'DEL') calcValue = calcValue.slice(0, -1);
    else calcValue += val;
    disp.value = calcValue;
}

function openModal(title, bodyHTML, onConfirmAction = null) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `<div id="main-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4"><div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl animate-fade-in overflow-hidden"><div class="p-8 border-b flex justify-between items-center bg-gray-50/50"><h3 class="text-2xl font-black text-blue-900 uppercase italic">${title}</h3><button onclick="closeModal()" class="btn btn-ghost btn-circle btn-sm"><i class="fa-solid fa-xmark"></i></button></div><div class="p-8 max-h-[70vh] overflow-y-auto">${bodyHTML}</div><div class="p-8 border-t flex justify-end gap-3 bg-gray-50/50"><button onclick="closeModal()" class="btn btn-ghost font-black uppercase text-xs">Cancel</button>${onConfirmAction ? `<button onclick="${onConfirmAction}" class="btn btn-primary font-black uppercase text-xs px-10">Proceed Task</button>` : ''}</div></div></div>`;
}
function closeModal() { document.getElementById('modal-container').innerHTML = ''; }

async function checkStorageHealth() {
    const hb = document.getElementById('storage-health-bar'); if (!hb) return;
    const isPersisted = await navigator.storage.persist();
    hb.innerHTML = `<div class="glass-card p-4 flex items-center justify-between border-2 ${isPersisted ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200 animate-pulse'}"><div class="flex items-center gap-4"><div class="w-10 h-10 rounded-full ${isPersisted ? 'bg-green-500' : 'bg-orange-500'} text-white flex items-center justify-center shadow-lg"><i class="fa-solid ${isPersisted ? 'fa-shield-check' : 'fa-triangle-exclamation'}"></i></div><div><h4 class="font-black text-gray-800 uppercase italic text-sm">Persistence: ${isPersisted ? 'SECURE' : 'AT RISK'}</h4><p class="text-[10px] uppercase font-bold text-gray-400">Status Verified</p></div></div><button onclick="exportData()" class="btn btn-ghost btn-xs text-primary font-black">BACKUP NOW</button></div>`;
}

async function exportData() {
    const data = { customers: await db.customers.toArray(), services: await db.services.toArray(), invoices: await db.invoices.toArray(), quotes: await db.quotes.toArray(), jobs: await db.jobs.toArray(), expenses: await db.expenses.toArray(), settings: await db.settings.toArray() };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Backup_${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url);
}

function updateCreationCustomer(select) { }
