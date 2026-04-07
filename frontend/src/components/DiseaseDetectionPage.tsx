import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  Upload, Scan, Camera, Loader2, AlertOctagon, CheckCircle,
  AlertCircle, MapPin, MessageCircle, Calendar, AlertTriangle, X, ArrowLeft
} from "lucide-react";
import { uploadForDetection, pollDetectionStatus } from "../services/diseaseDetectionService";

interface DiseaseDetectionPageProps {
  onNavigate: (screen: string) => void;
}

function mapResultToUI(result: any, animalType: string) {
  if (result.triage_score < 0.5) {
    return {
      status: 'healthy',
      confidence: result.confidence.toFixed(2),
      recommendation: 'No disease detected. Continue routine monitoring.'
    };
  }
  return {
    status: 'disease',
    disease: result.labels?.[0] || 'Unknown Condition',
    severity: result.triage_score > 0.85 ? 'High' : result.triage_score > 0.65 ? 'Medium' : 'Low',
    confidence: result.confidence.toFixed(2),
    findings: result.labels?.map((l: string) => `AI detected: ${l}`) || [],
    recommendation: 'Immediate veterinary consultation recommended.'
  };
}

export function DiseaseDetectionPage({ onNavigate }: DiseaseDetectionPageProps) {
  const [selectedAnimalType, setSelectedAnimalType] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);

  // More robust animal image validation
  const validateAnimalImage = async (file: File): Promise<boolean> => {
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      setImageValidationError('Please upload an image file (JPG, PNG)');
      return false;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setImageValidationError('Image size should be less than 10MB');
      return false;
    }

    // Simple validation: check file name for obvious non-animal keywords
    const nonAnimalKeywords = [
      'plant', 'tree', 'flower', 'car', 'vehicle', 'building', 'house',
      'person', 'human', 'people', 'landscape', 'mountain', 'beach',
      'food', 'phone', 'computer', 'screen', 'text', 'document'
    ];
    
    const fileName = file.name.toLowerCase();
    const hasNonAnimalKeyword = nonAnimalKeywords.some(keyword => fileName.includes(keyword));
    
    if (hasNonAnimalKeyword) {
      setImageValidationError('⚠️ This doesn\'t appear to be an animal image. Please upload a photo of a pig, poultry, or cattle.');
      return false;
    }

    // In a real implementation, you would use a proper image classification API here
    // For now, we'll accept the image after basic validation
    setImageValidationError(null);
    return true;
  };

  const handleImageUpload = async (file: File) => {
    const isValid = await validateAnimalImage(file);
    
    if (!isValid) {
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setImageValidationError(null);
    };
    reader.readAsDataURL(file);
    
    // Store raw file for upload
    setRawFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleScan = async () => {
    if (!uploadedImage || !selectedAnimalType || !rawFile) return;
    setIsScanning(true);

    try {
      const token = localStorage.getItem('token') || '';
      
      // 1. Upload → get job_id
      const { job_id } = await uploadForDetection(rawFile, selectedAnimalType, token);

      // 2. Poll every 3s (frontend already expects this contract)
      const poll = setInterval(async () => {
        const { status, result } = await pollDetectionStatus(job_id, token);
        
        if (status === 'done') {
          clearInterval(poll);
          setIsScanning(false);
          // result shape from backend: { triage_score, labels, confidence, frames_analysed }
          setScanResult(mapResultToUI(result, selectedAnimalType));
        } else if (status === 'failed') {
          clearInterval(poll);
          setIsScanning(false);
          alert('Analysis failed. Please try again.');
        }
      }, 3000);

    } catch (err) {
      setIsScanning(false);
      alert('Upload failed. Check your connection.');
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setScanResult(null);
    setSelectedAnimalType('');
    setImageValidationError(null);
  };

  const handleContactVet = () => {
    alert('Connecting to nearest veterinarian...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-25 to-orange-25">
      {/* Header */}
      <div className="bg-white shadow-sm border-b mb-8">
        <div className="px-6 py-6">
          <Button
            variant="ghost"
            onClick={() => onNavigate('farm-owner-dashboard')}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold" style={{ color: '#006400' }}>Disease Detection</h1>
              <p className="text-lg font-bold" style={{ color: '#EA580C' }}>VLM-based disease detection using animal image analysis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-12">
        {!scanResult ? (
          <div className="space-y-6">
            {/* Upload Section */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary">Upload Animal Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Animal Type Selection */}
                <div>
                  <Label htmlFor="animalType" className="text-base font-semibold mb-2 block">
                    Select Animal Type *
                  </Label>
                  <Select value={selectedAnimalType} onValueChange={setSelectedAnimalType}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Choose animal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pig">🐷 Pig</SelectItem>
                      <SelectItem value="Poultry">🐔 Poultry</SelectItem>
                      <SelectItem value="Cattle">🐄 Cattle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Image Upload Area */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Upload Image *
                  </Label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                      isDragging 
                        ? 'border-primary bg-primary/5 scale-[1.02]' 
                        : uploadedImage 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {uploadedImage ? (
                      <div className="space-y-4">
                        <img 
                          src={uploadedImage} 
                          alt="Uploaded animal" 
                          className="max-h-80 mx-auto rounded-lg object-contain shadow-md"
                        />
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <span className="text-base text-green-700 font-semibold">Image uploaded successfully</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="lg"
                          onClick={handleReset}
                          className="mt-2"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-base text-gray-700 font-medium mb-2">
                          Drag and drop an animal image here
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                          or click to browse files
                        </p>
                        <p className="text-xs text-gray-400 mb-4">
                          Supports JPG, PNG images (max 10MB)
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileInput}
                          className="hidden"
                          id="file-upload"
                        />
                        <Button 
                          size="lg"
                          variant="outline"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          className="text-base px-8"
                        >
                          <Camera className="w-5 h-5 mr-2" />
                          Browse Files
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {/* Error Message */}
                  {imageValidationError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800 font-medium">{imageValidationError}</p>
                    </div>
                  )}
                </div>

                {/* Scan Button */}
                <Button 
                  onClick={handleScan}
                  disabled={!uploadedImage || !selectedAnimalType || isScanning}
                  className="w-full bg-primary hover:bg-primary/90 text-white h-14 text-lg font-semibold"
                  size="lg"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Analyzing image using VLM model...
                    </>
                  ) : (
                    <>
                      <Scan className="w-6 h-6 mr-2" />
                      Scan Image
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Scanned Image Preview */}
            <Card className="bg-white shadow-lg">
              <CardContent className="pt-6">
                <div className="flex justify-center">
                  <img 
                    src={uploadedImage!} 
                    alt="Scanned animal" 
                    className="max-h-64 rounded-lg object-contain border-2 border-gray-200 shadow-md"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Result Card */}
            {scanResult.status === 'healthy' ? (
              <Card className="border-2 border-green-500 bg-green-50 shadow-lg">
                <CardContent className="pt-8 pb-8">
                  <div className="text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-green-800 mb-3">
                        No Disease Detected
                      </h2>
                      <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm">
                        <span className="text-base font-medium text-gray-700">Confidence Score:</span>
                        <span className="text-2xl font-bold text-green-700">{scanResult.confidence}</span>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg border-2 border-green-200 shadow-sm">
                      <h3 className="font-semibold text-green-800 mb-3 text-lg">Recommendation:</h3>
                      <p className="text-base text-gray-700 leading-relaxed">{scanResult.recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-orange-500 bg-orange-50 shadow-lg">
                <CardContent className="pt-8 pb-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <AlertOctagon className="w-9 h-9 text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-orange-900 mb-2">
                          Disease Detected
                        </h2>
                        <p className="text-xl font-semibold text-orange-800">
                          {scanResult.disease}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Severity Level</p>
                        <Badge className={`text-base px-3 py-1 ${
                          scanResult.severity === 'High' ? 'bg-red-500' : 
                          scanResult.severity === 'Medium' ? 'bg-orange-500' : 'bg-yellow-500'
                        } text-white`}>
                          {scanResult.severity}
                        </Badge>
                      </div>
                      <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Confidence Score</p>
                        <p className="text-2xl font-bold text-orange-800">{scanResult.confidence}</p>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border-2 border-orange-200 shadow-sm">
                      <h3 className="font-semibold text-orange-900 mb-4 text-lg">AI Findings:</h3>
                      <ul className="space-y-3">
                        {scanResult.findings.map((finding: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span className="text-base text-gray-700">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200 shadow-sm">
                      <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2 text-lg">
                        <AlertTriangle className="w-5 h-5" />
                        Recommendation:
                      </h3>
                      <p className="text-base text-red-800 leading-relaxed">{scanResult.recommendation}</p>
                    </div>

                    {/* Action Buttons - Only for Disease Detected */}
                    <div className="pt-4">
                      <h3 className="font-semibold text-gray-900 mb-4 text-lg">Quick Actions:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button 
                          onClick={handleContactVet}
                          className="bg-primary hover:bg-primary/90 text-white h-12 text-base font-semibold"
                          size="lg"
                        >
                          <MapPin className="w-5 h-5 mr-2" />
                          Contact Nearby Vet
                        </Button>
                        <Button 
                          onClick={handleContactVet}
                          variant="outline"
                          size="lg"
                          className="border-2 border-primary text-primary hover:bg-primary/10 h-12 text-base font-semibold"
                        >
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Chat with Vet
                        </Button>
                        <Button 
                          onClick={handleContactVet}
                          variant="outline"
                          size="lg"
                          className="border-2 border-primary text-primary hover:bg-primary/10 h-12 text-base font-semibold"
                        >
                          <Calendar className="w-5 h-5 mr-2" />
                          Schedule Appointment
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scan Another Image */}
            <Button 
              onClick={handleReset}
              variant="outline"
              size="lg"
              className="w-full h-12 text-base font-semibold"
            >
              <Camera className="w-5 h-5 mr-2" />
              Scan Another Image
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}