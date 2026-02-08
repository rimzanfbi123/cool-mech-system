
// Application Logic for Cool Mech Service

// --- Global State ---
let currentView = 'dashboard';
let invoiceItems = []; // For temporary invoice creation
let systemSettings = {
    companyName: 'COOL MECH SERVICES',
    address: 'Colombo, Sri Lanka',
    phone: '0773919281',
    email: 'infocoolmech@gmail.com',
    tagline: 'Reliable HVAC & Electrical Services',
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
            systemSettings = { ...systemSettings, ...storedSettings }; // Merge defaults
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

function initApp() {
    document.getElementById('login-screen')?.remove();
    document.getElementById('main-app').classList.remove('hidden');
    updateLogoDisplay();
    updateProfileDisplay();
    updateDate();
    renderDashboard();
}

function renderLoginScreen() {
    document.getElementById('main-app').classList.add('hidden');

    const loginDiv = document.createElement('div');
    loginDiv.id = 'login-screen';
    loginDiv.className = 'fixed inset-0 bg-gray-100 flex items-center justify-center z-50 animate-fade-in';
    loginDiv.innerHTML = `
        <div class="glass-card p-10 w-full max-w-sm text-center">
            <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-sm">
                <i class="fa-solid fa-shield-halved text-4xl"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-800 mb-2">CMS Suit System</h1>
            <p class="text-gray-500 mb-8 text-sm">Secure Login</p>
            
            <form onsubmit="handleLogin(event)" class="space-y-4">
                <div class="form-control">
                    <input type="text" id="login-user" placeholder="Username" class="input input-bordered w-full" required />
                </div>
                <div class="form-control">
                    <input type="password" id="login-pass" placeholder="Password" class="input input-bordered w-full" required />
                </div>
                <button type="submit" class="btn btn-primary w-full text-white">Sign In to System</button>
            </form>
             <p class="text-xs text-gray-400 mt-6">System Secured</p>
        </div>
    `;
    document.body.appendChild(loginDiv);
}

async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    // In a real app, hash passwords. Here, simple comparison.
    if (user === systemSettings.username && pass === systemSettings.password) {
        sessionStorage.setItem('coolmech_auth', 'true');
        initApp();
    } else {
        alert("Invalid Username or Password!");
    }
}

function logout() {
    sessionStorage.removeItem('coolmech_auth');
    window.location.reload();
}

function toggleTheme() {
    const newTheme = systemSettings.theme === 'light' ? 'dark' : 'light';
    systemSettings.theme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    db.settings.update('config', { theme: newTheme });
}

function updateLogoDisplay() {
    const container = document.getElementById('sidebar-logo-container');
    if (systemSettings.logo) {
        container.innerHTML = `<img src="${systemSettings.logo}" alt="Logo" class="w-full h-auto rounded-lg shadow-sm mb-4">`;
    } else {
        container.innerHTML = '';
    }
}

function updateProfileDisplay() {
    const pContainer = document.getElementById('sidebar-profile');
    if (pContainer) {
        const photo = systemSettings.profilePhoto || 'https://ui-avatars.com/api/?name=Admin+User&background=0ea5e9&color=fff';
        pContainer.innerHTML = `
            <div class="flex items-center gap-3 px-4 py-3 text-gray-500 border-t border-gray-100 mt-4 cursor-pointer hover:bg-gray-50 transition-colors" onclick="renderSettings()">
                <div class="avatar">
                    <div class="w-10 h-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        <img src="${photo}" />
                    </div>
                </div>
                <div class="text-sm">
                    <p class="font-bold text-gray-700">${systemSettings.username}</p> <!-- Username shown -->
                    <p class="text-xs text-green-500">● Online</p>
                </div>
            </div>
             <button onclick="logout()" class="btn btn-ghost btn-xs w-full text-red-400 mt-2 gap-2"><i class="fa-solid fa-sign-out-alt"></i> Logout</button>
        `;
    }
}

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-US', options);
}

// --- Navigation ---
function setActiveNav(id) {
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active', 'bg-blue-50', 'text-blue-600');
    });
    const navItem = document.getElementById(id);
    if (navItem) {
        navItem.classList.add('active', 'bg-blue-50', 'text-blue-600');
    }
}

