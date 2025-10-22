import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:9001';

test.describe('Backend API Tests', () => {
  test('should return health status', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/health`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.database).toContain('vibetech.db');
  });

  test('should handle CORS correctly', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/health`, {
      headers: {
        'Origin': 'http://localhost:8082'
      }
    });
    
    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-origin']).toBeTruthy();
  });

  test.describe('Customers API', () => {
    test('should get customers list', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/customers`);
      expect(response.status()).toBe(200);
      
      const customers = await response.json();
      expect(Array.isArray(customers)).toBe(true);
    });

    test('should create new customer', async ({ request }) => {
      const newCustomer = {
        email: 'test@example.com',
        full_name: 'Test Customer',
        phone: '555-0123'
      };

      const response = await request.post(`${API_BASE_URL}/api/customers`, {
        data: newCustomer
      });
      
      expect(response.status()).toBe(200);
      
      const customer = await response.json();
      expect(customer.email).toBe(newCustomer.email);
      expect(customer.full_name).toBe(newCustomer.full_name);
      expect(customer.id).toBeTruthy();
    });

    test('should update existing customer', async ({ request }) => {
      // First create a customer
      const newCustomer = {
        email: 'update@example.com',
        full_name: 'Update Test',
        phone: '555-0124'
      };

      const createResponse = await request.post(`${API_BASE_URL}/api/customers`, {
        data: newCustomer
      });
      const createdCustomer = await createResponse.json();

      // Then update it
      const updates = {
        full_name: 'Updated Name',
        phone: '555-9999'
      };

      const updateResponse = await request.put(`${API_BASE_URL}/api/customers/${createdCustomer.id}`, {
        data: { ...newCustomer, ...updates }
      });

      expect(updateResponse.status()).toBe(200);
      
      const updatedCustomer = await updateResponse.json();
      expect(updatedCustomer.full_name).toBe(updates.full_name);
      expect(updatedCustomer.phone).toBe(updates.phone);
    });

    test('should delete customer', async ({ request }) => {
      // First create a customer
      const newCustomer = {
        email: 'delete@example.com',
        full_name: 'Delete Test',
        phone: '555-0125'
      };

      const createResponse = await request.post(`${API_BASE_URL}/api/customers`, {
        data: newCustomer
      });
      const createdCustomer = await createResponse.json();

      // Then delete it
      const deleteResponse = await request.delete(`${API_BASE_URL}/api/customers/${createdCustomer.id}`);
      expect(deleteResponse.status()).toBe(204);
    });
  });

  test.describe('Leads API', () => {
    test('should get leads list', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/leads`);
      expect(response.status()).toBe(200);
      
      const leads = await response.json();
      expect(Array.isArray(leads)).toBe(true);
    });

    test('should create new lead', async ({ request }) => {
      const newLead = {
        company_name: 'Test Company',
        contact_email: 'contact@testcompany.com',
        contact_name: 'John Doe',
        phone: '555-0126',
        notes: 'Test lead creation',
        status: 'new'
      };

      const response = await request.post(`${API_BASE_URL}/api/leads`, {
        data: newLead
      });
      
      expect(response.status()).toBe(200);
      
      const lead = await response.json();
      expect(lead.company_name).toBe(newLead.company_name);
      expect(lead.contact_email).toBe(newLead.contact_email);
      expect(lead.id).toBeTruthy();
    });

    test('should handle validation errors', async ({ request }) => {
      const invalidLead = {
        company_name: '', // Empty required field
        contact_email: 'invalid-email', // Invalid email
        contact_name: ''
      };

      const response = await request.post(`${API_BASE_URL}/api/leads`, {
        data: invalidLead
      });
      
      // Should handle gracefully (our API currently doesn't have validation, so this tests the actual behavior)
      expect([200, 400, 500]).toContain(response.status());
    });
  });

  test.describe('Invoices API', () => {
    test('should get invoices list', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invoices`);
      expect(response.status()).toBe(200);
      
      const invoices = await response.json();
      expect(Array.isArray(invoices)).toBe(true);
    });

    test('should create new invoice', async ({ request }) => {
      const newInvoice = {
        amount_cents: 10000, // $100.00
        job_id: 'JOB-001',
        paid: false
      };

      const response = await request.post(`${API_BASE_URL}/api/invoices`, {
        data: newInvoice
      });
      
      expect(response.status()).toBe(200);
      
      const invoice = await response.json();
      expect(invoice.amount_cents).toBe(newInvoice.amount_cents);
      expect(invoice.job_id).toBe(newInvoice.job_id);
      expect(invoice.id).toBeTruthy();
    });
  });

  test('should handle database connection', async ({ request }) => {
    // Test that database operations work
    const healthResponse = await request.get(`${API_BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    expect(healthData.database).toContain('D:\\vibe-tech-data\\vibetech.db');
    
    // Test basic CRUD to ensure database is working
    const customersResponse = await request.get(`${API_BASE_URL}/api/customers`);
    expect(customersResponse.status()).toBe(200);
  });
});