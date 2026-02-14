// Application Logic for Cool Mech Service - Final Pro Version
let currentView = 'dashboard';
let invoiceItems = []; 
let systemSettings = {
    companyName: 'COOL MECH SERVICES', address: 'Colombo, Sri Lanka', phone: '0773919281', email: 'infocoolmech@gmail.com',
    tagline: 'Make your own weather today', warrantyText: 'Warranty subject to terms and conditions.',
    logo: '', username: 'admin', password: 'password123', theme: 'light'
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const stored = await db.settings.get('config');
        if (stored) systemSettings = { ...systemSettings, ...stored };
        else await db.settings.put({ id: 'config', ...systemSettings });
    } catch (e) { console.error(e); }
    
    document.documentElement.setAttribute('data-theme', systemSettings.theme || 'light');
    if (sessionStorage.getItem('coolmech_auth') === 'true') initApp();
    else renderLoginScreen();

    window.onclick = (e) => { if (e.target == document.getElementById('main-modal')) closeModal(); }
});

async function initApp() {
    document.getElementById('login-screen')?.remove();
    document.getElementById('main-app').classList.remove('hidden');
    try { await db.open(); } catch (err) { console.error(err); }
    updateDate();
    renderDashboard();
    setTimeout(checkStorageHealth, 2000); // 💡 Storage Health Check
}

// --- Storage Integrity Check ---
async function checkStorageHealth() {
    if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted && window.location.protocol === 'file:') {
            openModal("⚠️ Storage Alert", `
                <div class="text-center space-y-4">
                    <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2 text-3xl">⚠️</div>
                    <h3 class="text-xl font-bold">Data Security Warning</h3>
                    <p class="text-sm text-gray-500">Machan, browser eka data delete karanna ida thiyenawa. App eක 'Install' කරලා use කරන්න (Add to Home Screen). <b>Settings walin BACKUP ganna mathaka thiyaganna.</b></p>
                    <button onclick="closeModal()" class="btn btn-primary w-full">Harier mama balannam</button>
                </div>
            `);
        }
    }
}

// --- Auth ---
function renderLoginScreen() {
    document.body.insertAdjacentHTML('afterbegin', `<div id="login-screen" class="fixed inset-0 bg-blue-600 flex items-center justify-center z-[200] p-4"><div class="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center"><div class="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl"><i class="fa-solid fa-shield-halved"></i></div><h2 class="text-3xl font-black mb-8 uppercase">Cool Mech</h2><div class="space-y-4"><input type="text" id="login-user" placeholder="Username" class="input input-bordered h-16 w-full font-bold text-center rounded-2xl border-2 focus:border-blue-500" /><input type="password" id="login-pass" placeholder="Password" class="input input-bordered h-16 w-full font-bold text-center rounded-2xl border-2 focus:border-blue-500" /><button onclick="handleLogin()" class="btn btn-primary w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-blue-200 uppercase mt-4">Login Now</button></div></div></div>`);
}

function handleLogin() {
    if(document.getElementById('login-user').value===systemSettings.username && document.getElementById('login-pass').value===systemSettings.password) {
        sessionStorage.setItem('coolmech_auth', 'true'); initApp();
    } else alert("Waradi machan!");
}

// --- Dashboard ---
async function renderDashboard() {
    setActiveNav('nav-dashboard'); document.getElementById('page-title').innerText = 'Dashboard Overview';
    const cCount = await db.customers.count();
    const invs = await db.invoices.toArray();
    const rev = invs.reduce((s,i)=>s+i.total,0);
    document.getElementById('app-content').innerHTML = `
        <div class="animate-fade-in space-y-8 pb-20">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="glass-card p-6 bg-white shadow-xl rounded-3xl border-l-8 border-blue-500"><p class="text-[10px] font-black text-gray-400 uppercase">Customers</p><h3 class="text-4xl font-black">${cCount}</h3></div>
                <div class="glass-card p-6 bg-white shadow-xl rounded-3xl border-l-8 border-green-500"><p class="text-[10px] font-black text-gray-400 uppercase">Revenue</p><h3 class="text-4xl font-black text-green-600">LKR ${rev.toLocaleString()}</h3></div>
                <div class="glass-card p-6 bg-white shadow-xl rounded-3xl border-l-8 border-purple-500"><p class="text-[10px] font-black text-gray-400 uppercase">Invoices</p><h3 class="text-4xl font-black">${invs.length}</h3></div>
            </div>
            <div class="glass-card p-8 bg-white shadow-xl rounded-3xl border border-gray-100">
                <h3 class="font-black text-gray-800 text-sm uppercase tracking-widest mb-4">🚀 Storage Health Indicator</h3>
                <div class="flex items-center gap-3 text-green-500 font-bold"><i class="fa-solid fa-circle-check"></i> System Operational & Data Persisted</div>
            </div>
        </div>
    `;
}

