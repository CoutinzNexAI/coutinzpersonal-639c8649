
import React from 'react';
import { Upload, Brush, Sun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center">Como Funciona</h2>
        <p className="section-subtitle text-center text-ghibli-earth">
          Transforme suas fotos em apenas três passos simples
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {/* Step 1 */}
          <Card className="ghibli-card border-ghibli-sand/30 overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-ghibli-sky flex items-center justify-center mb-6">
                <Upload className="h-8 w-8 text-ghibli-sky-deep" />
              </div>
              <h3 className="text-xl font-ghibli text-ghibli-wood mb-2">1. Faça Upload</h3>
              <p className="text-ghibli-earth text-center">
                Selecione uma foto do seu dispositivo ou arraste-a para a área indicada
              </p>
            </CardContent>
          </Card>
          
          {/* Step 2 */}
          <Card className="ghibli-card border-ghibli-sand/30 overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-ghibli-sand flex items-center justify-center mb-6">
                <Brush className="h-8 w-8 text-ghibli-earth" />
              </div>
              <h3 className="text-xl font-ghibli text-ghibli-wood mb-2">2. Escolha o Estilo</h3>
              <p className="text-ghibli-earth text-center">
                Selecione entre os vários estilos artísticos inspirados no universo Ghibli
              </p>
            </CardContent>
          </Card>
          
          {/* Step 3 */}
          <Card className="ghibli-card border-ghibli-sand/30 overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-ghibli-sunflower/30 flex items-center justify-center mb-6">
                <Sun className="h-8 w-8 text-ghibli-sunflower" />
              </div>
              <h3 className="text-xl font-ghibli text-ghibli-wood mb-2">3. Transforme</h3>
              <p className="text-ghibli-earth text-center">
                Veja sua foto ser magicamente transformada e baixe o resultado
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
