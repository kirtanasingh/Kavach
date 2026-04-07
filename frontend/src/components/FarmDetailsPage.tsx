import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { ArrowLeft, ArrowRight, Building2, Users, Calendar, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { mockDB } from "../services/mockDatabase";

interface FarmDetailsPageProps {
  onNavigate: (screen: string) => void;
  userEmail: string;
  userName: string;
}

interface ValidationErrors {
  [key: string]: string;
}

export function FarmDetailsPage({ onNavigate, userEmail, userName }: FarmDetailsPageProps) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    farmName: '',
    farmType: '',
    farmSize: '',
    sizeUnit: 'acres',
    establishedYear: '',
    totalAnimals: '',
    animalTypes: [] as string[],
    farmingMethods: [] as string[],
    certifications: [] as string[],
    primaryProducts: '',
    annualRevenue: '',
    farmDescription: ''
  });

  const animalTypeOptions = [
    'Pigs/Swine',
    'Poultry (Chickens)',
    'Poultry (Ducks)',
    'Poultry (Turkeys)',
    'Cattle',
    'Goats',
    'Sheep',
    'Other'
  ];

  const farmingMethodOptions = [
    'Organic',
    'Conventional',
    'Free-range',
    'Pasture-raised',
    'Indoor confinement',
    'Mixed system'
  ];

  const certificationOptions = [
    'Organic certification',
    'Animal welfare certification',
    'Food safety certification',
    'Environmental certification',
    'No certifications'
  ];

  const validateField = (field: string, value: string | string[]): string => {
    switch (field) {
      case 'farmName':
        if (typeof value === 'string') {
          if (!value.trim()) return 'Farm name is required';
          if (value.length < 2) return 'Farm name must be at least 2 characters';
          if (value.length > 100) return 'Farm name must be less than 100 characters';
        }
        break;
      
      case 'farmType':
        if (typeof value === 'string' && !value) return 'Please select farm type';
        break;
      
      case 'farmSize':
        if (typeof value === 'string') {
          if (!value) return 'Farm size is required';
          if (isNaN(Number(value)) || Number(value) <= 0) return 'Please enter a valid farm size';
        }
        break;
      
      case 'establishedYear':
        if (typeof value === 'string') {
          if (!value) return 'Established year is required';
          const year = Number(value);
          const currentYear = new Date().getFullYear();
          if (isNaN(year) || year < 1900 || year > currentYear) {
            return `Please enter a valid year between 1900 and ${currentYear}`;
          }
        }
        break;
      
      case 'totalAnimals':
        if (typeof value === 'string') {
          if (!value) return 'Total number of animals is required';
          if (isNaN(Number(value)) || Number(value) < 0) return 'Please enter a valid number of animals';
        }
        break;
      
      case 'animalTypes':
        if (Array.isArray(value) && value.length === 0) return 'Please select at least one animal type';
        break;
      
      case 'farmingMethods':
        if (Array.isArray(value) && value.length === 0) return 'Please select at least one farming method';
        break;
      
      case 'primaryProducts':
        if (typeof value === 'string') {
          if (!value.trim()) return 'Primary products description is required';
          if (value.length < 10) return 'Please provide more details about your primary products';
        }
        break;
    }
    return '';
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const handleCheckboxChange = (field: 'animalTypes' | 'farmingMethods' | 'certifications', value: string, checked: boolean) => {
    const currentValues = formData[field];
    let newValues;
    
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(item => item !== value);
    }
    
    handleInputChange(field, newValues);
  };

  const getFieldValidationState = (field: string) => {
    const value = formData[field as keyof typeof formData];
    const hasError = errors[field];
    const hasValue = Array.isArray(value) ? value.length > 0 : (typeof value === 'string' ? value.length > 0 : value);
    
    if (hasError) return 'error';
    if (hasValue && !hasError) return 'success';
    return 'default';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate all fields
    const newErrors: ValidationErrors = {};
    Object.keys(formData).forEach(field => {
      if (field !== 'annualRevenue' && field !== 'farmDescription') { // These are optional
        const error = validateField(field, formData[field as keyof typeof formData]);
        if (error) newErrors[field] = error;
      }
    });

    setErrors(newErrors);

    // If no errors, proceed to save farm details and move to risk assessment
    if (Object.keys(newErrors).length === 0) {
      try {
        // Save farm details to mock database
        const result = mockDB.saveFarmDetails(userEmail, formData);
        
        if (result.success) {
          // Move to risk assessment
          onNavigate('risk-assessment');
        } else {
          setErrors({
            farmName: result.error || 'Failed to save farm details. Please try again.'
          });
        }
      } catch (error) {
        setErrors({
          farmName: 'Failed to save farm details. Please try again.'
        });
      }
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate('home')}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="ml-2 text-sm text-primary">Registration</span>
            </div>
            <div className="w-16 h-0.5 bg-primary"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                2
              </div>
              <span className="ml-2 text-sm text-primary">Farm Details</span>
            </div>
            <div className="w-16 h-0.5 bg-border"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-border rounded-full flex items-center justify-center text-muted-foreground">
                3
              </div>
              <span className="ml-2 text-sm text-muted-foreground">Risk Assessment</span>
            </div>
          </div>
        </div>

        {/* Farm Details Card */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
          {/* Header Gradient */}
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>
          
          <CardContent className="p-8">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Tell us about your farm</h1>
              <p className="text-muted-foreground">Help us understand your farming operation to provide better biosecurity recommendations</p>
            </div>

            {/* Farm Details Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Farm Name and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="farmName" className="flex items-center gap-2 text-foreground">
                    <Building2 className="w-4 h-4 text-primary" />
                    Farm Name *
                  </Label>
                  <div className="relative">
                    <Input
                      id="farmName"
                      type="text"
                      placeholder="Green Valley Farm"
                      value={formData.farmName}
                      onChange={(e) => handleInputChange('farmName', e.target.value)}
                      className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 pr-10 ${
                        errors.farmName 
                          ? 'border-destructive focus:border-destructive' 
                          : getFieldValidationState('farmName') === 'success'
                          ? 'border-primary'
                          : 'border-border/50 focus:border-primary'
                      }`}
                    />
                    {getFieldValidationState('farmName') === 'success' && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    )}
                    {errors.farmName && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
                    )}
                  </div>
                  {errors.farmName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.farmName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground">
                    <Users className="w-4 h-4 text-primary" />
                    Farm Type *
                  </Label>
                  <Select value={formData.farmType} onValueChange={(value) => handleInputChange('farmType', value)}>
                    <SelectTrigger className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 ${
                      errors.farmType 
                        ? 'border-destructive' 
                        : getFieldValidationState('farmType') === 'success'
                        ? 'border-primary'
                        : 'border-border/50 focus:border-primary'
                    }`}>
                      <SelectValue placeholder="Select farm type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pig-farm">Pig Farm</SelectItem>
                      <SelectItem value="poultry-farm">Poultry Farm</SelectItem>
                      <SelectItem value="mixed-livestock">Mixed Livestock</SelectItem>
                      <SelectItem value="integrated-farm">Integrated Farm</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.farmType && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.farmType}
                    </p>
                  )}
                </div>
              </div>

              {/* Farm Size and Established Year */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="farmSize" className="flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    Farm Size *
                  </Label>
                  <Input
                    id="farmSize"
                    type="number"
                    placeholder="50"
                    value={formData.farmSize}
                    onChange={(e) => handleInputChange('farmSize', e.target.value)}
                    className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 ${
                      errors.farmSize 
                        ? 'border-destructive focus:border-destructive' 
                        : 'border-border/50 focus:border-primary'
                    }`}
                  />
                  {errors.farmSize && (
                    <p className="text-sm text-destructive">{errors.farmSize}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Unit</Label>
                  <Select value={formData.sizeUnit} onValueChange={(value) => handleInputChange('sizeUnit', value)}>
                    <SelectTrigger className="h-12 rounded-2xl bg-input-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acres">Acres</SelectItem>
                      <SelectItem value="hectares">Hectares</SelectItem>
                      <SelectItem value="sq-meters">Square Meters</SelectItem>
                      <SelectItem value="sq-feet">Square Feet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="establishedYear" className="flex items-center gap-2 text-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    Established Year *
                  </Label>
                  <Input
                    id="establishedYear"
                    type="number"
                    placeholder="2010"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.establishedYear}
                    onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                    className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 ${
                      errors.establishedYear 
                        ? 'border-destructive focus:border-destructive' 
                        : 'border-border/50 focus:border-primary'
                    }`}
                  />
                  {errors.establishedYear && (
                    <p className="text-sm text-destructive">{errors.establishedYear}</p>
                  )}
                </div>
              </div>

              {/* Total Animals */}
              <div className="space-y-2">
                <Label htmlFor="totalAnimals" className="flex items-center gap-2 text-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  Total Number of Animals *
                </Label>
                <Input
                  id="totalAnimals"
                  type="number"
                  placeholder="500"
                  value={formData.totalAnimals}
                  onChange={(e) => handleInputChange('totalAnimals', e.target.value)}
                  className={`h-12 rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 ${
                    errors.totalAnimals 
                      ? 'border-destructive focus:border-destructive' 
                      : 'border-border/50 focus:border-primary'
                  }`}
                />
                {errors.totalAnimals && (
                  <p className="text-sm text-destructive">{errors.totalAnimals}</p>
                )}
              </div>

              {/* Animal Types */}
              <div className="space-y-3">
                <Label className="text-foreground">Animal Types * <span className="text-sm text-muted-foreground">(Select all that apply)</span></Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {animalTypeOptions.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`animal-${type}`}
                        checked={formData.animalTypes.includes(type)}
                        onCheckedChange={(checked) => handleCheckboxChange('animalTypes', type, checked as boolean)}
                      />
                      <Label htmlFor={`animal-${type}`} className="text-sm">{type}</Label>
                    </div>
                  ))}
                </div>
                {errors.animalTypes && (
                  <p className="text-sm text-destructive">{errors.animalTypes}</p>
                )}
              </div>

              {/* Farming Methods */}
              <div className="space-y-3">
                <Label className="text-foreground">Farming Methods * <span className="text-sm text-muted-foreground">(Select all that apply)</span></Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {farmingMethodOptions.map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <Checkbox
                        id={`method-${method}`}
                        checked={formData.farmingMethods.includes(method)}
                        onCheckedChange={(checked) => handleCheckboxChange('farmingMethods', method, checked as boolean)}
                      />
                      <Label htmlFor={`method-${method}`} className="text-sm">{method}</Label>
                    </div>
                  ))}
                </div>
                {errors.farmingMethods && (
                  <p className="text-sm text-destructive">{errors.farmingMethods}</p>
                )}
              </div>

              {/* Certifications */}
              <div className="space-y-3">
                <Label className="text-foreground">Certifications <span className="text-sm text-muted-foreground">(Select all that apply)</span></Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {certificationOptions.map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cert-${cert}`}
                        checked={formData.certifications.includes(cert)}
                        onCheckedChange={(checked) => handleCheckboxChange('certifications', cert, checked as boolean)}
                      />
                      <Label htmlFor={`cert-${cert}`} className="text-sm">{cert}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary Products */}
              <div className="space-y-2">
                <Label htmlFor="primaryProducts" className="text-foreground">
                  Primary Products * <span className="text-sm text-muted-foreground">(What do you mainly produce?)</span>
                </Label>
                <Textarea
                  id="primaryProducts"
                  placeholder="Describe your main products (e.g., pork, eggs, chicken meat, etc.)"
                  value={formData.primaryProducts}
                  onChange={(e) => handleInputChange('primaryProducts', e.target.value)}
                  className={`rounded-2xl bg-input-background focus:ring-2 focus:ring-primary/20 min-h-[100px] ${
                    errors.primaryProducts 
                      ? 'border-destructive focus:border-destructive' 
                      : 'border-border/50 focus:border-primary'
                  }`}
                />
                {errors.primaryProducts && (
                  <p className="text-sm text-destructive">{errors.primaryProducts}</p>
                )}
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="annualRevenue" className="text-foreground">
                    Annual Revenue <span className="text-sm text-muted-foreground">(Optional)</span>
                  </Label>
                  <Select value={formData.annualRevenue} onValueChange={(value) => handleInputChange('annualRevenue', value)}>
                    <SelectTrigger className="h-12 rounded-2xl bg-input-background">
                      <SelectValue placeholder="Select revenue range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-100k">Under ₹1 Lakh</SelectItem>
                      <SelectItem value="100k-500k">₹1-5 Lakhs</SelectItem>
                      <SelectItem value="500k-1m">₹5-10 Lakhs</SelectItem>
                      <SelectItem value="1m-5m">₹10-50 Lakhs</SelectItem>
                      <SelectItem value="5m-plus">Above ₹50 Lakhs</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farmDescription" className="text-foreground">
                    Additional Notes <span className="text-sm text-muted-foreground">(Optional)</span>
                  </Label>
                  <Textarea
                    id="farmDescription"
                    placeholder="Any additional information about your farm..."
                    value={formData.farmDescription}
                    onChange={(e) => handleInputChange('farmDescription', e.target.value)}
                    className="rounded-2xl bg-input-background min-h-[100px]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl hover:opacity-90 transition-all duration-300"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Saving farm details...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Continue to Risk Assessment
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}