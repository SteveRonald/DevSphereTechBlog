import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github, Twitter, Linkedin, Code, Zap, Heart, Users, Rocket, GraduationCap, User } from "lucide-react";
import Link from "next/link";

export default function About() {
  const team = [
    {
      name: "Steve Ronald",
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

  const values = [
    {
      icon: Code,
      title: "Simply rewarding",
      description: "A trusted place for developers to grow, with support to stay consistent and keep learning.",
    },
    {
      icon: Zap,
      title: "The easy experience",
      description: "Everything you need in one place, making it easy to discover, create, and learn more.",
    },
    {
      icon: Users,
      title: "You do you",
      description: "An all-inclusive, free, safe space where you have 100% control of your learning path.",
    },
    {
      icon: Rocket,
      title: "At your pace",
      description: "No forced deadlines. Learn at your own pace, revisit content, and track your progress.",
    },
  ];

  return (
    <>
      {/* Hero Section - Ko-fi inspired left-aligned bold heading */}
      <section className="bg-gradient-to-br from-primary/15 via-background to-background border-b border-border overflow-hidden">
        <div className="container max-w-4xl mx-auto px-4 md:px-6 py-16 sm:py-20 md:py-28">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 font-google-sans animate-[fadeInUp_0.6s_ease-out_both]">
            <span className="inline-block animate-[fadeInUp_0.6s_ease-out_both]">Learn </span>
            <span className="inline-block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-[fadeInUp_0.6s_ease-out_0.15s_both]">Modern Tech,</span>
            <br className="hidden sm:block" />
            <span className="inline-block animate-[fadeInUp_0.6s_ease-out_0.3s_both]">Build </span>
            <span className="inline-block bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent animate-[fadeInUp_0.6s_ease-out_0.45s_both]">Real Skills</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed font-google-sans animate-[fadeInUp_0.8s_ease-out_0.6s_both]">
            CodeCraft Academy is a learning platform offering free and affordable courses for everyone — from complete beginners to experienced professionals looking to level up.
          </p>
        </div>
      </section>

      {/* Story Section - long-form like Ko-fi */}
      <section className="container max-w-3xl mx-auto px-4 md:px-6 py-14 sm:py-18 md:py-20">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            <AvatarImage src="https://github.com/SteveRonald.png" className="object-cover" />
            <AvatarFallback className="bg-primary/10 font-google-sans font-bold">SR</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold font-google-sans">Hi, I&apos;m Steve Ronald.</p>
            <p className="text-sm text-muted-foreground font-google-sans">Founder of CodeCraft Academy</p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-google-sans">
            I often get asked, <em>&ldquo;Where did the idea for CodeCraft Academy come from?&rdquo;</em> So, I wanted to share the story with you.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-google-sans">
            After years working as a developer, I noticed something frustrating: quality learning resources were either locked behind paywalls or scattered across dozens of platforms. Beginners had no clear path, and experienced devs had no single place to stay current.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-google-sans">
            So I built CodeCraft Academy — an accessible platform where anyone can learn web development, AI engineering, and career skills through practical, project-based content. Most of our courses are free, and even our premium content is priced affordably. No fluff. Just real skills.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-google-sans">
            Today, CodeCraft Academy serves <strong className="text-foreground">5,000+ active learners</strong> with <strong className="text-foreground">25+ courses</strong> and a growing library of tutorials, reviews, and career resources. And we&apos;re just getting started.
          </p>
        </div>

        {/* Inline quote */}
        <div className="my-10 sm:my-14 border-l-4 border-primary pl-6 py-2">
          <p className="text-lg sm:text-xl italic text-foreground leading-relaxed font-google-sans">
            &ldquo;The career listings on CodeCraft Academy connected me with opportunities I wouldn&apos;t have found elsewhere. I landed my first dev role within weeks of applying.&rdquo;
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground font-google-sans">Community Member</p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-google-sans !mt-0">Staying true to our roots</h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-google-sans">
            Our focus is, and always will be, on <strong className="text-foreground">developers</strong>. Every decision we make — from the courses we create to the tools we review — is guided by what helps you learn faster and build better.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-google-sans">
            We&apos;ve made a conscious decision to stay independent. We keep our priorities where they belong — on learners and their experience. We&apos;re always iterating, always listening, always striving to be the best learning platform for developers.
          </p>
        </div>

        {/* Second quote */}
        <div className="my-10 sm:my-14 border-l-4 border-secondary pl-6 py-2">
          <p className="text-lg sm:text-xl italic text-foreground leading-relaxed font-google-sans">
            &ldquo;The courses are practical, the community is supportive, and the career resources actually helped me grow. Best learning platform I&apos;ve found.&rdquo;
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-secondary" />
            </div>
            <p className="text-sm text-muted-foreground font-google-sans">Community Member</p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-google-sans">
            Thank you for being here. Your curiosity and passion are what keep us going. Thank you for being a part of this story.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-google-sans">
            Together, we&apos;re building a community where every developer can learn, grow, and succeed.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground font-google-sans">
            Here&apos;s to creating, sharing, and supporting each other.
          </p>
          <p className="text-base sm:text-lg font-semibold text-foreground font-google-sans">
            Steve and the CodeCraft Academy Team
          </p>
        </div>
      </section>

      {/* Our Values - 2x2 grid like Ko-fi */}
      <section className="border-t border-border bg-muted/30">
        <div className="container max-w-4xl mx-auto px-4 md:px-6 py-14 sm:py-18 md:py-20">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 font-google-sans">Our values</h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto font-google-sans">
              Our values are what guide us every day. From the features we build to the way we support our community, the below is what inspires us.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold font-google-sans">{value.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-google-sans">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="border-t border-border">
        <div className="container max-w-4xl mx-auto px-4 md:px-6 py-14 sm:py-18 md:py-20">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 font-google-sans">Meet the Team</h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto font-google-sans">
              The people behind CodeCraft Academy who are passionate about making tech education accessible to everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
            {team.map((member) => (
              <Card key={member.name} className="border border-border/50 bg-card/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col items-center text-center space-y-5">
                    <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-xl">
                      <AvatarImage src={member.avatar} className="object-cover" />
                      <AvatarFallback className="text-xl bg-primary/10 font-google-sans font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg font-google-sans">{member.name}</h3>
                      <Badge variant="secondary" className="mt-2 text-sm px-4 py-1 font-google-sans">
                        {member.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed font-google-sans">
                      {member.bio}
                    </p>
                    <div className="flex gap-3">
                      <a href={member.social.twitter} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on Twitter`}
                        className="p-2.5 rounded-full hover:bg-accent transition-all duration-200 border border-border hover:border-primary">
                        <Twitter className="h-4 w-4" />
                      </a>
                      <a href={member.social.github} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on GitHub`}
                        className="p-2.5 rounded-full hover:bg-accent transition-all duration-200 border border-border hover:border-primary">
                        <Github className="h-4 w-4" />
                      </a>
                      <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on LinkedIn`}
                        className="p-2.5 rounded-full hover:bg-accent transition-all duration-200 border border-border hover:border-primary">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Ko-fi inspired */}
      <section className="border-t border-border bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container max-w-3xl mx-auto px-4 md:px-6 py-16 sm:py-20 md:py-24 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 font-google-sans">
            Sound like something you want to be part of?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed font-google-sans">
            CodeCraft Academy is here to help you learn, grow, and build real skills. Join thousands of developers already on this journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild className="h-12 px-8 text-base font-google-sans font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              <Link href="/free-courses">
                <GraduationCap className="h-5 w-5 mr-2" />
                Start Learning
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base font-google-sans font-semibold border-2 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
              <Link href="/donate">
                <Heart className="h-5 w-5 mr-2" />
                Support Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
