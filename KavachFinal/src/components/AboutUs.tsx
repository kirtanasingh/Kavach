import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Shield, Users, Award, Globe, Target, Heart, CheckCircle } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface AboutUsProps {
  onNavigate: (screen: string) => void;
}

export function AboutUs({ onNavigate }: AboutUsProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 bg-gradient-to-br from-muted/50 to-accent/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">
              About Kavach
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Pioneering the future of agricultural technology through innovative digital solutions, 
              empowering farmers worldwide to optimize their operations and maximize productivity.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground">
                Transforming Agricultural Management
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Founded by agricultural experts and technology innovators, Kavach was created 
                in response to the growing need for accessible, science-based digital solutions 
                for farmers seeking to modernize their operations and increase productivity.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe that every farmer, regardless of size or location, deserves access to 
                professional-grade digital tools to optimize their farming operations, protect their 
                livestock, and build sustainable agricultural businesses.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-3xl transform rotate-3 opacity-20"></div>
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1681705357021-d5434018247b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtZXIlMjBtb2JpbGUlMjBwaG9uZSUyMHBvdWx0cnklMjBjaGlja2VucyUyMGZhcm18ZW58MXx8fHwxNzU3NDc5MTgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Farmer using digital tools"
                  className="w-full h-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-0 shadow-xl rounded-3xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To democratize access to professional agricultural tools and knowledge, 
                  enabling farmers worldwide to optimize their operations, protect their livestock, 
                  and build sustainable agricultural communities.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/20 border-0 shadow-xl rounded-3xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A world where every farm, regardless of size or location, has access to 
                  cutting-edge digital tools and expert knowledge to maintain the highest standards 
                  of agricultural productivity and sustainability.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="kavach-card text-center p-8 border-0 shadow-lg hover:shadow-xl transition-shadow rounded-3xl">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Science-First</h3>
                <p className="text-muted-foreground">
                  Every recommendation is backed by agricultural science and proven farming principles.
                </p>
              </CardContent>
            </Card>

            <Card className="kavach-card text-center p-8 border-0 shadow-lg hover:shadow-xl transition-shadow rounded-3xl">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-3xl flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Accessibility</h3>
                <p className="text-muted-foreground">
                  Making professional-grade tools available to farmers of all backgrounds and technical levels.
                </p>
              </CardContent>
            </Card>

            <Card className="kavach-card text-center p-8 border-0 shadow-lg hover:shadow-xl transition-shadow rounded-3xl">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-3xl flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Community</h3>
                <p className="text-muted-foreground">
                  Building supportive networks where farmers can learn, share, and grow together.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-16">
            Global Impact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">50,000+</div>
              <div className="text-green-100">Farmers Served</div>
            </div>
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">25</div>
              <div className="text-green-100">Countries</div>
            </div>
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">95%</div>
              <div className="text-green-100">Risk Reduction</div>
            </div>
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">2M+</div>
              <div className="text-green-100">Animals Protected</div>
            </div>
          </div>
        </div>
      </section>





      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of farmers who are already revolutionizing their operations with Kavach.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => onNavigate('register')}
              className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg shadow-xl rounded-2xl"
            >
              Get Started Today
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => onNavigate('services')}
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