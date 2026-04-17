import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, Lock, Eye, EyeOff, Navigation, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { login, register } from "../services/authService";
import kavachLogo from 'figma:asset/2a4372773a3b5a42d85c8677296ad91523020f1f.png';

interface RegisterPageProps {
  onNavigate: (screen: string) => void;
  onRegister: (userData: { name: string; role: 'Farm Owner' | 'Veterinarian' | 'Authority'; email?: string }) => void;
}

interface ValidationErrors {
  [key: string]: string;
}

export function RegisterPage({ onNavigate, onRegister }: RegisterPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  });

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic phone validation (10-15 digits with optional + and spaces/dashes)
    const phoneRegex = /^[\+]?[\d\s\-]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validatePostalCode = (postalCode: string): boolean => {
    // Basic postal code validation (3-10 alphanumeric characters)
    const postalRegex = /^[A-Za-z0-9]{3,10}$/;
    return postalRegex.test(postalCode);
  };

  const validateAge = (dateOfBirth: string): boolean => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 16;
    }
    return age >= 16;
  };

  const validateField = (field: string, value: string | boolean): string => {
    switch (field) {
      case 'fullName':
        if (typeof value === 'string') {
          if (value.length < 2) return 'Full name must be at least 2 characters';
          if (value.length > 50) return 'Full name must be less than 50 characters';
          if (!/^[a-zA-Z\s]+$/.test(value)) return 'Full name can only contain letters and spaces';
        }
        break;
      
      case 'email':
        if (typeof value === 'string') {
          if (!value) return 'Email is required';
          if (!validateEmail(value)) return 'Please enter a valid email address';
        }
        break;
      
      case 'phoneNumber':
        if (typeof value === 'string') {
          if (!value) return 'Phone number is required';
          if (!validatePhoneNumber(value)) return 'Please enter a valid phone number (10-15 digits)';
        }
        break;
      
      case 'dateOfBirth':
        if (typeof value === 'string') {
          if (!value) return 'Date of birth is required';
          if (!validateAge(value)) return 'You must be at least 16 years old to register';
        }
        break;
      
      case 'streetAddress':
        if (typeof value === 'string') {
          if (!value) return 'Street address is required';
          if (value.length < 5) return 'Street address must be at least 5 characters';
          if (value.length > 100) return 'Street address must be less than 100 characters';
        }
        break;
      
      case 'city':
        if (typeof value === 'string') {
          if (!value) return 'City is required';
          if (value.length < 2) return 'City must be at least 2 characters';
          if (value.length > 50) return 'City must be less than 50 characters';
          if (!/^[a-zA-Z\s]+$/.test(value)) return 'City can only contain letters and spaces';
        }
        break;
      
      case 'state':
        if (typeof value === 'string') {
          if (!value) return 'State/Province is required';
          if (value.length < 2) return 'State must be at least 2 characters';
          if (value.length > 50) return 'State must be less than 50 characters';
        }
        break;
      
      case 'postalCode':
        if (typeof value === 'string') {
          if (!value) return 'Postal code is required';
          if (!validatePostalCode(value)) return 'Please enter a valid postal code (3-10 characters)';
        }
        break;
      
      case 'country':
        if (typeof value === 'string' && !value) return 'Please select your country';
        break;
      
      case 'password':
        if (typeof value === 'string') {
          if (!value) return 'Password is required';
          if (!validatePassword(value)) return 'Password must be at least 8 characters with uppercase, lowercase, and number';
        }
        break;
      
      case 'confirmPassword':
        if (typeof value === 'string') {
          if (!value) return 'Please confirm your password';
          if (value !== formData.password) return 'Passwords do not match';
        }
        break;
      
      case 'agreedToTerms':
        if (typeof value === 'boolean' && !value) return 'You must agree to the terms and conditions';
        break;
    }
    return '';
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));

    // Special case for confirm password when password changes
    if (field === 'password' && formData.confirmPassword) {
      const confirmError = validateField('confirmPassword', formData.confirmPassword);
      setErrors(prev => ({
        ...prev,
        confirmPassword: confirmError
      }));
    }
  };

  const handleAutoDetectLocation = () => {
    // Placeholder for auto-detect location functionality
    alert('Auto-detect location feature will be implemented here');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate all fields
    const newErrors: ValidationErrors = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);

    // If no errors, proceed with registration
    if (Object.keys(newErrors).length === 0) {
      try {
        await register({
          full_name: formData.fullName,
          email: formData.email.trim().toLowerCase(),
          phone_number: formData.phoneNumber || undefined,
          date_of_birth: formData.dateOfBirth || undefined,
          role: 'farm_owner',
          street_address: formData.streetAddress || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          postal_code: formData.postalCode || undefined,
          country: formData.country || 'India',
          password: formData.password,
          agreed_to_terms: formData.agreedToTerms,
        });

        const user = await login({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        });

        const uiRole = user.role === 'veterinarian'
          ? 'Veterinarian'
          : user.role === 'authority'
          ? 'Authority'
          : 'Farm Owner';

        onRegister({
          name: user.full_name,
          role: uiRole,
          email: user.email,
        });
      } catch (error: any) {
        const message = Array.isArray(error) && error.length > 0
          ? error[0].message
          : (error?.message || 'Registration failed. Please try again.');
        setErrors({ email: message });
      }
    }
    
    setIsSubmitting(false);
  };

  const getFieldValidationState = (field: string) => {
    const value = formData[field as keyof typeof formData];
    const hasError = errors[field];
    const hasValue = typeof value === 'string' ? value.length > 0 : value;
    
    if (hasError) return 'error';
    if (hasValue && !hasError) return 'success';
    return 'default';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => onNavigate('home')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Register Card */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
          {/* Header Gradient */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-accent"></div>
          
          <CardContent className="p-6">
            {/* Logo and Title */}
            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto mb-3">
                <img 
                  src={kavachLogo} 
                  alt="Kavach Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Join Kavach</h1>
              <p className="text-sm text-muted-foreground">Create your account and start your agricultural journey</p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2 text-foreground">
                  <User className="w-4 h-4 text-primary" />
                  Full Name *
                </Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 pr-10 ${
                      errors.fullName 
                        ? 'border-destructive focus:border-destructive' 
                        : getFieldValidationState('fullName') === 'success'
                        ? 'border-primary'
                        : 'border-border/50 focus:border-primary'
                    }`}
                  />
                  {getFieldValidationState('fullName') === 'success' && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  )}
                  {errors.fullName && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
                  )}
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  Email *
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 pr-10 ${
                      errors.email 
                        ? 'border-destructive focus:border-destructive' 
                        : getFieldValidationState('email') === 'success'
                        ? 'border-primary'
                        : 'border-border/50 focus:border-primary'
                    }`}
                  />
                  {getFieldValidationState('email') === 'success' && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  )}
                  {errors.email && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
                  )}
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2 text-foreground">
                  <Phone className="w-4 h-4 text-primary" />
                  Phone Number *
                </Label>
                <div className="relative">
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 pr-10 ${
                      errors.phoneNumber 
                        ? 'border-destructive focus:border-destructive' 
                        : getFieldValidationState('phoneNumber') === 'success'
                        ? 'border-primary'
                        : 'border-border/50 focus:border-primary'
                    }`}
                  />
                  {getFieldValidationState('phoneNumber') === 'success' && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  )}
                  {errors.phoneNumber && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
                  )}
                </div>
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2 text-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  Date of Birth * <span className="text-xs text-muted-foreground">(Must be 16+)</span>
                </Label>
                <div className="relative">
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 pr-10 ${
                      errors.dateOfBirth 
                        ? 'border-destructive focus:border-destructive' 
                        : getFieldValidationState('dateOfBirth') === 'success'
                        ? 'border-primary'
                        : 'border-border/50 focus:border-primary'
                    }`}
                  />
                  {getFieldValidationState('dateOfBirth') === 'success' && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  )}
                  {errors.dateOfBirth && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
                  )}
                </div>
                {errors.dateOfBirth && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-sm font-medium text-foreground">Account Type: Farm Owner</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Veterinarian and Authority accounts are managed directly by administrators.
                </p>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    Address Information
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoDetectLocation}
                    className="text-xs border-primary/20 text-primary hover:bg-primary/10 rounded-full"
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Auto Detect Location
                  </Button>
                </div>

                {/* Street Address */}
                <div className="space-y-2">
                  <Label htmlFor="streetAddress" className="text-sm text-muted-foreground">Street Address *</Label>
                  <div className="relative">
                    <Input
                      id="streetAddress"
                      type="text"
                      placeholder="123 Main Street, Apartment 4B"
                      value={formData.streetAddress}
                      onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                      className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 pr-10 ${
                        errors.streetAddress 
                          ? 'border-destructive focus:border-destructive' 
                          : getFieldValidationState('streetAddress') === 'success'
                          ? 'border-primary'
                          : 'border-border/50 focus:border-primary'
                      }`}
                    />
                    {getFieldValidationState('streetAddress') === 'success' && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    )}
                    {errors.streetAddress && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
                    )}
                  </div>
                  {errors.streetAddress && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.streetAddress}
                    </p>
                  )}
                </div>

                {/* City and State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm text-muted-foreground">City *</Label>
                    <div className="relative">
                      <Input
                        id="city"
                        type="text"
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 ${
                          errors.city 
                            ? 'border-destructive focus:border-destructive' 
                            : getFieldValidationState('city') === 'success'
                            ? 'border-primary'
                            : 'border-border/50 focus:border-primary'
                        }`}
                      />
                      {getFieldValidationState('city') === 'success' && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      )}
                      {errors.city && (
                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                      )}
                    </div>
                    {errors.city && (
                      <p className="text-xs text-destructive">{errors.city}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm text-muted-foreground">State/Province *</Label>
                    <div className="relative">
                      <Input
                        id="state"
                        type="text"
                        placeholder="Maharashtra"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 ${
                          errors.state 
                            ? 'border-destructive focus:border-destructive' 
                            : getFieldValidationState('state') === 'success'
                            ? 'border-primary'
                            : 'border-border/50 focus:border-primary'
                        }`}
                      />
                      {getFieldValidationState('state') === 'success' && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      )}
                      {errors.state && (
                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                      )}
                    </div>
                    {errors.state && (
                      <p className="text-xs text-destructive">{errors.state}</p>
                    )}
                  </div>
                </div>

                {/* Postal Code and Country */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="text-sm text-muted-foreground">Postal Code *</Label>
                    <div className="relative">
                      <Input
                        id="postalCode"
                        type="text"
                        placeholder="400001"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 ${
                          errors.postalCode 
                            ? 'border-destructive focus:border-destructive' 
                            : getFieldValidationState('postalCode') === 'success'
                            ? 'border-primary'
                            : 'border-border/50 focus:border-primary'
                        }`}
                      />
                      {getFieldValidationState('postalCode') === 'success' && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      )}
                      {errors.postalCode && (
                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                      )}
                    </div>
                    {errors.postalCode && (
                      <p className="text-xs text-destructive">{errors.postalCode}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Country *</Label>
                    <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                      <SelectTrigger className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 ${
                        errors.country 
                          ? 'border-destructive' 
                          : getFieldValidationState('country') === 'success'
                          ? 'border-primary'
                          : 'border-border/50 focus:border-primary'
                      }`}>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="india">India</SelectItem>
                        <SelectItem value="usa">United States</SelectItem>
                        <SelectItem value="canada">Canada</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="australia">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.country && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.country}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-foreground">
                  <Lock className="w-4 h-4 text-primary" />
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="8+ chars, uppercase, lowercase, number"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 pr-20 ${
                      errors.password 
                        ? 'border-destructive focus:border-destructive' 
                        : getFieldValidationState('password') === 'success'
                        ? 'border-primary'
                        : 'border-border/50 focus:border-primary'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {getFieldValidationState('password') === 'success' && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                    {errors.password && (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
                {formData.password && !errors.password && (
                  <div className="text-xs text-muted-foreground">
                    Password strength: {validatePassword(formData.password) ? 'Strong' : 'Weak'}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-foreground">
                  <Lock className="w-4 h-4 text-primary" />
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 pr-20 ${
                      errors.confirmPassword 
                        ? 'border-destructive focus:border-destructive' 
                        : getFieldValidationState('confirmPassword') === 'success'
                        ? 'border-primary'
                        : 'border-border/50 focus:border-primary'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {getFieldValidationState('confirmPassword') === 'success' && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                    {errors.confirmPassword && (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-2">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.agreedToTerms}
                    onCheckedChange={(checked) => handleInputChange('agreedToTerms', checked as boolean)}
                    className={`mt-1 ${errors.agreedToTerms ? 'border-destructive' : ''}`}
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                    I agree to the{' '}
                    <button type="button" className="text-primary hover:text-primary/80 underline">
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button type="button" className="text-primary hover:text-primary/80 underline">
                      Privacy Policy
                    </button>
                    <span className="text-destructive"> *</span>
                  </Label>
                </div>
                {errors.agreedToTerms && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.agreedToTerms}
                  </p>
                )}
              </div>

              {/* Create Account Button */}
              <Button
                type="submit"
                disabled={!formData.agreedToTerms || Object.keys(errors).some(key => errors[key]) || isSubmitting}
                className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-muted-foreground">or continue with</span>
                </div>
              </div>

              {/* Google Sign Up */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 border-border/50 hover:border-primary/30 rounded-2xl"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              {/* Sign In Link */}
              <div className="text-center pt-4">
                <span className="text-muted-foreground">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Sign in here
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}