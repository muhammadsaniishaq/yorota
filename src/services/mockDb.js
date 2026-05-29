// YOROTA Smart Office - High-Fidelity Mock Database Service
// Emulates Supabase PostgreSQL queries, tables, and constraints in LocalStorage

const KEYS = {
  SERVICES: 'yorota_services',
  DAILY_RECORDS: 'yorota_daily_records',
  TRANSACTIONS: 'yorota_transactions',
  DEBTORS: 'yorota_debtors',
  REPORTS: 'yorota_reports',
  USERS: 'yorota_users',
  CURRENT_USER: 'yorota_current_user'
};

// Initial services categories seed data
const DEFAULT_SERVICES = [
  { id: 's1', name: 'Rider Registration', price: 50.00, description: 'New registration for commercial motorcycle riders', status: 'active', created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 's2', name: 'Tricycle Owner', price: 75.00, description: 'Registration for tricycle vehicle owners', status: 'active', created_at: new Date(Date.now() - 28 * 86400000).toISOString() },
  { id: 's3', name: 'Renewal', price: 30.00, description: 'Annual driver or commercial permit renewals', status: 'active', created_at: new Date(Date.now() - 25 * 86400000).toISOString() },
  { id: 's4', name: 'Transfer of Ownership', price: 100.00, description: 'Legal transfer of commercial vehicle licenses', status: 'active', created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: 's5', name: 'Temp Operating Permit', price: 20.00, description: 'Temporary operating authorization certificate', status: 'inactive', created_at: new Date(Date.now() - 15 * 86400000).toISOString() }
];

// Helper to seed dates
const dateOffset = (days) => new Date(Date.now() - days * 86400000).toISOString();

const DEFAULT_DAILY_RECORDS = [
  { id: 'r1', service_id: 's1', customer_name: 'Abubakar Garba', phone_number: '+234 803 111 2222', quantity: 1, amount: 50.00, officer_name: 'Officer Musa', notes: 'First-time registration', created_at: dateOffset(5) },
  { id: 'r2', service_id: 's2', customer_name: 'Emmanuel Okafor', phone_number: '+234 812 333 4444', quantity: 2, amount: 150.00, officer_name: 'Officer Musa', notes: 'Two fleets registered', created_at: dateOffset(4) },
  { id: 'r3', service_id: 's3', customer_name: 'Fatima Bello', phone_number: '+234 905 555 6666', quantity: 1, amount: 30.00, officer_name: 'Officer Musa', notes: 'Yearly renewal', created_at: dateOffset(3) },
  { id: 'r4', service_id: 's4', customer_name: 'Chinedu Okeke', phone_number: '+234 708 777 8888', quantity: 1, amount: 100.00, officer_name: 'Officer Amina', notes: 'Ownership transfer from Alhaji Sani', created_at: dateOffset(2) },
  { id: 'r5', service_id: 's1', customer_name: 'Ibrahim Yusuf', phone_number: '+234 803 999 0000', quantity: 2, amount: 100.00, officer_name: 'Officer Amina', notes: 'Express rider registration', created_at: dateOffset(1) },
  { id: 'r6', service_id: 's3', customer_name: 'Sani Mohammed', phone_number: '+234 802 444 5555', quantity: 3, amount: 90.00, officer_name: 'Officer Musa', notes: 'Group permit renewals', created_at: new Date().toISOString() },
  { id: 'r7', service_id: 's2', customer_name: 'Tunde Lawal', phone_number: '+234 901 888 9999', quantity: 1, amount: 75.00, officer_name: 'Officer Amina', notes: 'New commercial tricycle registration', created_at: new Date().toISOString() }
];

const DEFAULT_TRANSACTIONS = [
  { id: 't1', date: dateOffset(5).split('T')[0], type: 'income', amount: 50.00, purpose: 'Rider Registration - Abubakar Garba', collected_by: 'Officer Musa', created_at: dateOffset(5) },
  { id: 't2', date: dateOffset(4).split('T')[0], type: 'income', amount: 150.00, purpose: 'Tricycle Owner - Emmanuel Okafor', collected_by: 'Officer Musa', created_at: dateOffset(4) },
  { id: 't3', date: dateOffset(3).split('T')[0], type: 'income', amount: 30.00, purpose: 'Renewal - Fatima Bello', collected_by: 'Officer Musa', created_at: dateOffset(3) },
  { id: 't4', date: dateOffset(3).split('T')[0], type: 'expense', amount: 45.00, purpose: 'Office printing paper & clipboards', collected_by: 'Admin Ibrahim', created_at: dateOffset(3) },
  { id: 't5', date: dateOffset(2).split('T')[0], type: 'income', amount: 100.00, purpose: 'Transfer of Ownership - Chinedu Okeke', collected_by: 'Officer Amina', created_at: dateOffset(2) },
  { id: 't6', date: dateOffset(1).split('T')[0], type: 'income', amount: 100.00, purpose: 'Rider Registration - Ibrahim Yusuf', collected_by: 'Officer Amina', created_at: dateOffset(1) },
  { id: 't7', date: dateOffset(1).split('T')[0], type: 'expense', amount: 120.00, purpose: 'Internet subscription renewal', collected_by: 'Admin Ibrahim', created_at: dateOffset(1) },
  { id: 't8', date: new Date().toISOString().split('T')[0], type: 'income', amount: 90.00, purpose: 'Renewal - Sani Mohammed', collected_by: 'Officer Musa', created_at: new Date().toISOString() },
  { id: 't9', date: new Date().toISOString().split('T')[0], type: 'income', amount: 75.00, purpose: 'Tricycle Owner - Tunde Lawal', collected_by: 'Officer Amina', created_at: new Date().toISOString() }
];

const DEFAULT_DEBTORS = [
  {
    id: 'd1',
    customer_name: 'Malam Isa Aliyu',
    phone_number: '+234 806 222 3333',
    amount_owed: 120.00,
    due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    status: 'unpaid',
    payment_history: [],
    created_at: dateOffset(10)
  },
  {
    id: 'd2',
    customer_name: 'Grace Nwosu',
    phone_number: '+234 703 444 5555',
    amount_owed: 40.00,
    due_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], // Overdue
    status: 'unpaid',
    payment_history: [
      { date: dateOffset(2).split('T')[0], amount_paid: 60.00, received_by: 'Officer Musa' }
    ],
    created_at: dateOffset(8)
  },
  {
    id: 'd3',
    customer_name: 'Haruna Danladi',
    phone_number: '+234 815 666 7777',
    amount_owed: 0.00,
    due_date: dateOffset(1).split('T')[0],
    status: 'paid',
    payment_history: [
      { date: dateOffset(1).split('T')[0], amount_paid: 75.00, received_by: 'Officer Amina' }
    ],
    created_at: dateOffset(6)
  }
];

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
