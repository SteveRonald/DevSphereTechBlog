import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  image?: string;
  content: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Full Stack Developer",
    company: "TechCorp",
    content: "CodeCraft Academy transformed my understanding of modern web development. The tutorials are practical, well-structured, and actually applicable to real projects. I've implemented several techniques in my current role!",
    rating: 5,
  },
  {
    id: "2",
    name: "Edwin Nyang'",
    role: "Data Analyst",
    company: "Kisumu",
    content: "The best resource I've found for staying updated with React and Next.js. The code examples are clean, the explanations are clear, and the community is supportive. Highly recommend!",
    rating: 5,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    role: "Software Engineer",
    company: "Moi University",
    content: "As someone transitioning from backend to full-stack, CodeCraft Academy made the learning curve much smoother. The tutorials break down complex concepts into digestible pieces.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-12 md:py-20 bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4">
            What People Say About Us
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of developers who are advancing their careers with CodeCraft Academy
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="h-full flex flex-col border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col flex-1">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="text-muted-foreground mb-6 flex-1 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Avatar className="h-10 w-10">
                    {testimonial.image ? (
                      <AvatarImage src={testimonial.image} alt={testimonial.name} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role}
                      {testimonial.company && ` • ${testimonial.company}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