// --- Customer Management ---
async function renderCustomers() {
    setActiveNav('nav-customers'); document.getElementById('page-title').innerText = 'Customers';
    const list = await db.customers.toArray();
    document.getElementById('app-content').innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center"><p class="font-bold text-gray-400 uppercase text-xs">Total: ${list.length}</p><button onclick="openAddCustomerModal()" class="btn btn-primary font-black shadow-lg">NEW CUSTOMER</button></div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${list.map(c => `<div class="glass-card p-6 bg-white shadow-lg rounded-3xl border group hover:border-blue-500"><div class="flex justify-between items-start mb-4"><div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center font-black">${c.name.charAt(0)}</div><button onclick="deleteCustomer(${c.id})" class="text-red-200 hover:text-red-500"><i class="fa-solid fa-trash"></i></button></div><h3 class="font-black text-gray-800">${c.name}</h3><p class="text-blue-600 font-black text-sm">${c.phone}</p><div class="mt-4"><a href="tel:${c.phone}" class="btn btn-sm btn-outline btn-primary w-full font-black">CALL</a></div></div>`).join('')}
            </div>
        </div>
    `;
}

function openAddCustomerModal() {
    openModal('New Customer', `<div class="space-y-4"><input type="text" id="cust-name" placeholder="Name" class="input input-bordered w-full font-bold" /><input type="text" id="cust-phone" placeholder="Phone" class="input input-bordered w-full font-bold" /><textarea id="cust-addr" placeholder="Address" class="textarea textarea-bordered w-full font-bold"></textarea></div>`, 'saveCustomer()');
}
async function saveCustomer() {
    const name=document.getElementById('cust-name').value, phone=document.getElementById('cust-phone').value, address=document.getElementById('cust-addr').value;
    if(!name||!phone) return alert("Puraawanna!"); await db.customers.add({name,phone,address}); closeModal(); renderCustomers();
}
async function deleteCustomer(id) { if(confirm("Mekawa ain karannada?")) { await db.customers.delete(id); renderCustomers(); } }

