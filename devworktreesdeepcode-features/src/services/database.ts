// Local Database Service using IndexedDB for browser storage
// For persistent data, we'll use a backend API that saves to D: drive

export interface Customer {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  created_at?: string | null;
}

export interface Invoice {
  id: string;
  amount_cents: number;
  issued_at?: string | null;
  job_id?: string | null;
  paid?: boolean | null;
}

export interface Lead {
  id: string;
  company_name: string;
  contact_email: string;
  contact_name: string;
  created_at?: string | null;
  notes?: string | null;
  phone?: string | null;
  status?: string | null;
}

// Database API endpoints (will connect to backend server)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9001';

class DatabaseService {
  // Customers
  async getCustomers(): Promise<Customer[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
    if (!response.ok) throw new Error('Failed to create customer');
    return response.json();
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update customer');
    return response.json();
  }

  async deleteCustomer(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete customer');
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices`);
      if (!response.ok) throw new Error('Failed to fetch invoices');
      return response.json();
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  async createInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
    const response = await fetch(`${API_BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    });
    if (!response.ok) throw new Error('Failed to create invoice');
    return response.json();
  }

  // Leads
  async getLeads(): Promise<Lead[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      return response.json();
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }

  async createLead(lead: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> {
    const response = await fetch(`${API_BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
    if (!response.ok) throw new Error('Failed to create lead');
    return response.json();
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update lead');
    return response.json();
  }

  async deleteLead(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete lead');
  }
}

export const db = new DatabaseService();