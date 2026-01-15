import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  CreditCard, 
  MessageSquare, 
  Shield, 
  FileText,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Member Management',
    description: 'Manage all society members, their details, and track their maintenance status.',
  },
  {
    icon: CreditCard,
    title: 'Payment Tracking',
    description: 'Track maintenance payments, dues, and generate detailed financial reports.',
  },
  {
    icon: MessageSquare,
    title: 'Direct Communication',
    description: 'Real-time chat between members and society management for quick support.',
  },
  {
    icon: FileText,
    title: 'Notices & Announcements',
    description: 'Post and view society notices, meeting updates, and important announcements.',
  },
  {
    icon: Shield,
    title: 'Complaint Management',
    description: 'Raise and track complaints with real-time status updates.',
  },
  {
    icon: Building2,
    title: 'Google Sheets Sync',
    description: 'Seamlessly sync member data with Google Sheets for easy management.',
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="sidebar-gradient min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-8 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Society ERP</h1>
                <p className="text-white/60 text-sm">Management System</p>
              </div>
            </div>

            <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-slide-up">
              Modern Housing<br />
              <span className="text-accent">Society Management</span>
            </h2>

            <p className="text-xl text-white/70 mb-8 max-w-2xl animate-slide-up" style={{ animationDelay: '100ms' }}>
              Streamline your cooperative housing society operations with our comprehensive ERP solution. 
              Manage members, track payments, handle complaints, and communicate effectively.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Link to="/login">
                <Button size="xl" className="bg-white text-primary hover:bg-white/90 gap-2 w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
                View Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 mt-12 text-white/60 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <span>Google Sheets Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <span>Webhook Integration</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <span>Real-time Updates</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to manage every aspect of your housing society
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-8 rounded-2xl bg-card border border-border hover:shadow-xl hover:border-primary/20 transition-all duration-300 group animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-muted/50">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of housing societies already using our platform to streamline their operations.
            </p>
            <Link to="/login">
              <Button variant="gradient" size="xl" className="gap-2">
                Sign In Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <span className="font-semibold">Society ERP</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Society ERP. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
