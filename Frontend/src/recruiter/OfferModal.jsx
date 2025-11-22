import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { Loader2 } from 'lucide-react';

const OfferModal = ({ app, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        designation: '',
        grade: '',
        department: '',
        location: '',
        offeredSalary: '',
        vehicleEntitlement: '',
        systemRequirement: '',
        mobileAllowance: '',
        fuelAllowance: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setFormData({
            designation: app.job?.designation || app.offer?.designation || '',
            grade: app.job?.grade || app.offer?.grade || '', 
            department: app.job?.department || app.offer?.department || '',
            location: app.job?.location || app.offer?.location || '',
            offeredSalary: app.offer?.offeredSalary || '',
            vehicleEntitlement: app.offer?.vehicleEntitlement || 'N/A',
            systemRequirement: app.offer?.systemRequirement || 'N/A',
            mobileAllowance: app.offer?.mobileAllowance || 'N/A',
            fuelAllowance: app.offer?.fuelAllowance || 0,
        });
    }, [app]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post(`/applications/${app._id}/offer`, formData);
            onSuccess(res.data);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send offer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={true} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
                    <form onSubmit={handleSubmit}>
                        {/* --- HEADER: Unchanged as requested --- */}
                        <div className="p-5 rounded-t-2xl bg-[#BFBFBF] text-black flex items-center justify-between border-b-2 border-[#1A1A1A]">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-9 rounded-full bg-[#E30613]" />
                                <div>
                                    <h3 className="text-xl font-semibold"> Send Offer</h3>
                                    <p className="text-sm opacity-90">To: {app.applicant.name}</p>
                                </div>
                            </div>
                            <div>
                                <button
                                    type="button" // Added type button
                                    onClick={onClose}
                                    className="bg-transparent hover:bg-black/30 font-semibold hover:text-white rounded-full p-2 text-black transition"
                                    aria-label="Close update profile"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        
                        
                        <div className="p-6">
                            <div className="mt- grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-2">
                                <InputField label="Designation" name="designation" value={formData.designation} onChange={handleChange} required />
                                <InputField label="Grade" name="grade" value={formData.grade} onChange={handleChange} />
                                <InputField label="Department" name="department" value={formData.department} onChange={handleChange} required />
                                <InputField label="Location" name="location" value={formData.location} onChange={handleChange} required />
                                
                                <InputField label="Offered Salary" name="offeredSalary" type="number" value={formData.offeredSalary} onChange={handleChange} required />
                                <InputField label="Vehicle Entitlement" name="vehicleEntitlement" value={formData.vehicleEntitlement} onChange={handleChange} />
                                
                                <InputField label="Mobile Allowance" name="mobileAllowance" type="text" value={formData.mobileAllowance} onChange={handleChange} />
                                
                                <InputField label="Fuel Allowance" name="fuelAllowance" type="number" value={formData.fuelAllowance} onChange={handleChange} />
                                <div className="md:col-span-2">
                                    <InputField label="System Requirement" name="systemRequirement" value={formData.systemRequirement} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                        
                        {/* --- THEME: Footer Buttons --- */}
                        <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t rounded-b-xl">
                            <button 
                              type="button" 
                              onClick={onClose} 
                              disabled={loading} 
                              className="px-5 py-2.5 text-sm bg-gray-300 text-black rounded-full font-medium hover:bg-gray-200 transition disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit" 
                              disabled={loading} 
                              className="flex items-center justify-center gap-2 px-5 py-2 text-sm bg-[#111] text-white rounded-full shadow-md hover:bg-red-700 transition disabled:bg-gray-400 font-medium"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                                {loading ? 'Sending...' : 'Submit for Approval'}
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

// --- THEME: InputField ---
const InputField = ({ label, ...props }) => (
    <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <input 
            {...props}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:ring-1 focus:ring-black focus:outline-none transition"
        />
    </div>
);

export default OfferModal;