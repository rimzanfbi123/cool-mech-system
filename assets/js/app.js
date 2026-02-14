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

// --- Auth System ---
function renderLoginScreen() {
    const loginHTML = `
        <div id="login-screen" class="fixed inset-0 bg-blue-600 flex items-center justify-center z-[200] p-4 text-center">
            <div class="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md animate-slide-up relative overflow-hidden">
                <!-- Decorative Circle -->
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full"></div>
                
                <div class="mb-8 relative">
                    <div class="w-24 h-24 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <i class="fa-solid fa-lock text-3xl"></i>
                    </div>
                    <h2 class="text-3xl font-black text-gray-800 tracking-tighter">COOL MECH</h2>
                    <p class="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Secure System v1.0</p>
                </div>
                
                <div class="space-y-4">
                    <div class="form-control">
                        <label class="label text-xs font-black text-gray-400 uppercase ml-2">Username</label>
                        <input type="text" id="login-user" placeholder="Enter username" 
                            class="input input-bordered h-14 bg-gray-50 border-2 focus:border-blue-500 rounded-2xl font-bold" />
                    </div>
                    <div class="form-control">
                        <label class="label text-xs font-black text-gray-400 uppercase ml-2">Password</label>
                        <input type="password" id="login-pass" placeholder="••••••••" 
                            class="input input-bordered h-14 bg-gray-50 border-2 focus:border-blue-500 rounded-2xl font-bold" />
                    </div>
                    <button onclick="handleLogin()" 
                        class="btn btn-primary w-full h-16 text-white text-lg font-black shadow-xl shadow-blue-200 mt-6 rounded-2xl uppercase tracking-widest">
                        ACCESS SYSTEM <i class="fa-solid fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', loginHTML);
}

function handleLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    if (user === systemSettings.username && pass === systemSettings.password) {
        sessionStorage.setItem('coolmech_auth', 'true');
        initApp();
    } else {
        alert("Machan, password eka waradi! Check karala balanna.");
    }
}

// --- Utils & Layout Helpers ---
function setActiveNav(id) {
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

            <!-- Storage Health Indicator -->
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
                                        <td><span class="font-black text-gray-400">#INV-${inv.id}</span></td>
                                        <td>${inv.customerName}</td>
                                        <td class="font-bold">LKR ${inv.total.toLocaleString()}</td>
                                        <td class="text-center">
                                            <span class="badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'} badge-sm text-[10px] font-black">${inv.status}</span>
                                        </td>
                                    </tr>
                                `).join('')}
                                ${invoices.length === 0 ? '<tr><td colspan="4" class="text-center py-10 text-gray-300 italic font-bold">No recent invoices found.</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="space-y-6">
                    <!-- Quick Actions -->
                    <div class="glass-card p-6">
                        <h3 class="font-bold text-gray-800 mb-6 uppercase tracking-widest text-[10px] border-b pb-2">Quick Actions</h3>
                        <div class="space-y-3">
                            <button onclick="renderCreateInvoice()" class="btn btn-primary w-full text-white font-black rounded-xl h-12 shadow-lg shadow-blue-100">
                                <i class="fa-solid fa-plus mr-2"></i> NEW INVOICE
                            </button>
                            <button onclick="renderCustomers()" class="btn btn-outline border-blue-500 text-blue-600 hover:bg-blue-600 hover:text-white w-full font-black rounded-xl h-12">
                                <i class="fa-solid fa-user-plus mr-2"></i> ADD CUSTOMER
                            </button>
                            <button onclick="renderSettings()" class="btn btn-ghost text-blue-400 w-full rounded-xl border-blue-50 border">
                                <i class="fa-solid fa-chart-line mr-2"></i> VIEW REPORTS
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 💡 Add dynamic check for storage indicators immediately
   // --- Customer Components ---
async function renderCustomers() {
    setActiveNav('nav-customers');
    document.getElementById('page-title').innerText = 'Customer Management';
    const content = document.getElementById('app-content');
    const customers = await db.customers.toArray();

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <p class="text-sm font-bold text-gray-500 ml-2 uppercase tracking-widest"><i class="fa-solid fa-address-book text-blue-500 mr-2"></i> Total: ${customers.length}</p>
                <button onclick="openAddCustomerModal()" class="btn btn-primary text-white gap-2 font-black shadow-lg shadow-blue-100">
                    <i class="fa-solid fa-plus font-black"></i> New Customer
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${customers.map(c => `
                    <div class="glass-card hover:border-blue-500 transition-all p-6 group relative overflow-hidden bg-white">
                         <div class="flex justify-between items-start mb-4 relative z-10">
                            <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-black group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                ${c.name.charAt(0)}
                            </div>
                            <div class="dropdown dropdown-end">
                                <label tabindex="0" class="btn btn-ghost btn-circle btn-xs opacity-50"><i class="fa-solid fa-ellipsis-vertical"></i></label>
                                <ul tabindex="0" class="dropdown-content z-[2] menu p-2 shadow-2xl bg-base-100 rounded-xl w-40 border border-gray-100 font-bold">
                                    <li><a onclick="editCustomer(${c.id})"><i class="fa-solid fa-pen text-blue-500"></i> Edit Details</a></li>
                                    <li><a href="https://wa.me/${c.phone}" target="_blank" class="text-green-600"><i class="fa-brands fa-whatsapp"></i> Send SMS</a></li>
                                    <li><a onclick="deleteCustomer(${c.id})" class="text-red-500"><i class="fa-solid fa-trash"></i> Remove</a></li>
                                </ul>
                            </div>
                        </div>
                        <h3 class="font-black text-gray-800 text-xl mb-1 truncate">${c.name}</h3>
                        <p class="text-blue-600 font-black text-sm mb-4"><i class="fa-solid fa-phone mr-1"></i> ${c.phone}</p>
                        <div class="space-y-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
                            <p class="truncate"><i class="fa-solid fa-envelope w-4"></i> ${c.email || 'No email'}</p>
                            <p class="truncate"><i class="fa-solid fa-map-marker-alt w-4"></i> ${c.address}</p>
                        </div>
                        <div class="mt-6 flex gap-2">
                             <a href="tel:${c.phone}" class="btn btn-sm btn-outline btn-primary flex-1 font-black rounded-lg uppercase tracking-widest text-[10px]">Call Client</a>
                        </div>
                    </div>
                `).join('')}
                ${customers.length === 0 ? '<div class="col-span-full py-20 text-center text-gray-400 uppercase font-black tracking-widest opacity-30 italic">No Customers Found</div>' : ''}
            </div>
        </div>
    `;
}

function openAddCustomerModal() {
    openModal('New Customer Record', `
        <div class="space-y-4">
            <div class="form-control w-full">
                <label class="label text-xs font-black uppercase text-gray-400">Shop / Name</label>
                <input type="text" id="cust-name" placeholder="Enter name" class="input input-bordered w-full font-bold h-12 rounded-xl" />
            </div>
            <div class="form-control w-full">
                <label class="label text-xs font-black uppercase text-gray-400">Phone</label>
                <input type="text" id="cust-phone" placeholder="07XXXXXXXX" class="input input-bordered w-full font-bold h-12 rounded-xl" />
            </div>
            <div class="form-control w-full">
                <label class="label text-xs font-black uppercase text-gray-400">Address (Optional)</label>
                <textarea id="cust-addr" placeholder="Location details" class="textarea textarea-bordered w-full font-bold h-20 rounded-xl"></textarea>
            </div>
        </div>
    `, 'saveCustomer()');
}

async function saveCustomer() {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-addr').value;

    if (!name || !phone) return alert("Hariyata purawanna machan.");

    await db.customers.add({ name, phone, address, email: '' });
    closeModal();
    renderCustomers();
}

async function deleteCustomer(id) {
    if (confirm('Me customerwa ain karannama onaද?')) {
        await db.customers.delete(id);
        renderCustomers();
    }
}

// --- Stock Components ---
async function renderServices() {
    setActiveNav('nav-services');
    document.getElementById('page-title').innerText = 'Stocks & Parts';
    const content = document.getElementById('app-content');
    const services = await db.services.toArray();

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div class="flex gap-2">
                    <span class="badge badge-lg bg-blue-50 text-blue-600 border-none font-bold">${services.length} Total Parts</span>
                </div>
                <button onclick="openAddServiceModal()" class="btn btn-primary text-white font-black shadow-lg shadow-blue-100">
                    <i class="fa-solid fa-plus mr-2"></i> ADD TO STOCK
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${services.map(s => `
                    <div class="glass-card p-6 bg-white hover:border-blue-500 transition-all">
                        <div class="flex justify-between mb-4">
                            <span class="badge ${s.inventory > 5 ? 'badge-success' : 'badge-error'} badge-sm font-black text-[9px] uppercase tracking-tighter">${s.inventory > 5 ? 'In Stock' : 'Low Stock'}</span>
                            <button onclick="deleteService(${s.id})" class="text-red-300 hover:text-red-500"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                        <h3 class="font-black text-gray-800 text-lg mb-1 truncate uppercase">${s.name}</h3>
                        <p class="text-[10px] text-gray-400 font-bold uppercase mb-4">${s.type}</p>
                        <div class="flex justify-between items-end border-t pt-4">
                            <div><p class="text-[9px] font-black text-gray-400 uppercase">Price</p><p class="text-xl font-black text-blue-600">LKR ${s.price}</p></div>
                            <div class="text-right"><p class="text-[9px] font-black text-gray-400 uppercase">Qty</p><p class="text-xl font-black">${s.inventory}</p></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function openAddServiceModal() {
    openModal('Stock / Service Item', `
        <div class="space-y-4">
            <input type="text" id="svc-name" placeholder="Item Name (e.g. Capacitor)" class="input input-bordered w-full font-bold h-12 rounded-xl" />
            <select id="svc-type" class="select select-bordered w-full font-bold h-12 rounded-xl">
                <option>Part / Inventory</option>
                <option>Repair / Labour</option>
            </select>
            <div class="flex gap-4">
                <input type="number" id="svc-price" placeholder="Price (LKR)" class="input input-bordered flex-1 font-bold h-12 rounded-xl" />
                <input type="number" id="svc-inv" placeholder="Initial Qty" class="input input-bordered w-24 font-bold h-12 rounded-xl" />
            </div>
        </div>
    `, 'saveService()');
}

async function saveService() {
    const name = document.getElementById('svc-name').value;
    const type = document.getElementById('svc-type').value;
    const price = parseFloat(document.getElementById('svc-price').value);
    const inventory = parseInt(document.getElementById('svc-inv').value);

    if (!name || isNaN(price)) return alert("Data missing machan.");

    await db.services.add({ name, type, price, inventory: inventory || 0 });
    closeModal();
    renderServices();
}

async function deleteService(id) {
    if(confirm("Meka ain karannada?")) { await db.services.delete(id); renderServices(); }
}

// --- Invoicing Components ---
async function renderInvoices() {
    setActiveNav('nav-invoices');
    document.getElementById('page-title').innerText = 'System Invoices';
    const invoices = await db.invoices.toArray();
    const content = document.getElementById('app-content');

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-end p-4">
                <button onclick="renderCreateInvoice()" class="btn btn-primary text-white font-black shadow-lg">
                    CREATE NEW INVOICE
                </button>
            </div>
            <div class="glass-card overflow-hidden bg-white shadow-xl rounded-3xl">
                <table class="table w-full">
                    <thead class="bg-gray-50 uppercase text-[10px] font-black text-gray-400 border-b">
                        <tr><th class="py-4">INV #</th><th>Customer</th><th class="text-right">Total Amount</th><th>Status</th><th class="text-center">Action</th></tr>
                    </thead>
                    <tbody class="font-bold text-sm">
                        ${invoices.reverse().map(inv => `
                            <tr class="hover:bg-gray-50 border-b border-gray-50">
                                <td><span class="text-gray-400 font-black">#${inv.id}</span></td>
                                <td>${inv.customerName}</td>
                                <td class="text-right text-blue-600">LKR ${inv.total.toLocaleString()}</td>
                                <td><span class="badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'} badge-sm font-black">${inv.status}</span></td>
                                <td class="text-center">
                                    <button onclick="printInvoice(${inv.id})" class="btn btn-ghost btn-xs text-blue-500"><i class="fa-solid fa-print"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function renderCreateInvoice() {
    const custs = await db.customers.toArray();
    const svcs = await db.services.toArray();
    invoiceItems = [];
    document.getElementById('app-content').innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in pb-20">
            <div class="space-y-6">
                <div class="glass-card p-6 bg-white shadow-xl rounded-3xl">
                    <h3 class="font-black mb-4 uppercase text-xs tracking-widest text-gray-400 underline decoration-blue-500 underline-offset-8">1. Select Buyer</h3>
                    <select id="inv-cust" class="select select-bordered w-full font-black h-12 rounded-xl text-blue-700 bg-blue-50/30">
                        <option disabled selected>Customer Thoranna</option>
                        ${custs.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="glass-card p-6 bg-white shadow-xl rounded-3xl">
                    <h3 class="font-black mb-4 uppercase text-xs tracking-widest text-gray-400 underline decoration-blue-500 underline-offset-8">2. Add Parts/Service</h3>
                    <div class="flex gap-2">
                        <select id="item-select" class="select select-bordered flex-1 font-bold h-12 rounded-xl">
                            ${svcs.map(s => `<option value="${s.id}">${s.name} (LKR ${s.price})</option>`).join('')}
                        </select>
                        <input type="number" id="item-qty" value="1" class="input input-bordered w-20 font-black text-center h-12 rounded-xl">
                        <button onclick="addInvoiceItem()" class="btn btn-primary font-black h-12 px-6 rounded-xl">ADD</button>
                    </div>
                    <div class="mt-8 border-t pt-4">
                        <table class="table w-full">
                            <tbody id="invoice-items-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="glass-card p-10 bg-blue-600 text-white shadow-2xl rounded-[3rem] relative overflow-hidden flex flex-col justify-between min-h-[500px]">
                <div class="relative z-10">
                    <h3 class="text-xl font-bold mb-2 uppercase tracking-widest opacity-60">Total Bill</h3>
                    <p id="summary-total" class="text-7xl font-black italic tracking-tighter mb-12 animate-pulse">LKR 0</p>
                    <label class="label cursor-pointer justify-start gap-4 bg-blue-700/50 p-6 rounded-3xl mb-8 border border-white/10">
                        <input type="checkbox" id="inv-paid" class="checkbox checkbox-white border-2 border-white/50" />
                        <span class="label-text text-white font-black text-lg uppercase">Full Payment Received</span>
                    </label>
                </div>
                <button onclick="saveInvoice()" class="btn bg-white text-blue-600 border-none h-20 text-2xl font-black rounded-3xl shadow-xl hover:scale-105 transition-transform">
                    FINALIZE BILL <i class="fa-solid fa-check-circle ml-2"></i>
                </button>
            </div>
        </div>
    `;
}

function addInvoiceItem() {
    const sId = parseInt(document.getElementById('item-select').value);
    const qty = parseInt(document.getElementById('item-qty').value);
    const select = document.getElementById('item-select');
    const name = select.options[select.selectedIndex].text.split(' (')[0];
    const price = parseFloat(select.options[select.selectedIndex].text.split('LKR ')[1].slice(0, -1));

    invoiceItems.push({ name, price, qty, subtotal: price * qty });
    updateInvoicePreview();
}

function updateInvoicePreview() {
    const body = document.getElementById('invoice-items-body');
    let total = 0;
    body.innerHTML = invoiceItems.map((item, i) => {
        total += item.subtotal;
        return `<tr class="font-bold border-none text-gray-700"><td>${item.name} x${item.qty}</td><td class="text-right">LKR ${item.subtotal}</td><td><button onclick="invoiceItems.splice(${i}, 1); updateInvoicePreview();" class="text-red-400">×</button></td></tr>`;
    }).join('');
    document.getElementById('summary-total').innerText = `LKR ${total.toLocaleString()}`;
}

async function saveInvoice() {
    const cId = parseInt(document.getElementById('inv-cust').value);
    const isPaid = document.getElementById('inv-paid').checked;
    if(isNaN(cId) || invoiceItems.length === 0) return alert("Items thoranna machan!");
    const cust = await db.customers.get(cId);
    await db.invoices.add({ 
        customerId: cId, customerName: cust.name, items: invoiceItems, 
        total: invoiceItems.reduce((s,i)=>s+i.subtotal,0), status: isPaid ? 'Paid' : 'Pending', 
        date: new Date().toISOString() 
    });
    alert("Invoice successfully saved! ✅"); renderInvoices();
}

// --- Expense Components ---
async function renderExpenses() {
    setActiveNav('nav-expenses');
    const list = await db.expenses.toArray();
    document.getElementById('app-content').innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-end p-4"><button onclick="openAddExpenseModal()" class="btn btn-error text-white font-black shadow-lg">NEW EXPENSE</button></div>
            <div class="glass-card overflow-hidden bg-white shadow-xl rounded-3xl">
                <table class="table w-full">
                    <thead class="bg-gray-50 uppercase text-[10px] font-black border-b"><tr><th>Type</th><th>Details</th><th class="text-right">Amount</th></tr></thead>
                    <tbody class="font-bold">${list.reverse().map(e => `<tr class="border-b"><td><span class="badge badge-info bg-blue-50 text-blue-600 border-none font-black uppercase text-[9px]">${e.category}</span></td><td>${e.description}</td><td class="text-right text-red-500 font-black">LKR ${e.amount.toLocaleString()}</td></tr>`).join('')}</tbody>
                </table>
            </div>
        </div>
    `;
}

function openAddExpenseModal() {
    openModal('Add Business Expense', `
        <div class="space-y-4">
            <input type="text" id="exp-desc" placeholder="Details (e.g. Fuel)" class="input input-bordered w-full font-bold h-12 rounded-xl" />
            <select id="exp-cat" class="select select-bordered w-full font-bold h-12 rounded-xl">
                <option>Fuel / Transport</option><option>Shop Rent</option><option>Spare Parts</option><option>Salary</option><option>Other</option>
            </select>
            <input type="number" id="exp-amt" placeholder="Amount (LKR)" class="input input-bordered w-full font-bold h-12 rounded-xl" />
        </div>
    `, 'saveExpense()');
}

async function saveExpense() {
    const d=document.getElementById('exp-desc').value, c=document.getElementById('exp-cat').value, a=parseFloat(document.getElementById('exp-amt').value);
    if(!d || isNaN(a)) return alert("Data missing.");
    await db.expenses.add({ description: d, category: c, amount: a, date: new Date().toISOString() });
    closeModal(); renderExpenses();
}

// --- Settings & Protection ---
function renderSettings() {
    setActiveNav('nav-settings');
    document.getElementById('app-content').innerHTML = `
        <div class="max-w-2xl mx-auto pb-20 space-y-8 animate-fade-in">
            <div class="glass-card p-10 bg-white shadow-2xl rounded-[3rem] border border-gray-100 relative overflow-hidden">
                <h3 class="font-black text-gray-400 uppercase tracking-[6px] text-[10px] mb-12 border-b pb-4">Business Core Settings</h3>
                <div class="space-y-6">
                    <div class="form-control">
                        <label class="label text-[10px] font-black uppercase text-gray-400 ml-2">Company Name Display</label>
                        <input type="text" id="set-name" value="${systemSettings.companyName}" class="input input-bordered h-16 rounded-2xl font-black text-xl border-2 focus:border-blue-500 shadow-inner">
                    </div>
                </div>
                
                <div class="mt-12 bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-100 border border-white/10 relative">
                    <div class="absolute -top-6 -right-6 w-24 h-24 bg-blue-500 rounded-full blur-2xl opacity-50"></div>
                    <h3 class="font-black uppercase tracking-[3px] text-sm mb-4"><i class="fa-solid fa-shield-halved text-yellow-300 mr-2"></i> Permanent Data Safety</h3>
                    <p class="text-xs opacity-80 leading-relaxed font-bold mb-10 italic">"Machan, oya use karana browser eka (Chrome/Safari) samahara welawata machine eka clean karaddi me data delete karanna puluwan. E nisa me BACKUP krama use karanna mathaka thiyaganna."</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                        <button onclick="exportData()" class="btn bg-white text-blue-600 border-none hover:bg-gray-100 font-black h-14 rounded-2xl shadow-lg uppercase tracking-widest text-[10px]">Generate Backup</button>
                        <button onclick="triggerImport()" class="btn bg-blue-700/50 border-2 border-white/20 text-white font-black h-14 rounded-2xl hover:bg-blue-700 uppercase tracking-widest text-[10px]">Restore Factory</button>
                    </div>
                </div>

                <div class="flex gap-4 mt-12">
                     <button onclick="saveSettings()" class="btn btn-primary flex-1 h-16 rounded-2xl font-black text-xl text-white shadow-xl shadow-blue-100 uppercase tracking-widest">Update Cloud</button>
                     <button onclick="handleLogout()" class="btn btn-ghost h-16 px-8 rounded-2xl font-black uppercase text-red-500 border border-red-50">Exit</button>
                </div>
            </div>
        </div>
    `;
}

async function saveSettings() {
    systemSettings.companyName=document.getElementById('set-name').value;
    await db.settings.put({id:'config',...systemSettings});
    alert("System updated successfully! ✅"); renderDashboard();
}

function handleLogout() { sessionStorage.removeItem('coolmech_auth'); window.location.reload(); }

// --- Support Functions ---

function openModal(title, html, action) {
    document.getElementById('modal-container').innerHTML = `
        <div id="main-modal" class="fixed inset-0 bg-black/70 backdrop-blur-md z-[260] flex items-center justify-center p-4 animate-fade-in shadow-2xl">
            <div class="bg-white rounded-[3rem] w-full max-w-md animate-slide-up shadow-2xl border border-gray-100 overflow-hidden">
                <div class="p-6 bg-gray-50 flex justify-between items-center font-black uppercase text-[10px] tracking-widest border-b border-gray-100 text-gray-400">
                    <span>${title}</span><button onclick="closeModal()" class="hover:text-red-500">CLOSE ×</button>
                </div>
                <div class="p-10 font-bold text-gray-700">${html}</div>
                <div class="p-6 bg-gray-50 flex gap-4">
                    <button onclick="closeModal()" class="btn btn-ghost flex-1 font-black uppercase tracking-widest text-[10px]">Cancel</button>
                    ${action ? `<button onclick="${action}" class="btn btn-primary flex-1 text-white font-black shadow-lg shadow-blue-100 uppercase tracking-widest text-[10px]">Confirm Now</button>` : ''}
                </div>
            </div>
        </div>`;
}

function closeModal() { document.getElementById('modal-container').innerHTML = ''; }
function updateDate() { document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' }); }
function updateLogoDisplay() {} function updateProfileDisplay() {}

// --- Advanced Data Logic ---
async function exportData() {
    const d = { 
        customers: await db.customers.toArray(), services: await db.services.toArray(), 
        invoices: await db.invoices.toArray(), expenses: await db.expenses.toArray(), settings: await db.settings.toArray() 
    };
    const blob = new Blob([JSON.stringify(d, null, 2)], {type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); 
    a.download=`CoolMech_SafeCopy_${new Date().toISOString().split('T')[0]}.json`; 
    a.click();
}

function triggerImport() {
    const input=document.createElement('input'); input.type='file'; input.accept='.json';
    input.onchange=ev=>{
        const r=new FileReader(); r.onload=async()=>{
            const d=JSON.parse(r.result);
            if (confirm("⚠️ PARISSAMIN: Restore karannada? Denata thiyena data okkoma delete wei!")) {
                await db.customers.clear(); await db.services.clear(); await db.invoices.clear(); await db.expenses.clear();
                await db.customers.bulkAdd(d.customers); await db.services.bulkAdd(d.services); await db.invoices.bulkAdd(d.invoices); await db.expenses.bulkAdd(d.expenses);
                alert("Restored Successfully! ✅ System reloaded."); window.location.reload();
            }
        }; r.readAsText(ev.target.files[0]);
    }; input.click();
}

async function printInvoice(id) {
    const inv = await db.invoices.get(id);
    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>BILL #${inv.id}</title><script src="https://cdn.tailwindcss.com"></script></head>
        <body class="p-10 bg-gray-50"><div class="max-w-2xl mx-auto bg-white border-2 border-blue-600 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <h1 class="text-4xl font-black text-blue-600 mb-2">${systemSettings.companyName}</h1>
            <p class="text-gray-400 font-bold mb-10 italic uppercase text-[10px] tracking-widest">${systemSettings.tagline}</p>
            <div class="flex justify-between border-y-2 border-gray-100 py-6 mb-10">
                <div><p class="text-[9px] uppercase font-black text-gray-300 mb-1">Bill To</p><p class="text-xl font-black text-gray-800 uppercase italic">${inv.customerName}</p></div>
                <div class="text-right"><p class="text-[9px] uppercase font-black text-gray-300 mb-1">Doc No</p><p class="text-xl font-black text-blue-600 italic">#INV-${inv.id}</p></div>
            </div>
            <table class="w-full mb-10 font-bold text-sm text-gray-700">
                <thead class="text-[9px] uppercase text-gray-300 border-b"><tr><th class="text-left py-2">Service Description</th><th class="text-right">Amount</th></tr></thead>
                ${inv.items.map(i=>`<tr class="border-b border-gray-50"><td class="py-4">${i.name} x${i.qty}</td><td class="text-right py-4 font-black">LKR ${i.subtotal}</td></tr>`).join('')}
            </table>
            <div class="text-right border-t-4 border-blue-600 pt-6"><p class="text-[10px] uppercase font-black text-gray-300 italic mb-1">Net Payable Total</p><p class="text-5xl font-black text-blue-600 tracking-tighter">LKR ${inv.total}</p></div>
            <div class="mt-20 flex justify-between items-end text-[9px] font-black uppercase text-gray-300 border-t pt-2">
                <p>Hotline: ${systemSettings.phone}</p><p class="border-t-2 border-gray-300 pt-2 px-10">Manager Signature</p>
            </div>
            <button onclick="window.print()" class="bg-blue-600 text-white px-10 py-5 rounded-3xl font-black uppercase tracking-widest mt-12 no-print w-full shadow-2xl shadow-blue-200">Print Official Bill</button>
        </div><style>@media print{.no-print{display:none;}}</style></body></html>`);
    win.document.close();
}

// 💡 STORAGE PROTECTION Logic
async function checkStorageHealth() {
    const healthBar = document.getElementById('storage-health-bar');
    if (!healthBar) return;

    let isPersisted = false;
    if (navigator.storage && navigator.storage.persist) {
        isPersisted = await navigator.storage.persisted();
    }

    const isLocalFile = window.location.protocol === 'file:';
    
    // Update Dashboard UI with cool health indicator
    healthBar.innerHTML = `
        <div class="glass-card p-6 border-l-8 ${isPersisted ? 'border-green-500 bg-green-50/30' : 'border-red-500 bg-red-50/30'} flex items-center justify-between shadow-xl">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 ${isPersisted ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                    <i class="fa-solid ${isPersisted ? 'fa-shield-check' : 'fa-triangle-exclamation'}"></i>
                </div>
                <div>
                    <h3 class="font-black text-gray-800 uppercase tracking-tight text-sm">Storage Status: ${isPersisted ? 'Safe Mode' : 'Risk Detected'}</h3>
                    <p class="text-[10px] ${isPersisted ? 'text-green-600' : 'text-red-500'} font-bold uppercase tracking-widest">
                        ${isPersisted ? 'Data persistence is active. Your data is protected.' : 'Data is stored temporarily! Export backups frequently.'}
                    </p>
                </div>
            </div>
            ${!isPersisted ? `<button onclick="renderSettings()" class="btn btn-error btn-xs font-black text-white px-4 rounded-lg">FIX SECURITY</button>` : ''}
        </div>
    `;

    // Alert if critical
    if (isLocalFile && !isPersisted) {
        openModal("⚠️ Security Notice", "Machan, browser eka data delete karanna ida thiyenawa local file nisa. Settings walin <b>BACKUP</b> ganna mathaka thiyaganna. GitHub eke use karanna puluwan nam thawat hondai.", "");
    }
} 
    checkStorageHealth();
}
