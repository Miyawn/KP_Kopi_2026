import { ShoppingCart } from "lucide-react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { useCart } from "../context/CartContext"

export default function MenuCard({ menu }) {
  const { addToCart } = useCart();

  const isOutOfStock = !menu.is_available || menu.stock === 0;

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Mencegah interaksi tumpang tindih
    if (!isOutOfStock) {
      addToCart(menu);
    }
  };

  return (
    <Card className="group flex flex-col h-full overflow-hidden rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-500 ease-out bg-white">
      
      {/* Area Gambar (Support PNG & Ikon) */}
      <div className="relative w-full h-[220px] bg-[#F9F6F0] overflow-hidden flex-shrink-0 border-b border-gray-50">
        
        {/* Logika Gambar Asli */}
        {menu.imageUrl ? (
          <img 
            src={menu.imageUrl} 
            alt={menu.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl group-hover:scale-110 transition-transform duration-700 ease-in-out opacity-60">
            {menu.icon || "☕"}
          </div>
        )}
        
        {/* Shadow gradient tipis agar badge tetap terbaca jika gambar terang */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent pointer-events-none z-10"></div>

        {/* Badge Kategori (Melayang) */}
        <div className="absolute top-4 left-4 z-20">
          <Badge variant="default" className="bg-white/95 text-gray-800 hover:bg-white backdrop-blur-md shadow-sm font-extrabold text-[11px] uppercase tracking-widest px-3.5 py-1.5 rounded-full border-none">
            {menu.category}
          </Badge>
        </div>

        {/* Overlay Stok Habis */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[3px] flex items-center justify-center z-30">
            <span className="bg-gray-900 text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full shadow-xl">
              Stok Habis
            </span>
          </div>
        )}
      </div>

      {/* Area Konten */}
      <div className="p-6 flex flex-col flex-grow">
        
        {/* Header (Judul & Deskripsi) */}
        <div className="flex-grow mb-6">
          <h3 className="text-[22px] font-bold text-gray-900 leading-tight mb-2 tracking-tight group-hover:text-amber-700 transition-colors line-clamp-2">
            {menu.name}
          </h3>
          <p className="text-[15px] text-gray-500 line-clamp-2 leading-relaxed font-medium">
            {menu.description}
          </p>
        </div>

        {/* Footer (Harga & Tombol Keranjang) */}
        <div className="flex items-center justify-between mt-auto">
          
          <div className="flex flex-col">
            {/* Notifikasi Stok Menipis (Dipertahankan dari kode aslimu) */}
            {menu.stock > 0 && menu.stock <= 5 && (
              <span className="text-[11px] font-bold text-red-500 mb-1 animate-pulse">
                Sisa {menu.stock} porsi!
              </span>
            )}
            
            <span className="text-2xl font-black text-amber-700 tracking-tight">
              Rp {menu.price.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Tombol Keranjang (Dikembalikan ke kotak melengkung) */}
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            size="sm"
            className={`h-12 w-12 rounded-xl p-0 flex items-center justify-center shadow-md transition-all duration-300 focus:outline-none ${
              isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                : "bg-amber-700 hover:bg-amber-800 hover:shadow-lg hover:-translate-y-1 text-white active:scale-95"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
          </Button>

        </div>
      </div>
    </Card>
  );
}

