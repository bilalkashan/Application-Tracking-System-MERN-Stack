import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../api';
import Sidebar from '../components/Sidebar';
import ProfileHeader from '../components/ProfileHeader';
import { Dialog } from '@headlessui/react';
import { Trash2, Edit, Users, Building, UserCog, Check, Search, Loader2 } from 'lucide-react'; // Added Loader2
import { FaSpinner, FaBars } from 'react-icons/fa'; // Added FaBars
import Footer from "../components/Footer";

const ROLES = ['user', 'recruiter', 'hod', 'hr', 'coo', 'admin', 'sub_recruiter', ];

const ManageUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false); // Set to false
    const [activeTab, setActiveTab] = useState('mmcl');
    const [searchQuery, setSearchQuery] = useState(''); // State for search input
    const [error, setError] = useState(null); // Added error state

    // State for the modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // For modal submit

    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    const role = user?.role || "admin";
    const [active, setActive] = useState("Manage Users"); // Sidebar active state

    const fetchUsers = async () => {
        setLoading(true); // Set loading true on each fetch
        setError(null);
        try {
            const res = await api.get('/auth/listUsers');
            setUsers(res.data || []);
        } catch (error) {
            toast.error("Failed to fetch users.");
            setError("Failed to fetch users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Updated Memo: Filters users based on search query first
    const { mmclUsers, otherUsers } = useMemo(() => {
        const lowerQuery = searchQuery.toLowerCase();
        
        // Filter the main users list based on the search query
        const filteredUsers = users.filter(u => 
            u.name.toLowerCase().includes(lowerQuery) || 
            u.email.toLowerCase().includes(lowerQuery)
        );

        // Then, split the filtered list into categories
        const mmcl = filteredUsers.filter(u => u.email.endsWith('@mmcl.com.pk'));
        const others = filteredUsers.filter(u => !u.email.endsWith('@mmcl.com.pk'));
        return { mmclUsers: mmcl, otherUsers: others };
    }, [users, searchQuery]); // Add searchQuery as a dependency

    const openRoleModal = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setIsModalOpen(true);
    };
    
    const closeModal = () => {
        if (isSubmitting) return;
        setIsModalOpen(false);
        setSelectedUser(null);
        setNewRole('');
    }

    const handleRoleChange = async () => {
        if (!selectedUser || !newRole) return;
        setIsSubmitting(true);
        try {
            await api.patch(`/auth/${selectedUser._id}/updateUserRole`, { role: newRole });
            toast.success("User role updated!");
            closeModal();
            fetchUsers(); // Refresh the user list
        } catch (error) {
            toast.error("Failed to update role.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (userId, userName) => {
        if (window.confirm(`Are you sure you want to delete ${userName}? This cannot be undone.`)) {
            try {
                await api.delete(`/auth/${userId}`);
                toast.success("User deleted successfully.");
                fetchUsers(); // Refresh the user list
            } catch (error) {
                toast.error("Failed to delete user.");
            }
        }
    };
    
    // --- ADDED: Standardized Loading Spinner ---
    const renderLoading = () => (
        <div className="flex items-center justify-center h-[calc(100vh-300px)]">
          <FaSpinner className="animate-spin text-4xl text-gray-700" />
          <p className="ml-3 text-lg text-gray-600">Loading Users...</p>
        </div>
    );

    const renderError = () => (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg m-8" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
    );


    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar
                role={role}
                active={active}
                setActive={setActive}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />
            <main className="flex-1 flex flex-col overflow-auto">
                <ProfileHeader
                    title="User Management"
                    subtitle="View, edit, and manage all registered users"
                    showMenuButton={true} // --- HAMBURGER FIX ---
                    onMenuClick={() => setSidebarOpen(true)} // --- HAMBURGER FIX ---
                />
                
                <div className="p-4 md:p-6 flex-1 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    type="text"
                                    name="search"
                                    id="search"
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#111] sm:text-sm shadow-sm"
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="mb-6 border-b border-gray-200">
                            <nav className="-mb-px flex flex-wrap space-x-6" aria-label="Tabs">
                                <button
                                    onClick={() => setActiveTab('mmcl')}
                                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                        activeTab === 'mmcl'
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Building size={16} />
                                    MMCL Users ({mmclUsers.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('external')}
                                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                        activeTab === 'external'
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Users size={16} />
                                    External Users ({otherUsers.length})
                                </button>
                            </nav>
                        </div>

                        {/* Conditional Rendering based on activeTab */}
                        {loading ? (
                            renderLoading()
                        ) : error ? (
                            renderError()
                        ) : (
                            <div>
                                {activeTab === 'mmcl' && <UserTable users={mmclUsers} onDelete={handleDelete} onChangeRole={openRoleModal} isInternal={true} />}
                                {activeTab === 'external' && <UserTable users={otherUsers} onDelete={handleDelete} onChangeRole={openRoleModal} />}
                            </div>
                        )}
                    </div>
                </div>

                <Footer />
            </main>

            {/* Role Change Modal */}
            <Dialog open={isModalOpen} onClose={closeModal} className="relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
                
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden flex flex-col transform transition-all">
                        
                        {/* Header with Icon */}
                        <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
                            <div className="flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full p-2">
                                <UserCog size={24} />
                            </div>
                            <div>
                                <Dialog.Title className="text-lg font-bold text-gray-900">
                                    Change Role for {selectedUser?.name}
                                </Dialog.Title>
                                <p className="text-sm text-gray-500">{selectedUser?.email}</p>
                            </div>
                        </div>
                
                        {/* Main Content */}
                        <div className="p-6">
                            <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-2">
                                Assign New Role
                            </label>
                            <select 
                                id="role-select" 
                                value={newRole} 
                                onChange={e => setNewRole(e.target.value)} 
                                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                
                        {/* Footer with Action Buttons */}
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 p-4 bg-gray-50 border-t">
                            <button 
                                onClick={closeModal} 
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors w-full sm:w-auto"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleRoleChange} 
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm w-full sm:w-auto"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Check size={16} />
                                )}
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
};

// Reusable Table Component (Responsive Wrapper Added)
const UserTable = ({ users, onDelete, onChangeRole, isInternal = false }) => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto"> {/* --- RESPONSIVE WRAPPER --- */}
            <table className="w-full min-w-[768px] text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-[#BFBFBF]">
                    <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Role</th>
                        {isInternal && (
                            <>
                                <th className="px-6 py-3">Employee ID</th>
                                <th className="px-6 py-3">Department</th>
                                <th className="px-6 py-3">Designation</th>
                            </>
                        )}
                        <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {users.length === 0 ? (
                        <tr>
                            <td colSpan={isInternal ? 7 : 4} className="text-center py-10 text-gray-500">No users found for this query.</td>
                        </tr>
                    ) : (
                        users.map(user => (
                            <tr key={user._id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                <td className="px-6 py-4 text-gray-600 capitalize">{user.role}</td>
                                {isInternal && (
                                    <>
                                        <td className="px-6 py-4 text-gray-600">{user.employeeId || 'N/A'}</td>
                                        <td className="px-6 py-4 text-gray-600">{user.department}</td>
                                        <td className="px-6 py-4 text-gray-600">{user.designation}</td>
                                    </>
                                )}
                                <td className="px-6 py-4 text-center space-x-2">
                                    <button title="Change Role" onClick={() => onChangeRole(user)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition"><Edit size={16} /></button>
                                    <button title="Delete User" onClick={() => onDelete(user._id, user.name)} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// --- Added ThemeProvider and ToastContainer for a runnable component ---
const ThemeContext = createContext();
const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => {}; 
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};


export default ManageUsersPage;