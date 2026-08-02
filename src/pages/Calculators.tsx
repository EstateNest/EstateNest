import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";

const Calculators = () => {
  // Present Value Calculator State
  const [pvFutureValue, setPvFutureValue] = useState("");
  const [pvRate, setPvRate] = useState("");
  const [pvYears, setPvYears] = useState("");
  const [pvResult, setPvResult] = useState<number | null>(null);

  // Future Value Calculator State
  const [fvPresentValue, setFvPresentValue] = useState("");
  const [fvRate, setFvRate] = useState("");
  const [fvYears, setFvYears] = useState("");
  const [fvResult, setFvResult] = useState<number | null>(null);

  // Insurance Needs Calculator State
  const [annualIncome, setAnnualIncome] = useState("");
  const [yearsOfIncome, setYearsOfIncome] = useState("");
  const [debts, setDebts] = useState("");
  const [existingCoverage, setExistingCoverage] = useState("");
  const [insuranceNeed, setInsuranceNeed] = useState<number | null>(null);

  const calculatePV = () => {
    const fv = parseFloat(pvFutureValue);
    const r = parseFloat(pvRate) / 100;
    const n = parseFloat(pvYears);

    if (fv && r && n) {
      const pv = fv / Math.pow(1 + r, n);
      setPvResult(pv);
    }
  };

  const calculateFV = () => {
    const pv = parseFloat(fvPresentValue);
    const r = parseFloat(fvRate) / 100;
    const n = parseFloat(fvYears);

    if (pv && r && n) {
      const fv = pv * Math.pow(1 + r, n);
      setFvResult(fv);
    }
  };

  const calculateInsuranceNeed = () => {
    const income = parseFloat(annualIncome);
    const years = parseFloat(yearsOfIncome);
    const debt = parseFloat(debts) || 0;
    const existing = parseFloat(existingCoverage) || 0;

    if (income && years) {
      const totalNeed = income * years + debt - existing;
      setInsuranceNeed(Math.max(0, totalNeed));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle font-[Inter]">
      <Navigation />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Financial{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Calculators
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Plan your financial future with our interactive tools
            </p>
          </div>

          <Tabs defaultValue="insurance" className="animate-scale-in">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-8">
              <TabsTrigger value="insurance" className="flex items-center space-x-2">
                <Calculator className="w-4 h-4" />
                <span>Insurance Needs</span>
              </TabsTrigger>
              <TabsTrigger value="present" className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Present Value</span>
              </TabsTrigger>
              <TabsTrigger value="future" className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Future Value</span>
              </TabsTrigger>
            </TabsList>

            {/* Insurance Needs Calculator */}
            <TabsContent value="insurance">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-2xl">Life Insurance Needs Calculator</CardTitle>
                  <CardDescription>
                    Estimate how much life insurance coverage your family needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="annualIncome">Annual Income</Label>
                      <Input
                        id="annualIncome"
                        type="number"
                        value={annualIncome}
                        onChange={(e) => setAnnualIncome(e.target.value)}
                        placeholder="e.g., 80000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearsOfIncome">Years of Income to Replace</Label>
                      <Input
                        id="yearsOfIncome"
                        type="number"
                        value={yearsOfIncome}
                        onChange={(e) => setYearsOfIncome(e.target.value)}
                        placeholder="e.g., 10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="debts">Outstanding Debts (Optional)</Label>
                      <Input
                        id="debts"
                        type="number"
                        value={debts}
                        onChange={(e) => setDebts(e.target.value)}
                        placeholder="e.g., 300000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="existingCoverage">Existing Coverage (Optional)</Label>
                      <Input
                        id="existingCoverage"
                        type="number"
                        value={existingCoverage}
                        onChange={(e) => setExistingCoverage(e.target.value)}
                        placeholder="e.g., 100000"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={calculateInsuranceNeed}
                    className="w-full bg-gradient-accent hover:shadow-glow"
                    size="lg"
                  >
                    Calculate Insurance Need
                  </Button>

                  {insuranceNeed !== null && (
                    <div className="p-6 bg-gradient-primary text-primary-foreground rounded-xl text-center animate-scale-in">
                      <div className="text-sm mb-2">Recommended Coverage</div>
                      <div className="text-4xl font-bold">{formatCurrency(insuranceNeed)}</div>
                      <div className="mt-4 text-sm text-primary-foreground/80">
                        This is an estimate. Actual needs may vary based on your specific situation.
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                    <strong>Note:</strong> This calculator provides a basic estimate. For a comprehensive analysis of your insurance needs, please contact our advisors for a personalized consultation.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Present Value Calculator */}
            <TabsContent value="present">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-2xl">Present Value Calculator</CardTitle>
                  <CardDescription>
                    Calculate what a future sum of money is worth today
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pvFutureValue">Future Value ($)</Label>
                      <Input
                        id="pvFutureValue"
                        type="number"
                        value={pvFutureValue}
                        onChange={(e) => setPvFutureValue(e.target.value)}
                        placeholder="e.g., 100000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pvRate">Annual Interest Rate (%)</Label>
                      <Input
                        id="pvRate"
                        type="number"
                        step="0.1"
                        value={pvRate}
                        onChange={(e) => setPvRate(e.target.value)}
                        placeholder="e.g., 5.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pvYears">Number of Years</Label>
                      <Input
                        id="pvYears"
                        type="number"
                        value={pvYears}
                        onChange={(e) => setPvYears(e.target.value)}
                        placeholder="e.g., 10"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={calculatePV}
                    className="w-full bg-gradient-accent hover:shadow-glow"
                    size="lg"
                  >
                    Calculate Present Value
                  </Button>

                  {pvResult !== null && (
                    <div className="p-6 bg-gradient-primary text-primary-foreground rounded-xl text-center animate-scale-in">
                      <div className="text-sm mb-2">Present Value</div>
                      <div className="text-4xl font-bold">{formatCurrency(pvResult)}</div>
                      <div className="mt-4 text-sm text-primary-foreground/80">
                        To receive {formatCurrency(parseFloat(pvFutureValue))} in {pvYears} years at {pvRate}% interest, you need to invest {formatCurrency(pvResult)} today.
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                    <strong>Formula:</strong> PV = FV / (1 + r)^n, where FV is future value, r is interest rate, and n is number of periods.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Future Value Calculator */}
            <TabsContent value="future">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-2xl">Future Value Calculator</CardTitle>
                  <CardDescription>
                    Calculate what your investment will be worth in the future
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fvPresentValue">Present Value ($)</Label>
                      <Input
                        id="fvPresentValue"
                        type="number"
                        value={fvPresentValue}
                        onChange={(e) => setFvPresentValue(e.target.value)}
                        placeholder="e.g., 50000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fvRate">Annual Interest Rate (%)</Label>
                      <Input
                        id="fvRate"
                        type="number"
                        step="0.1"
                        value={fvRate}
                        onChange={(e) => setFvRate(e.target.value)}
                        placeholder="e.g., 6.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fvYears">Number of Years</Label>
                      <Input
                        id="fvYears"
                        type="number"
                        value={fvYears}
                        onChange={(e) => setFvYears(e.target.value)}
                        placeholder="e.g., 15"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={calculateFV}
                    className="w-full bg-gradient-accent hover:shadow-glow"
                    size="lg"
                  >
                    Calculate Future Value
                  </Button>

                  {fvResult !== null && (
                    <div className="p-6 bg-gradient-primary text-primary-foreground rounded-xl text-center animate-scale-in">
                      <div className="text-sm mb-2">Future Value</div>
                      <div className="text-4xl font-bold">{formatCurrency(fvResult)}</div>
                      <div className="mt-4 text-sm text-primary-foreground/80">
                        If you invest {formatCurrency(parseFloat(fvPresentValue))} today at {fvRate}% interest for {fvYears} years, you'll have {formatCurrency(fvResult)}.
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                    <strong>Formula:</strong> FV = PV × (1 + r)^n, where PV is present value, r is interest rate, and n is number of periods.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* CTA */}
          <div className="mt-12 text-center space-y-4 animate-fade-in-up">
            <p className="text-lg text-muted-foreground">
              Need help planning your financial future?
            </p>
            <Button size="lg" className="bg-gradient-accent hover:shadow-glow">
              Schedule Free Consultation
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Calculators;
