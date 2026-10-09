import { motion } from 'framer-motion';
import { Shield, AlertTriangle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import SafetyChat from '@/components/chat/SafetyChat';

export default function SafetyChatPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h1 className="font-display text-3xl font-bold">Safety Assistant</h1>
            </div>
            <p className="text-muted-foreground">
              Ask about travel safety, emergencies, or precautions in Rajasthan. Get instant help with safety-related questions.
            </p>
          </div>

          {/* Safety Chat Component - Full Page Mode */}
          <div className="bg-background rounded-xl border p-2">
            <div className="h-[600px]">
              <SafetyChat floating={false} />
            </div>
          </div>

          {/* Quick Info Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border rounded-xl p-4">
              <AlertTriangle className="w-6 h-6 text-destructive mb-2" />
              <h3 className="font-semibold mb-1">Emergency Contacts</h3>
              <p className="text-sm text-muted-foreground">
                Police: 100 • Ambulance: 108 • Women Helpline: 1091
              </p>
            </div>
            <div className="bg-card border rounded-xl p-4">
              <Shield className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Safety Tips</h3>
              <p className="text-sm text-muted-foreground">
                Get advice on staying safe while exploring Rajasthan's heritage sites
              </p>
            </div>
            <div className="bg-card border rounded-xl p-4">
              <Shield className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">24/7 Assistance</h3>
              <p className="text-sm text-muted-foreground">
                Available anytime to help with safety concerns and emergencies
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

