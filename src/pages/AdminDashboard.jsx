import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import AdminMenuForm from '../components/AdminMenuForm';
import AdminMenuTable from '../components/AdminMenuTable';
import { dummyMenus } from '../data/dummyMenus';

export default function AdminDashboard() {
  const [menus, setMenus] = useState(dummyMenus);
  const [editingMenu, setEditingMenu] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login');
    }
  }, [navigate]);

  const handleAddMenu = (formData) => {
    if (editingMenu) {
      // Update existing menu
      setMenus((prevMenus) =>
        prevMenus.map((menu) =>
          menu.id === editingMenu.id
            ? { ...formData, id: editingMenu.id }
            : menu
        )
      );
      setEditingMenu(null);
    } else {
      // Add new menu
      const newMenu = {
        ...formData,
        id: Math.max(...menus.map((m) => m.id), 0) + 1,
        price: parseInt(formData.price),
      };
      setMenus((prevMenus) => [...prevMenus, newMenu]);
    }
    setShowForm(false);
  };

  const handleEditMenu = (menu) => {
    setEditingMenu(menu);
    setShowForm(true);
  };

  const handleDeleteMenu = (menuId) => {
    if (confirm('Apakah Anda yakin ingin menghapus menu ini?')) {
      setMenus((prevMenus) => prevMenus.filter((menu) => menu.id !== menuId));
    }
  };

  const handleToggleAvailable = (menuId) => {
    setMenus((prevMenus) =>
      prevMenus.map((menu) =>
        menu.id === menuId
          ? { ...menu, available: !menu.available }
          : menu
      )
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin-login');
  };

  const handleCancelEdit = () => {
    setEditingMenu(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-gray-900 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">☕ Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Menu</h2>
          {!showForm && (
            <button
              onClick={() => {
                setEditingMenu(null);
                setShowForm(true);
              }}
              className="bg-amber-900 text-white px-6 py-2 rounded hover:bg-amber-800 transition"
            >
              + Tambah Menu
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <AdminMenuForm
            key={editingMenu?.id || 'new'}
            onSubmit={handleAddMenu}
            initialData={editingMenu}
            onCancel={handleCancelEdit}
          />
        )}

        {/* Table */}
        {menus.length > 0 ? (
          <AdminMenuTable
            menus={menus}
            onEdit={handleEditMenu}
            onDelete={handleDeleteMenu}
            onToggleAvailable={handleToggleAvailable}
          />
        ) : (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500 text-lg">Tidak ada menu</p>
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Menu</h3>
            <p className="text-3xl font-bold text-amber-900">{menus.length}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Menu Tersedia</h3>
            <p className="text-3xl font-bold text-green-600">
              {menus.filter((m) => m.available).length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Menu Tidak Tersedia</h3>
            <p className="text-3xl font-bold text-red-600">
              {menus.filter((m) => !m.available).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
