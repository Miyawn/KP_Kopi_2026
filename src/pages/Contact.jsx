import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
    setTimeout(() => setSubmitted(false), 3000);
  };

  const contactInfo = [
    { icon: MapPin, label: "Lokasi", value: "Jl. Kopi Nusantara No. 12, Jakarta" },
    { icon: Clock, label: "Jam buka", value: "Setiap hari · 08.00 – 22.00 WIB" },
    { icon: Phone, label: "Telepon", value: "+62 812-1234-5678" },
    { icon: Mail, label: "Email", value: "hello@ucandoit.coffee" },
  ];

  return (
    <div className="min-h-screen bg-coffee-50">
      <div className="bg-gradient-to-br from-cream-100 via-coffee-100 to-coffee-200 text-coffee-900 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-3">
          <p className="uppercase tracking-[0.2em] text-xs text-coffee-600">Kontak</p>
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-1 tracking-tight">
            Kami senang diajak ngobrol
          </h1>
          <p className="text-lg text-coffee-700">
            Reservasi event, kolaborasi, atau sekadar tanya menu baru—drop pesanmu.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            return (
              <Card
                key={index}
                className="border border-coffee-100 bg-white p-8 hover:shadow-soft transition-shadow rounded-2xl"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-cream-100 rounded-xl">
                    <Icon className="w-6 h-6 text-coffee-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-coffee-900 mb-2 text-lg">{info.label}</h3>
                    <p className="text-coffee-700 text-lg">{info.value}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <Card className="border border-coffee-100 bg-white p-8 rounded-2xl shadow-soft">
            <h2 className="text-3xl font-display font-bold text-coffee-900 mb-8 tracking-tight">
              Kirim pesan
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="block text-sm font-semibold text-coffee-900 mb-2">
                  Nama
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Nama kamu"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-coffee-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee-700 focus:border-transparent"
                />
              </div>
              <div>
                <Label htmlFor="email" className="block text-sm font-semibold text-coffee-900 mb-2">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-coffee-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee-700 focus:border-transparent"
                />
              </div>
              <div>
                <Label htmlFor="message" className="block text-sm font-semibold text-coffee-900 mb-2">
                  Pesan
                </Label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Tulis pertanyaan atau kebutuhanmu di sini..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-coffee-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee-700 focus:border-transparent h-32 resize-none font-sans"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-coffee-900 hover:bg-coffee-700 text-cream font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Kirim Pesan
              </Button>
              {submitted && (
                <div className="p-4 bg-cream-100 border border-coffee-200 text-coffee-800 rounded-xl text-sm">
                  Terima kasih! Pesanmu sudah terkirim.
                </div>
              )}
            </form>
          </Card>

          <Card className="border border-coffee-100 overflow-hidden rounded-2xl h-full shadow-soft">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.9719405824973!2d-74.00629!3d40.712776!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a23e0552e61%3A0x40c6a5410fcad0fa!2s123%20Main%20St%2C%20New%20York%2C%20NY%2010007!5e0!3m2!1sen!2sus!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "400px" }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokasi U CAN DO IT! Coffee"
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
