export default function CategoryFilter({ categories, activeCategory, setActiveCategory }) {
  return (
    <div className="flex gap-2 mb-12 overflow-x-auto pb-3 justify-center">
      <button
        onClick={() => setActiveCategory('Semua')}
        className={`px-6 py-2.5 rounded-full whitespace-nowrap font-medium transition-all duration-200 ${
          activeCategory === 'Semua'
            ? 'bg-amber-700 text-white shadow-sm'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Semua
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => setActiveCategory(category.name)}
          className={`px-6 py-2.5 rounded-full whitespace-nowrap font-medium transition-all duration-200 ${
            activeCategory === category.name
              ? 'bg-amber-700 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
