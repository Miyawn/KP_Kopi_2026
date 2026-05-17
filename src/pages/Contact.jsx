import { Card } from "../components/ui/card";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export default function Contact() {
  const contactInfo = [
    {
      icon: MapPin,
      label: "Lokasi",
      value:
        "Jl. Tamansari No. 130 RT. 32 Kel. Graha Indah Kec. Balikpapan Utara, Balikpapan, Kalimantan Timur 76126",
    },
    { icon: Clock, label: "Jam buka", value: "Setiap hari - 08.00 - 24.00 WITA" },
    { icon: Phone, label: "Telepon", value: "+62 895-2008-1688" },
    { icon: Mail, label: "Email", value: "-" },
  ];

  return (
    <div className="min-h-screen bg-coffee-50">
      <div className="bg-gradient-to-br from-cream-100 via-coffee-100 to-coffee-200 text-coffee-900 pt-40 pb-24">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
          <p className="uppercase tracking-[0.2em] text-xs text-coffee-600">Kontak</p>
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-1 tracking-tight">
            Kami senang diajak ngobrol
          </h1>
          <p className="text-lg text-coffee-700">
            Reservasi event, kolaborasi, atau sekadar tanya menu baru, kirim pesanmu.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {contactInfo.map((info) => {
            const Icon = info.icon;
            return (
              <Card
                key={info.label}
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

        <div className="items-start">
          <Card className="border border-coffee-100 overflow-hidden rounded-2xl h-full shadow-soft">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.9378915800266!2d116.86387859999999!3d-1.2036942!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2df1490f33b7f3ad%3A0xa7aed4e827fded53!2sKOPI%20DARI%20HATI!5e0!3m2!1sid!2sid!4v1776161903279!5m2!1sid!2sid"
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
