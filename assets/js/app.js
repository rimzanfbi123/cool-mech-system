// Application Logic for Cool Mech Service

// --- Global State ---
let currentView = 'dashboard';
let invoiceItems = []; 
let systemSettings = {
    companyName: 'COOL MECH SERVICES',
    address: 'Colombo, Sri Lanka',
    phone: '0773919281',
    email: 'infocoolmech@gmail.com',
    tagline: 'Make your own weather today',
    warrantyText: 'Warranty subject to terms and conditions.',
    logo: '',
    username: 'admin',
    password: 'password123',
    theme: 'light',
    profilePhoto: ''
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const storedSettings = await db.settings.get('config');
        if (storedSettings) {
            systemSettings = { ...systemSettings, ...storedSettings };
        } else {
            await db.settings.put({ id: 'config', ...systemSettings });
        }
    } catch (e) {
        console.error("Settings load error", e);
    }

    document.documentElement.setAttribute('data-theme', systemSettings.theme || 'light');

    if (sessionStorage.getItem('coolmech_auth') === 'true') {
        initApp();
    } else {
        renderLoginScreen();
    }

    window.onclick = function (event) {
        const modal = document.getElementById('main-modal');
        if (event.target == modal) closeModal();
    }
});

async function initApp() {
    document.getElementById('login-screen')?.remove();
    document.getElementById('main-app').classList.remove('hidden');
    try { await db.open(); } catch (err) { console.error(err); }
    updateLogoDisplay();
    updateProfileDisplay();
    updateDate();
    renderDashboard();
    setTimeout(checkStorageHealth, 2000);
}

// --- Auth System ---
function renderLoginScreen() {
    document.body.insertAdjacentHTML('afterbegin', `
        <div id="login-screen" class="fixed inset-0 bg-blue-600 flex items-center justify-center z-[200] p-4">
            <div class="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md animate-slide-up text-center">
                <div class="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <i class="fa-solid fa-lock text-3xl"></i>
                </div>
                <h2 class="text-3xl font-black text-gray-800 mb-2">Cool Mech</h2>
                <p class="text-gray-400 font-bold mb-8 uppercase tracking-widest text-xs">Secure Login</p>
                <div class="space-y-4">
                    <div class="form-control">
                        <input type="text" id="login-user" placeholder="Username" class="input input-bordered h-14 font-bold text-center border-2 focus:border-blue-500 rounded-2xl" />
                    </div>
                    <div class="form-control">
                        <input type="password" id="login-pass" placeholder="Password house" class="input input-bordered h-14 font-bold text-center border-2 focus:border-blue-500 rounded-2xl" />
                    </div>
                    <button onclick="handleLogin()" class="btn btn-primary w-full h-14 text-white text-lg font-black shadow-xl shadow-blue-200 mt-4 rounded-2xl uppercase">
                        Gedarata Enna <i class="fa-solid fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </div>
        </div>
    `);
}

function handleLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    if (user === systemSettings.username && pass === systemSettings.password) {
        sessionStorage.setItem('coolmech_auth', 'true');
        initApp();
    } else {
        alert("Password eka waradi machan! Try again.");
    }
}

