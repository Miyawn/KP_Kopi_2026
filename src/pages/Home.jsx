import { useState } from 'react';
import { Link } from 'react-router-dom';
import MenuCard from '../components/MenuCard';
import CategoryFilter from '../components/CategoryFilter';
import { Button } from '../components/ui/button';
import { dummyMenus } from '../data/dummyMenus';
import { categories } from '../data/dummyCategories';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('Semua');

  const filteredMenus =
    activeCategory === 'Semua'
      ? dummyMenus
      : dummyMenus.filter((menu) => menu.category === activeCategory);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Modern Minimalist */}
      <div 
        className="relative h-[600px] bg-cover bg-center bg-no-repeat flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("https://images.unsplash.com/photo-1495474472645-4d71bcdd2085?w=1400&q=90")',
          backgroundPosition: 'center'
        }}
      >
        <div className="text-center text-white px-4 max-w-3xl">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
            Brewed to Perfection
          </h1>
          <p className="text-lg md:text-xl mb-10 opacity-95 font-light leading-relaxed max-w-xl mx-auto">
            Experience the finest artisanal coffee crafted with passion and precision
          </p>
          <Link to="#menu">
            <Button 
              size="lg"
              className="bg-amber-700 hover:bg-amber-800 text-white font-semibold px-12 py-6 text-base rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Explore Our Menu
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full bg-white">
        {/* Menu Section */}
        <div className="max-w-7xl mx-auto px-4 py-20" id="menu">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Our Menu</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Carefully curated selection of premium coffee and treats
            </p>
          </div>

          {/* Category Filter */}
          <div className="mb-12">
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
            />
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenus.map((menu) => (
              <MenuCard key={menu.id} menu={menu} />
            ))}
          </div>

          {filteredMenus.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-gray-500">No menu items for this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
