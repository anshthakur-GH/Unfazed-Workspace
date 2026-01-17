import React, { useState, useEffect } from 'react';
import InvoiceDashboard from '../components/Invoices/InvoiceDashboard';
import InvoiceForm from '../components/Invoices/InvoiceForm';
import { generateInvoicePDF } from '../components/Invoices/InvoicePDF';

const Invoices = () => {
    const [view, setView] = useState('dashboard'); // 'dashboard', 'create', 'edit'
    const [invoices, setInvoices] = useState([]);
    const [activeInvoice, setActiveInvoice] = useState(null);

    // Load from LocalStorage on mount
    useEffect(() => {
        const savedInvoices = localStorage.getItem('unfazed_invoices');
        if (savedInvoices) {
            try {
                setInvoices(JSON.parse(savedInvoices));
            } catch (error) {
                console.error("Failed to parse invoices from storage", error);
            }
        }
    }, []);

    // Save to LocalStorage whenever invoices change
    useEffect(() => {
        localStorage.setItem('unfazed_invoices', JSON.stringify(invoices));
    }, [invoices]);

    const handleCreateNew = () => {
        setActiveInvoice(null);
        setView('create');
    };

    const handleEdit = (invoice) => {
        setActiveInvoice(invoice);
        setView('edit');
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            setInvoices(prev => prev.filter(inv => inv.id !== id));
        }
    };

    const handleSave = (invoiceData) => {
        if (activeInvoice) {
            // Update existing
            setInvoices(prev => prev.map(inv => inv.id === invoiceData.id ? invoiceData : inv));
        } else {
            // Create new
            const newInvoice = {
                ...invoiceData,
                id: crypto.randomUUID(), // Or Date.now().toString() if crypto not safe
                createdAt: new Date().toISOString(),
                status: invoiceData.amountPaid >= invoiceData.total ? 'paid' : 'unpaid'
            };
            setInvoices(prev => [newInvoice, ...prev]);
        }
        setView('dashboard');
        setActiveInvoice(null);
    };

    const handleDownloadPDF = (invoice) => {
        generateInvoicePDF(invoice);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-text">Invoice Management</h1>
                <p className="text-text-muted">Create, manage, and track invoices for Unfazed AI.</p>
            </div>

            {view === 'dashboard' && (
                <InvoiceDashboard
                    invoices={invoices}
                    onCreateNew={handleCreateNew}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDownloadPDF={handleDownloadPDF}
                />
            )}

            {(view === 'create' || view === 'edit') && (
                <InvoiceForm
                    existingInvoice={activeInvoice}
                    onSave={handleSave}
                    onCancel={() => setView('dashboard')}
                />
            )}
        </div>
    );
};

export default Invoices;
