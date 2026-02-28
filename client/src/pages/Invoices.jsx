import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import InvoiceDashboard from '../components/Invoices/InvoiceDashboard';
import InvoiceForm from '../components/Invoices/InvoiceForm';
import { generateInvoicePDF } from '../components/Invoices/InvoicePDF';

const Invoices = () => {
    const [view, setView] = useState('dashboard'); // 'dashboard', 'create', 'edit'
    const [invoices, setInvoices] = useState([]);
    const [activeInvoice, setActiveInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [localInvoicesCount, setLocalInvoicesCount] = useState(0);
    const isAdmin = localStorage.getItem('username') === 'Ansh_Unfazed';

    useEffect(() => {
        const saved = localStorage.getItem('unfazed_invoices');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setLocalInvoicesCount(parsed.length);
                }
            } catch (e) { console.error(e); }
        }
    }, []);

    // Fetch invoices from API
    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/invoices`, {
                headers: { Authorization: token }
            });
            setInvoices(res.data.map(inv => ({ ...inv, id: inv._id })));
            setError(null);
        } catch (err) {
            console.error("Failed to fetch invoices", err);
            setError("Failed to load invoices. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleCreateNew = () => {
        setActiveInvoice(null);
        setView('create');
    };

    const handleEdit = (invoice) => {
        setActiveInvoice(invoice);
        setView('edit');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_URL}/api/invoices/${id}`, {
                    headers: { Authorization: token }
                });
                setInvoices(prev => prev.filter(inv => inv._id !== id && inv.id !== id));
            } catch (err) {
                console.error("Failed to delete invoice", err);
                alert("Failed to delete invoice.");
            }
        }
    };

    const handleSave = async (invoiceData) => {
        try {
            const token = localStorage.getItem('token');
            // If activeInvoice has _id, it's an update
            const isUpdate = !!activeInvoice && (activeInvoice._id || activeInvoice.id);
            const idToUpdate = activeInvoice ? (activeInvoice._id || activeInvoice.id) : null;

            if (isUpdate) {
                // Update existing
                const res = await axios.put(`${API_URL}/api/invoices/${idToUpdate}`, invoiceData, {
                    headers: { Authorization: token }
                });

                const updatedInvoice = { ...res.data, id: res.data._id };
                setInvoices(prev => prev.map(inv => (inv._id === idToUpdate || inv.id === idToUpdate) ? updatedInvoice : inv));
            } else {
                // Create new
                // Backend expects straight data. 
                // Ensure id is NOT passed if it's empty or generate by backend.
                // Frontend creates 'id' with crypto.randomUUID() usually in Form?
                // If form passes 'id', we can keep it or let backend generate _id. 
                // Let's assume generic data.
                const res = await axios.post(`${API_URL}/api/invoices`, invoiceData, {
                    headers: { Authorization: token }
                });
                const newInvoice = { ...res.data, id: res.data._id };
                setInvoices(prev => [newInvoice, ...prev]);
            }
            setView('dashboard');
            setActiveInvoice(null);
        } catch (err) {
            console.error("Failed to save invoice", err);
            alert("Failed to save invoice. " + (err.response?.data?.message || err.message));
        }
    };

    const handleDownloadPDF = (invoice) => {
        generateInvoicePDF(invoice);
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const invoice = invoices.find(inv => inv._id === id || inv.id === id);
            if (!invoice) return;

            const updatedData = {
                ...invoice,
                status: newStatus,
                amountPaid: newStatus === 'paid' ? invoice.total : 0,
                balanceDue: newStatus === 'paid' ? 0 : invoice.total
            };

            // Calculate IDs
            const realId = invoice._id || invoice.id;

            const res = await axios.put(`${API_URL}/api/invoices/${realId}`, updatedData, {
                headers: { Authorization: token }
            });

            const updatedInvoice = { ...res.data, id: res.data._id };
            setInvoices(prev => prev.map(inv => (inv._id === realId || inv.id === realId) ? updatedInvoice : inv));
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const handleDuplicate = async (invoice) => {
        try {
            const token = localStorage.getItem('token');
            const newInvoiceData = {
                ...invoice,
                _id: undefined, // Clear ID
                id: undefined,
                invoiceNumber: `${invoice.invoiceNumber}-COPY`,
                date: new Date().toISOString(),
                createdAt: undefined
            };

            const res = await axios.post(`${API_URL}/api/invoices`, newInvoiceData, {
                headers: { Authorization: token }
            });
            const duplicatedInvoice = { ...res.data, id: res.data._id };
            setInvoices(prev => [duplicatedInvoice, ...prev]);
        } catch (err) {
            console.error("Failed to duplicate invoice", err);
        }
    };

    // Migration Logic
    const handleMigrateLocalData = async () => {
        if (!window.confirm(`Found ${localInvoicesCount} invoices in Local Storage. Do you want to upload them to the database? This may create duplicates if they already exist.`)) return;

        try {
            setLoading(true);
            const saved = localStorage.getItem('unfazed_invoices');
            const localInvoices = JSON.parse(saved);
            const token = localStorage.getItem('token');

            let successCount = 0;
            for (const inv of localInvoices) {
                // Ensure no ID conflict, let backend/schema handle _id
                const { id, _id, ...safeData } = inv;
                // Restore formatted fields if needed, or pass as is. 
                // Schema expects strict fields, extra fields are ignored by Mongoose (mostly).

                // Fix date formats if they are strings
                if (safeData.date) safeData.date = new Date(safeData.date);
                if (safeData.dueDate) safeData.dueDate = new Date(safeData.dueDate);
                if (safeData.createdAt) safeData.createdAt = new Date(safeData.createdAt);

                await axios.post(`${API_URL}/api/invoices`, safeData, {
                    headers: { Authorization: token }
                });
                successCount++;
            }

            alert(`Successfully migrated ${successCount} invoices!`);
            localStorage.removeItem('unfazed_invoices');
            setLocalInvoicesCount(0);
            fetchInvoices(); // Refresh list
        } catch (err) {
            console.error(err);
            alert("Migration partially failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-text-muted">Loading invoices...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-text">Invoice Management</h1>
                        <p className="text-text-muted">Create, manage, and track invoices for Unfazed AI.</p>
                    </div>
                    {localInvoicesCount > 0 && isAdmin && (
                        <button
                            onClick={handleMigrateLocalData}
                            className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 px-4 py-2 rounded-lg text-sm font-medium border border-yellow-500/20 transition-colors animate-pulse"
                        >
                            Sync {localInvoicesCount} Local Invoices
                        </button>
                    )}
                </div>
            </div>

            {view === 'dashboard' && (
                <InvoiceDashboard
                    invoices={invoices}
                    onCreateNew={handleCreateNew}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onDownloadPDF={handleDownloadPDF}
                    onStatusChange={handleStatusChange}
                    isAdmin={isAdmin}
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
