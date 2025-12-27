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
    content: "The step-by-step course flow is what I needed. Short lessons, clear explanations, and the progress tracking kept me consistent.",
    rating: 5,
  },
  {
    id: "2",
    name: "Edwin Nyang'",
    role: "Data Analyst",
    company: "Kisumu",
    content: "Finally a beginner-friendly platform that doesn’t waste time. The courses are straight to the point and the examples are easy to follow.",
    rating: 5,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    role: "Software Engineer",
    company: "Moi University",
    content: "I like that the blog supports the courses. I read a quick article, then jump into a course lesson and actually apply it.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-3 sm:mb-4">
            What Learners Say
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            A beginner-first learning experience built around short courses and practical lessons.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="h-full flex flex-col border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 sm:p-6 flex flex-col flex-1">
                {/* Rating */}
                <div className="flex gap-1 mb-3 sm:mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 flex-1 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                    {testimonial.image ? (
                      <AvatarImage src={testimonial.image} alt={testimonial.name} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-semibold text-xs sm:text-sm">{testimonial.name}</p>
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

