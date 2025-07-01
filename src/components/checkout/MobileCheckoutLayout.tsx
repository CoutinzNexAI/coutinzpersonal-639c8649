import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Info } from 'lucide-react';

interface UserData {
  full_name: string;
  email: string;
}

interface MobileCheckoutLayoutProps {
  userData: UserData | null;
  children?: React.ReactNode;
}

export const MobileCheckoutLayout: React.FC<MobileCheckoutLayoutProps> = ({
  userData,
  children
}) => {
  return (
    <div className="lg:hidden pb-24">
      {/* Mobile Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🛒</div>
          <h1 className="text-2xl font-ghibli text-ghibli-wood mb-2">
            Finalizar Compra
          </h1>
          <p className="text-sm text-ghibli-earth">
            Reveja o seu pedido e prossiga para o pagamento
          </p>
        </div>
      </motion.div>

      {/* User Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-ghibli-moss/10 mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <h2 className="font-bold text-ghibli-wood">Dados do Cliente</h2>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-ghibli-cream/30 rounded-lg">
            <User className="w-4 h-4 text-ghibli-earth" />
            <div>
              <p className="text-xs text-ghibli-earth/70 uppercase tracking-wide">Nome</p>
              <p className="font-semibold text-ghibli-wood">
                {userData?.full_name || 'Não disponível'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-ghibli-cream/30 rounded-lg">
            <Mail className="w-4 h-4 text-ghibli-earth" />
            <div>
              <p className="text-xs text-ghibli-earth/70 uppercase tracking-wide">Email</p>
              <p className="font-semibold text-ghibli-wood">
                {userData?.email || 'Não disponível'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Shipping Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-ghibli-sky/20 backdrop-blur-sm rounded-xl p-4 border border-ghibli-sky/30 mb-6"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-ghibli-sky mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-ghibli-wood text-sm mb-1">
              Informação de Envio
            </h3>
            <p className="text-xs text-ghibli-earth leading-relaxed">
              Os dados de envio serão recolhidos no próximo passo através do sistema seguro do Stripe.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Additional Content */}
      {children}

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200">
          <div className="text-lg mb-1">🚚</div>
          <p className="text-xs font-bold text-green-700">Envio Grátis</p>
          <p className="text-xs text-green-600">5-8 dias</p>
        </div>
        
        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
          <div className="text-lg mb-1">🛡️</div>
          <p className="text-xs font-bold text-blue-700">Seguro</p>
          <p className="text-xs text-blue-600">SSL + Stripe</p>
        </div>
        
        <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-200">
          <div className="text-lg mb-1">↩️</div>
          <p className="text-xs font-bold text-purple-700">Garantia</p>
          <p className="text-xs text-purple-600">30 dias</p>
        </div>
      </motion.div>
    </div>
  );
}; 