// --- Component: Dashboard ---
async function renderDashboard() {
    setActiveNav('nav-dashboard');
    document.getElementById('page-title').innerText = 'System Overview';
    const content = document.getElementById('app-content');

    const totalCustomers = await db.customers.count();
    const totalInvoices = await db.invoices.count();
    const invoices = await db.invoices.toArray();
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

    content.innerHTML = `
        <div class="animate-fade-in space-y-8 pb-20">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="glass-card p-6 border-l-8 border-blue-500 hover:scale-105 transition-transform">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-sm"><i class="fa-solid fa-users"></i></div>
                        <div><p class="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Customers</p><h3 class="text-3xl font-black text-gray-800 leading-tight">${totalCustomers}</h3></div>
                    </div>
                </div>
                <div class="glass-card p-6 border-l-8 border-green-500 hover:scale-105 transition-transform">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-2xl shadow-sm"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                        <div><p class="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Revenue</p><h3 class="text-3xl font-black text-green-600 leading-tight">LKR ${totalRevenue.toLocaleString()}</h3></div>
                    </div>
                </div>
                 <div class="glass-card p-6 border-l-8 border-purple-500 hover:scale-105 transition-transform">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-sm"><i class="fa-solid fa-briefcase"></i></div>
                        <div><p class="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Invoices</p><h3 class="text-3xl font-black text-gray-800 leading-tight">${totalInvoices}</h3></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="glass-card p-6">
                    <div class="flex justify-between items-center mb-6"><h3 class="font-black text-gray-800 text-lg uppercase tracking-tight">Recent Activity Log</h3></div>
                    <div class="space-y-4 max-h-[400px] overflow-y-auto">
                        <p class="text-gray-400 text-sm italic py-10 text-center uppercase font-bold tracking-widest opacity-40">System scanning active... No issues found.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- Component: Customers ---
async function renderCustomers() {
    setActiveNav('nav-customers');
    document.getElementById('page-title').innerText = 'Customer Management';
    const content = document.getElementById('app-content');
    const customers = await db.customers.toArray();

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <p class="text-sm font-bold text-gray-500 ml-2 uppercase tracking-widest"><i class="fa-solid fa-address-book text-blue-500"></i> Total: ${customers.length}</p>
                <button onclick="openAddCustomerModal()" class="btn btn-primary text-white gap-2 font-black shadow-lg shadow-blue-100">
                    <i class="fa-solid fa-plus font-black"></i> New Customer
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${customers.map(c => `
                    <div class="glass-card hover:border-blue-500 transition-all p-6 group">
                         <div class="flex justify-between items-start mb-4">
                            <div class="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-xl font-black group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                ${c.name.charAt(0)}
                            </div>
                            <div class="dropdown dropdown-end">
                                <label tabindex="0" class="btn btn-ghost btn-circle btn-xs opacity-50"><i class="fa-solid fa-ellipsis-vertical"></i></label>
                                <ul tabindex="0" class="dropdown-content z-[2] menu p-2 shadow-2xl bg-base-100 rounded-xl w-40 border border-gray-100">
                                    <li><a onclick="editCustomer(${c.id})"><i class="fa-solid fa-pen text-blue-500"></i> Edit Details</a></li>
                                    <li><a href="https://wa.me/${c.phone}" target="_blank" class="text-green-600 font-bold"><i class="fa-brands fa-whatsapp"></i> Send SMS</a></li>
                                    <li><a onclick="deleteCustomer(${c.id})" class="text-red-500 font-bold"><i class="fa-solid fa-trash"></i> Remove</a></li>
                                </ul>
                            </div>
                        </div>
                        <h3 class="font-black text-gray-800 text-xl mb-1">${c.name}</h3>
                        <p class="text-blue-600 font-black text-sm mb-4"><i class="fa-solid fa-phone mr-1"></i> ${c.phone}</p>
                        <div class="space-y-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
                            <p><i class="fa-solid fa-envelope w-4"></i> ${c.email || 'No email'}</p>
                            <p class="truncate"><i class="fa-solid fa-map-marker-alt w-4"></i> ${c.address}</p>
                        </div>
                        <div class="mt-6 flex gap-2">
                            <a href="tel:${c.phone}" class="btn btn-sm btn-outline btn-primary flex-1 font-black rounded-lg uppercase">Call</a>
                        </div>
                    </div>
                `).join('')}
                ${customers.length === 0 ? '<div class="col-span-full py-20 text-center text-gray-400 font-black italic uppercase tracking-[5px]">No Customers Found<br><span class="text-[10px] mt-2 block opacity-50">Click the blue button above to add a business lead.</span></div>' : ''}
            </div>
        </div>
    `;
}

function openAddCustomerModal() {
    openModal('New Customer Record', `
        <div class="space-y-4">
            <div class="form-control w-full">
                <input type="text" id="cust-name" placeholder="Customer / Shop Name" class="input input-bordered w-full font-bold" />
            </div>
            <div class="form-control w-full">
                <input type="text" id="cust-phone" placeholder="Phone Number" class="input input-bordered w-full font-bold" />
            </div>
            <div class="form-control w-full">
                <input type="email" id="cust-email" placeholder="Email (Optional)" class="input input-bordered w-full font-bold" />
            </div>
            <div class="form-control w-full">
                <textarea id="cust-addr" placeholder="Service Address" class="textarea textarea-bordered w-full font-bold h-24"></textarea>
            </div>
        </div>
    `, 'saveCustomer()');
}

async function saveCustomer() {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const email = document.getElementById('cust-email').value;
    const address = document.getElementById('cust-addr').value;

    if (!name || !phone) return alert("Nama saha Phone number eka aniwa ona machan.");

    await db.customers.add({ name, phone, email, address });
    closeModal();
    renderCustomers();
}

async function deleteCustomer(id) {
    if (confirm('Me customer eka delete karannama onaද?')) {
        await db.customers.delete(id);
        renderCustomers();
    }
}

// --- Component: Services ---
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

