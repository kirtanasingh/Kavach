import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  Camera,
  Pill,
  Bell,
  BarChart3,
  Video,
  MapPin,
  Shield,
  Users,
  Activity,
  CheckCircle,
  Upload,
  ArrowRight,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  MapPinned,
  ChevronRight
} from 'lucide-react';
import logoImg from 'figma:asset/28cc7f8b67ba61bb13e03c30f73fd05e9d3d8a2c.png';

interface MarketingHomepageProps {
  onNavigate: (screen: string) => void;
}

export function MarketingHomepage({ onNavigate }: MarketingHomepageProps) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const features = [
    { icon: Camera, title: 'AI Disease Detection', description: 'Upload photos or videos to instantly detect early signs of disease with 95% accuracy using advanced vision AI trained on Indian livestock data.' },
    { icon: Pill, title: 'AMU Tracking', description: 'Monitor antibiotic usage, track withdrawal periods, and maintain complete compliance with veterinary regulations automatically.' },
    { icon: Bell, title: 'Real-time Alerts', description: 'Get instant notifications about disease outbreaks, compliance deadlines, and critical biosecurity events in your region.' },
    { icon: BarChart3, title: 'Analytics Dashboard', description: 'Visualize farm health trends, track medication patterns, and make data-driven decisions with comprehensive analytics.' },
    { icon: Video, title: 'Vet Collaboration', description: 'Connect with certified veterinarians for instant consultations, prescriptions, and treatment recommendations via video calls.' },
    { icon: MapPin, title: 'Contact Tracing', description: 'Trace disease spread across farms and regions to prevent outbreaks before they happen with geographical insights.' }
  ];

  const steps = [
    { number: 1, title: 'Register Your Farm', description: 'Create your account, add farm details, and complete a quick biosecurity assessment in under 5 minutes.' },
    { number: 2, title: 'Monitor & Detect', description: 'Use AI disease detection, track medications, and receive real-time alerts about health issues on your farm.' },
    { number: 3, title: 'Stay Compliant', description: 'Automatically maintain records, meet regulatory requirements, and collaborate with vets for certified treatment plans.' }
  ];

  const roles = [
    {
      title: 'Farm Owner',
      accent: '#1B5E42',
      description: 'Complete farm management with AI disease detection, task assignment, and compliance tracking.',
      features: ['AI Disease Scanner', 'Worker Task Management', 'AMU & Withdrawal Tracking', 'Vet Consultation Booking', 'Compliance Dashboard']
    },
    {
      title: 'Veterinarian',
      accent: '#4CAF7D',
      description: 'Manage consultations, prescribe treatments, and monitor farm health across your practice.',
      features: ['Farmer Consultation Queue', 'Prescription Management', 'AMU Logging & Analysis', 'Regional Disease Trends', 'Treatment History']
    },
    {
      title: 'Government Authority',
      accent: '#E8A838',
      description: 'Monitor regional biosecurity, track disease outbreaks, and ensure regulatory compliance.',
      features: ['Regional Farm Dashboard', 'Outbreak Detection Maps', 'Compliance Monitoring', 'AMU Surveillance', 'Epidemiological Analytics']
    }
  ];

  const partners = ['ICAR', 'DAHD', 'NDDB', 'BAHS', 'DADF'];

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-[#E5E3DC] z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <img src={logoImg} alt="Kavach" className="h-10" />
          
          <div className="flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-[#7A7A6E] hover:text-[#1B5E42] transition-colors">How It Works</a>
            <a href="#features" className="text-sm text-[#7A7A6E] hover:text-[#1B5E42] transition-colors">Features</a>
            <a href="#roles" className="text-sm text-[#7A7A6E] hover:text-[#1B5E42] transition-colors">For You</a>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              className="text-[#1B5E42] hover:bg-[#1B5E42]/5"
              onClick={() => onNavigate('login')}
            >
              Login
            </Button>
            <Button 
              className="bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-full px-6"
              onClick={() => onNavigate('login')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-[56px] leading-[1.1] font-bold text-gray-900 mb-6">
              Protect Your Farm with AI-Powered Biosecurity
            </h1>
            <p className="text-xl text-[#7A7A6E] mb-8 leading-relaxed">
              Kavach combines vision AI, real-time monitoring, and expert veterinary care to prevent disease outbreaks in pig and poultry farms across India.
            </p>
            <div className="flex items-center gap-4">
              <Button 
                size="lg" 
                className="bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-full px-8 text-lg"
                onClick={() => onNavigate('login')}
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
            <p className="text-sm text-[#7A7A6E] mt-6">
              Free to use · Secure platform · Trusted by farmers nationwide
            </p>
          </div>

          {/* Floating Dashboard Mockup */}
          <div className="relative">
            <div className="relative z-10">
              <Card className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E5E3DC]">
                <div className="bg-[#1B5E42] px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20"></div>
                    <div>
                      <p className="text-sm font-medium text-white">—</p>
                      <p className="text-xs text-white/70">Live Monitoring</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#F7F5F0] rounded-2xl border-l-4 border-[#E5E3DC]">
                    <div>
                      <p className="font-medium text-gray-400">—</p>
                      <p className="text-sm text-gray-400">—</p>
                    </div>
                    <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#F7F5F0] rounded-2xl border-l-4 border-[#E5E3DC]">
                    <div>
                      <p className="font-medium text-gray-400">—</p>
                      <p className="text-sm text-gray-400">—</p>
                    </div>
                    <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#F7F5F0] rounded-2xl border-l-4 border-[#E5E3DC]">
                    <div>
                      <p className="font-medium text-gray-400">—</p>
                      <p className="text-sm text-gray-400">—</p>
                    </div>
                    <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Floating status chips */}
            <div className="absolute top-8 -left-8 bg-white rounded-full px-4 py-2 shadow-lg border border-[#E5E3DC]">
              <p className="text-sm font-medium text-gray-400">—</p>
            </div>
            <div className="absolute bottom-8 -right-8 bg-white rounded-full px-4 py-2 shadow-lg border border-[#E5E3DC]">
              <p className="text-sm font-medium text-gray-400">—</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="bg-white border-y border-[#E5E3DC] py-8">
        <div className="max-w-7xl mx-auto px-8">
          <p className="text-center text-sm text-[#7A7A6E] mb-6">Trusted by leading organizations</p>
          <div className="flex items-center justify-center gap-16">
            {partners.map((partner) => (
              <div key={partner} className="text-2xl font-bold text-[#7A7A6E]/30">
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[36px] font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-[#7A7A6E] max-w-2xl mx-auto">
              Get started in minutes and protect your farm with cutting-edge biosecurity technology
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="absolute top-16 left-[16.67%] right-[16.67%] h-0.5 border-t-2 border-dashed border-[#1B5E42]/30"></div>

            {steps.map((step, idx) => (
              <Card 
                key={step.number}
                className="kavach-card relative bg-white rounded-3xl border border-[#E5E3DC] hover:shadow-md transition-shadow"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#1B5E42] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6 relative z-10">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-[#7A7A6E] leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-24 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[36px] font-bold text-gray-900 mb-4">Everything You Need to Stay Protected</h2>
            <p className="text-xl text-[#7A7A6E] max-w-2xl mx-auto">
              Comprehensive biosecurity tools designed for Indian farms
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  className="kavach-card bg-[#F7F5F0] rounded-2xl border border-[#E5E3DC] hover:shadow-md transition-shadow cursor-pointer"
                  onMouseEnter={() => setHoveredCard(idx)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
                      hoveredCard === idx ? 'bg-[#1B5E42]' : 'bg-[#1B5E42]/10'
                    }`}>
                      <Icon className={`w-6 h-6 transition-colors duration-300 ${
                        hoveredCard === idx ? 'text-white' : 'text-[#1B5E42]'
                      }`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-[#7A7A6E] leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* VLM Showcase */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-16 items-center">
            <Card className="bg-white rounded-3xl border border-[#E5E3DC] shadow-xl overflow-hidden">
              <CardContent className="p-8">
                <div className="bg-[#F7F5F0] rounded-2xl p-6 border-2 border-dashed border-[#1B5E42]/30 mb-6 text-center">
                  <Upload className="w-12 h-12 text-[#1B5E42] mx-auto mb-4" />
                  <p className="font-medium text-gray-900 mb-2">Upload Image or Video</p>
                  <p className="text-sm text-[#7A7A6E]">Drag and drop or click to browse</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-400">—</p>
                      <p className="text-sm font-bold text-gray-400">—</p>
                    </div>
                    <div className="w-full h-3 bg-[#E5E3DC] rounded-full overflow-hidden">
                      <div className="h-full bg-gray-300 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-400">—</p>
                      <p className="text-sm font-bold text-gray-400">—</p>
                    </div>
                    <div className="w-full h-3 bg-[#E5E3DC] rounded-full overflow-hidden">
                      <div className="h-full bg-gray-300 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button className="w-full bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-full">
                      Get Veterinary Confirmation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-[36px] font-bold text-gray-900 mb-6">
                AI-Powered Disease Detection
              </h2>
              <p className="text-xl text-[#7A7A6E] mb-8 leading-relaxed">
                
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#4CAF7D] flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Instant Analysis</p>
                    <p className="text-[#7A7A6E]"></p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#4CAF7D] flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Vet Review Queue</p>
                    <p className="text-[#7A7A6E]"></p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#4CAF7D] flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Real Indian Datasets</p>
                    <p className="text-[#7A7A6E]"></p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#4CAF7D] flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Continuous Learning</p>
                    <p className="text-[#7A7A6E]"></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Roles */}
      <section id="roles" className="py-24 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[36px] font-bold text-gray-900 mb-4">Built for Every Stakeholder</h2>
            <p className="text-xl text-[#7A7A6E] max-w-2xl mx-auto">
              Tailored dashboards and tools for farm owners, veterinarians, and government authorities
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {roles.map((role, idx) => (
              <Card
                key={idx}
                className="kavach-card bg-white rounded-3xl border border-[#E5E3DC] overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-2" style={{ backgroundColor: role.accent }}></div>
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{role.title}</h3>
                  <p className="text-[#7A7A6E] mb-6 leading-relaxed">{role.description}</p>
                  <div className="space-y-3">
                    {role.features.map((feature, featureIdx) => (
                      <div key={featureIdx} className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-[#4CAF7D]" />
                        <p className="text-gray-900">{feature}</p>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full mt-6 border-2 rounded-full hover:bg-[#1B5E42] hover:text-white hover:border-[#1B5E42]"
                    variant="outline"
                    style={{ borderColor: role.accent, color: role.accent }}
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-[48px] font-bold text-gray-900 mb-6">
            Ready to Protect Your Farm?
          </h2>
          <p className="text-xl text-[#7A7A6E] mb-8">
            Join the biosecurity revolution with AI-powered disease prevention
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button 
              size="lg" 
              className="bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-full px-10 text-lg"
              onClick={() => onNavigate('login')}
            >
              Get Started
            </Button>
          </div>
          <p className="text-sm text-[#7A7A6E]">
            Free platform · Secure & compliant · Built for Indian farms
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1B5E42] text-white py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-5 gap-12 mb-12">
            <div className="col-span-1">
              <img src={logoImg} alt="Kavach" className="h-10 mb-4 brightness-0 invert" />
              <p className="text-white/70 text-sm leading-relaxed">
                AI-powered biosecurity for pig and poultry farms across India
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press Kit</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  support@kavach.in
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  +91 1800 123 4567
                </li>
                <li className="flex items-center gap-2">
                  <MapPinned className="w-4 h-4" />
                  New Delhi, India
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 flex items-center justify-between">
            <p className="text-sm text-white/70">
              © 2026 Kavach. All rights reserved. · <a href="#" className="hover:text-white">Privacy Policy</a> · <a href="#" className="hover:text-white">Terms of Service</a>
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}