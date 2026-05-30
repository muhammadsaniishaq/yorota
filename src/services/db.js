import { supabase } from './supabase';

export const db = {
  isMock: () => false, // Mock environment completely removed
  
  auth: {
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Fetch user profile metadata (role and name) without throwing on empty array
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id);
        
      if (pError) throw pError;
      
      if (!profile || profile.length === 0) {
        // Fallback if profile doesn't exist yet: initialize a profile dynamically
        const fallbackName = data.user.email.split('@')[0];
        const fallbackRole = data.user.email.includes('admin') ? 'admin' : 'officer';
        
        const { data: newProfile, error: insErr } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, name: fallbackName, role: fallbackRole }])
          .select();
          
        if (insErr) {
          console.error('Profile insertion error:', insErr);
          throw new Error(`Profile initialization failed: ${insErr.message}. Ensure your "profiles" RLS policy permits authenticated inserts with check constraints.`);
        }
        
        const createdProfile = newProfile[0];
        return {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: createdProfile.name,
            role: createdProfile.role
          },
          session: data.session
        };
      }
      
      const activeProfile = profile[0];
      return { 
        user: { 
          id: data.user.id,
          email: data.user.email, 
          name: activeProfile.name, 
          role: activeProfile.role 
        }, 
        session: data.session 
      };
    },

    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    },

    getCurrentUser: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return profile ? { id: user.id, email: user.email, name: profile.name, role: profile.role } : null;
    }
  },

  services: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    getActive: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },

    create: async (data) => {
      const { data: inserted, error } = await supabase
        .from('services')
        .insert([data])
        .select()
        .single();
      if (error) {
        if (error.code === '23505') throw new Error(`Category "${data.name}" already exists.`);
        throw error;
      }
      return inserted;
    },

    update: async (id, data) => {
      const { data: updated, error } = await supabase
        .from('services')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        if (error.code === '23505') throw new Error(`Category "${data.name}" already exists.`);
        throw error;
      }
      return updated;
    },

    delete: async (id) => {
      const { count, error: countErr } = await supabase
        .from('daily_records')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', id);
      if (countErr) throw countErr;
      if (count > 0) {
        throw new Error('Cannot delete this category because it is already used in existing daily entries. Deactivate it instead.');
      }

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  dailyRecords: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('daily_records')
        .select('*, service:services(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    create: async (data) => {
      // Fetch selected service price dynamically
      const { data: srv, error: srvErr } = await supabase
        .from('services')
        .select('*')
        .eq('id', data.service_id)
        .single();
      if (srvErr) throw new Error('Selected service type does not exist');

      const amount = srv.price * parseInt(data.quantity);
      const recordData = {
        service_id: data.service_id,
        customer_name: data.customer_name,
        phone_number: data.phone_number,
        quantity: parseInt(data.quantity),
        amount,
        officer_name: data.officer_name,
        notes: data.notes || ''
      };

      const { data: inserted, error } = await supabase
        .from('daily_records')
        .insert([recordData])
        .select()
        .single();
      if (error) throw error;

      // Auto post to transactions ledger
      const { error: txErr } = await supabase
        .from('transactions')
        .insert([{
          type: 'income',
          amount,
          purpose: `${srv.name} - ${data.customer_name} (Qty: ${data.quantity})`,
          collected_by: data.officer_name
        }]);
      if (txErr) console.error('Ledger posting error:', txErr);

      return {
        ...inserted,
        service: srv
      };
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('daily_records')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  transactions: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    create: async (data) => {
      const { data: inserted, error } = await supabase
        .from('transactions')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return inserted;
    },

    getBalanceSummary: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*');
      if (error) throw error;

      let income = 0;
      let expenses = 0;
      let todayIncome = 0;
      let thisMonthIncome = 0;
      
      const todayStr = new Date().toISOString().split('T')[0];
      const thisMonthPrefix = todayStr.substring(0, 7);

      data.forEach(t => {
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

  debtors: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('debtors')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    create: async (data) => {
      const { data: inserted, error } = await supabase
        .from('debtors')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return inserted;
    },

    recordPayment: async (id, amount, collectedBy) => {
      const { data: debtor, error: dError } = await supabase
        .from('debtors')
        .select('*')
        .eq('id', id)
        .single();
      if (dError) throw dError;
      
      const newOwed = parseFloat((debtor.amount_owed - amount).toFixed(2));
      const status = newOwed === 0 ? 'paid' : 'unpaid';
      const history = [...debtor.payment_history, {
        date: new Date().toISOString().split('T')[0],
        amount_paid: amount,
        received_by: collectedBy
      }];

      const { data: updated, error } = await supabase
        .from('debtors')
        .update({ amount_owed: newOwed, status, payment_history: history })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Add ledger entry
      const { error: txErr } = await supabase
        .from('transactions')
        .insert([{
          type: 'income',
          amount,
          purpose: `Debt Repayment - ${debtor.customer_name}`,
          collected_by: collectedBy
        }]);
      if (txErr) console.error('Ledger posting error:', txErr);

      return updated;
    },

    increaseDebt: async (id, amount, reason, officerName) => {
      const { data: debtor, error: dError } = await supabase
        .from('debtors')
        .select('*')
        .eq('id', id)
        .single();
      if (dError) throw dError;

      const newOwed = parseFloat((debtor.amount_owed + amount).toFixed(2));
      const status = newOwed === 0 ? 'paid' : 'unpaid';
      const history = [...debtor.payment_history, {
        date: new Date().toISOString().split('T')[0],
        amount_added: amount,
        reason: reason || 'Accumulated additional credit',
        received_by: officerName
      }];

      const { data: updated, error } = await supabase
        .from('debtors')
        .update({ amount_owed: newOwed, status, payment_history: history })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },

    getSummary: async () => {
      const { data, error } = await supabase
        .from('debtors')
        .select('*')
        .eq('status', 'unpaid');
      if (error) throw error;
      const unpaidCount = data.length;
      const totalOwed = data.reduce((sum, d) => sum + parseFloat(d.amount_owed), 0);
      return { unpaidCount, totalOwed };
    }
  },

  globalSearch: async (query) => {
    if (!query) return { records: [], debtors: [], transactions: [] };
    const q = `%${query}%`;
    const [recRes, debtRes, txRes] = await Promise.all([
      supabase
        .from('daily_records')
        .select('*, service:services(*)')
        .or(`customer_name.ilike.${q},phone_number.ilike.${q},notes.ilike.${q},officer_name.ilike.${q}`)
        .limit(5),
      supabase
        .from('debtors')
        .select('*')
        .or(`customer_name.ilike.${q},phone_number.ilike.${q}`)
        .limit(5),
      supabase
        .from('transactions')
        .select('*')
        .or(`purpose.ilike.${q},collected_by.ilike.${q}`)
        .limit(5)
    ]);

    if (recRes.error) throw recRes.error;
    if (debtRes.error) throw debtRes.error;
    if (txRes.error) throw txRes.error;

    return {
      records: recRes.data || [],
      debtors: debtRes.data || [],
      transactions: txRes.data || []
    };
  }
};
