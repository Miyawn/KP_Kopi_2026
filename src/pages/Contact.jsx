import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
    setTimeout(() => setSubmitted(false), 3000);
  };

  const contactInfo = [
    {
      icon: MapPin,
      label: 'Location',
      value: '123 Coffee Street, Downtown District',
    },
    {
      icon: Clock,
      label: 'Hours',
      value: 'Mon-Fri: 7:00 AM - 8:00 PM',
    },
    {
      icon: Phone,
      label: 'Phone',
      value: '(555) 123-4567',
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'hello@latteandco.com',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">Visit Us</h1>
          <p className="text-lg opacity-90 text-gray-300">We'd love to see you at our coffee shop</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            return (
              <Card key={index} className="border border-gray-200 bg-white p-8 hover:shadow-lg transition-shadow rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <Icon className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-lg">{info.label}</h3>
                    <p className="text-gray-700 text-lg">{info.value}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Contact Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Form */}
          <Card className="border border-gray-200 bg-white p-8 rounded-2xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent"
                />
              </div>
              <div>
                <Label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent"
                />
              </div>
              <div>
                <Label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                  Message
                </Label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Your message here..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent h-32 resize-none font-sans"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Send Message
              </Button>
              {submitted && (
                <div className="p-4 bg-green-50 border border-green-300 text-green-800 rounded-xl text-sm">
                  ✓ Thank you! Your message has been sent.
                </div>
              )}
            </form>
          </Card>

          {/* Map */}
          <div>
            <Card className="border border-gray-200 overflow-hidden rounded-2xl h-full">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.9719405824973!2d-74.00629!3d40.712776!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a23e0552e61%3A0x40c6a5410fcad0fa!2s123%20Main%20St%2C%20New%20York%2C%20NY%2010007!5e0!3m2!1sen!2sus!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '400px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
