import { Card } from '../components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';

export default function About() {
  const stats = [
    { label: '2020', value: 'Mulai meracik' },
    { label: '50k+', value: 'Cangkir tersaji' },
    { label: '100%', value: 'Bijian organik' },
  ];

  const values = [
    {
      title: 'Quality First',
      description: 'Hanya pakai biji pilihan dari kebun berkelanjutan, diproses roast kecil agar rasa konsisten.',
    },
    {
      title: 'Passion',
      description: 'Barista kami menakar, menguap, dan meracik dengan penuh rasa ingin tahu dan cinta pada kopi.',
    },
    {
      title: 'Community',
      description: 'Ruang hangat untuk kerja remote, meet-up komunitas, atau sekadar ngobrol santai.',
    },
  ];

  return (
    <div className="min-h-screen bg-coffee-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br mt-24 from-cream-100 via-coffee-100 to-coffee-200 text-coffee-900 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-3">
          <p className="uppercase tracking-[0.2em] text-xs text-coffee-600">Tentang kami</p>
          <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight">Cerita U CAN DO IT! Coffee</h1>
          <p className="text-lg text-coffee-700">Meracik kopi sejak 2015 untuk menemani hari produktif dan momen hangatmu.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-20 space-y-16">
        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-display font-bold text-coffee-900 mb-6 tracking-tight">Dari garasi kecil ke ruang komunal</h2>
            <p className="text-coffee-700 leading-relaxed mb-4 text-lg">
              Dimulai 2015 dengan mesin manual brew di garasi, kini kami tumbuh jadi ruang komunal dengan roastery kecil, bakery, dan program kelas kopi mingguan.
            </p>
            <p className="text-coffee-700 leading-relaxed text-lg">
              Kami memadukan teknik klasik dan eksplorasi rasa modern: espresso blend buat penikmat susu, single origin buat penjelajah rasa.
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-soft ring-1 ring-coffee-100">
            <img
              src="https://images.unsplash.com/photo-1669162364316-a74b2d661d1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Latte art"
              className="w-full h-96 object-cover"
            />
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-14 px-8 bg-gradient-to-r from-cream-100 via-cream-50 to-coffee-100 rounded-3xl border border-coffee-100">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl font-bold text-coffee-900 mb-2">{stat.label}</div>
              <div className="text-coffee-700 text-lg">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              src: 'https://images.unsplash.com/photo-1675306408031-a9aad9f23308?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
              alt: 'Coffee beans',
            },
            {
              src: 'https://images.unsplash.com/photo-1539021897569-06e9fa3c6bb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
              alt: 'Barista making coffee',
            },
            {
              src: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
              alt: 'Coffee shop',
            },
          ].map((image, index) => (
            <div key={index} className="rounded-2xl overflow-hidden shadow-soft h-64 group ring-1 ring-coffee-100">
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>

        {/* Values Section */}
        <div>
          <h2 className="text-4xl font-display font-bold text-coffee-900 mb-12 text-center tracking-tight">Nilai yang kami jaga</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border border-coffee-100 bg-white p-8 hover:shadow-soft transition-shadow rounded-2xl">
                <h3 className="text-2xl font-semibold text-coffee-900 mb-4">{value.title}</h3>
                <p className="text-coffee-700 leading-relaxed text-lg">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="pt-16 border-t border-coffee-100">
          <h2 className="text-4xl font-display font-bold text-coffee-900 mb-10 text-center tracking-tight">Pertanyaan yang sering muncul</h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What are the business hours?</AccordionTrigger>
                <AccordionContent>
                  We are open Monday to Friday from 7:00 AM to 8:00 PM, Saturday from 8:00 AM to 9:00 PM, and Sunday from 9:00 AM to 7:00 PM.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Do you offer delivery?</AccordionTrigger>
                <AccordionContent>
                  Yes! We offer delivery for orders within our service area. Orders can be placed through our website or mobile app for convenient delivery to your location.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Are your beans organic?</AccordionTrigger>
                <AccordionContent>
                  100% of our coffee beans are sourced from organic, sustainable farms around the world. We are committed to supporting farmers who practice environmentally responsible methods.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Can I customize my drink?</AccordionTrigger>
                <AccordionContent>
                  Absolutely! Our skilled baristas can customize any drink to your preferences. You can adjust the strength, temperature, milk type, sweetness level, and add any extra flavors or toppings.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>Do you have a loyalty program?</AccordionTrigger>
                <AccordionContent>
                  Yes! Our loyalty program offers points for every purchase. Collect points to earn free drinks, discounts, and exclusive rewards. Sign up in-store or through our mobile app.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
