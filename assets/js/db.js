
// Database configuration using Dexie.js
const db = new Dexie('CoolMechDB');
window.db = db; // Explicitly make it global for app.js

db.version(1).stores({
    customers: '++id, name, phone, email, address', // id is auto-incremented
    services: '++id, name, price, type, inventory', // inventory: number
    invoices: '++id, customerId, date, status, total, items, type, jobDescription',
    expenses: '++id, description, amount, date, category',
    settings: 'id, companyName, address, phone, logo, warrantyText, taxRate',
    logs: '++id, type, target, details, date' // type: 'sms', 'call', 'email'
});

// Helper functions for database operations can be added here or used directly in app.js
console.log("Cool Mech Database Initialized");
