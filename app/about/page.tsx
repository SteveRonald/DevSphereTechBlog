import { SidebarMinimal } from "@/components/blog/SidebarMinimal";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github, Twitter, Linkedin, Code, BookOpen, Zap, Target, Users, TrendingUp, Rocket, GraduationCap } from "lucide-react";
import Link from "next/link";

export default function About() {
  const team = [
    {
      name:"Steve Ronald",
      role: "Founder & Lead Editor",
      bio: "10+ years of full-stack development experience. Passionate about teaching modern web technologies and helping developers level up their skills.",
      avatar: "https://github.com/SteveRonald.png",
      social: {
        twitter: "https://twitter.com/Stevegmail98",
        github: "https://github.com/SteveRonald",
        linkedin: "https://www.linkedin.com/in/steve-ronald-432775255"
      }
    },
    {
      name: "Diana Odindo",
      role: "AI Specialist",
      bio: "Machine Learning engineer focused on making AI accessible to web developers. Expert in LLM integration and vector databases.",
      avatar: "https://api.dicebear.com/8.x/lorelei/svg?seed=DianaOdindo&flip=true&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf",
      social: {
        twitter: "https://twitter.com",
        github: "https://github.com",
        linkedin: "https://linkedin.com"
      }
    }
  ];

  const stats = [
    { label: "Articles Published", value: "50+", icon: BookOpen},
    { label: "Active Readers", value: "5K+", icon: Users },
    { label: "Categories", value: "8+", icon: Code },
  ];

  const values = [
    {
      icon: Code,
      title: "Practical Learning",
      description: "Real-world examples and hands-on free courses you can apply immediately.",
      color: "text-blue-500"
    },
    {
      icon: BookOpen,
      title: "In-Depth Content",
      description: "Comprehensive guides that go beyond surface-level explanations.",
      color: "text-purple-500"
    },
    {
      icon: Zap,
      title: "Stay Current",
      description: "Always up-to-date with the latest technologies and best practices.",
      color: "text-yellow-500"
    }
  ];

  const topics = [
    {
      title: "Web Development",
      description: "React, Next.js, TypeScript, Tailwind CSS, and modern frontend frameworks",
      icon: Code,
      gradient: "from-blue-500/10 to-blue-600/5"
    },
    {
      title: "AI Engineering",
      description: "OpenAI API, LangChain, Vector Databases, and AI integration patterns",
      icon: Zap,
      gradient: "from-purple-500/10 to-purple-600/5"
    },
    {
      title: "Productivity",
      description: "Developer tools, VS Code setups, workflows, and best practices",
      icon: Target,
      gradient: "from-green-500/10 to-green-600/5"
    },
    {
      title: "Career Growth",
      description: "Interview prep, portfolio building, and professional development",
      icon: TrendingUp,
      gradient: "from-orange-500/10 to-orange-600/5"
    }
  ];

  return (
    <>
      {/* Hero Section with Animation */}
      <div className="relative bg-gradient-to-br from-primary/20 via-background to-background py-16 sm:py-20 md:py-24 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container max-w-6xl mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-6 text-sm px-6 py-2.5 font-google-sans font-medium shadow-lg">
              <Target className="h-4 w-4 mr-2" />
              About Us
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent font-google-sans">
                About CodeCraft Academy
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-4 font-google-sans">
              We are a community of developers dedicated to mastering modern tech skills through free courses and in-depth reviews.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="container max-w-7xl mx-auto px-4 md:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="text-center border-2 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-105 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-8 pb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 rounded-2xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors duration-300">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
                  </div>
                  <div className="text-4xl font-bold text-primary mb-2 font-google-sans">{stat.value}</div>
                  <div className="text-base font-medium text-muted-foreground font-google-sans">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <section className="container max-w-7xl mx-auto px-4 md:px-6 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12">
          <div className="lg:col-span-8 space-y-16">
            {/* Mission Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight font-google-sans">Our Mission</h2>
              </div>
              <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <p className="text-lg text-muted-foreground leading-relaxed font-google-sans">
                  The tech landscape is evolving faster than ever. At <strong className="text-foreground">CodeCraft Academy</strong>, our mission is to cut through the noise and provide high-quality, actionable educational content that helps you advance your career.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed font-google-sans">
                  Whether you're just starting with HTML & CSS or you're an experienced engineer looking to integrate LLMs into your applications, we have resources for you.
                </p>
              </div>
            </section>

            {/* What We Cover */}
            <section className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight font-google-sans">What We Cover</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {topics.map((topic) => {
                  const Icon = topic.icon;
                  return (
                    <Card key={topic.title} className={`bg-gradient-to-br ${topic.gradient} border-2 border-border/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.03] hover:border-primary/30 bg-card/50 backdrop-blur-sm`}>
                      <CardContent className="pt-8">
                        <div className="flex items-start gap-6">
                          <div className="p-4 rounded-2xl bg-background/70 hover:bg-primary/10 transition-colors duration-300">
                            <Icon className="h-8 w-8 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2 font-google-sans">{topic.title}</h3>
                            <p className="text-base text-muted-foreground leading-relaxed font-google-sans">
                              {topic.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Values */}
            <section className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight font-google-sans">Our Values</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {values.map((value) => {
                  const Icon = value.icon;
                  return (
                    <Card key={value.title} className="border-2 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-105 bg-card/50 backdrop-blur-sm">
                      <CardContent className="pt-8">
                        <div className="flex flex-col items-center text-center space-y-6">
                          <div className={`p-5 rounded-2xl bg-primary/10 ${value.color} hover:bg-primary/20 transition-colors duration-300`}>
                            <Icon className="h-8 w-8" />
                          </div>
                          <h3 className="font-bold text-lg font-google-sans">{value.title}</h3>
                          <p className="text-base text-muted-foreground leading-relaxed font-google-sans">
                            {value.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Team Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight font-google-sans">Meet the Team</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-10">
                {team.map((member) => (
                  <Card key={member.name} className="overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-105 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-8">
                      <div className="flex flex-col items-center text-center space-y-8">
                        <div className="relative">
                          <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-2xl">
                            <AvatarImage src={member.avatar} className="object-cover" />
                            <AvatarFallback className="text-2xl bg-primary/10 font-google-sans font-bold">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-primary rounded-full border-4 border-background shadow-lg"></div>
                        </div>
                        <div className="space-y-4">
                          <h3 className="font-bold text-xl font-google-sans">{member.name}</h3>
                          <Badge variant="secondary" className="text-base px-6 py-2 font-google-sans font-medium">
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-base text-muted-foreground max-w-md leading-relaxed font-google-sans">
                          {member.bio}
                        </p>
                        <div className="flex gap-4 pt-4">
                          <a 
                            href={member.social.twitter} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            aria-label={`${member.name} on Twitter`}
                            className="p-3 rounded-full hover:bg-accent transition-all duration-300 border border-border hover:border-primary hover:scale-110"
                          >
                            <Twitter className="h-5 w-5" />
                          </a>
                          <a 
                            href={member.social.github} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            aria-label={`${member.name} on GitHub`}
                            className="p-3 rounded-full hover:bg-accent transition-all duration-300 border border-border hover:border-primary hover:scale-110"
                          >
                            <Github className="h-5 w-5" />
                          </a>
                          <a 
                            href={member.social.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            aria-label={`${member.name} on LinkedIn`}
                            className="p-3 rounded-full hover:bg-accent transition-all duration-300 border border-border hover:border-primary hover:scale-110"
                          >
                            <Linkedin className="h-5 w-5" />
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Call to Action Section */}
            <section className="mt-20">
              <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-secondary/10 backdrop-blur-sm">
                <CardContent className="p-12 md:p-16 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                    <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent font-google-sans">
                    Ready to Level Up Your Skills?
                  </h2>
                  <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed font-google-sans">
                    Join thousands of developers learning modern web development, AI engineering, and career skills through our free courses and in-depth tutorials.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                    <Button size="lg" asChild className="w-full sm:w-auto min-w-[250px] h-14 text-base font-google-sans font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <Link href="/free-courses">
                        <GraduationCap className="h-6 w-6 mr-3" />
                        Browse Free Courses
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="w-full sm:w-auto min-w-[250px] h-14 text-base font-google-sans font-semibold border-2 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
                      <Link href="/blog">
                        <BookOpen className="h-6 w-6 mr-3" />
                        Read Our Blog
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-12 pt-12 border-t border-border/50">
                    <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
                      <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-primary mb-2 font-google-sans">50+</div>
                        <div className="text-sm md:text-base text-muted-foreground font-google-sans">Articles</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-primary mb-2 font-google-sans">5K+</div>
                        <div className="text-sm md:text-base text-muted-foreground font-google-sans">Readers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-primary mb-2 font-google-sans">Free</div>
                        <div className="text-sm md:text-base text-muted-foreground font-google-sans">Always</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
          
          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <SidebarMinimal />
          </aside>
        </div>
      </section>
    </>
  );
}
