import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Shield, BookOpen, Bell, FileText, MessageCircle, Map, CheckCircle, ArrowRight, Camera } from "lucide-react";

interface ServicesPageProps {
  onNavigate: (screen: string) => void;
}

export function ServicesPage({ onNavigate }: ServicesPageProps) {
  const services = [
    {
      icon: Shield,
      title: "Personalized Risk Assessment",
      description: "Assess disease risk based on symptoms",
      details: "Advanced AI-powered analysis of your farm's specific conditions, animal health symptoms, and environmental factors to provide personalized risk scores and actionable recommendations.",
      gradient: "from-primary to-secondary",
      iconColor: "text-white"
    },
    {
      icon: BookOpen,
      title: "Interactive Learning Modules",
      description: "Gamified biosecurity training",
      details: "Engaging, game-based learning experiences that make biosecurity training fun and memorable. Track your progress and earn certifications as you master essential farming practices.",
      gradient: "from-secondary to-accent",
      iconColor: "text-white"
    },
    {
      icon: Bell,
      title: "Real-time Outbreak Alerts",
      description: "SMS & in-app disease notifications",
      details: "Stay informed with instant alerts about disease outbreaks in your area. Receive notifications via SMS, push notifications, and in-app messages to take immediate action.",
      gradient: "from-accent to-primary",
      iconColor: "text-white"
    },
    {
      icon: FileText,
      title: "Compliance Checklist & Reports",
      description: "Daily tasks + auto-generated PDF",
      details: "Streamlined compliance management with automated daily task lists, progress tracking, and professional PDF reports for regulatory requirements and record-keeping.",
      gradient: "from-primary to-accent",
      iconColor: "text-white"
    },
    {
      icon: MessageCircle,
      title: "Expert Advice & Support",
      description: "In-app messaging with vets",
      details: "Direct access to veterinary experts and agricultural specialists through secure in-app messaging. Get professional advice and support whenever you need it.",
      gradient: "from-secondary to-primary",
      iconColor: "text-white"
    },
    {
      icon: Map,
      title: "Farm Location Mapping",
      description: "Visual map of farm + nearby outbreaks (optional)",
      details: "Interactive mapping system that visualizes your farm location, tracks nearby disease outbreaks, and helps you understand regional risk patterns for better decision-making.",
      gradient: "from-accent to-secondary",
      iconColor: "text-white"
    },
    {
      icon: Camera,
      title: "VLM Based Disease Detection",
      description: "AI-powered visual disease identification",
      details: "Cutting-edge Vision Language Model technology that analyzes images of your livestock to detect early signs of disease, providing instant diagnostic insights and treatment recommendations.",
      gradient: "from-primary to-secondary",
      iconColor: "text-white"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-muted/50 to-accent/30">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 rounded-full px-6 py-2">
            🛡️ Comprehensive Farm Protection
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-foreground">Our</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Services
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-12">
            Comprehensive digital solutions designed to protect your livestock, optimize your operations, 
            and ensure the highest standards of farm biosecurity and productivity.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card 
                  key={index}
                  className="kavach-card border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 bg-gradient-to-br ${service.gradient} rounded-3xl flex items-center justify-center mb-6 shadow-lg`}>
                      <IconComponent className={`w-8 h-8 ${service.iconColor}`} />
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {service.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          {service.description}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {service.details}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Our Services */}
      <section className="py-20 px-4 bg-gradient-to-br from-muted/30 to-accent/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Why Choose Kavach Services?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our services are designed by agricultural experts and powered by cutting-edge technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Expert-Designed</h3>
              <p className="text-muted-foreground">
                Developed by veterinarians and agricultural specialists with decades of field experience
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Evidence-Based</h3>
              <p className="text-muted-foreground">
                All recommendations backed by scientific research and proven best practices in agriculture
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">24/7 Support</h3>
              <p className="text-muted-foreground">
                Round-the-clock assistance from our team of agricultural experts and support specialists
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Protect Your Farm?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Get started with our comprehensive services and join thousands of successful farmers using Kavach.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => onNavigate('register')}
              className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg shadow-xl rounded-2xl group"
            >
              Get Started Today
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => onNavigate('about')}
              className="border-2 border-white text-primary hover:bg-white/10 px-8 py-4 text-lg rounded-2xl"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}