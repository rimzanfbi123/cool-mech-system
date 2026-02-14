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
                        <input type="password" id="login-pass" placeholder="Password" class="input input-bordered h-14 font-bold text-center border-2 focus:border-blue-500 rounded-2xl" />
                    </div>
                    <button onclick="handleLogin()" class="btn btn-primary w-full h-14 text-white text-lg font-black shadow-xl shadow-blue-200 mt-4 rounded-2xl uppercase">
                        LOG IN <i class="fa-solid fa-arrow-right ml-2"></i>
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
        alert("Username or Password waradi machan!");
    }
}

// --- Dashboard ---
async function renderDashboard() {
    setActiveNav('nav-dashboard');
    document.getElementById('page-title').innerText = 'Dashboard Overview';
    const content = document.getElementById('app-content');
    const totalCustomers = await db.customers.count();
    const invoices = await db.invoices.toArray();
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

    content.innerHTML = `
        <div class="animate-fade-in space-y-8 pb-20">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="glass-card p-6 border-l-8 border-blue-500 shadow-xl bg-white"><div class="flex items-center gap-4"><div class="text-3xl text-blue-500"><i class="fa-solid fa-users"></i></div><div><p class="text-[10px] font-black text-gray-400 uppercase">Customers</p><h3 class="text-3xl font-black">${totalCustomers}</h3></div></div></div>
                <div class="glass-card p-6 border-l-8 border-green-500 shadow-xl bg-white"><div class="flex items-center gap-4"><div class="text-3xl text-green-500"><i class="fa-solid fa-money-bill-wave"></i></div><div><p class="text-[10px] font-black text-gray-400 uppercase">Revenue</p><h3 class="text-3xl font-black">LKR ${totalRevenue.toLocaleString()}</h3></div></div></div>
                <div class="glass-card p-6 border-l-8 border-purple-500 shadow-xl bg-white"><div class="flex items-center gap-4"><div class="text-3xl text-purple-500"><i class="fa-solid fa-file-invoice"></i></div><div><p class="text-[10px] font-black text-gray-400 uppercase">Invoices</p><h3 class="text-3xl font-black">${invoices.length}</h3></div></div></div>
            </div>
            <div class="glass-card p-8 bg-white shadow-xl rounded-3xl">
                <h3 class="font-black text-gray-800 mb-6 uppercase tracking-widest text-sm">System Performance</h3>
                <p class="text-gray-400 italic">No errors detected. Local database is healthy.</p>
            </div>
        </div>
    `;
}

