
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  onDeleteLead?: (id: number) => void;
}

const DashboardLeads = ({ leads, onDeleteLead }: DashboardLeadsProps) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<number | null>(null);

  const handleDeleteClick = (leadId: number) => {
    setLeadToDelete(leadId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (leadToDelete !== null && onDeleteLead) {
      onDeleteLead(leadToDelete);
    }
    setDeleteConfirmOpen(false);
    setLeadToDelete(null);
  };

  return (
    <>
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
                  <th className="text-left py-3 px-2 font-medium text-aura-textSecondary">Actions</th>
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
                    <td className="py-3 px-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        onClick={() => handleDeleteClick(lead.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
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

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-aura-backgroundLight border-aura-accent/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-aura-textSecondary">
              This action cannot be undone. This will permanently delete the lead and remove it from your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-aura-backgroundDark text-white hover:bg-aura-backgroundLight">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DashboardLeads;
