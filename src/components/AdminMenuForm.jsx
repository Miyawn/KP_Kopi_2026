import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card } from './ui/card';

export default function AdminMenuForm({ onSubmit, initialData, onCancel }) {
  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      category: 'Coffee',
      price: '',
      description: '',
      available: true,
    }
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      category: 'Coffee',
      price: '',
      description: '',
      available: true,
    });
  };

  return (
    <Card className="p-6 mb-6 border-0 shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        {initialData ? 'Edit Menu' : 'Tambah Menu Baru'}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nama Menu</Label>
            <Input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Nama menu"
            />
          </div>

          <div>
            <Label htmlFor="category">Kategori</Label>
            <Select value={formData.category} onValueChange={handleCategoryChange}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Coffee">Coffee</SelectItem>
                <SelectItem value="Non-Coffee">Non-Coffee</SelectItem>
                <SelectItem value="Snacks">Snacks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="price">Harga</Label>
            <Input
              id="price"
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              placeholder="Harga"
              min="0"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="available"
                checked={formData.available}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Tersedia</span>
            </label>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Deskripsi</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-900 focus:border-transparent"
              placeholder="Deskripsi menu"
              rows="3"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            type="submit"
            className="bg-amber-900 text-white hover:bg-amber-800"
          >
            {initialData ? 'Update' : 'Tambah'}
          </Button>
          {initialData && (
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
            >
              Batal
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