// --- Dashboard Component ---
async function renderDashboard() {
    setActiveNav('nav-dashboard');
    const content = document.getElementById('app-content');

    // Fetch Data
    const customerCount = await db.customers.count();
    const serviceCount = await db.services.count();
    const invoices = await db.invoices.toArray();
    const totalRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
    const pendingInvoices = invoices.filter(i => i.status === 'pending').length;
    // Low stock warnings
    const lowStock = await db.services.filter(s => s.type === 'part' && (s.inventory || 0) < 5).toArray();

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="stat glass-card p-6">
                    <div class="stat-figure text-blue-500">
                        <i class="fa-solid fa-users text-3xl"></i>
                    </div>
                    <div class="stat-title text-gray-500 font-medium">Total Customers</div>
                    <div class="stat-value text-gray-800 text-3xl font-bold">${customerCount}</div>
                    <div class="stat-desc text-blue-400">↗︎ Business Growing</div>
                </div>
                
                <div class="stat glass-card p-6">
                    <div class="stat-figure text-emerald-500">
                        <i class="fa-solid fa-sack-dollar text-3xl"></i>
                    </div>
                    <div class="stat-title text-gray-500 font-medium">Total Revenue</div>
                    <div class="stat-value text-gray-800 text-3xl font-bold">LKR ${totalRevenue.toLocaleString()}</div>
                    <div class="stat-desc text-emerald-500">↗︎ Cash flow healthy</div>
                </div>

                <div class="stat glass-card p-6">
                    <div class="stat-figure text-orange-500">
                        <i class="fa-solid fa-file-invoice text-3xl"></i>
                    </div>
                    <div class="stat-title text-gray-500 font-medium">Pending Invoices</div>
                    <div class="stat-value text-gray-800 text-3xl font-bold">${pendingInvoices}</div>
                    <div class="stat-desc text-orange-400">Needs attention</div>
                </div>
                 
                 <div class="stat glass-card p-6 ${lowStock.length > 0 ? 'bg-red-50 border-red-200' : ''}">
                    <div class="stat-figure text-purple-500">
                        <i class="fa-solid fa-boxes-stacked text-3xl"></i>
                    </div>
                    <div class="stat-title text-gray-500 font-medium">Inventory Alerts</div>
                    <div class="stat-value text-gray-800 text-3xl font-bold">${lowStock.length}</div>
                    <div class="stat-desc text-red-500 font-bold">${lowStock.length > 0 ? 'Low Stock Items!' : 'All good'}</div>
                </div>
            </div>

            <!-- Recent Activity Section -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="glass-card p-6 lg:col-span-2">
                    <h3 class="font-bold text-lg mb-4 text-gray-700">Recent Invoices</h3>
                    <div class="overflow-x-auto">
                        <table class="table w-full custom-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoices.slice(-5).reverse().map(inv => `
                                    <tr>
                                        <td class="font-mono text-xs">#INV-${inv.id}</td>
                                        <td>${inv.customerName || 'Unknown'}</td>
                                        <td class="font-medium">LKR ${inv.total}</td>
                                        <td><span class="status-badge ${inv.status === 'paid' ? 'status-paid' : 'status-pending'}">${inv.status}</span></td>
                                    </tr>
                                `).join('')}
                                ${invoices.length === 0 ? '<tr><td colspan="4" class="text-center text-gray-400 py-4">No recent invoices</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                 <div class="glass-card p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-white to-blue-50/50">
                    <h3 class="font-bold text-lg text-gray-800 mb-4">Quick Actions</h3>
                    <div class="grid grid-cols-1 gap-3 w-full">
                        <button onclick="renderCreateInvoice()" class="btn btn-primary text-white w-full gap-2 shadow-md">
                             <i class="fa-solid fa-plus"></i> New Invoice
                        </button>
                        <button onclick="renderCustomers(); openAddCustomerModal()" class="btn btn-outline btn-primary w-full gap-2">
                            <i class="fa-solid fa-user-plus"></i> Add Customer
                        </button>
                        <button onclick="renderReports()" class="btn btn-outline btn-info w-full gap-2">
                            <i class="fa-solid fa-chart-line"></i> View Reports
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- Customer Component ---
async function renderCustomers() {
    setActiveNav('nav-customers');
    const content = document.getElementById('app-content');
    const customers = await db.customers.toArray();

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                     <h2 class="text-lg font-bold text-gray-800">Customer Directory</h2>
                     <p class="text-sm text-gray-500">Manage clients & Communication</p>
                </div>
                <button onclick="openAddCustomerModal()" class="btn btn-primary btn-sm text-white gap-2">
                    <i class="fa-solid fa-user-plus"></i> Add Customer
                </button>
            </div>

            <div class="glass-card overflow-hidden">
                <table class="table w-full custom-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customers.map(c => `
                            <tr class="hover:bg-gray-50 transition-colors">
                                <td class="font-medium text-gray-700">
                                    <div class="flex items-center gap-3">
                                        <div class="avatar placeholder">
                                            <div class="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold">
                                                ${c.name.charAt(0)}
                                            </div>
                                        </div>
                                        <div>
                                            <div class="font-bold">${c.name}</div>
                                            <div class="text-xs text-gray-500 truncate max-w-[150px]">${c.address}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="flex gap-2">
                                        <button onclick="logCommunication('call', '${c.name}', '${c.phone}')" class="btn btn-circle btn-xs btn-outline btn-success tooltip" data-tip="Call">
                                            <i class="fa-solid fa-phone"></i>
                                        </button>
                                        <button onclick="openMessageModal('${c.name}', '${c.phone}')" class="btn btn-circle btn-xs btn-outline btn-info tooltip" data-tip="SMS">
                                            <i class="fa-solid fa-comment-sms"></i>
                                        </button>
                                        <!-- WhatsApp Link -->
                                        <a href="https://wa.me/${c.phone.replace(/[^0-9]/g, '')}" target="_blank" onclick="logCommunication('whatsapp', '${c.name}', '${c.phone}', 'Chat opened')" class="btn btn-circle btn-xs btn-outline btn-success tooltip" data-tip="WhatsApp">
                                            <i class="fa-brands fa-whatsapp"></i>
                                        </a>
                                         <button onclick="openEmailModal('${c.name}', '${c.email || ''}')" class="btn btn-circle btn-xs btn-outline btn-warning tooltip" data-tip="Email">
                                            <i class="fa-solid fa-envelope"></i>
                                        </button>
                                    </div>
                                    <div class="text-xs font-mono mt-1 text-gray-500">${c.phone}</div>
                                </td>
                                <td>
                                    <button class="btn btn-ghost btn-xs text-blue-500" onclick="editCustomer(${c.id})"><i class="fa-solid fa-pen"></i></button>
                                    <button class="btn btn-ghost btn-xs text-red-500" onclick="deleteCustomer(${c.id})"><i class="fa-solid fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                        ${customers.length === 0 ? '<tr><td colspan="4" class="text-center py-10 text-gray-400">No customers found.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// --- Communication Logic ---
async function logCommunication(type, targetName, targetContact, details = '') {
    // 1. Log to DB
    await db.logs.add({
        type,
        target: `${targetName} (${targetContact})`,
        details: details || `Performed ${type}`,
        date: new Date().toLocaleString()
    });

    // 2. Perform action
    if (type === 'call') {
        window.location.href = `tel:${targetContact}`;
    }
}

function openMessageModal(name, phone) {
    if (!phone) return alert("No phone number available");
    openModal(`Send SMS to ${name}`, `
        <div class="form-control">
            <label class="label">Message</label>
            <textarea id="sms-body" class="textarea textarea-bordered h-24">Hello ${name}, this is regarding your service from Cool Mech.</textarea>
        </div>
        <div class="alert alert-info shadow-sm mt-4 text-xs">
            <i class="fa-solid fa-info-circle"></i> This will open your default SMS app.
        </div>
    `, `sendSMS('${phone}')`);
}

function sendSMS(phone) {
    const body = document.getElementById('sms-body').value;
    logCommunication('sms', 'Customer', phone, body);
    window.location.href = `sms:${phone}?body=${encodeURIComponent(body)}`;
    closeModal();
}

function openEmailModal(name, email) {
    // if(!email) return alert("No email address available for this customer.");
    openModal(`Send Email to ${name}`, `
        <div class="form-control">
            <label class="label">To</label>
            <input type="email" id="email-to" value="${email || ''}" class="input input-bordered" placeholder="customer@example.com">
        </div>
         <div class="form-control">
            <label class="label">Subject</label>
            <input type="text" id="email-subject" value="Invoice from Cool Mech" class="input input-bordered">
        </div>
        <div class="form-control">
            <label class="label">Message Body</label>
            <textarea id="email-body" class="textarea textarea-bordered h-24">Dear ${name},\n\nPlease find attached the invoice for the recent service.\n\nBest regards,\nCool Mech Services</textarea>
        </div>
    `, `sendEmail()`);
}

function sendEmail() {
    const to = document.getElementById('email-to').value;
    const subject = document.getElementById('email-subject').value;
    const body = document.getElementById('email-body').value;

    if (!to) return alert("Email address required");

    logCommunication('email', 'Customer', to, subject);
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    closeModal();
}

// --- Service & Stock Component ---
async function renderServices() {
    setActiveNav('nav-services');
    const content = document.getElementById('app-content');
    const services = await db.services.toArray();

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                     <h2 class="text-lg font-bold text-gray-800">Services & Inventory</h2>
                     <p class="text-sm text-gray-500">Manage prices & stock levels</p>
                </div>
                <button onclick="openAddServiceModal()" class="btn btn-primary btn-sm text-white gap-2">
                    <i class="fa-solid fa-plus"></i> Add Item
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${services.map(s => `
                    <div class="glass-card p-4 flex flex-col justify-between relative group hover:shadow-lg transition-shadow border-l-4 ${s.type === 'part' && (s.inventory || 0) < 5 ? 'border-red-400' : 'border-transparent'}">
                        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button onclick="editService(${s.id})" class="btn btn-circle btn-xs btn-ghost text-blue-500"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deleteService(${s.id})" class="btn btn-circle btn-xs btn-ghost text-red-500"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <div>
                            <span class="badge ${s.type === 'service' ? 'badge-primary' : 'badge-secondary'} badge-outline mb-2 text-xs uppercase">${s.type}</span>
                            <h3 class="font-bold text-gray-800 text-lg">${s.name}</h3>
                             ${s.type === 'part' ? `<div class="text-xs text-gray-500 mt-1">Stock: <span class="font-bold ${(s.inventory || 0) < 5 ? 'text-red-500' : 'text-green-600'}">${s.inventory || 0} units</span></div>` : ''}
                        </div>
                        <div class="mt-4 flex justify-between items-end border-t border-gray-100 pt-3">
                            <span class="text-gray-400 text-xs uppercase font-bold tracking-wider">Price</span>
                            <span class="text-xl font-bold text-blue-600">LKR ${parseFloat(s.price).toFixed(2)}</span>
                        </div>
                    </div>
                `).join('')}
                 ${services.length === 0 ? '<div class="col-span-full text-center py-10 text-gray-400">No services added yet.</div>' : ''}
            </div>
        </div>
    `;
}

// --- Reports Component ---
async function renderReports() {
    // setActiveNav('nav-reports'); // Need to add to html side first? No, dynamically handle.
    const content = document.getElementById('app-content');

    const invoices = await db.invoices.toArray();
    const expenses = await db.expenses.toArray();
    const logs = await db.logs.reverse().limit(20).toArray(); // Communication logs

    // Calc totals
    const totalRevenue = invoices.reduce((sum, i) => sum + parseFloat(i.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
             <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                     <h2 class="text-lg font-bold text-gray-800">Business Reports</h2>
                     <p class="text-sm text-gray-500">Insights & History</p>
                </div>
                <button onclick="window.print()" class="btn btn-ghost btn-sm gap-2">
                    <i class="fa-solid fa-print"></i> Print Report
                </button>
            </div>

            <!-- Profit Loss -->
             <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="glass-card p-6 border-l-4 border-green-500">
                    <h3 class="text-gray-500 text-sm font-bold uppercase">Total Income</h3>
                    <div class="text-2xl font-bold text-green-600">LKR ${totalRevenue.toLocaleString()}</div>
                </div>
                 <div class="glass-card p-6 border-l-4 border-red-500">
                    <h3 class="text-gray-500 text-sm font-bold uppercase">Total Expenses</h3>
                    <div class="text-2xl font-bold text-red-500">LKR ${totalExpenses.toLocaleString()}</div>
                </div>
                 <div class="glass-card p-6 border-l-4 ${netProfit >= 0 ? 'border-blue-500' : 'border-orange-500'}">
                    <h3 class="text-gray-500 text-sm font-bold uppercase">Net Profit</h3>
                    <div class="text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-500'}">LKR ${netProfit.toLocaleString()}</div>
                </div>
            </div>

            <!-- Communication Log -->
            <div class="glass-card p-6 mt-6">
                <h3 class="font-bold text-lg mb-4 text-gray-700 border-b pb-2">Communication History (Sent from System)</h3>
                <table class="table w-full custom-table text-xs">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Target</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(l => `
                            <tr>
                                <td>${l.date}</td>
                                <td class="uppercase font-bold text-gray-500">${l.type}</td>
                                <td>${l.target}</td>
                                <td class="text-gray-400 italic">${l.details}</td>
                            </tr>
                        `).join('')}
                         ${logs.length === 0 ? '<tr><td colspan="4" class="text-center py-4">No calls/messages sent yet.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// --- Invoice Component ---
async function renderInvoices() {
    setActiveNav('nav-invoices');
    const content = document.getElementById('app-content');
    const invoices = await db.invoices.reverse().toArray();

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
             <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                     <h2 class="text-lg font-bold text-gray-800">Invoices & Quotes</h2>
                     <p class="text-sm text-gray-500">Billing history</p>
                </div>
                <button onclick="renderCreateInvoice()" class="btn btn-primary btn-sm text-white gap-2">
                    <i class="fa-solid fa-plus"></i> New Invoice
                </button>
            </div>

             <div class="glass-card overflow-hidden">
                <table class="table w-full custom-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Invoice #</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoices.map(inv => `
                            <tr>
                                <td class="text-gray-500 text-sm">${inv.date}</td>
                                <td class="font-mono font-bold">#INV-${inv.id}</td>
                                <td class="font-medium">
                                    ${inv.customerName}
                                    <div class="text-xs text-gray-400">${inv.jobDescription ? inv.jobDescription.substring(0, 20) + '...' : ''}</div>
                                </td>
                                <td class="font-bold">LKR ${inv.total}</td>
                                <td><span class="status-badge ${inv.status === 'paid' ? 'status-paid' : 'status-pending'}">${inv.status}</span></td>
                                <td>
                                    <button onclick="viewInvoice(${inv.id})" class="btn btn-square btn-ghost btn-xs text-blue-500 tooltip" data-tip="View/Print"><i class="fa-solid fa-eye"></i></button>
                                     <button onclick="deleteInvoice(${inv.id})" class="btn btn-square btn-ghost btn-xs text-red-500 tooltip" data-tip="Delete"><i class="fa-solid fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                        ${invoices.length === 0 ? '<tr><td colspan="7" class="text-center py-10 text-gray-400">No invoices yet.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function renderCreateInvoice() {
    setActiveNav('nav-invoices');
    const content = document.getElementById('app-content');
    const customers = await db.customers.toArray();
    const services = await db.services.toArray();

    // Reset temporary items
    invoiceItems = [];

    content.innerHTML = `
        <div class="animate-fade-in max-w-5xl mx-auto space-y-6">
            <div class="flex items-center gap-4 mb-6">
                <button onclick="renderInvoices()" class="btn btn-circle btn-ghost"><i class="fa-solid fa-arrow-left"></i></button>
                <h2 class="text-2xl font-bold text-gray-800">New Invoice</h2>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Settings Panel -->
                <div class="glass-card p-6 md:col-span-1 space-y-4 h-fit">
                    <div class="form-control">
                        <label class="label font-bold text-gray-600">Customer</label>
                        <select id="inv-customer" class="select select-bordered w-full">
                            <option value="">Select Customer</option>
                            ${customers.map(c => `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`).join('')}
                        </select>
                         <button onclick="openAddCustomerModal()" class="btn btn-xs btn-link no-underline text-blue-500 mt-1">+ Add New</button>
                    </div>

                    <div class="form-control">
                        <label class="label font-bold text-gray-600">Date</label>
                        <input type="date" id="inv-date" class="input input-bordered w-full" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                
                    <div class="form-control">
                         <label class="label font-bold text-gray-600">Status</label>
                        <select id="inv-status" class="select select-bordered w-full">
                            <option value="pending">Unpaid (Pending)</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>

                    <div class="form-control">
                         <label class="label font-bold text-gray-600">Job Description</label>
                         <textarea id="inv-desc" class="textarea textarea-bordered h-24" placeholder="Fixed capacitor..."></textarea>
                    </div>
                </div>

                <!-- Items Panel -->
                <div class="glass-card p-6 md:col-span-2 flex flex-col h-full">
                    <h3 class="font-bold text-gray-700 mb-4 border-b border-gray-100 pb-2">Line Items</h3>
                    
                    <div class="flex gap-2 mb-4">
                        <select id="item-select" class="select select-bordered select-sm flex-1">
                            <option value="">Select Service / Part...</option>
                            ${services.map(s => `<option value="${s.id}" data-price="${s.price}" data-name="${s.name}">${s.name} (LKR ${s.price})</option>`).join('')}
                        </select>
                        <input type="number" id="item-qty" class="input input-bordered input-sm w-20" value="1" min="1" placeholder="Qty">
                        <button onclick="addItemToInvoice()" class="btn btn-sm btn-primary text-white"><i class="fa-solid fa-plus"></i></button>
                    </div>

                    <div class="overflow-x-auto flex-1 bg-gray-50 rounded-lg p-2 mb-4">
                        <table class="table w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody id="invoice-items-body">
                                <tr><td colspan="5" class="text-center text-gray-400">No items added</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="flex justify-between items-center border-t border-gray-200 pt-4">
                        <div class="text-right w-full">
                             <div class="text-sm text-gray-500">Grand Total</div>
                             <div class="text-3xl font-bold text-blue-600" id="invoice-total-display">LKR 0.00</div>
                        </div>
                    </div>
                    
                    <button onclick="saveInvoice()" class="btn btn-primary text-white w-full mt-6 shadow-lg shadow-blue-200">Save Invoice</button>
                </div>
            </div>
        </div>
    `;
}

function addItemToInvoice() {
    const select = document.getElementById('item-select');
    const qtyInput = document.getElementById('item-qty');

    if (!select.value) return alert("Select an item first");

    const option = select.options[select.selectedIndex];
    const item = {
        id: option.value,
        name: option.dataset.name,
        price: parseFloat(option.dataset.price),
        qty: parseInt(qtyInput.value)
    };

    invoiceItems.push(item);
    renderInvoiceItems();
}

function deleteInvoiceItem(index) {
    invoiceItems.splice(index, 1);
    renderInvoiceItems();
}

function renderInvoiceItems() {
    const tbody = document.getElementById('invoice-items-body');
    const totalDisplay = document.getElementById('invoice-total-display');
    let total = 0;

    if (invoiceItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-400">No items added</td></tr>';
    } else {
        tbody.innerHTML = invoiceItems.map((item, index) => {
            const rowTotal = item.price * item.qty;
            total += rowTotal;
            return `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>${item.price}</td>
                    <td class="font-bold">${rowTotal}</td>
                    <td><button onclick="deleteInvoiceItem(${index})" class="text-red-500 hover:text-red-700"><i class="fa-solid fa-times"></i></button></td>
                </tr>
            `;
        }).join('');
    }

    totalDisplay.innerText = `LKR ${total.toFixed(2)}`;
    totalDisplay.dataset.value = total;
}

async function saveInvoice() {
    const customerSelect = document.getElementById('inv-customer');
    const customerId = customerSelect.value;
    const customerName = customerSelect.options[customerSelect.selectedIndex]?.dataset.name;
    const date = document.getElementById('inv-date').value;
    const status = document.getElementById('inv-status').value;
    const jobDescription = document.getElementById('inv-desc').value;
    const total = parseFloat(document.getElementById('invoice-total-display').dataset.value || 0);

    if (!customerId) return alert("Please select a customer");
    if (invoiceItems.length === 0) return alert("Add at least one item");

    const invoice = {
        customerId,
        customerName,
        date,
        status,
        jobDescription,
        items: invoiceItems,
        total: total.toFixed(2),
        type: 'invoice' // quote vs invoice could be a toggle
    };

    // 1. Save Invoice
    await db.invoices.add(invoice);

    // 2. Update Inventory (Deduct Stock)
    for (const item of invoiceItems) {
        // Find if this item exists in services and track inventory
        const serviceItem = await db.services.get(parseInt(item.id));
        if (serviceItem && serviceItem.type === 'part') {
            const newStock = (serviceItem.inventory || 0) - item.qty;
            await db.services.update(serviceItem.id, { inventory: newStock });
        }
    }

    alert("Invoice Saved Successfully!");
    renderInvoices();
}

async function deleteInvoice(id) {
    if (confirm('Delete this invoice?')) {
        await db.invoices.delete(id);
        renderInvoices();
    }
}

async function viewInvoice(id) {
    const invoice = await db.invoices.get(id);
    if (!invoice) return alert("Invoice not found");

    const isEstimate = invoice.type === 'estimate';
    const docTitle = isEstimate ? 'ESTIMATE' : 'INVOICE';
    const colorClass = isEstimate ? 'text-orange-600' : 'text-blue-600';
    const bgClass = isEstimate ? 'bg-orange-50' : 'bg-blue-50';
    const borderClass = isEstimate ? 'border-orange-200' : 'border-blue-200';

    // Dynamic Logo
    const logoHtml = systemSettings.logo ?
        `<img src="${systemSettings.logo}" style="max-height: 80px; width: auto; object-fit: contain;">` :
        `<h1 class="text-3xl font-extrabold text-gray-800 tracking-tight">${systemSettings.companyName}</h1>`;

    openModal(`${docTitle} #${invoice.id}`, `
        <div id="print-area" class="bg-white text-gray-800 font-sans" style="max-width: 800px; margin: 0 auto;">
            <!-- Top Decor Bar -->
            <div class="w-full h-4 ${isEstimate ? 'bg-orange-500' : 'bg-blue-600'} mb-8"></div>

            <div class="px-8 pb-8">
                <!-- Header Section -->
                <div class="flex justify-between items-start mb-10">
                    <div class="w-1/2">
                        ${logoHtml}
                        <div class="mt-4 text-sm text-gray-500 leading-relaxed">
                            <p class="font-bold text-gray-700 text-base">${systemSettings.companyName}</p>
                            <div class="whitespace-pre-line">${systemSettings.address}</div>
                            <p class="mt-2 text-gray-700 font-semibold"><i class="fa-solid fa-phone text-xs"></i> ${systemSettings.phone}</p>
                             <p class="text-gray-700"><i class="fa-solid fa-envelope text-xs"></i> ${systemSettings.email || ''}</p>
                        </div>
                    </div>
                    <div class="w-1/2 text-right">
                        <h1 class="text-5xl font-black ${colorClass} tracking-tighter opacity-100 mb-2">${docTitle}</h1>
                        <p class="text-gray-500 font-medium text-sm w-full"># ${docTitle.substring(0, 3)}-${invoice.id}</p>
                        
                        <div class="mt-6 inline-block text-left bg-gray-50 p-4 rounded-lg border border-gray-100 min-w-[200px]">
                            <div class="flex justify-between gap-4 mb-2">
                                <span class="text-xs font-bold text-gray-400 uppercase">Date</span>
                                <span class="text-sm font-bold text-gray-700">${invoice.date}</span>
                            </div>
                            <div class="flex justify-between gap-4">
                                <span class="text-xs font-bold text-gray-400 uppercase">Status</span>
                                <span class="badge ${invoice.status === 'paid' ? 'badge-success text-white' : 'badge-warning'} badge-sm uppercase text-[10px]">${invoice.status}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bill To Section -->
                <div class="flex gap-8 mb-10">
                    <div class="w-1/2">
                        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">Bill To</h3>
                        <p class="text-xl font-bold text-gray-800">${invoice.customerName}</p>
                        <p class="text-sm text-gray-500 mt-1 italic border-l-4 ${borderClass} pl-3 py-1 bg-gray-50/50 rounded-r">
                            ${invoice.jobDescription || 'Standard functionality check & service'}
                        </p>
                    </div>
                </div>

                <!-- Items Table -->
                <div class="mb-8 overflow-hidden rounded-lg border border-gray-200">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-gray-100 text-gray-600 border-b border-gray-200">
                                <th class="py-3 px-4 text-left font-bold uppercase text-xs w-12">#</th>
                                <th class="py-3 px-4 text-left font-bold uppercase text-xs">Description</th>
                                <th class="py-3 px-4 text-center font-bold uppercase text-xs w-20">Qty</th>
                                <th class="py-3 px-4 text-right font-bold uppercase text-xs w-32">Unit Price</th>
                                <th class="py-3 px-4 text-right font-bold uppercase text-xs w-32">Amount</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            ${invoice.items.map((item, index) => `
                                <tr class="hover:bg-gray-50/50">
                                    <td class="py-3 px-4 text-gray-400 text-xs font-mono">${index + 1}</td>
                                    <td class="py-3 px-4 text-gray-700 font-medium">${item.name}</td>
                                    <td class="py-3 px-4 text-center text-gray-600">${item.qty}</td>
                                    <td class="py-3 px-4 text-right text-gray-600 font-mono">${parseFloat(item.price).toFixed(2)}</td>
                                    <td class="py-3 px-4 text-right font-bold text-gray-800 font-mono">${(item.price * item.qty).toFixed(2)}</td>
                                </div>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Totals & Footer -->
                <div class="flex justify-end mb-12">
                   <div class="w-1/2 lg:w-1/3">
                        <div class="flex justify-between items-center mb-2 px-4">
                            <span class="text-sm text-gray-500">Subtotal</span>
                            <span class="text-sm font-bold text-gray-700">LKR ${invoice.total}</span>
                        </div>
                        <div class="flex justify-between items-center mb-4 px-4">
                            <span class="text-sm text-gray-500">Handling / Service</span>
                            <span class="text-sm font-bold text-gray-700">LKR 0.00</span>
                        </div>
                        <div class="${bgClass} p-4 rounded-lg flex justify-between items-center border ${borderClass}">
                            <span class="${colorClass} text-sm font-bold uppercase tracking-wider">Total Due</span>
                            <span class="${colorClass} text-2xl font-black">LKR ${invoice.total}</span>
                        </div>
                   </div>
                </div>

                <!-- Bottom Terms -->
                <div class="grid grid-cols-2 gap-8 mt-auto pt-8 border-t border-gray-100">
                    <div>
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Terms & Conditions</h4>
                        <p class="text-[10px] text-gray-500 leading-relaxed text-justify">
                            ${systemSettings.warrantyText ? systemSettings.warrantyText.replace(/\n/g, '<br>') : 'Warranty covers manufacturing defects only. Service calls are billable after 30 days. Logos and brands are properties of their respective owners.'}
                        </p>
                    </div>
                    <div class="text-center pt-8">
                         <div class="border-b border-gray-300 w-3/4 mx-auto mb-2"></div>
                         <p class="text-xs font-bold text-gray-400 uppercase">Authorized Signature</p>
                    </div>
                </div>
                
                <div class="text-center mt-8">
                     <p class="text-xs text-blue-300 italic font-medium">"${systemSettings.tagline || 'Thank you for your business!'}"</p>
                </div>
            </div>
        </div>

        <div class="flex justify-end gap-3 mt-4 no-print border-t pt-4">
             <button onclick="closeModal()" class="btn btn-ghost">Close</button>
            <button onclick="printDiv('print-area')" class="btn btn-primary text-white gap-2"><i class="fa-solid fa-print"></i> Print / Download PDF</button>
        </div>
    `);
}

function printDiv(divId) {
    const printContents = document.getElementById(divId).innerHTML;

    // Create an iframe to print content without losing event listeners or state
    let iframe = document.getElementById('print-frame');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'print-frame';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }

    iframe.contentDocument.write(`
        <html>
            <head>
                <title>Print Invoice</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; }
                    /* Ensure background colors print */
                    @media print {
                         .bg-gray-100 { background-color: #f3f4f6 !important; }
                         .bg-blue-600 { background-color: #2563eb !important; }
                         .bg-orange-500 { background-color: #f97316 !important; }
                         .bg-blue-50 { background-color: #eff6ff !important; }
                         .bg-gray-50 { background-color: #f9fafb !important; }
                         .text-white { color: white !important; }
                    }
                </style>
            </head>
            <body>
                ${printContents}
                <script>
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 500);
                </script>
            </body>
        </html>
    `);
    iframe.contentDocument.close();
}

// --- Expenses Component ---
async function renderExpenses() {
    setActiveNav('nav-expenses');
    const content = document.getElementById('app-content');
    const expenses = await db.expenses.toArray();

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                     <h2 class="text-lg font-bold text-gray-800">Expense Tracking</h2>
                     <p class="text-sm text-gray-500">Monitor business costs</p>
                </div>
                <button onclick="openAddExpenseModal()" class="btn btn-warning btn-sm text-white gap-2">
                    <i class="fa-solid fa-plus"></i> Add Expense
                </button>
            </div>

            <div class="glass-card overflow-hidden">
                <table class="table w-full custom-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expenses.map(e => `
                            <tr>
                                <td>${e.date}</td>
                                <td>${e.description}</td>
                                <td><span class="badge badge-ghost badge-sm">${e.category}</span></td>
                                <td class="font-bold text-red-500">- LKR ${e.amount}</td>
                                <td><button onclick="deleteExpense(${e.id})" class="btn btn-ghost btn-xs text-red-400"><i class="fa-solid fa-trash"></i></button></td>
                            </tr>
                        `).join('')}
                        ${expenses.length === 0 ? '<tr><td colspan="5" class="text-center py-10 text-gray-400">No expenses recorded.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// --- Settings Component ---
function renderSettings() {
    setActiveNav('nav-settings');
    const content = document.getElementById('app-content');

    content.innerHTML = `
        <div class="animate-fade-in max-w-3xl mx-auto">
            <div class="glass-card p-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">System Settings</h2>
                
                <div class="grid grid-cols-1 gap-6">
                    <!-- Company Info -->
                    <div class="form-control">
                        <label class="label font-bold text-gray-600">Company Name</label>
                        <input type="text" id="set-name" value="${systemSettings.companyName}" class="input input-bordered">
                    </div>

                     <div class="form-control">
                        <label class="label font-bold text-gray-600">Company Tagline</label>
                        <input type="text" id="set-tagline" value="${systemSettings.tagline}" class="input input-bordered" placeholder="e.g. Best HVAC in town">
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div class="form-control">
                            <label class="label font-bold text-gray-600">Phone</label>
                            <input type="text" id="set-phone" value="${systemSettings.phone}" class="input input-bordered">
                        </div>
                        <div class="form-control">
                             <label class="label font-bold text-gray-600">Logo Image URL</label>
                             <input type="text" id="set-logo" value="${systemSettings.logo}" class="input input-bordered" placeholder="http://... or assets/img/logo.png">
                             <label class="label">
                                <span class="label-text-alt text-gray-400">Put your logo in assets/img/logo.png and type that path here.</span>
                             </label>
                        </div>
                    </div>

                    <div class="form-control">
                        <label class="label font-bold text-gray-600">Address</label>
                        <textarea id="set-address" class="textarea textarea-bordered h-24">${systemSettings.address}</textarea>
                    </div>

                    <!-- Invoice Config -->
                    <div class="form-control">
                        <label class="label font-bold text-gray-600">Warranty / Invoice Footer Text</label>
                        <textarea id="set-warranty" class="textarea textarea-bordered h-24">${systemSettings.warrantyText}</textarea>
                    </div>

                    <div class="divider">User & Security</div>
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="form-control">
                            <label class="label font-bold text-gray-600">Login Username</label>
                            <input type="text" id="set-user" value="${systemSettings.username}" class="input input-bordered">
                        </div>
                        <div class="form-control">
                             <label class="label font-bold text-gray-600">Login Password</label>
                             <input type="password" id="set-pass" value="${systemSettings.password}" class="input input-bordered">
                        </div>
                         <div class="form-control">
                             <label class="label font-bold text-gray-600">Profile Photo URL</label>
                             <input type="text" id="set-profile" value="${systemSettings.profilePhoto}" class="input input-bordered" placeholder="assets/img/avatars/me.png">
                             <label class="label"><span class="label-text-alt">Put image in 'assets/img/avatars/'</span></label>
                        </div>
                         <div class="form-control">
                            <label class="label font-bold text-gray-600">Theme</label>
                             <label class="swap swap-rotate btn btn-ghost btn-circle justify-start w-fit px-4 gap-4">
                                <input type="checkbox" onchange="toggleTheme()" ${systemSettings.theme === 'dark' ? 'checked' : ''} />
                                <div class="swap-on flex items-center gap-2"><i class="fa-solid fa-moon"></i> Dark Mode</div>
                                <div class="swap-off flex items-center gap-2"><i class="fa-solid fa-sun"></i> Light Mode</div>
                            </label>
                        </div>
                    </div>

                    <button onclick="saveSettings()" class="btn btn-primary text-white">Save All Changes</button>
                    
                    <div class="divider">Backup & Restore</div>
                    <div class="flex gap-4">
                        <button onclick="exportData()" class="btn btn-outline btn-success gap-2">
                             <i class="fa-solid fa-download"></i> Backup Data
                        </button>
                        <button onclick="triggerImport()" class="btn btn-outline btn-warning gap-2">
                             <i class="fa-solid fa-upload"></i> Restore Data
                        </button>
                        <input type="file" id="import-file" style="display:none" onchange="importData(event)" accept=".json">
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function saveSettings() {
    systemSettings = {
        ...systemSettings, // Keep existing keys like theme if not explicity set here, but we set them below
        companyName: document.getElementById('set-name').value,
        tagline: document.getElementById('set-tagline').value,
        phone: document.getElementById('set-phone').value,
        logo: document.getElementById('set-logo').value,
        address: document.getElementById('set-address').value,
        warrantyText: document.getElementById('set-warranty').value,
        username: document.getElementById('set-user').value || 'admin',
        password: document.getElementById('set-pass').value || 'password123',
        profilePhoto: document.getElementById('set-profile').value
    };

    await db.settings.put(systemSettings);
    updateLogoDisplay();
    updateProfileDisplay();
    alert("Settings Saved!");
}

// --- Modals & Popups ---
function openModal(title, htmlContent, actionFunction) {
    const modalContainer = document.getElementById('modal-container');
    const actionBtn = actionFunction ? `<button class="btn btn-primary text-white" onclick="${actionFunction}">Save</button>` : '';

    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" id="main-modal">
             <div class="glass-card w-full max-w-lg bg-white relative p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <button class="absolute right-4 top-4 text-gray-400 hover:text-gray-600" onclick="closeModal()">
                    <i class="fa-solid fa-times text-xl"></i>
                </button>
                <h3 class="font-bold text-xl mb-6 text-gray-800 border-b border-gray-100 pb-2">${title}</h3>
                <div class="space-y-4 mb-6">
                    ${htmlContent}
                </div>
                <div class="flex justify-end gap-3 no-print">
                    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
                    ${actionBtn}
                </div>
            </div>
        </div>
    `;
}

function closeModal() {
    document.getElementById('modal-container').innerHTML = '';
}

// -- Customer CRUD --
function openAddCustomerModal() {
    openModal('Add New Customer', `
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Customer Name</span></label>
            <input type="text" id="cust-name" class="input input-bordered w-full" />
        </div>
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Phone Number</span></label>
            <input type="text" id="cust-phone" class="input input-bordered w-full" />
        </div>
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Address</span></label>
            <textarea id="cust-address" class="textarea textarea-bordered h-24"></textarea>
        </div>
    `, 'saveCustomer()');
}

async function saveCustomer() {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-address').value;
    const id = document.getElementById('cust-id')?.value; // Hidden input check if I add one later

    if (!name || !phone) return alert("Name and Phone are required!");

    // Simple Add (Edit logic would require ID check)
    await db.customers.add({ name, phone, address });
    closeModal();
    renderCustomers();
}

async function editCustomer(id) {
    const c = await db.customers.get(id);
    if (!c) return;

    // Reuse modal but we need a different save function or logic to handle Update vs Add
    // For simplicity, let's just make a specific update function here
    openModal('Edit Customer', `
        <input type="hidden" id="edit-cust-id" value="${c.id}">
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Customer Name</span></label>
            <input type="text" id="edit-cust-name" value="${c.name}" class="input input-bordered w-full" />
        </div>
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Phone Number</span></label>
            <input type="text" id="edit-cust-phone" value="${c.phone}" class="input input-bordered w-full" />
        </div>
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Address</span></label>
            <textarea id="edit-cust-address" class="textarea textarea-bordered h-24">${c.address}</textarea>
        </div>
    `, 'updateCustomer()');
}

async function updateCustomer() {
    const id = parseInt(document.getElementById('edit-cust-id').value);
    const name = document.getElementById('edit-cust-name').value;
    const phone = document.getElementById('edit-cust-phone').value;
    const address = document.getElementById('edit-cust-address').value;

    await db.customers.update(id, { name, phone, address });
    closeModal();
    renderCustomers();
}

async function deleteCustomer(id) {
    if (confirm('Are you sure?')) {
        await db.customers.delete(id);
        renderCustomers();
    }
}

// -- Service CRUD --
function openAddServiceModal() {
    openModal('Add Service / Part', `
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Item Name</span></label>
            <input type="text" id="serv-name" class="input input-bordered w-full" />
        </div>
        <div class="flex gap-4">
            <div class="form-control w-1/3">
                <label class="label"><span class="label-text">Type</span></label>
                <select id="serv-type" class="select select-bordered" onchange="toggleInventoryField(this.value)">
                    <option value="service" selected>Service</option>
                    <option value="part">Spare Part</option>
                </select>
            </div>
            <div class="form-control w-1/3">
                <label class="label"><span class="label-text">Price (LKR)</span></label>
                <input type="number" id="serv-price" class="input input-bordered w-full" />
            </div>
             <div class="form-control w-1/3" id="inv-field" style="display:none;">
                <label class="label"><span class="label-text">Stock Qty</span></label>
                <input type="number" id="serv-inv" value="0" class="input input-bordered w-full" />
            </div>
        </div>
        <script>
            function toggleInventoryField(val) {
                document.getElementById('inv-field').style.display = val === 'part' ? 'block' : 'none';
            }
        </script>
    `, 'saveService()');
}

async function saveService() {
    const name = document.getElementById('serv-name').value;
    const type = document.getElementById('serv-type').value;
    const price = parseFloat(document.getElementById('serv-price').value);
    const inventory = parseInt(document.getElementById('serv-inv').value || 0);

    if (!name || isNaN(price)) return alert("All fields are required!");

    await db.services.add({ name, type, price, inventory });
    closeModal();
    renderServices();
}

async function editService(id) {
    const s = await db.services.get(id);
    openModal('Edit Item', `
        <input type="hidden" id="edit-serv-id" value="${s.id}">
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Item Name</span></label>
            <input type="text" id="edit-serv-name" value="${s.name}" class="input input-bordered w-full" />
        </div>
        <div class="flex gap-4">
            <div class="form-control w-1/3">
                <label class="label"><span class="label-text">Type</span></label>
                <select id="edit-serv-type" class="select select-bordered" onchange="document.getElementById('edit-inv-field').style.display = this.value === 'part' ? 'block' : 'none'">
                    <option value="service" ${s.type === 'service' ? 'selected' : ''}>Service</option>
                    <option value="part" ${s.type === 'part' ? 'selected' : ''}>Spare Part</option>
                </select>
            </div>
            <div class="form-control w-1/3">
                <label class="label"><span class="label-text">Price (LKR)</span></label>
                <input type="number" id="edit-serv-price" value="${s.price}" class="input input-bordered w-full" />
            </div>
             <div class="form-control w-1/3" id="edit-inv-field" style="display: ${s.type === 'part' ? 'block' : 'none'}">
                <label class="label"><span class="label-text">Stock</span></label>
                <input type="number" id="edit-serv-inv" value="${s.inventory || 0}" class="input input-bordered w-full" />
            </div>
        </div>
    `, 'updateService()');
}

async function updateService() {
    const id = parseInt(document.getElementById('edit-serv-id').value);
    const name = document.getElementById('edit-serv-name').value;
    const type = document.getElementById('edit-serv-type').value;
    const price = parseFloat(document.getElementById('edit-serv-price').value);
    const inventory = parseInt(document.getElementById('edit-serv-inv').value || 0);

    await db.services.update(id, { name, type, price, inventory });
    closeModal();
    renderServices();
}

async function deleteService(id) {
    if (confirm('Delete this item?')) {
        await db.services.delete(id);
        renderServices();
    }
}

// -- Expense CRUD --
function openAddExpenseModal() {
    openModal('Add Expense', `
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Description</span></label>
            <input type="text" id="exp-desc" placeholder="e.g. Fuel, Tools" class="input input-bordered w-full" />
        </div>
        <div class="flex gap-4">
             <div class="form-control w-1/2">
                <label class="label"><span class="label-text">Amount</span></label>
                <input type="number" id="exp-amount" placeholder="0.00" class="input input-bordered w-full" />
            </div>
             <div class="form-control w-1/2">
                <label class="label"><span class="label-text">Date</span></label>
                <input type="date" id="exp-date" class="input input-bordered w-full" value="${new Date().toISOString().split('T')[0]}" />
            </div>
        </div>
        <div class="form-control w-full">
            <label class="label"><span class="label-text">Category</span></label>
            <select id="exp-cat" class="select select-bordered">
                <option>Transport</option>
                <option>Tools</option>
                <option>Spare Parts</option>
                <option>Meals</option>
                <option>Other</option>
            </select>
        </div>
    `, 'saveExpense()');
}

async function saveExpense() {
    const description = document.getElementById('exp-desc').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const date = document.getElementById('exp-date').value;
    const category = document.getElementById('exp-cat').value;

    if (!description || !amount) return alert("Required fields missing");

    await db.expenses.add({ description, amount, date, category });
    closeModal();
    renderExpenses();
}

async function deleteExpense(id) {
    if (confirm('Delete expense?')) {
        await db.expenses.delete(id);
        renderExpenses();
    }
}
