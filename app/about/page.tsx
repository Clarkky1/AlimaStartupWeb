"use client"

import React from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { H1, H2, H3, P, Lead } from "@/components/ui/typography"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Github, Linkedin, Mail, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"

// Team members data
const founders = [
  {
    name: "Kin Clark",
    role: "Founder & Lead Developer",
    bio: "Founded Alima with a vision to create a marketplace that connects service providers with clients in a seamless and efficient way.",
    avatar: "/team/founder.jpg", // Update with actual image
    social: {
      twitter: "https://twitter.com/founder",
      linkedin: "https://linkedin.com/in/founder",
      github: "https://github.com/founder",
      email: "founder@alima.com"
    }
  },
]

const developers = [
  {
    name: "John Developer",
    role: "Full Stack Developer",
    bio: "Responsible for backend development and API integration.",
    avatar: "/team/dev1.jpg", // Update with actual image
    social: {
      github: "https://github.com/dev1",
      linkedin: "https://linkedin.com/in/dev1"
    }
  },
  {
    name: "Sarah Engineer",
    role: "Frontend Developer",
    bio: "Created the responsive UI components and implemented client-side logic.",
    avatar: "/team/dev2.jpg", // Update with actual image
    social: {
      github: "https://github.com/dev2",
      linkedin: "https://linkedin.com/in/dev2"
    }
  },
]

const designers = [
  {
    name: "Maria Designer",
    role: "UI/UX Designer",
    bio: "Designed the user interface and experience for Alima, focusing on simplicity and usability.",
    avatar: "/team/design1.jpg", // Update with actual image
    social: {
      linkedin: "https://linkedin.com/in/design1"
    }
  },
]

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  avatar: string;
  social: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    email?: string;
  }
}

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="absolute bottom-0 left-1/2 -mb-12 -translate-x-1/2">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <CardContent className="pt-16 text-center">
        <H3 className="mb-1">{member.name}</H3>
        <p className="text-sm font-medium text-primary">{member.role}</p>
        <P className="mt-2 text-sm text-muted-foreground">{member.bio}</P>
        
        <div className="mt-4 flex justify-center space-x-3">
          {member.social.github && (
            <a href={member.social.github} target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </a>
          )}
          {member.social.twitter && (
            <a href={member.social.twitter} target="_blank" rel="noopener noreferrer">
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </a>
          )}
          {member.social.linkedin && (
            <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer">
              <Linkedin className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </a>
          )}
          {member.social.email && (
            <a href={`mailto:${member.social.email}`}>
              <Mail className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="text-center mb-16">
        <H1>About Alima</H1>
        <Lead className="max-w-3xl mx-auto mt-4">
          Connecting service providers with clients in a seamless and efficient marketplace.
        </Lead>
      </div>

      <div className="grid gap-12">
        {/* About the Platform */}
        <section>
          <H2 className="mb-6">Our Mission</H2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <P>
                Alima was created with a simple but powerful mission: to build a platform that connects skilled service providers with those who need their expertise. Whether you're looking for local services or global remote work, Alima provides a seamless experience for both service providers and clients.
              </P>
              <P>
                Our platform ensures secure transactions, transparent reviews, and easy communication between parties. We believe in creating opportunities for people to showcase their talents and find quality services at competitive prices.
              </P>
            </div>
            <div className="relative h-64 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center text-4xl font-heading font-bold text-primary/40">
                Alima
              </div>
            </div>
          </div>
        </section>

        <Separator />
        
        {/* The Team */}
        <section>
          <div className="text-center mb-8">
            <H2>Meet Our Team</H2>
            <P className="max-w-3xl mx-auto">
              The passionate individuals behind Alima who work tirelessly to create the best possible experience for our users.
            </P>
          </div>
          
          <Tabs defaultValue="founders" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="founders">Founders</TabsTrigger>
              <TabsTrigger value="developers">Developers</TabsTrigger>
              <TabsTrigger value="designers">Designers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="founders" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                {founders.map((member) => (
                  <MemberCard key={member.name} member={member} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="developers" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {developers.map((member) => (
                  <MemberCard key={member.name} member={member} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="designers" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {designers.map((member) => (
                  <MemberCard key={member.name} member={member} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>
        
        <Separator />
        
        {/* Contact/Connect */}
        <section className="text-center">
          <H2 className="mb-6">Get In Touch</H2>
          <P className="max-w-2xl mx-auto mb-8">
            Have questions about Alima or interested in joining our team? We'd love to hear from you!
          </P>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="default">
              <Mail className="mr-2 h-4 w-4" />
              Contact Us
            </Button>
            <Button variant="outline">
              <Twitter className="mr-2 h-4 w-4" />
              Follow Us
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
} 