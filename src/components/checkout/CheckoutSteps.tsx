import React from 'react';
import { motion } from 'framer-motion';

interface CheckoutStep {
  id: number;
  name: string;
  icon: string;
  description: string;
}

interface CheckoutStepsProps {
  currentStep: number;
  className?: string;
}

const steps: CheckoutStep[] = [
  { id: 1, name: 'Carrinho', icon: '🛒', description: 'Revisar produtos' },
  { id: 2, name: 'Dados', icon: '👤', description: 'Informações pessoais' },
  { id: 3, name: 'Pagamento', icon: '💳', description: 'Finalizar compra' },
  { id: 4, name: 'Confirmação', icon: '✅', description: 'Pedido confirmado' }
];

export const CheckoutSteps: React.FC<CheckoutStepsProps> = ({ 
  currentStep, 
  className = '' 
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      {/* Mobile Steps */}
      <div className="block lg:hidden">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-ghibli-moss/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-ghibli-moss text-white flex items-center justify-center text-lg">
                {steps[currentStep - 1]?.icon}
              </div>
              <div>
                <p className="font-bold text-ghibli-wood">
                  Passo {currentStep} de {steps.length}
                </p>
                <p className="text-sm text-ghibli-earth">
                  {steps[currentStep - 1]?.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-ghibli-earth mb-1">Progresso</div>
              <div className="w-16 h-2 bg-ghibli-sand/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / steps.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Steps */}
      <div className="hidden lg:flex justify-center">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => {
            const isActive = currentStep >= step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <React.Fragment key={step.id}>
                <motion.div 
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <motion.div 
                    className={`
                      w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold
                      transition-all duration-300 shadow-lg
                      ${isActive 
                        ? 'bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light text-white' 
                        : 'bg-white text-ghibli-earth border-2 border-ghibli-sand'
                      }
                      ${isCurrent ? 'ring-4 ring-ghibli-moss/30 scale-110' : ''}
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {step.icon}
                  </motion.div>
                  
                  <div className="text-center mt-3">
                    <p className={`
                      font-bold text-sm
                      ${isActive ? 'text-ghibli-moss' : 'text-ghibli-earth'}
                    `}>
                      {step.name}
                    </p>
                    <p className="text-xs text-ghibli-earth/70 max-w-20">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
                
                {index < steps.length - 1 && (
                  <motion.div 
                    className={`
                      w-16 h-1 rounded-full transition-all duration-300
                      ${currentStep > step.id 
                        ? 'bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light' 
                        : 'bg-ghibli-sand/30'
                      }
                    `}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: (index + 1) * 0.1 }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 