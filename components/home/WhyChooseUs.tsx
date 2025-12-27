import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Code, 
  Users
} from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Free Short Courses",
    description: "Structured lessons designed for busy learners — learn fast, stay consistent, and build real momentum.",
  },
  {
    icon: <Code className="h-6 w-6" />,
    title: "Practical, Real Examples",
    description: "Hands-on explanations and code you can copy, run, and understand — focused on skills that matter.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Built for Beginners",
    description: "Clear steps, simple language, and guided progression — perfect if you’re not sure where to start.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4">
            Why Choose CodeCraft Academy?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Learn tech the practical way with short courses, clear guidance, and a growing knowledge base that supports your journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-border hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
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

