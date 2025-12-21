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
    title: "Free Courses",
    description: "Learn by doing with real-world projects and hands-on examples that you can immediately apply to your work.",
  },
  {
    icon: <Code className="h-6 w-6" />,
    title: "Quality Code Examples",
    description: "Clean, well-documented code snippets and examples that follow industry best practices and modern standards.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Expert Community",
    description: "Join a community of developers sharing knowledge, asking questions, and growing together in their careers.",
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
            We're committed to helping developers succeed with practical, high-quality content and a supportive community.
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