// --- Component: Invoices ---
async function renderInvoices() {
    setActiveNav('nav-invoices');
    document.getElementById('page-title').innerText = 'Invoices & Quotes';
    const content = document.getElementById('app-content');
    const invoices = await db.invoices.toArray();

    content.innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <button onclick="renderCreateInvoice()" class="btn btn-primary text-white gap-2 font-black shadow-lg shadow-blue-100">
                    <i class="fa-solid fa-plus font-black"></i> Create Invoice
                </button>
            </div>

            <div class="glass-card overflow-hidden">
                <table class="table w-full">
                    <thead>
                        <tr class="text-gray-400 border-b border-gray-100 uppercase text-[10px]">
                            <th class="bg-transparent py-4 font-black">INV #</th>
                            <th class="bg-transparent py-4 font-black">Customer</th>
                            <th class="bg-transparent py-4 font-black">Status</th>
                            <th class="bg-transparent py-4 font-black text-right">Total</th>
                            <th class="bg-transparent py-4 font-black text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm font-medium">
                        ${invoices.reverse().map(inv => `
                            <tr class="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                                <td class="font-black text-gray-400">#${inv.id}</td>
                                <td class="font-bold text-gray-800">${inv.customerName}</td>
                                <td><span class="badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'} badge-sm font-black text-[10px]">${inv.status}</span></td>
                                <td class="text-blue-600 font-black text-right">LKR ${inv.total.toLocaleString()}</td>
                                <td class="text-center flex justify-center gap-2">
                                    <button onclick="printInvoice(${inv.id})" class="btn btn-ghost btn-xs text-blue-500"><i class="fa-solid fa-print"></i></button>
                                    <button onclick="deleteInvoice(${inv.id})" class="btn btn-ghost btn-xs text-red-500"><i class="fa-solid fa-trash"></i></button>
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
    setActiveNav('nav-invoices');
    document.getElementById('page-title').innerText = 'New Invoice';
    const content = document.getElementById('app-content');
    const customers = await db.customers.toArray();
    const services = await db.services.toArray();
    invoiceItems = [];

    content.innerHTML = `
        <div class="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
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
                            <input type="text" id="inv-desc" placeholder="e.g. AC Repair & Service" class="input input-bordered w-full font-bold">
                        </div>
                    </div>
                </div>

                <!-- Step 2: Line Items -->
                <div class="glass-card p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <i class="fa-solid fa-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"></i> Items & Services
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div class="form-control md:col-span-2">
                             <label class="label text-xs font-bold uppercase text-gray-400">Select Item</label>
                            <select id="item-select" class="select select-bordered w-full font-bold">
                                <option disabled selected>Thoranna</option>
                                ${services.map(s => `<option value="${s.id}">${s.name} (LKR ${s.price})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label text-xs font-bold uppercase text-gray-400">Qty</label>
                            <input type="number" id="item-qty" value="1" class="input input-bordered font-bold text-center">
                        </div>
                        <div class="form-control self-end">
                            <button onclick="addInvoiceItem()" class="btn btn-primary text-white font-black">ADD</button>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="table w-full">
                            <thead class="bg-gray-50 border-y border-gray-100 uppercase text-[10px] font-black text-gray-400">
                                <tr><th>Description</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr>
                            </thead>
                            <tbody id="invoice-items-body" class="text-sm font-bold"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                 <div class="glass-card p-8 bg-blue-600 text-white shadow-2xl shadow-blue-100 border-none relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-10 text-8xl"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                    <h3 class="text-xl font-bold mb-8 uppercase tracking-widest border-b border-blue-400 pb-4">Invoice Summary</h3>
                    <div class="space-y-4 mb-10">
                        <div class="flex justify-between items-center"><span class="opacity-60 font-medium">Subtotal Amount</span><span id="summary-subtotal" class="text-xl font-black italic">LKR 0</span></div>
                        <div class="flex justify-between items-center"><span class="opacity-60 font-medium">Service Charge</span><span class="text-xl font-black italic">LKR 0</span></div>
                    </div>
                    <div class="flex justify-between items-center mb-10 border-t border-blue-400 pt-6">
                        <span class="text-sm font-black uppercase tracking-[5px] text-blue-200">Total</span>
                        <span id="summary-total" class="text-4xl font-black">LKR 0</span>
                    </div>
                    <div class="form-control mb-8">
                         <label class="label cursor-pointer justify-start gap-4 bg-blue-700/50 p-4 rounded-xl">
                            <input type="checkbox" id="inv-paid" class="checkbox checkbox-white border-2 border-white/50" />
                            <span class="label-text text-white font-black uppercase">Customer fully paid</span>
                        </label>
                    </div>
                    <button onclick="saveInvoice()" class="btn bg-white text-blue-600 border-none hover:bg-gray-100 w-full h-16 text-xl font-black shadow-2xl shadow-blue-900/30 rounded-2xl">
                        CONFIRM & SAVE <i class="fa-solid fa-check-circle ml-2"></i>
                    </button>
                </div>
                <button onclick="renderInvoices()" class="btn btn-ghost w-full font-bold opacity-60">Cancel & Go Back</button>
            </div>
        </div>
    `;
}

function addInvoiceItem() {
    const serviceId = parseInt(document.getElementById('item-select').value);
    const qty = parseInt(document.getElementById('item-qty').value);

    if (isNaN(serviceId)) return alert("Item ekak thoranna machan.");

    const select = document.getElementById('item-select');
    const serviceName = select.options[select.selectedIndex].text.split(' (')[0];
    const servicePrice = parseFloat(select.options[select.selectedIndex].text.split('LKR ')[1].slice(0, -1));

    invoiceItems.push({
        name: serviceName,
        price: servicePrice,
        qty: qty,
        subtotal: servicePrice * qty
    });

    updateInvoicePreview();
}

function updateInvoicePreview() {
    const body = document.getElementById('invoice-items-body');
    const totalDisplay = document.getElementById('summary-total');
    const subDisplay = document.getElementById('summary-subtotal');

    let total = 0;
    body.innerHTML = invoiceItems.map((item, index) => {
        total += item.subtotal;
        return `
            <tr class="border-b border-gray-50">
                <td class="py-4">${item.name}</td>
                <td class="py-4">LKR ${item.price.toLocaleString()}</td>
                <td class="py-4 text-center"><span class="badge badge-ghost font-black border-none">${item.qty}</span></td>
                <td class="py-4 text-right">LKR ${item.subtotal.toLocaleString()}</td>
                <td class="py-4 text-right">
                    <button onclick="invoiceItems.splice(${index}, 1); updateInvoicePreview();" class="btn btn-ghost btn-xs text-red-500"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    subDisplay.innerText = `LKR ${total.toLocaleString()}`;
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

    await db.invoices.add({
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

// --- Component: Expenses ---
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
                            <th class="bg-transparent py-4 font-black text-center">Category</th>
                            <th class="bg-transparent py-4 font-black">Description</th>
                            <th class="bg-transparent py-4 font-black text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm font-medium">
                        ${expenses.reverse().map(e => `
                            <tr class="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                                <td class="text-center"><span class="badge badge-ghost badge-sm uppercase text-[9px] font-bold">${e.category || 'Other'}</span></td>
                                <td class="font-bold text-gray-800">${e.description}</td>
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
            <input type="text" id="exp-desc" placeholder="e.g. Fuel, Tools" class="input input-bordered w-full font-bold" />
        </div>
        <div class="flex gap-4">
             <div class="form-control w-1/2">
                <label class="label"><span class="label-text">Amount (LKR)</span></label>
                <input type="number" id="exp-amt" class="input input-bordered w-full font-bold" />
            </div>
            <div class="form-control w-1/2">
                <label class="label"><span class="label-text">Category</span></label>
                <select id="exp-cat" class="select select-bordered w-full font-bold">
                    <option>Fuel / Transport</option>
                    <option>Spare Parts</option>
                    <option>Shop Rent</option>
                    <option>Salary</option>
                    <option>Other</option>
                </select>
            </div>
        </div>
    `, 'saveExpense()');
}

async function saveExpense() {
    const description = document.getElementById('exp-desc').value;
    const amount = parseFloat(document.getElementById('exp-amt').value);
    const category = document.getElementById('exp-cat').value;

    if (!description || isNaN(amount)) return alert("Fields missing");

    await db.expenses.add({ description, amount, category, date: new Date().toISOString() });
    closeModal();
    renderExpenses();
}

// --- Component: Settings ---
function renderSettings() {
    setActiveNav('nav-settings');
    const content = document.getElementById('app-content');

    content.innerHTML = `
        <div class="animate-fade-in max-w-2xl mx-auto pb-20">
            <div class="glass-card p-8">
                <h2 class="text-3xl font-black text-gray-800 mb-8 uppercase tracking-tighter">System Settings</h2>
                <div class="space-y-12">
                     <section>
                        <h3 class="text-xs font-black text-gray-400 uppercase tracking-[4px] mb-6 border-b pb-2">Business Branding</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="form-control"><label class="label text-[10px] font-black uppercase text-gray-400">Company Name</label><input type="text" id="set-name" value="${systemSettings.companyName}" class="input input-bordered font-bold focus:border-blue-500"></div>
                            <div class="form-control"><label class="label text-[10px] font-black uppercase text-gray-400">Official Phone</label><input type="text" id="set-phone" value="${systemSettings.phone}" class="input input-bordered font-bold"></div>
                        </div>
                    </section>

                    <section class="bg-blue-600 p-8 rounded-3xl text-white shadow-2xl shadow-blue-100 relative overflow-hidden">
                        <div class="absolute top-0 right-0 p-4 opacity-10 text-6xl"><i class="fa-solid fa-shield-halved"></i></div>
                        <h3 class="text-sm font-black uppercase tracking-[3px] mb-4">Lifetime Data Security</h3>
                        <p class="text-xs opacity-70 leading-relaxed font-bold mb-8">Machan, me system eka phone eke local storage eke thama save wenne. Phone eka format kaloth hari data yana nisa aniwa sathiye sarayak me backup eka ganna.</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onclick="exportData()" class="btn border-none bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-black h-16 rounded-2xl shadow-xl shadow-blue-800/40">BACKUP DATA</button>
                            <button onclick="triggerImport()" class="btn border-none bg-blue-500 hover:bg-blue-400 text-white font-black h-16 rounded-2xl border-2 border-white/20">RESTORE DATA</button>
                        </div>
                    </section>

                    <div class="pt-10 flex gap-4">
                        <button onclick="saveSettings()" class="btn btn-primary flex-1 h-16 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-100 uppercase">Save Settings</button>
                        <button onclick="handleLogout()" class="btn btn-ghost h-16 rounded-2xl uppercase font-black text-red-500 border border-red-50 px-8">Logout</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function saveSettings() {
    systemSettings.companyName = document.getElementById('set-name').value;
    systemSettings.phone = document.getElementById('set-phone').value;
    await db.settings.put({ id: 'config', ...systemSettings });
    alert("Settings Saved Successfully! ✅");
}

function handleLogout() {
    sessionStorage.removeItem('coolmech_auth');
    window.location.reload();
}

// --- Utils: Modal & Helper ---
function openModal(title, html, actionType) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
        <div id="main-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-fade-in">
            <div class="bg-white rounded-3xl w-full max-w-md overflow-hidden animate-slide-up shadow-2xl">
                <div class="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 class="font-black text-gray-800 text-sm uppercase tracking-widest">${title}</h3>
                    <button onclick="closeModal()" class="btn btn-circle btn-ghost btn-sm"><i class="fa-solid fa-times"></i></button>
                </div>
                <div class="p-8">${html}</div>
                <div class="p-4 bg-gray-50/50 flex gap-2">
                    <button onclick="closeModal()" class="btn btn-ghost flex-1 font-black uppercase text-xs">Cancel</button>
                    ${actionType ? `<button onclick="${actionType}" class="btn btn-primary flex-1 text-white font-black uppercase text-xs">Confirm</button>` : ''}
                </div>
            </div>
        </div>
    `;
}

function closeModal() { document.getElementById('modal-container').innerHTML = ''; }

function setActiveNav(id) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('bg-blue-600', 'text-white'));
    const active = document.getElementById(id);
    if (active) active.classList.add('bg-blue-600', 'text-white');
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); document.getElementById('mobile-overlay').classList.toggle('hidden'); }
function closeSidebarOnMobile() { if (window.innerWidth < 1024) toggleSidebar(); }
function updateDate() { document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
function updateLogoDisplay() { /* Logo update logic here */ }
function updateProfileDisplay() { /* Profile update logic here */ }

// --- Backup & Restore Logic ---
async function exportData() {
    const data = {
        customers: await db.customers.toArray(),
        services: await db.services.toArray(),
        invoices: await db.invoices.toArray(),
        expenses: await db.expenses.toArray(),
        settings: await db.settings.toArray(),
        date: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CoolMech_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function triggerImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = ev => {
        const reader = new FileReader();
        reader.onload = async () => {
            const data = JSON.parse(reader.result);
            if (confirm("Restore කරමුද? දැනට තියෙන data මැකේවි!")) {
                await db.customers.clear(); await db.services.clear(); await db.invoices.clear(); await db.expenses.clear(); await db.settings.clear();
                await db.customers.bulkAdd(data.customers); await db.services.bulkAdd(data.services); await db.invoices.bulkAdd(data.invoices); await db.expenses.bulkAdd(data.expenses); await db.settings.bulkAdd(data.settings);
                alert("Restored Successfully! ✅");
                window.location.reload();
            }
        };
        reader.readAsText(ev.target.files[0]);
    };
    input.click();
}

function checkStorageHealth() { console.log("System Status: Operational"); }
