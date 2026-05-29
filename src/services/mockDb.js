// YOROTA Smart Office - High-Fidelity Mock Database Service
// Emulates Supabase PostgreSQL queries, tables, and constraints in LocalStorage

const KEYS = {
  SERVICES: 'yorota_v3_services',
  DAILY_RECORDS: 'yorota_v3_daily_records',
  TRANSACTIONS: 'yorota_v3_transactions',
  DEBTORS: 'yorota_v3_debtors',
  REPORTS: 'yorota_v3_reports',
  USERS: 'yorota_v3_users',
  CURRENT_USER: 'yorota_v3_current_user'
};

// Initial services categories seed data (Completely Empty Slate)
const DEFAULT_SERVICES = [];

// Helper to seed dates
const dateOffset = (days) => new Date(Date.now() - days * 86400000).toISOString();

const DEFAULT_DAILY_RECORDS = [];

const DEFAULT_TRANSACTIONS = [];

const DEFAULT_DEBTORS = [];

// LocalStorage helpers
const read = (key, fallback) => {
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : fallback;
};

const write = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Seed database on load if empty
export const initMockDatabase = () => {
  if (!localStorage.getItem(KEYS.SERVICES)) write(KEYS.SERVICES, DEFAULT_SERVICES);
  if (!localStorage.getItem(KEYS.DAILY_RECORDS)) write(KEYS.DAILY_RECORDS, DEFAULT_DAILY_RECORDS);
  if (!localStorage.getItem(KEYS.TRANSACTIONS)) write(KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
  if (!localStorage.getItem(KEYS.DEBTORS)) write(KEYS.DEBTORS, DEFAULT_DEBTORS);
  if (!localStorage.getItem(KEYS.REPORTS)) write(KEYS.REPORTS, []);
};

// Execute seeding
initMockDatabase();

export const mockDb = {
  // --- AUTHENTICATION MOCK ---
  auth: {
    login: async (email, password) => {
      // Validate
      const users = {
        'admin@yorota.gov': { id: 'u-admin', email: 'admin@yorota.gov', name: 'Director Ibrahim', role: 'admin' },
        'officer1@yorota.gov': { id: 'u-off1', email: 'officer1@yorota.gov', name: 'Officer Musa', role: 'officer' },
        'officer2@yorota.gov': { id: 'u-off2', email: 'officer2@yorota.gov', name: 'Officer Amina', role: 'officer' }
      };

      const user = users[email.toLowerCase()];
      if (user && password === 'password') {
        write(KEYS.CURRENT_USER, user);
        return { user, session: { token: 'mock-jwt-token' } };
      }
      
      // Allow custom email signups in mock environment automatically
      if (email && password) {
        const customUser = { 
          id: 'u-custom', 
          email, 
          name: email.split('@')[0], 
          role: email.toLowerCase().includes('admin') ? 'admin' : 'officer' 
        };
        write(KEYS.CURRENT_USER, customUser);
        return { user: customUser, session: { token: 'mock-jwt-token' } };
      }
      throw new Error('Invalid email or password');
    },

    logout: async () => {
      localStorage.removeItem(KEYS.CURRENT_USER);
      return true;
    },

    getCurrentUser: () => {
      return read(KEYS.CURRENT_USER, null);
    }
  },

  // --- SERVICES / CATEGORIES MOCK ---
  services: {
    getAll: async () => {
      return read(KEYS.SERVICES, []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    getActive: async () => {
      return read(KEYS.SERVICES, []).filter(s => s.status === 'active');
    },

    create: async (data) => {
      const services = read(KEYS.SERVICES, []);
      if (services.some(s => s.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error(`Category "${data.name}" already exists.`);
      }
      const newService = {
        id: 's-' + Math.random().toString(36).substr(2, 9),
        name: data.name,
        price: parseFloat(data.price),
        description: data.description || '',
        status: data.status || 'active',
        created_at: new Date().toISOString()
      };
      services.push(newService);
      write(KEYS.SERVICES, services);
      return newService;
    },

    update: async (id, data) => {
      const services = read(KEYS.SERVICES, []);
      const idx = services.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Service not found');
      
      // Check duplicate name
      if (data.name && services.some(s => s.id !== id && s.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error(`Category "${data.name}" already exists.`);
      }

      services[idx] = {
        ...services[idx],
        ...data,
        price: data.price !== undefined ? parseFloat(data.price) : services[idx].price
      };
      write(KEYS.SERVICES, services);
      return services[idx];
    },

    delete: async (id) => {
      const records = read(KEYS.DAILY_RECORDS, []);
      // Check if categories are in use
      if (records.some(r => r.service_id === id)) {
        throw new Error('Cannot delete this category because it is already used in existing daily entries. Deactivate it instead.');
      }
      const services = read(KEYS.SERVICES, []);
      const filtered = services.filter(s => s.id !== id);
      write(KEYS.SERVICES, filtered);
      return true;
    }
  },

  // --- DAILY WORK RECORDS MOCK ---
  dailyRecords: {
    getAll: async () => {
      const records = read(KEYS.DAILY_RECORDS, []);
      const services = read(KEYS.SERVICES, []);
      // Join logic
      return records.map(rec => ({
        ...rec,
        service: services.find(s => s.id === rec.service_id) || { name: 'Unknown' }
      })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    create: async (data) => {
      const records = read(KEYS.DAILY_RECORDS, []);
      const services = read(KEYS.SERVICES, []);
      const srv = services.find(s => s.id === data.service_id);
      if (!srv) throw new Error('Selected service type does not exist');

      const amount = srv.price * parseInt(data.quantity);
      const newRecord = {
        id: 'r-' + Math.random().toString(36).substr(2, 9),
        service_id: data.service_id,
        customer_name: data.customer_name,
        phone_number: data.phone_number,
        quantity: parseInt(data.quantity),
        amount,
        officer_name: data.officer_name,
        notes: data.notes || '',
        created_at: new Date().toISOString()
      };

      records.push(newRecord);
      write(KEYS.DAILY_RECORDS, records);

      // Automatically post transaction in ledger (transactions)
      await mockDb.transactions.create({
        type: 'income',
        amount,
        purpose: `${srv.name} - ${data.customer_name} (Qty: ${data.quantity})`,
        collected_by: data.officer_name
      });

      return {
        ...newRecord,
        service: srv
      };
    },

    delete: async (id) => {
      const records = read(KEYS.DAILY_RECORDS, []);
      const filtered = records.filter(r => r.id !== id);
      write(KEYS.DAILY_RECORDS, filtered);
      return true;
    }
  },

  // --- OFFICE LEDGER (TRANSACTIONS) MOCK ---
  transactions: {
    getAll: async () => {
      return read(KEYS.TRANSACTIONS, []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    create: async (data) => {
      const transactions = read(KEYS.TRANSACTIONS, []);
      const newTx = {
        id: 't-' + Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        type: data.type,
        amount: parseFloat(data.amount),
        purpose: data.purpose,
        collected_by: data.collected_by,
        created_at: new Date().toISOString()
      };
      transactions.push(newTx);
      write(KEYS.TRANSACTIONS, transactions);
      return newTx;
    },

    getBalanceSummary: async () => {
      const txs = read(KEYS.TRANSACTIONS, []);
      let income = 0;
      let expenses = 0;
      let todayIncome = 0;
      let thisMonthIncome = 0;

      const todayStr = new Date().toISOString().split('T')[0];
      const thisMonthPrefix = todayStr.substring(0, 7); // "YYYY-MM"

      txs.forEach(t => {
        const amt = parseFloat(t.amount);
        if (t.type === 'income') {
          income += amt;
          if (t.date === todayStr) todayIncome += amt;
          if (t.date.startsWith(thisMonthPrefix)) thisMonthIncome += amt;
        } else if (t.type === 'expense') {
          expenses += amt;
        }
      });

      return {
        totalIncome: income,
        totalExpenses: expenses,
        remainingBalance: income - expenses,
        incomeToday: todayIncome,
        incomeThisMonth: thisMonthIncome
      };
    }
  },

  // --- DEBTORS MOCK ---
  debtors: {
    getAll: async () => {
      return read(KEYS.DEBTORS, []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    create: async (data) => {
      const debtors = read(KEYS.DEBTORS, []);
      const newDebtor = {
        id: 'd-' + Math.random().toString(36).substr(2, 9),
        customer_name: data.customer_name,
        phone_number: data.phone_number,
        amount_owed: parseFloat(data.amount_owed),
        due_date: data.due_date,
        status: 'unpaid',
        payment_history: [],
        created_at: new Date().toISOString()
      };
      debtors.push(newDebtor);
      write(KEYS.DEBTORS, debtors);
      return newDebtor;
    },

    recordPayment: async (id, amountPaid, receivedBy) => {
      const debtors = read(KEYS.DEBTORS, []);
      const idx = debtors.findIndex(d => d.id === id);
      if (idx === -1) throw new Error('Debtor record not found');

      const debtor = debtors[idx];
      const amt = parseFloat(amountPaid);

      if (amt <= 0) throw new Error('Payment must be greater than zero.');
      if (amt > debtor.amount_owed) throw new Error('Payment cannot exceed amount owed.');

      debtor.amount_owed = parseFloat((debtor.amount_owed - amt).toFixed(2));
      debtor.payment_history.push({
        date: new Date().toISOString().split('T')[0],
        amount_paid: amt,
        received_by: receivedBy
      });

      if (debtor.amount_owed === 0) {
        debtor.status = 'paid';
      }

      debtors[idx] = debtor;
      write(KEYS.DEBTORS, debtors);

      // Automatically post payments into ledger (transactions) as income
      await mockDb.transactions.create({
        type: 'income',
        amount: amt,
        purpose: `Debt Repayment - ${debtor.customer_name}`,
        collected_by: receivedBy
      });

      return debtor;
    },

    getSummary: async () => {
      const debtors = read(KEYS.DEBTORS, []);
      const unpaidCount = debtors.filter(d => d.status === 'unpaid').length;
      const totalOwed = debtors.reduce((sum, d) => sum + (d.status === 'unpaid' ? d.amount_owed : 0), 0);

      return {
        unpaidCount,
        totalOwed
      };
    }
  },

  // --- GLOBAL SEARCH ---
  globalSearch: async (query) => {
    if (!query) return { records: [], debtors: [], transactions: [] };
    const q = query.toLowerCase();

    // 1. Search Daily work records
    const records = await mockDb.dailyRecords.getAll();
    const filteredRecords = records.filter(r => 
      r.customer_name.toLowerCase().includes(q) || 
      r.phone_number.includes(q) ||
      (r.service && r.service.name.toLowerCase().includes(q)) ||
      r.officer_name.toLowerCase().includes(q)
    );

    // 2. Search Debtors
    const debtors = await mockDb.debtors.getAll();
    const filteredDebtors = debtors.filter(d => 
      d.customer_name.toLowerCase().includes(q) || 
      d.phone_number.includes(q)
    );

    // 3. Search Transactions (ledger)
    const transactions = await mockDb.transactions.getAll();
    const filteredTransactions = transactions.filter(t => 
      t.purpose.toLowerCase().includes(q) || 
      t.collected_by.toLowerCase().includes(q)
    );

    return {
      records: filteredRecords.slice(0, 10),
      debtors: filteredDebtors.slice(0, 10),
      transactions: filteredTransactions.slice(0, 10)
    };
  }
};