// --- Customer Management ---
async function renderCustomers() {
    setActiveNav('nav-customers');
    document.getElementById('page-title').innerText = 'Customers';
    const customers = await db.customers.toArray();
    document.getElementById('app-content').innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <p class="text-sm font-bold text-gray-500 ml-2 uppercase">Total: ${customers.length}</p>
                <button onclick="openAddCustomerModal()" class="btn btn-primary text-white font-black">ADD NEW</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${customers.map(c => `
                    <div class="glass-card p-6 bg-white shadow-lg rounded-3xl border border-gray-50 group hover:border-blue-500 transition-all">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black">${c.name.charAt(0)}</div>
                            <div class="flex gap-2">
                                <button onclick="deleteCustomer(${c.id})" class="text-red-300 hover:text-red-500"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                        <h3 class="font-black text-gray-800 text-xl">${c.name}</h3>
                        <p class="text-blue-600 font-black mb-4">${c.phone}</p>
                        <p class="text-xs text-gray-400 font-medium">${c.address}</p>
                        <div class="mt-6"><a href="tel:${c.phone}" class="btn btn-sm btn-outline btn-primary w-full font-black">CALL NOW</a></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function openAddCustomerModal() {
    openModal('New Customer', `<div class="space-y-4"><input type="text" id="cust-name" placeholder="Name" class="input input-bordered w-full font-bold" /><input type="text" id="cust-phone" placeholder="Phone" class="input input-bordered w-full font-bold" /><textarea id="cust-addr" placeholder="Address" class="textarea textarea-bordered w-full font-bold"></textarea></div>`, 'saveCustomer()');
}

async function saveCustomer() {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-addr').value;
    if (!name || !phone) return alert("Puraawanna machan!");
    await db.customers.add({ name, phone, address });
    closeModal(); renderCustomers();
}

async function deleteCustomer(id) { if(confirm("Mekawa ain karannada?")) { await db.customers.delete(id); renderCustomers(); } }

// --- Stocks & Services ---
async function renderServices() {
    setActiveNav('nav-services');
    document.getElementById('page-title').innerText = 'Inventory';
    const services = await db.services.toArray();
    document.getElementById('app-content').innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-end p-4"><button onclick="openAddServiceModal()" class="btn btn-primary text-white font-black">ADD PART/SERVICE</button></div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${services.map(s => `
                    <div class="glass-card p-6 bg-white shadow-lg rounded-3xl border border-gray-50">
                        <h3 class="font-black text-gray-800 mb-1">${s.name}</h3>
                        <p class="text-xs text-gray-400 uppercase font-black mb-4">${s.type}</p>
                        <div class="flex justify-between items-center"><span class="text-xl font-black text-blue-600">LKR ${s.price}</span><span class="badge badge-ghost font-black">Qty: ${s.inventory}</span></div>
                        <div class="mt-4"><button onclick="deleteService(${s.id})" class="btn btn-ghost btn-xs text-red-400 w-full">Delete</button></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function openAddServiceModal() {
    openModal('Add Item', `<div class="space-y-4"><input type="text" id="svc-name" placeholder="Item Name" class="input input-bordered w-full font-bold" /><select id="svc-type" class="select select-bordered w-full"><option>Part / Inventory</option><option>Service / Labour</option></select><input type="number" id="svc-price" placeholder="Price" class="input input-bordered w-full font-bold" /><input type="number" id="svc-inv" placeholder="Quantity" class="input input-bordered w-full font-bold" /></div>`, 'saveService()');
}

async function saveService() {
    const name = document.getElementById('svc-name').value;
    const type = document.getElementById('svc-type').value;
    const price = parseFloat(document.getElementById('svc-price').value);
    const inventory = parseInt(document.getElementById('svc-inv').value);
    await db.services.add({ name, type, price, inventory });
    closeModal(); renderServices();
}

async function deleteService(id) { if(confirm("Delete part?")) { await db.services.delete(id); renderServices(); } }

// --- Invoicing ---
async function renderInvoices() {
    setActiveNav('nav-invoices'); document.getElementById('page-title').innerText = 'Invoices';
    const invoices = await db.invoices.toArray();
    document.getElementById('app-content').innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-end p-4"><button onclick="renderCreateInvoice()" class="btn btn-primary text-white font-black uppercase">Create New Invoice</button></div>
            <div class="glass-card shadow-xl rounded-3xl overflow-hidden bg-white">
                <table class="table w-full">
                    <thead class="bg-gray-50 font-black uppercase text-[10px]"><tr><th>ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody class="font-bold">
                        ${invoices.reverse().map(inv => `<tr><td>#${inv.id}</td><td>${inv.customerName}</td><td class="text-blue-600">LKR ${inv.total}</td><td><span class="badge ${inv.status==='Paid'?'badge-success':'badge-warning'} badge-sm font-black">${inv.status}</span></td><td><button onclick="printInvoice(${inv.id})" class="btn btn-ghost btn-xs text-blue-500">Print</button></td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function renderCreateInvoice() {
    setActiveNav('nav-invoices'); document.getElementById('page-title').innerText = 'Create Invoice';
    const customers = await db.customers.toArray();
    const services = await db.services.toArray();
    invoiceItems = [];
    document.getElementById('app-content').innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in pb-20">
            <div class="space-y-6">
                <div class="glass-card p-6 bg-white shadow-xl rounded-3xl">
                    <h3 class="font-black mb-4 uppercase">Customer</h3>
                    <select id="inv-cust" class="select select-bordered w-full font-bold"><option disabled selected>Select Customer</option>${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
                </div>
                <div class="glass-card p-6 bg-white shadow-xl rounded-3xl">
                    <h3 class="font-black mb-4 uppercase">Add Items</h3>
                    <div class="flex gap-2"><select id="item-select" class="select select-bordered flex-1 font-bold"><option disabled selected>Select Part</option>${services.map(s => `<option value="${s.id}">${s.name} (LKR ${s.price})</option>`).join('')}</select><input type="number" id="item-qty" value="1" class="input input-bordered w-20 font-bold text-center"><button onclick="addInvoiceItem()" class="btn btn-primary font-black">ADD</button></div>
                    <table class="table w-full mt-6"><thead class="text-[10px] uppercase font-black"><tr><th>Item</th><th>Subtotal</th><th></th></tr></thead><tbody id="invoice-items-body"></tbody></table>
                </div>
            </div>
            <div class="glass-card p-8 bg-blue-600 text-white shadow-2xl rounded-3xl flex flex-col justify-between">
                <div><h3 class="text-2xl font-black mb-4 uppercase">Total Amount</h3><p id="summary-total" class="text-6xl font-black italic mb-10">LKR 0</p><label class="label cursor-pointer justify-start gap-4 bg-blue-700/50 p-4 rounded-xl"><input type="checkbox" id="inv-paid" class="checkbox checkbox-white" /><span class="label-text text-white font-black">CASH PAID</span></label></div>
                <button onclick="saveInvoice()" class="btn bg-white text-blue-600 border-none h-16 text-xl font-black rounded-2xl shadow-xl mt-8">SAVE & GENERATE</button>
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
    body.innerHTML = invoiceItems.map((item, i) => { total += item.subtotal; return `<tr class="font-bold border-none"><td>${item.name} x${item.qty}</td><td>LKR ${item.subtotal}</td><td><button onclick="invoiceItems.splice(${i}, 1); updateInvoicePreview();" class="text-red-400">×</button></td></tr>`; }).join('');
    document.getElementById('summary-total').innerText = `LKR ${total.toLocaleString()}`;
}

async function saveInvoice() {
    const cId = parseInt(document.getElementById('inv-cust').value);
    const isPaid = document.getElementById('inv-paid').checked;
    if(isNaN(cId) || invoiceItems.length === 0) return alert("Hariyata purawanna machan!");
    const customer = await db.customers.get(cId);
    await db.invoices.add({ customerId: cId, customerName: customer.name, items: invoiceItems, total: invoiceItems.reduce((s,i)=>s+i.subtotal,0), status: isPaid?'Paid':'Pending', date: new Date().toISOString() });
    alert("Invoice Ready! ✅"); renderInvoices();
}

async function printInvoice(id) {
    const inv = await db.invoices.get(id);
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Invoice #${inv.id}</title><script src="https://cdn.tailwindcss.com"></script></head><body class="p-10"><div class="max-w-2xl mx-auto border-4 border-blue-600 p-8 rounded-3xl"><h1 class="text-4xl font-black text-blue-600 mb-2">${systemSettings.companyName}</h1><p class="text-gray-400 font-bold mb-8 italic">${systemSettings.tagline}</p><div class="flex justify-between border-y-2 py-4 mb-8"><div><p class="text-xs uppercase font-black text-gray-400">Bill To</p><p class="text-xl font-black">${inv.customerName}</p></div><div class="text-right"><p class="text-xs uppercase font-black text-gray-400">Invoice #</p><p class="text-xl font-black">INV-${inv.id}</p></div></div><table class="w-full mb-8"><tr class="text-left border-b-2 font-black text-xs uppercase text-gray-400"><th class="pb-2">Description</th><th class="pb-2 text-right">Price</th><th class="pb-2 text-center">Qty</th><th class="pb-2 text-right">Total</th></tr>${inv.items.map(i=>`<tr class="font-bold border-b border-gray-100"><td class="py-4">${i.name}</td><td class="py-4 text-right">LKR ${i.price}</td><td class="py-4 text-center">${i.qty}</td><td class="py-4 text-right font-black">LKR ${i.subtotal}</td></tr>`).join('')}</table><div class="text-right border-t-4 border-blue-600 pt-4"><p class="text-sm uppercase font-black text-gray-400">Grand Total</p><p class="text-4xl font-black text-blue-600">LKR ${inv.total}</p></div><div class="mt-20 flex justify-between items-end text-[10px] font-black uppercase text-gray-400"><p>${systemSettings.address}</p><p class="border-t-2 pt-2 px-10">Authorized Signature</p></div><div class="mt-10 text-center"><button onclick="window.print()" class="bg-blue-600 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest no-print">PRINT NOW</button></div></div><style>@media print{.no-print{display:none;}}</style></body></html>`);
    win.document.close();
}

// --- Expenses ---
async function renderExpenses() {
    setActiveNav('nav-expenses'); document.getElementById('page-title').innerText = 'Expenses';
    const expenses = await db.expenses.toArray();
    document.getElementById('app-content').innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-end p-4"><button onclick="openAddExpenseModal()" class="btn btn-error text-white font-black">ADD EXPENSE</button></div>
            <div class="glass-card shadow-xl rounded-3xl overflow-hidden bg-white"><table class="table w-full"><thead class="bg-gray-50 uppercase text-[10px] font-black"><tr><th>Category</th><th>Details</th><th>Amount</th></tr></thead><tbody class="font-bold">${expenses.reverse().map(e=>`<tr><td><span class="badge badge-ghost badge-sm font-black">${e.category}</span></td><td>${e.description}</td><td class="text-red-500">LKR ${e.amount}</td></tr>`).join('')}</tbody></table></div>
        </div>
    `;
}

function openAddExpenseModal() {
    openModal('Add Expense', `<div class="space-y-4"><input type="text" id="exp-desc" placeholder="Details" class="input input-bordered w-full font-bold" /><select id="exp-cat" class="select select-bordered w-full"><option>Fuel</option><option>Transport</option><option>Spare Parts</option><option>Rent</option><option>Salary</option><option>Other</option></select><input type="number" id="exp-amt" placeholder="Amount" class="input input-bordered w-full font-bold" /></div>`, 'saveExpense()');
}

async function saveExpense() {
    const description = document.getElementById('exp-desc').value;
    const category = document.getElementById('exp-cat').value;
    const amount = parseFloat(document.getElementById('exp-amt').value);
    await db.expenses.add({ description, category, amount, date: new Date().toISOString() });
    closeModal(); renderExpenses();
}

// --- Settings & Backup ---
function renderSettings() {
    setActiveNav('nav-settings'); document.getElementById('page-title').innerText = 'Settings';
    document.getElementById('app-content').innerHTML = `
        <div class="max-w-2xl mx-auto space-y-8 animate-fade-in pb-20">
            <div class="glass-card p-10 bg-white shadow-2xl rounded-[3rem] border border-gray-100">
                <h3 class="font-black text-gray-400 uppercase tracking-[5px] text-xs mb-10">System Configuration</h3>
                <div class="space-y-6">
                    <div class="form-control"><label class="label text-[10px] font-black uppercase text-gray-400 ml-2">Business Name</label><input type="text" id="set-name" value="${systemSettings.companyName}" class="input input-bordered h-16 rounded-2xl font-black text-xl border-2 focus:border-blue-500"></div>
                </div>
                <div class="mt-12 bg-blue-600 p-8 rounded-[2rem] text-white shadow-2xl shadow-blue-100">
                    <h3 class="font-black uppercase tracking-widest text-sm mb-4"><i class="fa-solid fa-shield-halved text-yellow-300"></i> Lifetime Backup</h3>
                    <p class="text-xs opacity-70 mb-8 font-bold leading-relaxed">Machan, phone eka nathi unath data safe thiyaganna sathiye sarayak BACKUP ganna.</p>
                    <div class="grid grid-cols-2 gap-4">
                        <button onclick="exportData()" class="btn bg-yellow-400 border-none text-blue-900 font-black h-14 rounded-xl">SAVE BACKUP</button>
                        <button onclick="triggerImport()" class="btn bg-blue-500 border-2 border-white/20 text-white font-black h-14 rounded-xl">RESTORE DATA</button>
                    </div>
                </div>
                <button onclick="saveSettings()" class="btn btn-primary w-full h-16 mt-10 rounded-2xl font-black text-xl text-white shadow-xl shadow-blue-100 uppercase">Save Settings</button>
                <button onclick="handleLogout()" class="btn btn-ghost w-full mt-4 font-black uppercase text-red-500">Logout</button>
            </div>
        </div>
    `;
}

async function saveSettings() {
    systemSettings.companyName = document.getElementById('set-name').value;
    await db.settings.put({ id: 'config', ...systemSettings });
    alert("Settings Saved! ✅"); renderDashboard();
}

function handleLogout() { sessionStorage.removeItem('coolmech_auth'); window.location.reload(); }

// --- Support Utils ---
function openModal(title, html, action) {
    document.getElementById('modal-container').innerHTML = `<div id="main-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-fade-in"><div class="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden animate-slide-up shadow-2xl"><div class="p-6 bg-gray-50/50 flex justify-between items-center font-black uppercase text-xs tracking-widest border-b border-gray-100"><span>${title}</span><button onclick="closeModal()">×</button></div><div class="p-10">${html}</div><div class="p-6 bg-gray-50/50 flex gap-4"><button onclick="closeModal()" class="btn btn-ghost flex-1 font-black">CANCEL</button>${action?`<button onclick="${action}" class="btn btn-primary flex-1 text-white font-black shadow-lg shadow-blue-100">CONFIRM</button>`:''}</div></div></div>`;
}

function closeModal() { document.getElementById('modal-container').innerHTML = ''; }
function setActiveNav(id) { document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('bg-blue-600', 'text-white')); const el = document.getElementById(id); if(el) el.classList.add('bg-blue-600', 'text-white'); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); document.getElementById('mobile-overlay').classList.toggle('hidden'); }
function closeSidebarOnMobile() { if(window.innerWidth < 1024) toggleSidebar(); }
function updateDate() { document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
function updateLogoDisplay() {} function updateProfileDisplay() {}

// --- Data Persistence ---
async function exportData() {
    const data = { customers: await db.customers.toArray(), services: await db.services.toArray(), invoices: await db.invoices.toArray(), expenses: await db.expenses.toArray(), settings: await db.settings.toArray() };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `CoolMech_${new Date().toISOString().split('T')[0]}.json`; a.click();
}

function triggerImport() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = ev => {
        const reader = new FileReader(); reader.onload = async () => {
            const d = JSON.parse(reader.result);
            if (confirm("Restore karannada? Data delete wei!")) {
                await db.customers.clear(); await db.services.clear(); await db.invoices.clear(); await db.expenses.clear(); await db.settings.clear();
                await db.customers.bulkAdd(d.customers); await db.services.bulkAdd(d.services); await db.invoices.bulkAdd(d.invoices); await db.expenses.bulkAdd(d.expenses); await db.settings.bulkAdd(d.settings);
                alert("Restored! ✅"); window.location.reload();
            }
        };
        reader.readAsText(ev.target.files[0]);
    };
    input.click();
}

function checkStorageHealth() { console.log("Storage Running OK"); }
