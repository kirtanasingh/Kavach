import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { 
  ArrowLeft, 
  Pill, 
  Stethoscope, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Save,
  X,
  Search
} from "lucide-react";

interface AMULoggingPageProps {
  onNavigate: (screen: string) => void;
  userName: string;
}

// Mock data for dropdowns
const mockAnimals = [
  { id: "PIG001", species: "Pig", age: "6 months", weight: "45 kg" },
  { id: "PIG002", species: "Pig", age: "8 months", weight: "62 kg" },
  { id: "PIG003", species: "Pig", age: "4 months", weight: "28 kg" },
  { id: "POULTRY001", species: "Poultry", age: "12 weeks", weight: "2.1 kg" },
  { id: "POULTRY002", species: "Poultry", age: "8 weeks", weight: "1.5 kg" },
  { id: "COW001", species: "Cattle", age: "2 years", weight: "350 kg" },
  { id: "GOAT001", species: "Goat", age: "1 year", weight: "35 kg" },
  { id: "SHEEP001", species: "Sheep", age: "18 months", weight: "40 kg" }
];

const vaccineDatabase = [
  // CATTLE & BUFFALO VACCINES
  { 
    name: "Brucella abortus S19 (Sanbru)", 
    strain: "S19 (IVRI, Izatnagar)",
    species: ["cattle", "buffalo"],
    form: "Freeze-dried, 5/10/20/50 doses",
    indication: "Female cattle & buffalo calves, brucellosis prevention",
    manufacturer: "IVRI, Izatnagar",
    withdrawalPeriods: { 
      cattle: { meat: 0, milk: 0 }, // Vaccines typically have no withdrawal
      buffalo: { meat: 0, milk: 0 },
      pig: { meat: 0, milk: 0 }, 
      poultry: { meat: 0, eggs: 0 },
      goat: { meat: 0, milk: 0 },
      sheep: { meat: 0, milk: 0 }
    }
  },
  { 
    name: "Foot and Mouth Disease Vaccine (FMD, Inactivated)", 
    strain: "O (IND/R2/75), A (IND/40/2000), Asia1 (IND/63/72)",
    species: ["cattle", "buffalo", "sheep", "goat"],
    form: "Injection (Cattle/Buffalo 2 ml, Sheep/Goat 1 ml), 20–200 ml packs",
    indication: "Protection against FMD",
    manufacturer: "IVRI approved",
    withdrawalPeriods: { 
      cattle: { meat: 0, milk: 0 },
      buffalo: { meat: 0, milk: 0 },
      sheep: { meat: 0, milk: 0 },
      goat: { meat: 0, milk: 0 },
      pig: { meat: 0, milk: 0 }, 
      poultry: { meat: 0, eggs: 0 }
    }
  },
  { 
    name: "Haemorrhagic Septicaemia Vaccine", 
    strain: "Pasteurella multocida (P52)",
    species: ["cattle", "buffalo"],
    form: "25, 50, 100 doses (Subcutaneous)",
    indication: "HS prevention",
    manufacturer: "IVRI approved",
    withdrawalPeriods: { 
      cattle: { meat: 0, milk: 0 },
      buffalo: { meat: 0, milk: 0 },
      pig: { meat: 0, milk: 0 }, 
      poultry: { meat: 0, eggs: 0 },
      goat: { meat: 0, milk: 0 },
      sheep: { meat: 0, milk: 0 }
    }
  },
  { 
    name: "Black Quarter Vaccine", 
    strain: "Clostridium chauvoei (49)",
    species: ["cattle", "buffalo"],
    form: "25, 50, 100 doses",
    indication: "Black Quarter prevention",
    manufacturer: "IVRI approved",
    withdrawalPeriods: { 
      cattle: { meat: 0, milk: 0 },
      buffalo: { meat: 0, milk: 0 },
      pig: { meat: 0, milk: 0 }, 
      poultry: { meat: 0, eggs: 0 },
      goat: { meat: 0, milk: 0 },
      sheep: { meat: 0, milk: 0 }
    }
  },

  // POULTRY VACCINES
  { 
    name: "Newcastle Disease Vaccine (LaSota)", 
    strain: "LaSota, Lentogenic strain",
    species: ["poultry"],
    form: "200–2000 doses, freeze-dried pellets",
    indication: "Newcastle (Ranikhet) prevention",
    manufacturer: "IVRI approved",
    withdrawalPeriods: { 
      poultry: { meat: 0, eggs: 0 },
      cattle: { meat: 0, milk: 0 },
      pig: { meat: 0, milk: 0 }, 
      goat: { meat: 0, milk: 0 },
      sheep: { meat: 0, milk: 0 }
    }
  },
  { 
    name: "Newcastle Disease Vaccine (B1 strain)", 
    strain: "B1 strain, Live",
    species: ["poultry"],
    form: "Freeze-dried pellets, 1000-2000 doses",
    indication: "Newcastle disease prevention in chickens",
    manufacturer: "IVRI approved",
    withdrawalPeriods: { 
      poultry: { meat: 0, eggs: 0 },
      cattle: { meat: 0, milk: 0 },
      pig: { meat: 0, milk: 0 }, 
      goat: { meat: 0, milk: 0 },
      sheep: { meat: 0, milk: 0 }
    }
  },
  { 
    name: "Infectious Bursal Disease Vaccine (Lukert)", 
    strain: "Lukert strain",
    species: ["poultry"],
    form: "Live (oral, spray), 1000 doses",
    indication: "IBD/Gumboro disease prevention",
    manufacturer: "IVRI approved",
    withdrawalPeriods: { 
      poultry: { meat: 0, eggs: 0 },
      cattle: { meat: 0, milk: 0 },
      pig: { meat: 0, milk: 0 }, 
      goat: { meat: 0, milk: 0 },
      sheep: { meat: 0, milk: 0 }
    }
  },
  { 
    name: "Infectious Bursal Disease Vaccine (V217)", 
    strain: "V217 strain",
    species: ["poultry"],
    form: "Inactivated (oil emulsion), 500-1000 doses",
    indication: "IBD prevention in broilers and layers",
    manufacturer: "IVRI approved",
    withdrawalPeriods: { 
      poultry: { meat: 0, eggs: 0 },
      cattle: { meat: 0, milk: 0 },
      pig: { meat: 0, milk: 0 }, 
      goat: { meat: 0, milk: 0 },
      sheep: { meat: 0, milk: 0 }
    }
  },
  { 
    name: "Fowl Pox Vaccine", 
    strain: "IVRI modified strain",
    species: ["poultry"],
    form: "Freeze-dried (wing-web method), 500–1000 doses",
    indication: "Fowl pox prevention in chickens & turkeys",
    manufacturer: "IVRI",
    withdrawalPeriods: { 
      poultry: { meat: 0, eggs: 0 },
      cattle: { meat: 0, milk: 0 },
      pig: { meat: 0, milk: 0 }, 
      goat: { meat: 0, milk: 0 },
      sheep: { meat: 0, milk: 0 }
    }
  },
  { 
    name: "Coryza Vaccine", 
    strain: "Avibacterium paragallinarum (Serotypes A, B, C)",
    species: ["poultry"],
    form: "Inactivated, oil emulsion, 1000 doses",
    indication: "Infectious Coryza control in poultry",
    manufacturer: "IVRI approved",
    withdrawalPeriods: { 
      poultry: { meat: 0, eggs: 0 },
      cattle: { meat: 0, milk: 0 },
      pig: { meat: 0, milk: 0 }, 
      goat: { meat: 0, milk: 0 },
      sheep: { meat: 0, milk: 0 }
    }
  },
  { 
    name: "Marek's Disease Vaccine", 
    strain: "HVT, SB1, CVI988, FC126",
    species: ["poultry"],
    form: "Frozen or freeze-dried, 1000–2000 doses",
    indication: "Marek's prevention in day-old chicks",
    manufacturer: "IVRI approved",
    withdrawalPeriods: { 
      poultry: { meat: 0, eggs: 0 },
      cattle: { meat: 0, milk: 0 },
      pig: { meat: 0, milk: 0 }, 
      goat: { meat: 0, milk: 0 },
      sheep: { meat: 0, milk: 0 }
    }
  },

  // SWINE VACCINES
  { 
    name: "Classical Swine Fever Vaccine", 
    strain: "LOM strain",
    species: ["pig"],
    form: "Injection, 10–20 doses",
    indication: "Hog cholera prevention",
    manufacturer: "IVRI approved",
    withdrawalPeriods: { 
      pig: { meat: 0, milk: 0 },
      poultry: { meat: 0, eggs: 0 },
      cattle: { meat: 0, milk: 0 },
      goat: { meat: 0, milk: 0 },
      sheep: { meat: 0, milk: 0 }
    }
  },
  { 
    name: "Porcine Circovirus Vaccine (PCV2)", 
    strain: "Type 2, Killed Baculovirus Vector",
    species: ["pig"],
    form: "10 ml & 50 ml injection",
    indication: "Prevents lymphoid depletion & PCV2 infections",
    manufacturer: "IVRI approved",
    withdrawalPeriods: { 
      pig: { meat: 0, milk: 0 },
      poultry: { meat: 0, eggs: 0 },
      cattle: { meat: 0, milk: 0 },
      goat: { meat: 0, milk: 0 },
      sheep: { meat: 0, milk: 0 }
    }
  },
  { 
    name: "Mycoplasma Hyopneumoniae Vaccine (Mycoflex)", 
    strain: "Mycoplasma hyopneumoniae",
    species: ["pig"],
    form: "Suspension injection, 10–50 ml",
    indication: "Enzootic pneumonia control in pigs",
    manufacturer: "IVRI approved",
    withdrawalPeriods: { 
      pig: { meat: 0, milk: 0 },
      poultry: { meat: 0, eggs: 0 },
      cattle: { meat: 0, milk: 0 },
      goat: { meat: 0, milk: 0 },
      sheep: { meat: 0, milk: 0 }
    }
  },

  // EQUINE VACCINES
  { 
    name: "Equine Influenza Vaccine (Calvenza 03 EIV)", 
    strain: "Killed Virus, Calvenza 03 EIV",
    species: ["equine"],
    form: "Liquid injection, 20 ml",
    indication: "Respiratory disease reduction, safe for pregnant mares",
    manufacturer: "IVRI approved",
    withdrawalPeriods: { 
      equine: { meat: 0, milk: 0 },
      pig: { meat: 0, milk: 0 },
      poultry: { meat: 0, eggs: 0 },
      cattle: { meat: 0, milk: 0 },
      goat: { meat: 0, milk: 0 },
      sheep: { meat: 0, milk: 0 }
    }
  },

  // ADDITIONAL ANTIMICROBIALS (keeping some originals for treatment purposes)
  { 
    name: "Amoxicillin", 
    strain: "Broad-spectrum antibiotic",
    species: ["cattle", "pig", "poultry", "goat", "sheep"],
    form: "Injectable/Oral suspension",
    indication: "Bacterial infections",
    manufacturer: "Various",
    withdrawalPeriods: { 
      pig: { meat: 5, milk: 0 }, 
      poultry: { meat: 7, eggs: 0 },
      cattle: { meat: 14, milk: 72 },
      goat: { meat: 7, milk: 36 },
      sheep: { meat: 7, milk: 36 }
    }
  },
  { 
    name: "Oxytetracycline", 
    strain: "Tetracycline antibiotic",
    species: ["cattle", "pig", "poultry", "goat", "sheep"],
    form: "Injectable/Feed additive",
    indication: "Respiratory and digestive infections",
    manufacturer: "Various",
    withdrawalPeriods: { 
      pig: { meat: 21, milk: 0 }, 
      poultry: { meat: 5, eggs: 3 },
      cattle: { meat: 22, milk: 96 },
      goat: { meat: 15, milk: 72 },
      sheep: { meat: 15, milk: 72 }
    }
  },
  { 
    name: "Enrofloxacin", 
    strain: "Fluoroquinolone antibiotic",
    species: ["cattle", "pig", "poultry", "goat", "sheep"],
    form: "Injectable/Oral solution",
    indication: "Respiratory and urogenital infections",
    manufacturer: "Various",
    withdrawalPeriods: { 
      pig: { meat: 12, milk: 0 }, 
      poultry: { meat: 11, eggs: 8 },
      cattle: { meat: 14, milk: 48 },
      goat: { meat: 9, milk: 36 },
      sheep: { meat: 9, milk: 36 }
    }
  }
];

