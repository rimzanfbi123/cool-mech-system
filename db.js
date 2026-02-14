// Database configuration using Dexie.js
const db = new Dexie('CoolMechDB');
window.db = db; // Global for app.js

db.version(1).stores({
    customers: '++id, name, phone, email, address',
    services: '++id, name, price, type, inventory',
    invoices: '++id, customerId, date, status, total, items, type, jobDescription',
    expenses: '++id, description, amount, date, category',
    settings: 'id, companyName, address, phone, logo, warrantyText, taxRate',
    logs: '++id, type, target, details, date'
});

// --- ROBUST STORAGE PROTECTION ---
async function ensurePersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();
        console.log(`%c Storage Persistence: ${isPersisted ? 'GUARANTEED ✅' : 'TEMPORARY ⚠️'}`, 'font-weight: bold; color: ' + (isPersisted ? 'green' : 'orange'));

        if (!isPersisted) {
            console.warn("Miyage browser eka data delete karanna ida thiyenawa. App eka 'Install' karanna (Add to Home Screen).");
        }
    }
}

// Global error handler for DB
db.on('error', function (e) {
    alert("Database Error: " + e);
});

// Initialize
ensurePersistentStorage();
