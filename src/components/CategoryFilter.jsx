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
          className={`px-6 py-2.5 rounded-full whitespace-nowrap font-medium transition-all duration-200 ${
            activeCategory === category
              ? "bg-amber-700 text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
