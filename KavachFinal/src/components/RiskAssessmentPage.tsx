import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { ArrowLeft, ArrowRight, CheckCircle, Shield, AlertTriangle, TrendingUp, Target } from "lucide-react";
import { useState } from "react";
import { mockDB } from "../services/mockDatabase";

interface RiskAssessmentPageProps {
  onNavigate: (screen: string) => void;
  onComplete: (userData: { name: string; role: 'Farm Owner' | 'Farm Worker' | 'Veterinarian' }) => void;
  userEmail: string;
  userName: string;
}

interface Question {
  id: string;
  category: string;
  question: string;
  description?: string;
}

export function RiskAssessmentPage({ onNavigate, onComplete, userEmail, userName }: RiskAssessmentPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [riskScore, setRiskScore] = useState(0);

  const questions: Question[] = [
    {
      id: "q1",
      category: "Access Control",
      question: "Do you have controlled access points to your farm with locked gates?",
      description: "Limiting and monitoring who enters your farm is crucial for disease prevention"
    },
    {
      id: "q2",
      category: "Access Control", 
      question: "Do visitors register and follow biosecurity protocols before entering?",
      description: "Visitor logs and protocols help track potential disease sources"
    },
    {
      id: "q3",
      category: "Personal Hygiene",
      question: "Do workers shower and change clothes before entering animal areas?",
      description: "Personal hygiene prevents carrying pathogens between areas"
    },
    {
      id: "q4",
      category: "Personal Hygiene",
      question: "Are hand washing stations available at all entry/exit points?",
      description: "Hand hygiene is one of the most effective disease prevention measures"
    },
    {
      id: "q5",
      category: "Vehicle Sanitation",
      question: "Are all vehicles disinfected before entering the farm premises?",
      description: "Vehicles can carry pathogens from other farms and locations"
    },
    {
      id: "q6",
      category: "Vehicle Sanitation",
      question: "Do you have designated parking areas away from animal housing?",
      description: "Separating vehicles from animals reduces contamination risk"
    },
    {
      id: "q7",
      category: "Animal Health",
      question: "Do you quarantine new animals before introducing them to your herd?",
      description: "Quarantine prevents introducing diseases from new animals"
    },
    {
      id: "q8",
      category: "Animal Health",
      question: "Are animals regularly monitored for signs of illness?",
      description: "Early detection allows for quick response to prevent spread"
    },
    {
      id: "q9",
      category: "Feed and Water",
      question: "Is animal feed stored in secure, pest-proof containers?",
      description: "Contaminated feed can be a major source of disease transmission"
    },
    {
      id: "q10",
      category: "Feed and Water",
      question: "Is water tested regularly for contamination?",
      description: "Clean water is essential for animal health and disease prevention"
    },
    {
      id: "q11",
      category: "Waste Management",
      question: "Do you have proper disposal systems for animal waste?",
      description: "Proper waste management prevents pathogen buildup and spread"
    },
    {
      id: "q12",
      category: "Waste Management",
      question: "Are dead animals disposed of following biosecurity protocols?",
      description: "Improper carcass disposal can contaminate the environment"
    },
    {
      id: "q13",
      category: "Equipment Sanitation",
      question: "Are tools and equipment disinfected between uses?",
      description: "Clean equipment prevents cross-contamination between animals"
    },
    {
      id: "q14",
      category: "Equipment Sanitation",
      question: "Do you have separate equipment for different animal groups?",
      description: "Dedicated equipment reduces disease transmission risk"
    },
    {
      id: "q15",
      category: "Emergency Preparedness",
      question: "Do you have an outbreak response plan in place?",
      description: "Quick response can limit the impact of disease outbreaks"
    }
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = (answer: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));

    // Auto-advance to next question after a short delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        calculateRiskScore();
      }
    }, 300);
  };

  const calculateRiskScore = () => {
    const totalQuestions = questions.length;
    const yesAnswers = Object.values(answers).filter(answer => answer === true).length;
    const score = Math.round((yesAnswers / totalQuestions) * 100);
    setRiskScore(score);
    setShowResults(true);
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: "Low Risk", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 60) return { level: "Medium Risk", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (score >= 40) return { level: "High Risk", color: "text-orange-600", bg: "bg-orange-100" };
    return { level: "Very High Risk", color: "text-red-600", bg: "bg-red-100" };
  };

  const getRecommendations = (score: number) => {
    if (score >= 80) {
      return [
        "Excellent biosecurity practices! Continue monitoring and maintaining protocols.",
        "Consider getting biosecurity certification to showcase your commitment.",
        "Share your best practices with other farmers in your network."
      ];
    }
    if (score >= 60) {
      return [
        "Good foundation, but there's room for improvement in some areas.",
        "Focus on implementing missing protocols gradually.",
        "Consider professional biosecurity training for your team."
      ];
    }
    if (score >= 40) {
      return [
        "Several critical biosecurity gaps need immediate attention.",
        "Prioritize visitor control and personal hygiene protocols.",
        "Consider consulting with a veterinarian for a comprehensive plan."
      ];
    }
    return [
      "Urgent action needed to implement basic biosecurity measures.",
      "Start with access control and basic hygiene protocols immediately.",
      "Seek professional guidance to develop a comprehensive biosecurity plan."
    ];
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Save risk assessment to mock database
      const result = mockDB.saveRiskAssessment(userEmail, {
        answers,
        score: riskScore,
        completedAt: new Date().toISOString()
      });
      
      if (result.success) {
        // Complete onboarding and redirect to dashboard
        onComplete({
          name: userName,
          role: 'Farm Owner'
        });
      } else {
        alert('Failed to save risk assessment. Please try again.');
      }
    } catch (error) {
      alert('Failed to save risk assessment. Please try again.');
    }
    
    setIsSubmitting(false);
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (showResults) {
    const riskInfo = getRiskLevel(riskScore);
    const recommendations = getRecommendations(riskScore);

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>
            
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Risk Assessment Complete</h1>
                <p className="text-muted-foreground">Here's your biosecurity risk profile</p>
              </div>

              {/* Risk Score Display */}
              <div className="text-center mb-8">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(143, 181, 105, 0.2)"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#8fb569"
                      strokeWidth="2"
                      strokeDasharray={`${riskScore}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{riskScore}%</span>
                  </div>
                </div>
                
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${riskInfo.bg}`}>
                  <div className={`w-2 h-2 rounded-full ${riskInfo.color.replace('text-', 'bg-')}`}></div>
                  <span className={`font-medium ${riskInfo.color}`}>{riskInfo.level}</span>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-4 mb-8">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Recommendations for Improvement
                </h3>
                <div className="space-y-3">
                  {recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-2xl">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm text-foreground">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl hover:opacity-90 transition-all duration-300"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Completing setup...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Complete Setup & Go to Dashboard
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </Button>
                
                <p className="text-center text-sm text-muted-foreground">
                  Your risk score will be available in your dashboard for ongoing monitoring
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="ml-2 text-sm text-primary">Farm Details</span>
            </div>
            <div className="w-16 h-0.5 bg-primary"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                3
              </div>
              <span className="ml-2 text-sm text-primary">Risk Assessment</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span className="text-sm font-medium text-primary">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>
          
          <CardContent className="p-8">
            {/* Category Badge */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{currentQuestion.category}</span>
              </div>
            </div>

            {/* Question */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4 leading-relaxed">
                {currentQuestion.question}
              </h2>
              {currentQuestion.description && (
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  {currentQuestion.description}
                </p>
              )}
            </div>

            {/* Answer Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
              <Button
                onClick={() => handleAnswer(true)}
                variant="outline"
                className={`h-16 rounded-2xl border-2 transition-colors duration-150 ${
                  answers[currentQuestion.id] === true 
                    ? 'border-primary bg-primary text-white' 
                    : 'border-primary/20 hover:border-primary hover:bg-primary/10'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-medium">Yes</span>
                </div>
              </Button>
              
              <Button
                onClick={() => handleAnswer(false)}
                variant="outline"
                className={`h-16 rounded-2xl border-2 transition-colors duration-150 ${
                  answers[currentQuestion.id] === false 
                    ? 'border-destructive bg-destructive text-white' 
                    : 'border-destructive/20 hover:border-destructive hover:bg-destructive/10'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <AlertTriangle className="w-6 h-6" />
                  <span className="font-medium">No</span>
                </div>
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="text-muted-foreground disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {answers[currentQuestion.id] !== undefined 
                    ? "Moving to next question..." 
                    : "Select an answer to continue"}
                </p>
              </div>
              
              <div className="w-20"></div> {/* Spacer for balance */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}