
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/ui/page-header";
import { Mail, Phone, MapPin, Send } from "lucide-react";

const Contact = () => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Placeholder for form submission logic
    console.log("Form submitted");
  };

  return (
    <PageLayout 
      title="Contact" 
      description="Get in touch with Bruce Freshwater and the Vibe Tech team. Contact us for project inquiries, collaborations, or to learn more about our services."
      keywords="contact Vibe Tech, Bruce Freshwater contact, tech services inquiry, get a quote"
      canonicalUrl="https://vibetech.com/contact"
    >
      {/* Hero Section */}
      <section className="pt-28 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <PageHeader 
            title="Get In Touch"
            subtitle="Have a question or interested in working with Bruce Freshwater? Reach out using the form below or contact directly."
          />
        </div>
      </section>

      {/* Contact Section */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Contact Form */}
            <div className="p-8 rounded-lg border border-aura-accent/20 bg-aura-background shadow-neon">
              <h2 className="text-2xl font-semibold mb-6 font-heading">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-aura-textSecondary">Your Name</Label>
                    <Input 
                      id="name" 
                      type="text" 
                      required 
                      className="bg-aura-backgroundLight/20 border-aura-accent/20 focus-visible:ring-aura-accent/30 text-aura-textSecondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-aura-textSecondary">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      required 
                      className="bg-aura-backgroundLight/20 border-aura-accent/20 focus-visible:ring-aura-accent/30 text-aura-textSecondary"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-aura-textSecondary">Subject</Label>
                  <Input 
                    id="subject" 
                    type="text" 
                    className="bg-aura-backgroundLight/20 border-aura-accent/20 focus-visible:ring-aura-accent/30 text-aura-textSecondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-aura-textSecondary">Message</Label>
                  <Textarea 
                    id="message" 
                    required 
                    rows={5}
                    className="bg-aura-backgroundLight/20 border-aura-accent/20 focus-visible:ring-aura-accent/30 text-aura-textSecondary resize-none"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="bg-aura-accent hover:bg-aura-accent/90 w-full sm:w-auto flex items-center gap-2"
                >
                  Send Message
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-6 font-heading">Contact Information</h2>
                <p className="text-aura-textSecondary mb-8">
                  Bruce Freshwater would love to hear from you! Contact using the information below or fill out the form and we'll get back to you as soon as possible.
                </p>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-aura-accent/10 border border-aura-accent/20 flex items-center justify-center mr-4">
                      <Mail className="h-5 w-5 text-aura-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Email</h3>
                      <p className="text-aura-textSecondary">
                        <a href="mailto:freshwaterbruce@icloud.com" className="hover:text-aura-accent">
                          freshwaterbruce@icloud.com
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-aura-accent/10 border border-aura-accent/20 flex items-center justify-center mr-4">
                      <Phone className="h-5 w-5 text-aura-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Phone</h3>
                      <p className="text-aura-textSecondary">
                        <a href="tel:18038258860" className="hover:text-aura-accent">
                          1-803-825-8860
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-aura-accent/10 border border-aura-accent/20 flex items-center justify-center mr-4">
                      <MapPin className="h-5 w-5 text-aura-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Office</h3>
                      <p className="text-aura-textSecondary">
                        Vibe Tech<br />
                        Bruce Freshwater<br />
                        Somerton, South Carolina<br />
                        United States
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Google Map Placeholder */}
              <div className="mt-10 h-64 rounded-lg overflow-hidden tech-border">
                <div className="w-full h-full bg-aura-backgroundLight/50 flex items-center justify-center">
                  <p className="text-aura-textSecondary">Map Placeholder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-aura-backgroundLight/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center font-heading">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                question: "What services does Bruce Freshwater offer?",
                answer: "Bruce offers a range of digital services including web development, mobile app development, UI/UX design, and digital strategy consulting."
              },
              {
                question: "How much do your services cost?",
                answer: "Our pricing varies depending on the project requirements and scope. We provide detailed quotes after an initial consultation to understand your specific needs."
              },
              {
                question: "How long does a typical project take?",
                answer: "Project timelines depend on complexity and scope. A simple website might take 2-4 weeks, while a complex web application could take several months."
              },
              {
                question: "Do you provide ongoing support?",
                answer: "Yes, Bruce and his team offer various maintenance and support packages to ensure your digital products continue to function optimally after launch."
              }
            ].map((item, index) => (
              <div 
                key={index}
                className="p-6 rounded-lg border border-aura-accent/20 bg-aura-background hover:shadow-neon transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2 font-heading">{item.question}</h3>
                <p className="text-aura-textSecondary">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Contact;
