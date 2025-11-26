
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarCheck, Plus } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
}

const AppCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "Client Meeting",
      description: "Discuss project requirements with new client",
      date: new Date(2025, 4, 15),
    },
    {
      id: "2",
      title: "Website Launch",
      description: "Launch redesigned company website",
      date: new Date(2025, 4, 22),
    },
  ]);
  
  const [newEvent, setNewEvent] = useState<Omit<Event, "id">>({
    title: "",
    description: "",
    date: new Date(),
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Find events for the selected date
  const selectedDateEvents = date
    ? events.filter((event) => 
        event.date.toDateString() === date.toDateString()
      )
    : [];
    
  const handleAddEvent = () => {
    if (newEvent.title.trim() === "" || !newEvent.date) return;
    
    const event: Event = {
      id: Date.now().toString(),
      ...newEvent,
    };
    
    setEvents([...events, event]);
    setNewEvent({ title: "", description: "", date: date || new Date() });
    setIsDialogOpen(false);
    
    toast({
      title: "Event added",
      description: `"${event.title}" has been added to your calendar`,
    });
  };
  
  const handleDeleteEvent = (id: string) => {
    const eventToDelete = events.find(event => event.id === id);
    setEvents(events.filter((event) => event.id !== id));
    
    if (eventToDelete) {
      toast({
        title: "Event removed",
        description: `"${eventToDelete.title}" has been removed from your calendar`,
        variant: "destructive",
      });
    }
  };
  
  function isDayWithEvent(day: Date) {
    return events.some(
      (event) => event.date.toDateString() === day.toDateString()
    );
  }

  return (
    <Card className="border-aura-accent/10 shadow-md bg-aura-backgroundLight w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-aura-accent" />
          <CardTitle>Calendar</CardTitle>
        </div>
        <CardDescription>Plan and manage your schedule</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border p-3 pointer-events-auto"
            modifiers={{
              event: (date) => isDayWithEvent(date),
            }}
            modifiersStyles={{
              event: {
                fontWeight: "bold",
                color: "var(--aura-accent)",
                textDecoration: "underline",
              },
            }}
          />
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">
              {date ? format(date, "MMMM d, yyyy") : "Select a date"}
            </h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-aura-accent hover:bg-aura-accent/90">
                  <Plus className="h-4 w-4 mr-1" /> Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Event</DialogTitle>
                  <DialogDescription>
                    Create a new event for {date ? format(date, "MMMM d, yyyy") : "the selected date"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="title" className="text-right">
                      Title
                    </label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="description" className="text-right">
                      Description
                    </label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddEvent}>Save Event</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {selectedDateEvents.length === 0 ? (
            <div className="text-center py-8 text-aura-textSecondary">
              No events scheduled for this day
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 border border-aura-accent/10 rounded-md hover:bg-aura-accent/5 transition-colors"
                >
                  <div className="flex justify-between">
                    <h4 className="font-medium">{event.title}</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 hover:text-red-500"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <span className="sr-only">Delete event</span>
                      ×
                    </Button>
                  </div>
                  <p className="text-sm text-aura-textSecondary mt-1">
                    {event.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AppCalendar;