const treatmentPurposes = [
  "Bacterial Infection",
  "Respiratory Disease",
  "Digestive Disorder",
  "Skin Condition",
  "Prophylactic Treatment",
  "Vaccination",
  "Parasite Control",
  "Disease Prevention",
  "Other"
];

export function AMULoggingPage({ onNavigate, userName }: AMULoggingPageProps) {
  const [selectedAnimal, setSelectedAnimal] = useState<typeof mockAnimals[0] | null>(null);
  const [selectedDrug, setSelectedDrug] = useState("");
  const [dosage, setDosage] = useState("");
  const [dosageUnit, setDosageUnit] = useState("mg/kg");
  const [route, setRoute] = useState("");
  const [purpose, setPurpose] = useState("");
  const [administrationDate, setAdministrationDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [animalSearch, setAnimalSearch] = useState("");

  // Calculate withdrawal period and safe dates
  const getWithdrawalInfo = () => {
    if (!selectedAnimal || !selectedDrug) return null;
    
    const drug = vaccineDatabase.find(d => d.name === selectedDrug);
    if (!drug) return null;

    const species = selectedAnimal.species.toLowerCase();
    const withdrawalData = drug.withdrawalPeriods[species as keyof typeof drug.withdrawalPeriods];
    
    if (!withdrawalData) return null;

    const adminDate = new Date(administrationDate);
    const meatSafeDate = new Date(adminDate);
    meatSafeDate.setDate(meatSafeDate.getDate() + withdrawalData.meat);

    const milkSafeDate = withdrawalData.milk > 0 ? new Date(adminDate) : null;
    if (milkSafeDate) {
      milkSafeDate.setHours(milkSafeDate.getHours() + withdrawalData.milk);
    }

    return {
      meatDays: withdrawalData.meat,
      milkHours: withdrawalData.milk,
      meatSafeDate: meatSafeDate.toLocaleDateString('en-GB'),
      milkSafeDate: milkSafeDate ? milkSafeDate.toLocaleDateString('en-GB') : null
    };
  };

  const withdrawalInfo = getWithdrawalInfo();
  
  const filteredAnimals = mockAnimals.filter(animal => 
    animal.id.toLowerCase().includes(animalSearch.toLowerCase()) ||
    animal.species.toLowerCase().includes(animalSearch.toLowerCase())
  );

  // Get selected drug details
  const selectedDrugDetails = vaccineDatabase.find(d => d.name === selectedDrug);

  const handleSave = () => {
    // Here you would typically save to localStorage or send to backend
    const amuRecord = {
      id: Date.now(),
      animalId: selectedAnimal?.id,
      animalSpecies: selectedAnimal?.species,
      drug: selectedDrug,
      drugDetails: selectedDrugDetails,
      dosage: `${dosage} ${dosageUnit}`,
      route,
      purpose,
      administrationDate,
      withdrawalInfo,
      notes,
      reminderEnabled,
      vetName: userName,
      timestamp: new Date().toISOString()
    };

    // Save to localStorage (in a real app, this would go to a database)
    const existingRecords = JSON.parse(localStorage.getItem('amuRecords') || '[]');
    existingRecords.push(amuRecord);
    localStorage.setItem('amuRecords', JSON.stringify(existingRecords));

    // Navigate back to vet dashboard
    onNavigate('vet-dashboard');
  };

  const isFormValid = selectedAnimal && selectedDrug && dosage && route && purpose && administrationDate;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('vet-dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Pill className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Log Antimicrobial Usage & Vaccination</h1>
                <p className="text-sm text-muted-foreground">Record medication administration and vaccination for livestock</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Animal Details Section */}
        <Card className="shadow-lg">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Stethoscope className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-primary">Animal Details</h2>
            </div>

            <div className="space-y-4">
              {/* Animal Search and Select */}
              <div>
                <Label htmlFor="animal-search">Animal ID / Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="animal-search"
                    placeholder="Search by Animal ID or Species..."
                    value={animalSearch}
                    onChange={(e) => setAnimalSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Animal Selection */}
              <div>
                <Label>Select Animal</Label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {filteredAnimals.map((animal) => (
                    <div
                      key={animal.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedAnimal?.id === animal.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedAnimal(animal)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{animal.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {animal.species} • {animal.age} • {animal.weight}
                          </div>
                        </div>
                        <div className="text-2xl">
                          {animal.species.toLowerCase() === 'pig' ? '🐷' : 
                           animal.species.toLowerCase() === 'poultry' ? '🐔' :
                           animal.species.toLowerCase() === 'cattle' ? '🐄' :
                           animal.species.toLowerCase() === 'goat' ? '🐐' : '🐑'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Medicine/Vaccine Details Section */}
        <Card className="shadow-lg">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Pill className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-primary">Medicine & Vaccine Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drug/Vaccine Selection */}
              <div className="md:col-span-2">
                <Label htmlFor="drug-select">Drug/Vaccine Name</Label>
                <Select value={selectedDrug} onValueChange={setSelectedDrug}>
                  <SelectTrigger id="drug-select">
                    <SelectValue placeholder="Select antimicrobial drug or vaccine" />
                  </SelectTrigger>
                  <SelectContent>
                    {vaccineDatabase.map((drug) => (
                      <SelectItem key={drug.name} value={drug.name}>
                        <div>
                          <div className="font-medium">{drug.name}</div>
                          {drug.strain && (
                            <div className="text-xs text-muted-foreground">
                              {drug.strain}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Display selected drug details */}
              {selectedDrugDetails && (
                <div className="md:col-span-2 p-4 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-primary">Form:</span> {selectedDrugDetails.form}
                    </div>
                    <div>
                      <span className="font-medium text-primary">Manufacturer:</span> {selectedDrugDetails.manufacturer}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-primary">Indication:</span> {selectedDrugDetails.indication}
                    </div>
                  </div>
                </div>
              )}

              {/* Dosage */}
              <div>
                <Label htmlFor="dosage">Dosage</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="dosage"
                    placeholder="Enter dosage"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={dosageUnit} onValueChange={setDosageUnit}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mg/kg">mg/kg</SelectItem>
                      <SelectItem value="ml/kg">ml/kg</SelectItem>
                      <SelectItem value="IU/kg">IU/kg</SelectItem>
                      <SelectItem value="mg">mg</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="doses">doses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Administration Date */}
              <div>
                <Label htmlFor="admin-date">Date of Administration</Label>
                <Input
                  id="admin-date"
                  type="date"
                  value={administrationDate}
                  onChange={(e) => setAdministrationDate(e.target.value)}
                />
              </div>

              {/* Route of Administration */}
              <div className="md:col-span-2">
                <Label>Route of Administration</Label>
                <RadioGroup value={route} onValueChange={setRoute} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oral" id="oral" />
                    <Label htmlFor="oral">Oral</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="injection" id="injection" />
                    <Label htmlFor="injection">Injection (IM/IV/SC)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="feed" id="feed" />
                    <Label htmlFor="feed">Feed Additive</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="water" id="water" />
                    <Label htmlFor="water">Water Treatment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="topical" id="topical" />
                    <Label htmlFor="topical">Topical</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="spray" id="spray" />
                    <Label htmlFor="spray">Spray/Aerosol</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="wing-web" id="wing-web" />
                    <Label htmlFor="wing-web">Wing-web (Poultry)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Purpose of Treatment */}
              <div className="md:col-span-2">
                <Label htmlFor="purpose">Purpose of Treatment</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger id="purpose">
                    <SelectValue placeholder="Select treatment purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {treatmentPurposes.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>

        {/* Withdrawal Period Information */}
        {withdrawalInfo && (
          <Card className="shadow-lg border-l-4 border-l-orange-500">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-orange-800">Withdrawal Period</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <h3 className="font-medium text-orange-800">Meat Withdrawal</h3>
                  </div>
                  <p className="text-sm text-orange-700 mb-1">
                    Withdrawal Period: <strong>{withdrawalInfo.meatDays} days</strong>
                  </p>
                  <p className="text-sm text-orange-700">
                    Safe for consumption after: <strong>{withdrawalInfo.meatSafeDate}</strong>
                  </p>
                </div>

                {withdrawalInfo.milkHours > 0 && withdrawalInfo.milkSafeDate && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-blue-600" />
                      <h3 className="font-medium text-blue-800">Milk Withdrawal</h3>
                    </div>
                    <p className="text-sm text-blue-700 mb-1">
                      Withdrawal Period: <strong>{withdrawalInfo.milkHours} hours</strong>
                    </p>
                    <p className="text-sm text-blue-700">
                      Safe for consumption after: <strong>{withdrawalInfo.milkSafeDate}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Additional Options */}
        <Card className="shadow-lg">
          <div className="p-6">
            <div className="space-y-4">
              {/* Reminder Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <h3 className="font-medium text-foreground">Withdrawal Reminder</h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified before withdrawal period ends
                  </p>
                </div>
                <Switch
                  checked={reminderEnabled}
                  onCheckedChange={setReminderEnabled}
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes / Remarks (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional observations, symptoms, vaccine batch details, or remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 pb-8">
          <Button
            onClick={handleSave}
            disabled={!isFormValid}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="w-4 h-4 mr-2" />
            Save AMU Record
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate('vet-dashboard')}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        {/* Form Validation Status */}
        {!isFormValid && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Please fill in all required fields: Animal, Drug/Vaccine, Dosage, Route, Purpose, and Date
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}