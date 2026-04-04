import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Shield, BookOpen, Bell, TrendingUp, Users, Award, Star, CheckCircle, ArrowRight, Globe, Target, Zap, Leaf } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import kavachLogo from 'figma:asset/84aec6f5325bdec8bfae13572190699649874afb.png';

interface LandingPageProps {
  onNavigate: (screen: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-background via-muted/50 to-accent/30 pt-8 pb-20 px-4 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-secondary rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 min-h-[80vh] px-4">
            {/* Kavach Logo - Circular */}
            <div className="flex-shrink-0">
              <img 
                src={kavachLogo} 
                alt="Raksha – Protecting Farms, Securing Health." 
                className="w-80 h-80 lg:w-96 lg:h-96 object-contain bg-white rounded-full shadow-2xl border-4 border-white/50 p-4"
              />
            </div>

            {/* Text Content - Right next to logo */}
            <div className="space-y-8 text-center lg:text-left flex-1 max-w-2xl">
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent uppercase">
                    Protecting Farms, Securing Health.
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Transform your farming with Raksha’s digital platform. 
                  Smart antimicrobial tracking, compliance monitoring, and real-time alerts 
                  to protect your livestock and enhance farm productivity.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg"
                  onClick={() => onNavigate('register')}
                  className="bg-secondary hover:bg-secondary/90 text-white px-8 py-4 text-lg rounded-2xl shadow-xl transition-colors duration-150 group"
                >
                  Get Started Today
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => onNavigate('services')}
                  className="border-2 border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg rounded-2xl"
                >
                  Learn More
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-4 justify-center lg:justify-start">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Trusted by 50,000+ farmers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Expert-verified solutions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>24/7 support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                50,000+
              </div>
              <div className="text-muted-foreground font-medium">Active Farmers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">
                95%
              </div>
              <div className="text-muted-foreground font-medium">Risk Reduction</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">
                25+
              </div>
              <div className="text-muted-foreground font-medium">Countries</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                2M+
              </div>
              <div className="text-muted-foreground font-medium">Animals Protected</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-4 bg-gradient-to-br from-muted/30 to-accent/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-secondary/20 text-secondary border-secondary/30">
              Comprehensive Protection
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Everything You Need for
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Modern Agriculture
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Advanced digital tools and expert guidance designed specifically for livestock farmers
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Feature 1 */}
            <Card className="kavach-card border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  AMU & Compliance Tracker
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Efficient monitoring of antimicrobial usage across all livestock.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Vet-logged medicine usage for accuracy
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Automated withdrawal period tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Real-time compliance alerts
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="kavach-card border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-primary rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Vet Oversight & Guidance
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Ensure expert supervision and farm safety at every step.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-secondary" />
                    Vet approval of all logs and entries
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-secondary" />
                    Early warning alerts for unsafe practices
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-secondary" />
                    Multi-channel notifications for farmers and vets
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="kavach-card border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-secondary rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Vaccination & Aftercare
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Keep livestock healthy with timely vaccinations and proper care.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Species-specific vaccine schedules
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Automated reminders for upcoming doses
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Post-treatment guidance and monitoring
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Additional Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4 p-6 bg-white/60 backdrop-blur-sm rounded-3xl">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Multi-Language Support</h4>
                <p className="text-sm text-muted-foreground">Available in 15+ languages</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-6 bg-white/60 backdrop-blur-sm rounded-3xl">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Works Offline</h4>
                <p className="text-sm text-muted-foreground">No internet? No problem</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-6 bg-white/60 backdrop-blur-sm rounded-3xl">
              <div className="w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Data Privacy</h4>
                <p className="text-sm text-muted-foreground">Your data stays secure</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Trusted by Farmers Worldwide
            </h2>
            <div className="flex justify-center items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-secondary text-secondary" />
              ))}
              <span className="ml-2 text-muted-foreground">4.9/5 from 10,000+ reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow rounded-3xl">
              <CardContent className="p-8">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <blockquote className="text-muted-foreground mb-6 italic leading-relaxed">
                  "Raksha’s platform helped me track all medicines and withdrawal periods properly. 
                  In just 2 months, I avoided unsafe milk batches and ensured my farm’s compliance."
                </blockquote>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">RS</span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Ravi Singh</p>
                    <p className="text-sm text-muted-foreground">Dairy Farm Owner, Uttar Pradesh</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow rounded-3xl">
              <CardContent className="p-8">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <blockquote className="text-muted-foreground mb-6 italic leading-relaxed">
                  "The system is easy to use, and vets can approve everything instantly. My team now 
                  follows safe antimicrobial practices without confusion."
                </blockquote>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">SK</span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Dr. Sunita Kumar</p>
                    <p className="text-sm text-muted-foreground">Veterinarian & Livestock Consultant, Maharashtra</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow rounded-3xl">
              <CardContent className="p-8">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <blockquote className="text-muted-foreground mb-6 italic leading-relaxed">
                  "Clear, simple, and works even on my basic smartphone. Perfect for small-scale farms like mine 
                  that need reliable, professional, and practical tools."
                </blockquote>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">AP</span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Anil Patel</p>
                    <p className="text-sm text-muted-foreground">Goat & Poultry Farmer, Gujarat</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-foreground text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Company */}
            <div>
              <div className="flex items-center space-x-4 mb-6">
                <img 
                  src={kavachLogo} 
                  alt="Kavach Logo" 
                  className="w-16 h-16 object-contain"
                />
                <h3 className="text-2xl font-bold">Raksha</h3>
              </div>
              <p className="text-white/70 leading-relaxed">
                Empowering Indian farmers with cutting-edge digital solutions and expert guidance.
              </p>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-bold mb-4">Services</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">AMU & Compliance Tracker</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Vet Oversight & Guidance</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Vaccination & Aftercare</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/70">
              © 2025 Raksha. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-white/70 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}