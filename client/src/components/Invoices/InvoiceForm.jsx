import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, RotateCcw } from 'lucide-react';
import { calculateLineItemAmount, calculateTotal } from './utils';

const InvoiceForm = ({ existingInvoice, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        type: 'invoice', // or 'quotation'
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        paymentTerms: '',
        poNumber: '',
        billTo: { name: '', address: '' },
        shipTo: { address: '' },
        items: [{ id: 1, description: '', quantity: 1, rate: 0, amount: 0 }],
        discount: { type: 'percentage', value: 0 },
        tax: { type: 'percentage', value: 0 },
        shipping: 0,
        amountPaid: 0,
        notes: 'Includes complete workflow setup, API integrations, custom logic, testing, deployment, and 7-day support.',
        terms: '',
    });

    useEffect(() => {
        if (existingInvoice) {
            setFormData(existingInvoice);
        } else {
            // Generate a random invoice number if new (in real app, fetch next from DB)
            setFormData(prev => ({ ...prev, invoiceNumber: Math.floor(1000 + Math.random() * 9000) }));
        }
    }, [existingInvoice]);

    // Calculations
    const subtotal = formData.items.reduce((acc, item) => acc + (item.amount || 0), 0);
    const total = calculateTotal(subtotal, formData.discount, formData.tax, formData.shipping);
    const balanceDue = Math.max(0, total - formData.amountPaid);

    const handleInputChange = (e, section = null) => {
        const { name, value } = e.target;
        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: { ...prev[section], [name]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleItemChange = (id, field, value) => {
        setFormData(prev => {
            const newItems = prev.items.map(item => {
                if (item.id === id) {
                    const updatedItem = { ...item, [field]: value };
                    if (field === 'quantity' || field === 'rate') {
                        updatedItem.amount = calculateLineItemAmount(Number(updatedItem.quantity), Number(updatedItem.rate));
                    }
                    return updatedItem;
                }
                return item;
            });
            return { ...prev, items: newItems };
        });
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { id: Date.now(), description: '', quantity: 1, rate: 0, amount: 0 }]
        }));
    };

    const removeItem = (id) => {
        if (formData.items.length === 1) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation removed as per request
        onSave({
            ...formData,
            subtotal,
            total,
            balanceDue,
        });
    };

    return (
        <div className="bg-card border border-border rounded-xl p-6 md:p-8 animate-in slide-in-from-bottom-5 duration-500">
            <div className="flex justify-between items-start mb-8">
                {/* Left Side: Logo & Company Info */}
                <div className="flex flex-col gap-4">
                    <img src="/Logo.png" alt="Unfazed AI" className="h-16 w-auto object-contain self-start" />
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-text">Unfazed AI</h1>
                            <span className="text-text-muted text-sm border-l border-text-muted/30 pl-3">unfazed-ai.online</span>
                        </div>
                        <p className="text-text-muted text-sm mt-1">Ghaziabad, Uttar Pradesh</p>
                    </div>
                </div>

                {/* Right Side: Invoice/Quotation Toggle */}
                <div className="flex flex-col items-end">
                    <h2 className="text-3xl font-bold text-text cursor-pointer select-none text-right" onClick={() => setFormData(prev => ({ ...prev, type: prev.type === 'invoice' ? 'quotation' : 'invoice' }))}>
                        {formData.type === 'invoice' ? 'INVOICE' : 'QUOTATION'}
                    </h2>
                    <span className="text-xs text-text-muted font-normal">(Click to toggle)</span>

                    <button
                        type="button"
                        onClick={onCancel}
                        className="mt-4 p-2 text-text-muted hover:text-text hover:bg-white/5 rounded-lg transition-colors self-end"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Header Details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Number</label>
                        <div className="flex items-center">
                            <span className="text-text-muted mr-1">#</span>
                            <input
                                type="text"
                                name="invoiceNumber"
                                value={formData.invoiceNumber}
                                onChange={handleInputChange}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
                            onChange={handleInputChange}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Due Date</label>
                        <input
                            type="date"
                            name="dueDate"
                            value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''}
                            onChange={handleInputChange}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase mb-1">PO Number</label>
                        <input
                            type="text"
                            name="poNumber"
                            value={formData.poNumber}
                            onChange={handleInputChange}
                            placeholder="Optional"
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none"
                        />
                    </div>
                </div>

                {/* Client Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-background/30 rounded-lg border border-border/50">
                    <div>
                        <h3 className="text-sm font-semibold text-text-muted uppercase mb-3 border-b border-border/50 pb-2">Bill To</h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                name="name"
                                value={formData.billTo.name}
                                onChange={(e) => handleInputChange(e, 'billTo')}
                                placeholder="Client Name"
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none placeholder:text-text-muted/50"
                            />
                            <textarea
                                name="address"
                                value={formData.billTo.address}
                                onChange={(e) => handleInputChange(e, 'billTo')}
                                placeholder="Billing Address"
                                rows="3"
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none placeholder:text-text-muted/50 resize-none"
                            />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-text-muted uppercase mb-3 border-b border-border/50 pb-2">Ship To</h3>
                        <div className="space-y-3">
                            <textarea
                                name="address"
                                value={formData.shipTo.address}
                                onChange={(e) => handleInputChange(e, 'shipTo')}
                                placeholder="Shipping Address (Optional)"
                                rows="4"
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none placeholder:text-text-muted/50 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border text-left">
                                <th className="py-2 text-xs font-semibold text-text-muted uppercase w-[45%]">Item Details</th>
                                <th className="py-2 text-xs font-semibold text-text-muted uppercase w-[15%] text-center">Quantity</th>
                                <th className="py-2 text-xs font-semibold text-text-muted uppercase w-[20%] text-right">Rate</th>
                                <th className="py-2 text-xs font-semibold text-text-muted uppercase w-[20%] text-right">Amount</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {formData.items.map((item) => (
                                <tr key={item.id} className="group">
                                    <td className="py-2 pr-2">
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                            placeholder="Description"
                                            className="w-full bg-transparent border-none focus:ring-0 text-text placeholder:text-text-muted/30"
                                        />
                                    </td>
                                    <td className="py-2 px-2">
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                                            className="w-full bg-background border border-border/50 rounded px-2 py-1 text-text text-center focus:border-accent focus:outline-none"
                                        />
                                    </td>
                                    <td className="py-2 px-2">
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.rate || ''} // Empty string if 0 for cleaner UX
                                            onChange={(e) => handleItemChange(item.id, 'rate', Number(e.target.value))}
                                            className="w-full bg-background border border-border/50 rounded px-2 py-1 text-text text-right focus:border-accent focus:outline-none"
                                        />
                                    </td>
                                    <td className="py-2 pl-2 text-right text-text font-medium">
                                        {item.amount.toFixed(2)}
                                    </td>
                                    <td className="py-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            className="text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button
                        type="button"
                        onClick={addItem}
                        className="mt-4 flex items-center text-accent hover:text-accent-hover text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Add Line Item
                    </button>
                </div>

                {/* Totals & Adjustments */}
                <div className="flex flex-col md:flex-row justify-end border-t border-border pt-6 gap-12">
                    <div className="w-full md:w-1/2 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Includes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="Details about what is included in the project..."
                                rows="2"
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none text-sm resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Terms & Conditions</label>
                            <textarea
                                name="terms"
                                value={formData.terms}
                                onChange={handleInputChange}
                                placeholder="Payment terms, late fees, delivery schedule, etc."
                                rows="2"
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none text-sm resize-none"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-1/3 space-y-3">
                        <div className="flex justify-between text-text-muted">
                            <span>Subtotal</span>
                            <span>{subtotal.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center text-text-muted text-sm group">
                            <span className="flex items-center gap-2">
                                Discount
                                <select
                                    value={formData.discount.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, discount: { ...prev.discount, type: e.target.value } }))}
                                    className="bg-transparent border-none text-xs text-text-muted focus:ring-0 cursor-pointer p-0"
                                >
                                    <option value="percentage">%</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                            </span>
                            <div className="flex items-center gap-1">
                                {formData.discount.type === 'fixed' && <span className="text-xs">₹</span>}
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.discount.value}
                                    onChange={(e) => setFormData(prev => ({ ...prev, discount: { ...prev.discount, value: Number(e.target.value) } }))}
                                    className="w-16 bg-background border border-border/50 rounded px-1 py-0.5 text-right focus:border-accent focus:outline-none text-sm"
                                />
                                {formData.discount.type === 'percentage' && <span className="text-xs">%</span>}
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-text-muted text-sm">
                            <span>Tax (%)</span>
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.tax.value}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tax: { ...prev.tax, value: Number(e.target.value) } }))}
                                    className="w-16 bg-background border border-border/50 rounded px-1 py-0.5 text-right focus:border-accent focus:outline-none text-sm"
                                />
                                <span className="text-xs">%</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-text-muted text-sm">
                            <span>Shipping</span>
                            <div className="flex items-center gap-1">
                                <span className="text-xs">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.shipping}
                                    onChange={(e) => setFormData(prev => ({ ...prev, shipping: Number(e.target.value) }))}
                                    className="w-16 bg-background border border-border/50 rounded px-1 py-0.5 text-right focus:border-accent focus:outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="border-t border-border my-2"></div>

                        <div className="flex justify-between text-lg font-bold text-text">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center text-text-muted text-sm mt-4">
                            <span>Amount Paid</span>
                            <div className="flex items-center gap-1">
                                <span className="text-xs">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.amountPaid}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amountPaid: Number(e.target.value) }))}
                                    className="w-24 bg-background border border-border/50 rounded px-1 py-1 text-right focus:border-accent focus:outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between text-md font-bold text-accent mt-2 pt-2 border-t border-dashed border-border">
                            <span>Balance Due</span>
                            <span>₹{balanceDue.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-6">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                            ...prev,
                            type: 'invoice', invoiceNumber: '', date: new Date().toISOString().split('T')[0], dueDate: '',
                            billTo: { name: '', address: '' }, shipTo: { address: '' },
                            items: [{ id: Date.now(), description: '', quantity: 1, rate: 0, amount: 0 }],
                            discount: { type: 'percentage', value: 0 }, tax: { type: 'percentage', value: 0 },
                            shipping: 0, amountPaid: 0, notes: '', terms: ''
                        }))}
                        className="flex items-center gap-2 px-6 py-3 border border-border rounded-lg text-text-muted hover:bg-white/5 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> Clear Form
                    </button>
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium shadow-lg shadow-accent/20 transition-all"
                    >
                        <Save className="w-5 h-5" /> Save Invoice
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InvoiceForm;
