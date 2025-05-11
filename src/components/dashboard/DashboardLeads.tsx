
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Lead {
  id: number;
  name: string;
  email: string;
  source: string;
  status: string;
  date: string;
}

interface DashboardLeadsProps {
  leads: Lead[];
}

const DashboardLeads = ({ leads }: DashboardLeadsProps) => {
  return (
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
              {leads.map((lead) => (
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
  );
};

export default DashboardLeads;
