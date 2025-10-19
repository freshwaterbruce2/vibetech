/**
 * Database Service Tests (TDD RED Phase)
 *
 * Tests for DatabaseService that manages:
 * - Customer CRUD operations
 * - Invoice management
 * - Lead tracking
 *
 * Based on REST API integration pattern
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../../services/database';
import type { Customer, Invoice, Lead } from '../../services/database';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('DatabaseService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Customer Operations', () => {
    it('should fetch all customers', async () => {
      const mockCustomers: Customer[] = [
        { id: '1', email: 'test@example.com', full_name: 'Test User', created_at: '2025-01-01' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCustomers,
      });

      const customers = await db.getCustomers();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/customers'));
      expect(customers).toEqual(mockCustomers);
    });

    it('should create a customer', async () => {
      const newCustomer = { email: 'new@example.com', full_name: 'New User' };
      const mockResponse: Customer = { id: '2', ...newCustomer, created_at: '2025-01-01' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const customer = await db.createCustomer(newCustomer);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/customers'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(customer).toEqual(mockResponse);
    });

    it('should update a customer', async () => {
      const updates = { full_name: 'Updated Name' };
      const mockResponse: Customer = { id: '1', email: 'test@example.com', full_name: 'Updated Name', created_at: '2025-01-01' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const customer = await db.updateCustomer('1', updates);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/customers/1'),
        expect.objectContaining({ method: 'PUT' })
      );
      expect(customer.full_name).toBe('Updated Name');
    });

    it('should delete a customer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await db.deleteCustomer('1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/customers/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const customers = await db.getCustomers();

      expect(customers).toEqual([]);
    });
  });

  describe('Invoice Operations', () => {
    it('should fetch all invoices', async () => {
      const mockInvoices: Invoice[] = [
        { id: '1', amount_cents: 10000, issued_at: '2025-01-01', paid: false }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvoices,
      });

      const invoices = await db.getInvoices();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/invoices'));
      expect(invoices).toEqual(mockInvoices);
    });

    it('should create an invoice', async () => {
      const newInvoice = { amount_cents: 5000, issued_at: '2025-01-01' };
      const mockResponse: Invoice = { id: '2', ...newInvoice, paid: false };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const invoice = await db.createInvoice(newInvoice);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/invoices'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(invoice).toEqual(mockResponse);
    });

    it('should handle invoice fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'));

      const invoices = await db.getInvoices();

      expect(invoices).toEqual([]);
    });
  });

  describe('Lead Operations', () => {
    it('should fetch all leads', async () => {
      const mockLeads: Lead[] = [
        { id: '1', company_name: 'Test Corp', contact_email: 'contact@test.com', contact_name: 'John Doe', status: 'new' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLeads,
      });

      const leads = await db.getLeads();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/leads'));
      expect(leads).toEqual(mockLeads);
    });

    it('should create a lead', async () => {
      const newLead = { company_name: 'New Corp', contact_email: 'new@corp.com', contact_name: 'Jane Smith' };
      const mockResponse: Lead = { id: '2', ...newLead, status: 'new', created_at: '2025-01-01' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const lead = await db.createLead(newLead);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/leads'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(lead).toEqual(mockResponse);
    });

    it('should update a lead', async () => {
      const updates = { status: 'contacted' };
      const mockResponse: Lead = { id: '1', company_name: 'Test Corp', contact_email: 'contact@test.com', contact_name: 'John Doe', status: 'contacted' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const lead = await db.updateLead('1', updates);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/leads/1'),
        expect.objectContaining({ method: 'PUT' })
      );
      expect(lead.status).toBe('contacted');
    });

    it('should delete a lead', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await db.deleteLead('1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/leads/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle lead fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const leads = await db.getLeads();

      expect(leads).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should throw error on failed customer creation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(db.createCustomer({ email: 'bad@email', full_name: '' }))
        .rejects.toThrow('Failed to create customer');
    });

    it('should throw error on failed invoice creation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(db.createInvoice({ amount_cents: -100 }))
        .rejects.toThrow('Failed to create invoice');
    });

    it('should throw error on failed customer update', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(db.updateCustomer('999', { full_name: 'Not Found' }))
        .rejects.toThrow('Failed to update customer');
    });
  });
});