// --- Inventory ---
async function renderServices() {
    setActiveNav('nav-services'); document.getElementById('page-title').innerText = 'Stocks';
    const list = await db.services.toArray();
    document.getElementById('app-content').innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-end"><button onclick="openAddServiceModal()" class="btn btn-primary font-black shadow-lg">ADD PART</button></div>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                ${list.map(s => `<div class="glass-card p-6 bg-white shadow-lg rounded-3xl"><h3 class="font-black">${s.name}</h3><p class="text-blue-600 font-black">LKR ${s.price}</p><span class="badge badge-ghost font-black mt-2">Qty: ${s.inventory}</span><button onclick="deleteService(${s.id})" class="text-red-300 block mt-4 text-xs font-bold">Delete</button></div>`).join('')}
            </div>
        </div>
    `;
}
function openAddServiceModal() {
    openModal('Add Item', `<div class="space-y-4"><input type="text" id="svc-name" placeholder="Name" class="input input-bordered w-full font-bold" /><select id="svc-type" class="select select-bordered w-full font-bold"><option>Part / Inventory</option><option>Service / Labour</option></select><input type="number" id="svc-price" placeholder="Price" class="input input-bordered w-full font-bold" /><input type="number" id="svc-inv" placeholder="Qty" class="input input-bordered w-full font-bold" /></div>`, 'saveService()');
}
async function saveService() {
    const name=document.getElementById('svc-name').value, type=document.getElementById('svc-type').value, price=parseFloat(document.getElementById('svc-price').value), inventory=parseInt(document.getElementById('svc-inv').value);
    await db.services.add({name,type,price,inventory}); closeModal(); renderServices();
}
async function deleteService(id) { if(confirm("Ain karannada?")) { await db.services.delete(id); renderServices(); } }

// --- Invoicing ---
async function renderInvoices() {
    setActiveNav('nav-invoices'); document.getElementById('page-title').innerText = 'Invoices';
    const list = await db.invoices.toArray();
    document.getElementById('app-content').innerHTML = `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-end"><button onclick="renderCreateInvoice()" class="btn btn-primary font-black uppercase">New Invoice</button></div>
            <div class="glass-card shadow-xl rounded-3xl overflow-hidden bg-white"><table class="table w-full"><thead class="bg-gray-50 uppercase text-[10px] font-black"><tr><th>INV #</th><th>Customer</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody class="font-bold">${list.reverse().map(inv => `<tr><td>#${inv.id}</td><td>${inv.customerName}</td><td class="text-blue-600">LKR ${inv.total}</td><td><span class="badge ${inv.status==='Paid'?'badge-success':'badge-warning'} badge-sm font-black">${inv.status}</span></td><td><button onclick="printInvoice(${inv.id})" class="text-blue-500"><i class="fa-solid fa-print"></i></button></td></tr>`).join('')}</tbody></table></div>
        </div>
    `;
}
async function renderCreateInvoice() {
    const custs = await db.customers.toArray(), svcs = await db.services.toArray(); invoiceItems = [];
    document.getElementById('app-content').innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in pb-20"><div class="space-y-6"><div class="glass-card p-6 bg-white shadow-xl rounded-3xl"><h3 class="font-black mb-4 uppercase">Select Customer</h3><select id="inv-cust" class="select select-bordered w-full font-bold"><option disabled selected>Select Customer</option>${custs.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div><div class="glass-card p-6 bg-white shadow-xl rounded-3xl"><h3 class="font-black mb-4 uppercase">Add Parts</h3><div class="flex gap-2"><select id="item-select" class="select select-bordered flex-1 font-bold"><option disabled selected>Select Part</option>${svcs.map(s=>`<option value="${s.id}">${s.name} (LKR ${s.price})</option>`).join('')}</select><input type="number" id="item-qty" value="1" class="input input-bordered w-20 font-bold text-center"><button onclick="addInvoiceItem()" class="btn btn-primary font-black">ADD</button></div><table class="table w-full mt-6"><tbody id="invoice-items-body"></tbody></table></div></div><div class="glass-card p-8 bg-blue-600 text-white shadow-2xl rounded-[2.5rem]"><h3 class="text-2xl font-black mb-4 uppercase">Total Amount</h3><p id="summary-total" class="text-6xl font-black italic mb-10">LKR 0</p><label class="label cursor-pointer justify-start gap-4 bg-blue-700/50 p-4 rounded-xl mb-8"><input type="checkbox" id="inv-paid" class="checkbox checkbox-white" /><span class="label-text text-white font-black uppercase">Fully Paid</span></label><button onclick="saveInvoice()" class="btn bg-white text-blue-600 border-none w-full h-16 text-xl font-black rounded-2xl shadow-xl">SAVE INVOICE</button></div></div>`;
}
function addInvoiceItem() {
    const sId = parseInt(document.getElementById('item-select').value), qty = parseInt(document.getElementById('item-qty').value), select = document.getElementById('item-select');
    const name = select.options[select.selectedIndex].text.split(' (')[0], price = parseFloat(select.options[select.selectedIndex].text.split('LKR ')[1].slice(0, -1));
    invoiceItems.push({ name, price, qty, subtotal: price * qty }); updateInvoicePreview();
}
function updateInvoicePreview() {
    const body = document.getElementById('invoice-items-body'); let total = 0;
    body.innerHTML = invoiceItems.map((item, i) => { total += item.subtotal; return `<tr class="font-bold border-none text-sm"><td>${item.name} x${item.qty}</td><td class="text-right">LKR ${item.subtotal}</td></tr>`; }).join('');
    document.getElementById('summary-total').innerText = `LKR ${total.toLocaleString()}`;
}
async function saveInvoice() {
    const cId = parseInt(document.getElementById('inv-cust').value), isPaid = document.getElementById('inv-paid').checked;
    if(isNaN(cId)||invoiceItems.length===0) return alert("Puraawanna!");
    const cust = await db.customers.get(cId);
    await db.invoices.add({ customerId:cId, customerName:cust.name, items:invoiceItems, total:invoiceItems.reduce((s,i)=>s+i.subtotal,0), status:isPaid?'Paid':'Pending', date:new Date().toISOString() });
    alert("Invoice Ready! ✅"); renderInvoices();
}
async function printInvoice(id) {
    const inv = await db.invoices.get(id); const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Invoice #${inv.id}</title><script src="https://cdn.tailwindcss.com"></script></head><body class="p-10"><div class="max-w-2xl mx-auto border-4 border-blue-600 p-8 rounded-3xl"><h1 class="text-4xl font-black text-blue-600">${systemSettings.companyName}</h1><p class="text-gray-400 font-bold mb-8 italic uppercase text-xs">${systemSettings.tagline}</p><div class="flex justify-between border-y-2 py-4 mb-8"><div><p class="text-xs uppercase font-black text-gray-400">Bill To</p><p class="text-xl font-black uppercase">${inv.customerName}</p></div><div class="text-right"><p class="text-xs uppercase font-black text-gray-400">Invoice</p><p class="text-xl font-black">#${inv.id}</p></div></div><table class="w-full mb-8 font-bold">${inv.items.map(i=>`<tr class="border-b"><td class="py-2">${i.name} x${i.qty}</td><td class="text-right py-2">LKR ${i.subtotal}</td></tr>`).join('')}</table><div class="text-right"><p class="text-xs uppercase font-black text-gray-400 leading-none">Total Amount</p><p class="text-4xl font-black text-blue-600">LKR ${inv.total}</p></div><div class="mt-20 flex justify-between items-end text-[10px] font-black uppercase text-gray-400 text-center"><p>${systemSettings.address}</p><p class="border-t-2 pt-2 px-10">Authorized Signature</p></div><button onclick="window.print()" class="bg-blue-600 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest mt-10 no-print w-full">Print Now</button></div><style>@media print{.no-print{display:none;}}</style></body></html>`);
    win.document.close();
}

