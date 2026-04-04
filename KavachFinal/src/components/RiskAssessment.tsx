import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";

interface RiskAssessmentProps {
  onNavigate: (screen: string) => void;
}

const questions = [
  {
    id: 'farm-type',
    question: 'What type of farm do you operate?',
    options: [
      { value: 'poultry', label: 'Poultry (Chickens, Ducks)', risk: 15 },
      { value: 'pigs', label: 'Pig Farm', risk: 20 },
      { value: 'mixed', label: 'Mixed (Poultry & Pigs)', risk: 25 },
    ]
  },
  {
    id: 'farm-size',
    question: 'How many animals do you have?',
    options: [
      { value: 'small', label: 'Less than 100', risk: 5 },
      { value: 'medium', label: '100 - 500', risk: 10 },
      { value: 'large', label: 'More than 500', risk: 20 },
    ]
  },
  {
    id: 'visitors',
    question: 'How often do visitors come to your farm?',
    options: [
      { value: 'rare', label: 'Rarely (less than once a month)', risk: 5 },
      { value: 'monthly', label: 'Monthly', risk: 10 },
      { value: 'weekly', label: 'Weekly or more', risk: 15 },
    ]
  },
  {
    id: 'cleaning',
    question: 'How often do you clean and disinfect?',
    options: [
      { value: 'daily', label: 'Daily', risk: 0 },
      { value: 'weekly', label: 'Weekly', risk: 10 },
      { value: 'monthly', label: 'Monthly or less', risk: 20 },
    ]
  },
  {
    id: 'water-source',
    question: 'What is your primary water source?',
    options: [
      { value: 'treated', label: 'Treated municipal water', risk: 0 },
      { value: 'well', label: 'Private well (tested)', risk: 5 },
      { value: 'surface', label: 'Surface water (pond, stream)', risk: 15 },
    ]
  }
];

export function RiskAssessment({ onNavigate }: RiskAssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isComplete, setIsComplete] = useState(false);

  const handleAnswer = (questionId: string, value: string, risk: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { value, risk }
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsComplete(true);
    }
  };

  const calculateRisk = () => {
    const totalRisk = Object.values(answers).reduce((sum: number, answer: any) => sum + answer.risk, 0);
    const maxRisk = questions.reduce((sum, q) => sum + Math.max(...q.options.map(o => o.risk)), 0);
    return Math.round((totalRisk / maxRisk) * 100);
  };

  if (isComplete) {
    const riskScore = calculateRisk();
    const riskLevel = riskScore < 30 ? 'Low' : riskScore < 60 ? 'Medium' : 'High';
    const riskColor = riskScore < 30 ? 'text-green-600' : riskScore < 60 ? 'text-orange-600' : 'text-red-600';
    
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white px-4 py-6 border-b">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('home')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Assessment Results</h1>
          </div>
        </div>

        <div className="p-4">
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                {riskScore < 30 ? (
                  <CheckCircle className="w-10 h-10 text-green-600" />
                ) : (
                  <AlertTriangle className="w-10 h-10 text-orange-600" />
                )}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{riskScore}%</h2>
              <p className={`text-lg font-semibold mb-4 ${riskColor}`}>{riskLevel} Risk</p>
              <p className="text-gray-600">
                {riskScore < 30 
                  ? "Great job! Your farm has strong biosecurity measures in place."
                  : riskScore < 60
                  ? "Good foundation, but there's room for improvement in your biosecurity."
                  : "Your farm has several risk factors that need immediate attention."
                }
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Improve Visitor Protocols</p>
                  <p className="text-sm text-gray-600">Implement strict visitor log and disinfection procedures</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Enhance Cleaning Schedule</p>
                  <p className="text-sm text-gray-600">Consider increasing disinfection frequency</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Water Quality Testing</p>
                  <p className="text-sm text-gray-600">Regular testing of your water source is recommended</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button 
              onClick={() => onNavigate('training')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Start Training Modules
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setCurrentQuestion(0);
                setAnswers({});
                setIsComplete(false);
              }}
              className="w-full"
            >
              Retake Assessment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentAnswer = answers[question.id]?.value;

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-white px-4 py-6 border-b">
        <div className="flex items-center space-x-3 mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onNavigate('dashboard')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Risk Assessment</h1>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{question.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={currentAnswer} 
              onValueChange={(value) => {
                const option = question.options.find(o => o.value === value);
                if (option) {
                  handleAnswer(question.id, value, option.risk);
                }
              }}
              className="space-y-4"
            >
              {question.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <Button 
              onClick={nextQuestion}
              disabled={!currentAnswer}
              className="w-full mt-6 bg-green-600 hover:bg-green-700"
            >
              {currentQuestion === questions.length - 1 ? 'Complete Assessment' : 'Next Question'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}