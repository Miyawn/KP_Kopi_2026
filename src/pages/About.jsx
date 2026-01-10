import { Card } from '../components/ui/card';

export default function About() {
  const stats = [
    { label: '10+ Years', value: 'In Business' },
    { label: '50k+', value: 'Customers' },
    { label: '100%', value: 'Organic Beans' },
  ];

  const values = [
    {
      title: 'Quality First',
      description: 'We source only the finest beans from sustainable farms, ensuring exceptional quality in every cup.',
    },
    {
      title: 'Passion',
      description: 'Our baristas are passionate craftspeople who love what they do and it shows in every drink.',
    },
    {
      title: 'Community',
      description: 'We believe in creating a welcoming space where people can connect and enjoy great coffee together.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">Our Story</h1>
          <p className="text-lg opacity-90 text-gray-300">Crafting exceptional coffee experiences since 2015</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">Founded with Passion</h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-lg">
              Founded in 2015, Latte & Co. began with a simple mission: to bring exceptional coffee experiences to our community. We source our beans from sustainable farms around the world, ensuring every cup tells a story of quality and care.
            </p>
            <p className="text-gray-700 leading-relaxed text-lg">
              Our skilled baristas are passionate about their craft, combining traditional techniques with modern innovation to create drinks that delight the senses.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1669162364316-a74b2d661d1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Latte art"
              className="w-full h-96 object-cover"
            />
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 py-16 px-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl font-bold text-amber-900 mb-2">{stat.label}</div>
              <div className="text-gray-700 text-lg">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
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
            <div key={index} className="rounded-2xl overflow-hidden shadow-lg h-64 group">
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
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center tracking-tight">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border border-gray-200 bg-white p-8 hover:shadow-lg transition-shadow rounded-2xl">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-700 leading-relaxed text-lg">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
