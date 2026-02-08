import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, GraduationCap } from "lucide-react";
import Link from "next/link";

const stats = [
  { value: "5K+", label: "Active Learners", description: "Students actively learning and growing", circleBg: "bg-primary/20", textColor: "text-primary" },
  { value: "25+", label: "Free Courses", description: "Comprehensive courses covering modern tech", circleBg: "bg-secondary/20", textColor: "text-secondary" },
  { value: "4.8", label: "Average Rating", description: "Highly rated by our community", circleBg: "bg-green-500/20", textColor: "text-green-500" },
  { value: "100%", label: "Free to Start", description: "No credit card required", circleBg: "bg-purple-500/20", textColor: "text-purple-500" },
];

const steps = [
  { number: 1, title: "Pick a Course", description: "Choose a beginner-friendly course and enroll for free.", color: "bg-primary/20 text-primary" },
  { number: 2, title: "Learn by Doing", description: "Short lessons, videos, quizzes, and mini projects that unlock step-by-step.", color: "bg-secondary/20 text-secondary" },
  { number: 3, title: "Build Skills & Momentum", description: "Track progress and keep improving with new courses and tutorials.", color: "bg-green-500/20 text-green-500" },
];

export function WhyChooseUs() {
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-black text-white">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        {/* Badge + Title */}
        <div className="text-center mb-12 sm:mb-16">
          <Badge className="mb-6 text-sm px-5 py-2 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 font-google-sans">
            <Award className="h-4 w-4 mr-2" />
            Trusted by Learners Worldwide
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 font-google-sans">
            Why Choose CodeCraft Academy
          </h2>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto px-4 font-google-sans">
            Join thousands of learners who have already started their tech journey with us.
          </p>
        </div>

        {/* Stats Grid - 2x2 on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto mb-16 sm:mb-20">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full ${stat.circleBg} flex items-center justify-center`}>
                <span className={`text-lg sm:text-xl font-bold font-google-sans ${stat.textColor}`}>{stat.value}</span>
              </div>
              <h3 className="text-sm sm:text-base font-semibold mb-1 font-google-sans">{stat.label}</h3>
              <p className="text-xs sm:text-sm text-gray-400 font-google-sans">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* How Learning Works */}
        <div className="text-center mb-10 sm:mb-12">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-3 font-google-sans">
            How Learning Works
          </h3>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto font-google-sans">
            A simple flow that keeps you moving and building confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto mb-12">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 rounded-full ${step.color} flex items-center justify-center font-bold text-base sm:text-lg font-google-sans`}>
                {step.number}
              </div>
              <h4 className="text-base sm:text-lg font-semibold mb-2 font-google-sans">{step.title}</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-google-sans">{step.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" asChild className="h-12 px-8 text-base font-google-sans font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
            <Link href="/free-courses">
              <GraduationCap className="h-5 w-5 mr-2" />
              Start Learning Now
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

