import { Trash2, Edit2 } from 'lucide-react';

export default function AdminMenuTable({ menus, onEdit, onToggleAvailable, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200 border-b-2 border-gray-400">
            <th className="border border-gray-300 px-4 py-2 text-left">No</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Nama</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Kategori</th>
            <th className="border border-gray-300 px-4 py-2 text-right">Harga</th>
            <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
            <th className="border border-gray-300 px-4 py-2 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {menus.map((menu, index) => (
            <tr key={menu.id} className="border-b border-gray-300 hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
              <td className="border border-gray-300 px-4 py-2 font-semibold">{menu.name}</td>
              <td className="border border-gray-300 px-4 py-2">{menu.category}</td>
              <td className="border border-gray-300 px-4 py-2 text-right">
                Rp {menu.price.toLocaleString('id-ID')}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                <button
                  onClick={() => onToggleAvailable(menu.id)}
                  className={`px-3 py-1 rounded text-white text-sm ${
                    menu.available ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                  } transition`}
                >
                  {menu.available ? 'Tersedia' : 'Tidak Tersedia'}
                </button>
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => onEdit(menu)}
                    className="text-blue-600 hover:text-blue-800 transition"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(menu.id)}
                    className="text-red-600 hover:text-red-800 transition"
                    title="Hapus"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
