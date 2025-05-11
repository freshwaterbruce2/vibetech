
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Computer, Wifi } from "lucide-react";

const RemoteServicesBanner: React.FC = () => {
  return (
    <section className="py-16 px-4 bg-aura-backgroundLight/30">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl overflow-hidden border border-aura-accent/20 shadow-lg">
          <div className="p-8 md:p-10 bg-gradient-to-r from-aura-background to-aura-backgroundLight">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="mb-6 flex items-center gap-4"
                >
                  <div className="p-3 rounded-full bg-aura-accent/10 border border-aura-accent/20">
                    <Computer className="h-8 w-8 text-aura-accent" />
                  </div>
                  <div className="p-3 rounded-full bg-aura-accent/10 border border-aura-accent/20">
                    <Wifi className="h-8 w-8 text-aura-accent" />
                  </div>
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="text-3xl font-bold mb-4 font-heading"
                >
                  Remote Computer <span className="bg-gradient-to-r from-aura-accent to-purple-400 bg-clip-text text-transparent">Repair Services</span>
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="text-aura-textSecondary mb-8"
                >
                  We offer complete remote computer repair services without ever needing to visit your home or office. 
                  Our certified technicians can resolve most software issues, remove viruses, optimize performance, 
                  and provide technical support through secure remote connections.
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <Button asChild size="lg" className="bg-aura-accent hover:bg-aura-accent/90">
                    <Link to="/contact">Schedule Remote Support</Link>
                  </Button>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-video rounded-lg overflow-hidden border border-aura-accent/20 shadow-xl bg-aura-background/80">
                  <div className="absolute inset-0 bg-gradient-to-tr from-aura-accent/10 to-transparent"></div>
                  <div className="flex items-center justify-center h-full p-8 text-center">
                    <div>
                      <h3 className="font-medium text-xl mb-4">How Remote Support Works</h3>
                      <ul className="space-y-3 text-left">
                        <li className="flex items-center gap-2">
                          <span className="text-aura-accent font-bold">1.</span>
                          <span>Contact us to schedule remote support</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-aura-accent font-bold">2.</span>
                          <span>We'll provide a secure connection link</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-aura-accent font-bold">3.</span>
                          <span>Our technician diagnoses and fixes the issue</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-aura-accent font-bold">4.</span>
                          <span>Only pay after successful resolution</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RemoteServicesBanner;
