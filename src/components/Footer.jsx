import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";
import logo from "../assets/LOGO_UCANDOIT_TRANS.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-cream-200 via-cream-100 to-coffee-100 text-coffee-900">
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-12">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="U CAN DO IT! Coffee logo"
                className="h-12 w-12 rounded-xl object-cover ring-1 ring-coffee-200 bg-white"
              />
              <div>
                <h3 className="text-xl font-bold text-coffee-900">U CAN DO IT! Coffee</h3>
                <p className="text-xs uppercase tracking-[0.2em] text-coffee-500">
                  Since 2020
                </p>
              </div>
            </div>
            <p className="text-sm text-coffee-700 leading-relaxed">
              Kopi spesialti, manual brew, dan pastry fresh-from-the-oven. Hadir
              untuk teman kerja jarak jauh maupun temu hangat.
            </p>
            <div className="flex gap-4">
              {[
                { Icon: Facebook, href: "https://facebook.com", label: "Facebook" },
                { Icon: Instagram, href: "https://instagram.com", label: "Instagram" },
                { Icon: Twitter, href: "https://twitter.com", label: "Twitter" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-white border border-coffee-100 flex items-center justify-center text-coffee-500 hover:bg-coffee-900 hover:text-cream transition"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-4">
            <h4 className="font-semibold text-coffee-900 mb-4">Navigasi</h4>
            <ul className="grid grid-cols-2 gap-3 text-sm text-coffee-700">
              {[
                { to: "/", label: "Home" },
                { to: "/#menu", label: "Menu" },
                { to: "/about", label: "About" },
                { to: "/contact", label: "Contact" },
                { to: "/orders", label: "Pesanan" },
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="hover:text-coffee-900 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="font-semibold text-coffee-900 mb-2">Jam & Lokasi</h4>
            <p className="text-sm text-coffee-700">Setiap hari, 08.00-24.00 WITA</p>
            <p className="text-sm text-coffee-700">
              Jl. Tamansari No. 130 RT. 32 Kel. Graha Indah Kec. Balikpapan Utara, Balikpapan, Kalimantan Timur 76126
            </p>
            <p className="text-sm text-coffee-600">+62 895-2008-1688</p>
          </div>
        </div>

        <div className="border-t border-coffee-200 pt-6 text-center text-sm text-coffee-600">
          <p>(c) {currentYear} U CAN DO IT! Coffeeshop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
