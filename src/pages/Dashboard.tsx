
import { useState } from "react";
import NavBar from "@/components/NavBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Activity, User, MessageSquare, Calendar, Users, Database, BarChart, PieChart } from "lucide-react";

// Mock data for demonstration
const mockLeads = [
  { id: 1, name: "John Doe", email: "john@example.com", source: "Contact Form", status: "New", date: "2025-05-10" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", source: "Newsletter", status: "Contacted", date: "2025-05-09" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", source: "Contact Form", status: "Qualified", date: "2025-05-08" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", source: "Service Page", status: "Proposal", date: "2025-05-07" },
  { id: 5, name: "Charlie Wilson", email: "charlie@example.com", source: "Portfolio", status: "Closed", date: "2025-05-06" },
];

const mockMetrics = {
  totalLeads: 43,
  newLeadsToday: 5,
  conversionRate: "12.5%",
  avgResponseTime: "2.3 hours",
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-aura-background pb-16">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 pt-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-heading bg-gradient-to-r from-aura-accent to-aura-accentSecondary bg-clip-text text-transparent">
            CRM Dashboard
          </h1>
          <Button className="bg-gradient-to-r from-aura-accent to-aura-accentSecondary">
            + New Lead
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-aura-backgroundLight border-aura-accent/10">
            <CardHeader className="pb-2">
              <CardDescription>Total Leads</CardDescription>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">{mockMetrics.totalLeads}</CardTitle>
                <Database className="h-5 w-5 text-aura-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-aura-textSecondary">
                <span className="text-green-500">↑ 12.5%</span> from last month
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-aura-backgroundLight border-aura-accent/10">
            <CardHeader className="pb-2">
              <CardDescription>New Leads Today</CardDescription>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">{mockMetrics.newLeadsToday}</CardTitle>
                <User className="h-5 w-5 text-aura-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-aura-textSecondary">
                <span className="text-green-500">↑ 2</span> more than yesterday
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-aura-backgroundLight border-aura-accent/10">
            <CardHeader className="pb-2">
              <CardDescription>Conversion Rate</CardDescription>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">{mockMetrics.conversionRate}</CardTitle>
                <PieChart className="h-5 w-5 text-aura-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-aura-textSecondary">
                <span className="text-green-500">↑ 3.2%</span> from last month
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-aura-backgroundLight border-aura-accent/10">
            <CardHeader className="pb-2">
              <CardDescription>Avg. Response Time</CardDescription>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">{mockMetrics.avgResponseTime}</CardTitle>
                <Activity className="h-5 w-5 text-aura-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-aura-textSecondary">
                <span className="text-red-500">↓ 0.5 hours</span> improvement
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-10">
          <TabsList className="grid grid-cols-4 mb-8 bg-aura-backgroundLight">
            <TabsTrigger value="overview">
              <BarChart className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="leads">
              <Users className="h-4 w-4 mr-2" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card className="bg-aura-backgroundLight border-aura-accent/10">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your CRM activity from the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockLeads.slice(0, 3).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between border-b border-aura-accent/10 pb-2">
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-aura-textSecondary">{lead.email}</div>
                      </div>
                      <div>
                        <span className="text-xs bg-aura-accent/10 text-aura-accent px-2 py-1 rounded-full">
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">View All Activity</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="leads">
            <Card className="bg-aura-backgroundLight border-aura-accent/10">
              <CardHeader>
                <CardTitle>All Leads</CardTitle>
                <CardDescription>Manage and track your potential customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-aura-accent/10">
                        <th className="text-left py-3 px-2 font-medium text-aura-textSecondary">Name</th>
                        <th className="text-left py-3 px-2 font-medium text-aura-textSecondary">Email</th>
                        <th className="text-left py-3 px-2 font-medium text-aura-textSecondary">Source</th>
                        <th className="text-left py-3 px-2 font-medium text-aura-textSecondary">Status</th>
                        <th className="text-left py-3 px-2 font-medium text-aura-textSecondary">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockLeads.map((lead) => (
                        <tr key={lead.id} className="border-b border-aura-accent/5 hover:bg-aura-accent/5">
                          <td className="py-3 px-2">{lead.name}</td>
                          <td className="py-3 px-2">{lead.email}</td>
                          <td className="py-3 px-2">{lead.source}</td>
                          <td className="py-3 px-2">
                            <span className={`text-xs px-2 py-1 rounded-full 
                              ${lead.status === "New" ? "bg-blue-100 text-blue-700" : 
                                lead.status === "Contacted" ? "bg-yellow-100 text-yellow-700" :
                                lead.status === "Qualified" ? "bg-purple-100 text-purple-700" :
                                lead.status === "Proposal" ? "bg-orange-100 text-orange-700" :
                                "bg-green-100 text-green-700"}`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-3 px-2">{lead.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">Previous</Button>
                <div className="text-sm text-aura-textSecondary">
                  Page 1 of 1
                </div>
                <Button variant="outline" size="sm">Next</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="messages">
            <Card className="bg-aura-backgroundLight border-aura-accent/10">
              <CardHeader>
                <CardTitle>Customer Messages</CardTitle>
                <CardDescription>Manage your conversations with leads and clients</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-aura-accent/40" />
                  <h3 className="text-lg font-medium mb-1">No messages yet</h3>
                  <p className="text-aura-textSecondary">When you receive messages, they'll appear here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="calendar">
            <Card className="bg-aura-backgroundLight border-aura-accent/10">
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Schedule and manage your appointments</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-aura-accent/40" />
                  <h3 className="text-lg font-medium mb-1">No upcoming events</h3>
                  <p className="text-aura-textSecondary">Add events to see them appear on your calendar.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
