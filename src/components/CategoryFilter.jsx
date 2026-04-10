export default function CategoryFilter({
  categories,
  activeCategory,
  setActiveCategory,
}) {
  return (
    <div className="flex gap-2 mb-12 overflow-x-auto pb-3 justify-center">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => setActiveCategory(category)}
          className={`px-6 py-2.5 rounded-xl whitespace-nowrap font-medium transition-all duration-200 border ${
            activeCategory === category
              ? "bg-cream-200 text-coffee-900 border-coffee-300 shadow-sm"
              : "bg-white text-coffee-800 border-coffee-200 hover:bg-cream-100"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
