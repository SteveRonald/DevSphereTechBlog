import { Sidebar } from "@/components/blog/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Github, Twitter, Linkedin, Code, BookOpen, Zap, Target, Users, TrendingUp } from "lucide-react";

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
    { label: "Articles Published", value: "100+", icon: BookOpen},
    { label: "Active Readers", value: "10K+", icon: Users },
    { label: "Categories", value: "15+", icon: Code },
  ];

  const values = [
    {
      icon: Code,
      title: "Practical Learning",
      description: "Real-world examples and hands-on tutorials you can apply immediately.",
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
      <div className="relative bg-gradient-to-br from-primary/20 via-background to-background py-20 md:py-32 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-1.5">
              <Target className="h-3 w-3 mr-2" />
              About Us
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                About CodeCraft Academy
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              We are a community of developers dedicated to mastering modern tech skills through practical tutorials and in-depth reviews.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section with Icons */}
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="text-center border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-8 pb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
          <div className="lg:col-span-8 space-y-16">
            {/* Mission Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 bg-primary"></div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Our Mission</h2>
              </div>
              <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  The tech landscape is evolving faster than ever. At <strong className="text-foreground">CodeCraft Academy</strong>, our mission is to cut through the noise and provide high-quality, actionable educational content that helps you advance your career.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Whether you're just starting with HTML & CSS or you're an experienced engineer looking to integrate LLMs into your applications, we have resources for you.
                </p>
              </div>
            </section>

            {/* What We Cover */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 bg-primary"></div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">What We Cover</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {topics.map((topic) => {
                  const Icon = topic.icon;
                  return (
                    <Card key={topic.title} className={`bg-gradient-to-br ${topic.gradient} border-2 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-background/50">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2">{topic.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
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
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 bg-primary"></div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Our Values</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {values.map((value) => {
                  const Icon = value.icon;
                  return (
                    <Card key={value.title} className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className={`p-4 rounded-full bg-primary/10 ${value.color}`}>
                            <Icon className="h-8 w-8" />
                          </div>
                          <h3 className="font-bold text-lg">{value.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
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
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 bg-primary"></div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Meet the Team</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {team.map((member) => (
                  <Card key={member.name} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                    <CardContent className="p-8">
                      <div className="flex flex-col items-center text-center space-y-6">
                        <div className="relative">
                          <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-lg">
                            <AvatarImage src={member.avatar} className="object-cover" />
                            <AvatarFallback className="text-3xl bg-primary/10">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full border-4 border-background"></div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-bold text-2xl">{member.name}</h3>
                          <Badge variant="secondary" className="text-sm px-4 py-1">
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                          {member.bio}
                        </p>
                        <div className="flex gap-3 pt-2">
                          <a 
                            href={member.social.twitter} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            aria-label={`${member.name} on Twitter`}
                            className="p-3 rounded-full hover:bg-accent transition-colors border border-border hover:border-primary"
                          >
                            <Twitter className="h-5 w-5" />
                          </a>
                          <a 
                            href={member.social.github} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            aria-label={`${member.name} on GitHub`}
                            className="p-3 rounded-full hover:bg-accent transition-colors border border-border hover:border-primary"
                          >
                            <Github className="h-5 w-5" />
                          </a>
                          <a 
                            href={member.social.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            aria-label={`${member.name} on LinkedIn`}
                            className="p-3 rounded-full hover:bg-accent transition-colors border border-border hover:border-primary"
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
          </div>
          
          <aside className="lg:col-span-4">
            <Sidebar />
          </aside>
        </div>
      </div>
    </>
  );
}
