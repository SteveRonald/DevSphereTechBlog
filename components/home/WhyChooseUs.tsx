import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Code, 
  Users,
  Rocket,
  DollarSign
} from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Users className="h-6 w-6" />,
    title: "Beginner-friendly",
    description: "Clear steps from zero",
  },
  {
    icon: <Rocket className="h-6 w-6" />,
    title: "Short and practical",
    description: "Learn in minutes",
  },
  {
    icon: <Code className="h-6 w-6" />,
    title: "Project-based",
    description: "Build real skills",
  },
  {
    icon: <DollarSign className="h-6 w-6" />,
    title: "Free to start",
    description: "No paywalls",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-3 sm:mb-4">
            Why Choose CodeCraft Academy?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            Learn tech the practical way with short courses, clear guidance, and a growing knowledge base that supports your journey.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
              <CardHeader className="p-5 sm:p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    {feature.icon}
                  </div>
                </div>
                <CardTitle className="text-base sm:text-lg text-center">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 pt-0">
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

