
import NavBar from "@/components/NavBar";
import TodoList from "@/components/TodoList";
import AppCalendar from "@/components/AppCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Calendar, ListTodo } from "lucide-react";

const Tools = () => {
  return (
    <div className="min-h-screen bg-aura-background pb-16">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 pt-24">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 bg-gradient-to-r from-aura-accent to-aura-accentSecondary bg-clip-text text-transparent">
            Productivity Tools
          </h1>
          <p className="text-aura-textSecondary max-w-3xl mx-auto">
            Stay organized and boost your productivity with our collection of helpful tools.
          </p>
        </motion.div>

        <Tabs defaultValue="todo" className="w-full max-w-3xl mx-auto mb-16">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-aura-backgroundLight">
            <TabsTrigger value="todo" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              <span>Task Manager</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Calendar</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="todo">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <TodoList />
            </motion.div>
          </TabsContent>
          <TabsContent value="calendar">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AppCalendar />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Tools;