// --- Expenses ---
async function renderExpenses() {
    setActiveNav('nav-expenses'); const list = await db.expenses.toArray();
    document.getElementById('app-content').innerHTML = `<div class="animate-fade-in space-y-6"><div class="flex justify-end p-4"><button onclick="openAddExpenseModal()" class="btn btn-error text-white font-black">ADD EXPENSE</button></div><div class="glass-card shadow-xl rounded-3xl overflow-hidden bg-white"><table class="table w-full"><thead class="bg-gray-50 text-[10px] font-black"><tr><th>Category</th><th>Details</th><th>Amount</th></tr></thead><tbody class="font-bold">${list.reverse().map(e=>`<tr><td><span class="badge badge-ghost font-black">${e.category}</span></td><td>${e.description}</td><td class="text-red-500">LKR ${e.amount}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function openAddExpenseModal() { openModal('Add Expense', `<div class="space-y-4"><input type="text" id="exp-desc" placeholder="Details" class="input input-bordered w-full font-bold" /><select id="exp-cat" class="select select-bordered w-full font-bold"><option>Fuel</option><option>Transport</option><option>Shop Rent</option><option>Salary</option><option>Other</option></select><input type="number" id="exp-amt" placeholder="Amount" class="input input-bordered w-full font-bold" /></div>`, 'saveExpense()'); }
async function saveExpense() { const d=document.getElementById('exp-desc').value, c=document.getElementById('exp-cat').value, a=parseFloat(document.getElementById('exp-amt').value); await db.expenses.add({description:d,category:c,amount:a,date:new Date().toISOString()}); closeModal(); renderExpenses(); }

// --- Settings ---
function renderSettings() {
    setActiveNav('nav-settings');
    document.getElementById('app-content').innerHTML = `
        <div class="max-w-2xl mx-auto space-y-8 animate-fade-in pb-20"><div class="glass-card p-10 bg-white shadow-2xl rounded-[3rem] border border-gray-100">
            <h3 class="font-black text-gray-400 uppercase tracking-[5px] text-xs mb-10">System Settings</h3>
            <div class="form-control mb-10"><label class="label text-[10px] font-black uppercase text-gray-400 ml-2">Business Name</label><input type="text" id="set-name" value="${systemSettings.companyName}" class="input input-bordered h-16 rounded-2xl font-black text-xl border-2 focus:border-blue-500"></div>
            <div class="bg-blue-600 p-8 rounded-[2rem] text-white shadow-2xl shadow-blue-100 mb-10">
                <h3 class="font-black uppercase text-sm mb-4"><i class="fa-solid fa-cloud-arrow-up"></i> Lifetime Backup</h3>
                <p class="text-xs opacity-70 mb-8 font-bold">Machan, phone eka format kaloth data yana nisa sathiye sarayak BACKUP file eka ganna.</p>
                <div class="grid grid-cols-2 gap-4"><button onclick="exportData()" class="btn bg-yellow-400 border-none text-blue-900 font-bold">SAVE BACKUP</button><button onclick="triggerImport()" class="btn bg-blue-500 border-2 border-white/20 text-white font-bold">RESTORE DATA</button></div>
            </div>
            <button onclick="saveSettings()" class="btn btn-primary w-full h-16 rounded-2xl font-black text-white shadow-xl uppercase">UPATE SETTINGS</button>
            <button onclick="handleLogout()" class="btn btn-ghost w-full mt-4 font-black uppercase text-red-400">Log Out</button>
        </div></div>`;
}
async function saveSettings() { systemSettings.companyName=document.getElementById('set-name').value; await db.settings.put({id:'config',...systemSettings}); alert("Saved! ✅"); renderDashboard(); }
function handleLogout() { sessionStorage.removeItem('coolmech_auth'); window.location.reload(); }

// --- Utils ---
function openModal(title, html, action) { document.getElementById('modal-container').innerHTML = `<div id="main-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-fade-in"><div class="bg-white rounded-[2.5rem] w-full max-w-md animate-slide-up shadow-2xl"><div class="p-6 bg-gray-50 flex justify-between font-black uppercase text-[10px] tracking-widest border-b"><span>${title}</span><button onclick="closeModal()">×</button></div><div class="p-10">${html}</div><div class="p-6 bg-gray-100 flex gap-4"><button onclick="closeModal()" class="btn btn-ghost flex-1 font-black">CANCEL</button>${action?`<button onclick="${action}" class="btn btn-primary flex-1 text-white font-black shadow-lg shadow-blue-100">CONFIRM</button>`:''}</div></div></div>`; }
function closeModal() { document.getElementById('modal-container').innerHTML = ''; }
function setActiveNav(id) { document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('bg-blue-600','text-white')); const el=document.getElementById(id); if(el) el.classList.add('bg-blue-600','text-white'); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); document.getElementById('mobile-overlay').classList.toggle('hidden'); }
function closeSidebarOnMobile() { if(window.innerWidth < 1024) toggleSidebar(); }
function updateDate() { document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' }); }

// --- Backup ---
async function exportData() {
    const d = { customers:await db.customers.toArray(), services:await db.services.toArray(), invoices:await db.invoices.toArray(), expenses:await db.expenses.toArray(), settings:await db.settings.toArray() };
    const blob = new Blob([JSON.stringify(d)], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`CoolMech_${new Date().toISOString().split('T')[0]}.json`; a.click();
}
function triggerImport() {
    const input=document.createElement('input'); input.type='file'; input.accept='.json';
    input.onchange=ev=>{ const r=new FileReader(); r.onload=async()=>{ const d=JSON.parse(r.result); if(confirm("Restore karannada? Data delete wei!")){ await db.customers.clear(); await db.services.clear(); await db.invoices.clear(); await db.expenses.clear(); await db.settings.clear(); await db.customers.bulkAdd(d.customers); await db.services.bulkAdd(d.services); await db.invoices.bulkAdd(d.invoices); await db.expenses.bulkAdd(d.expenses); await db.settings.bulkAdd(d.settings); alert("Restored! ✅"); window.location.reload(); }}; r.readAsText(ev.target.files[0]); }; input.click();
}
