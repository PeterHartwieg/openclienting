import { Search, PenLine, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    icon: Search,
    title: "Browse Real Problems",
    description:
      "Explore validated business challenges from SMEs across industries, complete with requirements and success criteria.",
  },
  {
    icon: PenLine,
    title: "Contribute Solutions",
    description:
      "Submit problem templates, add requirements, propose pilot frameworks, and share your domain expertise.",
  },
  {
    icon: Rocket,
    title: "Pilot Together",
    description:
      "Use structured pilot playbooks to test solutions. Report success stories and help the community learn.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-h2 font-semibold tracking-tight leading-heading">
            How It Works
          </h2>
          <p className="mt-3 text-muted-foreground">
            From problem discovery to successful pilots — in three steps.
          </p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Card
              key={step.title}
              className="relative border-t-2 border-t-primary/60 bg-card transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-3 text-lg">
                  <span className="text-muted-foreground mr-2">
                    {i + 1}.
                  </span>
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
