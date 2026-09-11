import React, { useState, useEffect } from 'react';
import { 
  FaUserPlus, FaSearch, FaFilter, FaTrash, FaUsers, 
  FaUser, FaSpinner
} from 'react-icons/fa';
import { Power, X } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AddMembers = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [addLoading, setAddLoading] = useState(false);

  // Fetch members from backend
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/members`);
      setMembers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch members', { className: 'text-sm' });
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddMember = async () => {
    // Validate form
    if (!formData.name.trim()) {
      toast.warning('Please enter a member name', { className: 'text-sm' });
      return;
    }

    // Start loading
    setAddLoading(true);

    try {
      // Simulate 3-4 seconds delay
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 1000));
      
      const response = await axios.post(`${API_URL}/api/members`, { name: formData.name.trim() });
      setMembers([response.data.data, ...members]);
      toast.success('Member added successfully! 🎉', { className: 'text-sm' });
      setShowAddModal(false);
      setFormData({ name: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member', { className: 'text-sm' });
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteMember = async (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await axios.delete(`${API_URL}/api/members/${id}`);
        setMembers(members.filter(member => member._id !== id));
        toast.info('Member removed successfully', { className: 'text-sm' });
      } catch (error) {
        toast.error('Failed to delete member', { className: 'text-sm' });
      }
    }
  };

  const toggleStatus = async (id) => {
    try {
      const response = await axios.put(`${API_URL}/api/members/${id}/status`);
      setMembers(members.map(member => 
        member._id === id ? response.data.data : member
      ));
      const member = members.find(m => m._id === id);
      toast.info(`${member.name} is now ${member.status === 'Active' ? 'Inactive' : 'Active'}`, { className: 'text-sm' });
    } catch (error) {
      toast.error('Failed to update status', { className: 'text-sm' });
    }
  };

  // Filter members based on search
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const stats = [
    { label: 'Total Members', value: members.length, icon: FaUsers, color: 'text-fintrack-green' },
    { label: 'Active Members', value: members.filter(m => m.status === 'Active').length, icon: FaUser, color: 'text-fintrack-income' },
    { label: 'Inactive Members', value: members.filter(m => m.status === 'Inactive').length, icon: FaUser, color: 'text-fintrack-expense' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fintrack-navy">Team Members</h2>
          <p className="text-sm text-fintrack-secondary mt-1">Manage your team members</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-fintrack-green text-white rounded-lg hover:bg-fintrack-dark-green transition-colors w-full sm:w-auto justify-center"
        >
          <FaUserPlus /> Add New Member
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-fintrack-light-green ${stat.color}`}>
                <stat.icon className="text-2xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-fintrack-secondary" />
          <input
            type="text"
            placeholder="Search members by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 border border-fintrack-border rounded-lg hover:bg-fintrack-light-green transition-colors">
          <FaFilter /> Filter
        </button>
      </div>

      {/* Members Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-fintrack-green border-t-transparent"></div>
              <p className="text-sm text-fintrack-secondary mt-2">Loading members...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-fintrack-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary">Member</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary hidden sm:table-cell">Joined</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-fintrack-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <tr key={member._id} className="border-b border-fintrack-border last:border-0 hover:bg-fintrack-light-green transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-fintrack-green rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {member.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-fintrack-navy">{member.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-fintrack-secondary hidden sm:table-cell">{member.joined}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleStatus(member._id)}
                          className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 flex items-center justify-center gap-1.5 ${
                            member.status === 'Active' 
                              ? 'text-fintrack-income bg-green-50 hover:bg-green-100' 
                              : 'text-fintrack-expense bg-red-50 hover:bg-red-100'
                          }`}
                          title={member.status === 'Active' ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => handleDeleteMember(member._id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FaTrash className="text-fintrack-secondary hover:text-fintrack-expense" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-fintrack-secondary">
                      <FaUsers className="mx-auto text-4xl text-fintrack-secondary/30 mb-2" />
                      <p>No members found</p>
                      <button 
                        onClick={() => setShowAddModal(true)}
                        className="mt-2 text-fintrack-green hover:text-fintrack-dark-green text-sm font-medium"
                      >
                        Add your first member
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            {/* Close button - Top Right */}
            <button
              onClick={() => {
                setShowAddModal(false);
                setFormData({ name: '' });
              }}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={addLoading}
            >
              <X className="w-5 h-5 text-fintrack-secondary hover:text-fintrack-navy" />
            </button>

            <h3 className="text-xl font-bold text-fintrack-navy mb-4 flex items-center gap-2">
              <FaUserPlus className="text-fintrack-green" />
              Add New Member
            </h3>
            
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-fintrack-secondary mb-1">Full Name *</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-fintrack-secondary" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-fintrack-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fintrack-green"
                    placeholder="Enter full name"
                    autoFocus
                    disabled={addLoading}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={addLoading}
                  className={`flex-1 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    addLoading 
                      ? 'bg-fintrack-green/50 text-white/70 cursor-not-allowed' 
                      : 'bg-fintrack-green text-white hover:bg-fintrack-dark-green'
                  }`}
                >
                  {addLoading ? (
                    <>
                      <FaSpinner className="animate-spin w-4 h-4" />
                      Adding...
                    </>
                  ) : (
                    'Add Member'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '' });
                  }}
                  disabled={addLoading}
                  className={`flex-1 border py-2 rounded-lg transition-colors ${
                    addLoading 
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'border-fintrack-border hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMembers;