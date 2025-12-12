import { Layout } from "@/components/layout/Layout";
import { Sidebar } from "@/components/blog/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function About() {
  const team = [
    {
      name: "Alex Dev",
      role: "Founder & Lead Editor",
      bio: "10+ years of full-stack development experience. Passionate about teaching modern web technologies.",
      avatar: "https://github.com/shadcn.png"
    },
    {
      name: "Sarah Code",
      role: "AI Specialist",
      bio: "Machine Learning engineer focused on making AI accessible to web developers.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop"
    }
  ];

  return (
    <Layout>
      <div className="bg-muted/30 py-12 border-b border-border">
        <div className="container px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">About CodeCraft Academy</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            We are a community of developers dedicated to mastering modern tech skills through practical tutorials and in-depth reviews.
          </p>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <div className="prose prose-slate dark:prose-invert max-w-none mb-12">
              <h2>Our Mission</h2>
              <p>
                The tech landscape is evolving faster than ever. At CodeCraft Academy, our mission is to cut through the noise and provide high-quality, actionable educational content that helps you advance your career.
              </p>
              <p>
                Whether you're just starting with HTML & CSS or you're an experienced engineer looking to integrate LLMs into your applications, we have resources for you.
              </p>

              <h2>What We Cover</h2>
              <ul>
                <li><strong>Web Development:</strong> React, Next.js, TypeScript, Tailwind CSS</li>
                <li><strong>AI Engineering:</strong> OpenAI API, LangChain, Vector Databases</li>
                <li><strong>Productivity:</strong> Developer tools, VS Code setups, workflows</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold tracking-tight mb-6">Meet the Team</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {team.map((member) => (
                <Card key={member.name} className="overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4 border-2 border-primary/20">
                      <AvatarImage src={member.avatar} className="object-cover" />
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-lg">{member.name}</h3>
                    <p className="text-sm text-primary font-medium mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.bio}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <aside className="lg:col-span-4">
            <Sidebar />
          </aside>
        </div>
      </div>
    </Layout>
  );
}
