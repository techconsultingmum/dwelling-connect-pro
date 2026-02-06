import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Save, 
  Loader2, 
  Edit, 
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface SocietySettings {
  id: string;
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  contact_phone: string;
  contact_email: string;
  registration_number: string;
}

const demoSettings: SocietySettings = {
  id: 'demo',
  name: 'Harmony Heights Co-operative Housing Society',
  address_line1: '123 Main Street, Sector 15',
  address_line2: '',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  contact_phone: '+91 22 2345 6789',
  contact_email: 'info@harmonyheights.com',
  registration_number: 'MH/HSG/2020/12345',
};

export default function SocietySettings() {
  const { role } = useAuth();
  const { isDemoMode } = useDemo();
  const isManager = isDemoMode ? true : role === 'manager';
  
  const [settings, setSettings] = useState<SocietySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<SocietySettings>>({});

  useEffect(() => {
    if (isDemoMode) {
      setSettings(demoSettings);
      setFormData(demoSettings);
      setIsLoading(false);
      return;
    }
    
    fetchSettings();
  }, [isDemoMode]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('society_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      
      const s: SocietySettings = {
        id: data.id,
        name: data.name,
        address_line1: data.address_line1 || '',
        address_line2: data.address_line2 || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || '',
        registration_number: data.registration_number || '',
      };
      setSettings(s);
      setFormData(s);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load society settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    if (isDemoMode) {
      setSettings({ ...settings, ...formData } as SocietySettings);
      setIsEditing(false);
      toast.success('Settings updated (demo mode)');
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('society_settings')
        .update({
          name: formData.name,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          contact_phone: formData.contact_phone,
          contact_email: formData.contact_email,
          registration_number: formData.registration_number,
        })
        .eq('id', settings.id);

      if (error) throw error;
      
      setSettings({ ...settings, ...formData } as SocietySettings);
      setIsEditing(false);
      toast.success('Society settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(settings || {});
    setIsEditing(false);
  };

  const updateField = (field: keyof SocietySettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              Society Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your society's name, address, and contact information
            </p>
          </div>
          {isManager && (
            <div className="flex gap-2">
              {isEditing && (
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
              <Button
                variant={isEditing ? 'gradient' : 'outline'}
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : isEditing ? (
                  <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                ) : (
                  <><Edit className="w-4 h-4 mr-2" /> Edit Settings</>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Society Name & Registration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Society Details
            </CardTitle>
            <CardDescription>Basic information about your society</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="society-name">Society Name</Label>
              <Input
                id="society-name"
                value={isEditing ? formData.name || '' : settings?.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-number">Registration Number</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reg-number"
                  value={isEditing ? formData.registration_number || '' : settings?.registration_number || ''}
                  onChange={(e) => updateField('registration_number', e.target.value)}
                  disabled={!isEditing}
                  className={`pl-10 ${!isEditing ? 'bg-muted' : ''}`}
                  placeholder="e.g. MH/HSG/2020/12345"
                  maxLength={50}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Address
            </CardTitle>
            <CardDescription>Society location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addr1">Address Line 1</Label>
              <Input
                id="addr1"
                value={isEditing ? formData.address_line1 || '' : settings?.address_line1 || ''}
                onChange={(e) => updateField('address_line1', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr2">Address Line 2</Label>
              <Input
                id="addr2"
                value={isEditing ? formData.address_line2 || '' : settings?.address_line2 || ''}
                onChange={(e) => updateField('address_line2', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
                placeholder="Optional"
                maxLength={200}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={isEditing ? formData.city || '' : settings?.city || ''}
                  onChange={(e) => updateField('city', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={isEditing ? formData.state || '' : settings?.state || ''}
                  onChange={(e) => updateField('state', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={isEditing ? formData.pincode || '' : settings?.pincode || ''}
                  onChange={(e) => updateField('pincode', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                  maxLength={10}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Contact Information
            </CardTitle>
            <CardDescription>Society office contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="contact-phone"
                  value={isEditing ? formData.contact_phone || '' : settings?.contact_phone || ''}
                  onChange={(e) => updateField('contact_phone', e.target.value)}
                  disabled={!isEditing}
                  className={`pl-10 ${!isEditing ? 'bg-muted' : ''}`}
                  placeholder="+91 22 1234 5678"
                  maxLength={20}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="contact-email"
                  type="email"
                  value={isEditing ? formData.contact_email || '' : settings?.contact_email || ''}
                  onChange={(e) => updateField('contact_email', e.target.value)}
                  disabled={!isEditing}
                  className={`pl-10 ${!isEditing ? 'bg-muted' : ''}`}
                  placeholder="info@society.com"
                  maxLength={255}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
