'use client';

import { useState } from 'react';
import { CreditCard, Plus, Trash2, Star, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTenant } from '@/context/TenantContext';
import { cn } from '@/lib/utils';

const MOCK_CARDS = [
  { id: '1', type: 'visa', last4: '4242', expiry: '12/25', isDefault: true, name: 'John Doe' },
  { id: '2', type: 'mastercard', last4: '8888', expiry: '06/26', isDefault: false, name: 'John Doe' },
];

const cardLogos: Record<string, string> = {
  visa: 'VISA',
  mastercard: 'MC',
  amex: 'AMEX',
};

export default function PaymentMethodsPage() {
  const { settings } = useTenant();
  const [cards, setCards] = useState(MOCK_CARDS);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCard, setNewCard] = useState({ number: '', name: '', expiry: '', cvv: '' });

  const handleSetDefault = (cardId: string) => {
    setCards(cards.map((card) => ({ ...card, isDefault: card.id === cardId })));
  };

  const handleDeleteCard = (cardId: string) => {
    setCards(cards.filter((card) => card.id !== cardId));
  };

  const handleAddCard = () => {
    const newCardData = {
      id: Date.now().toString(),
      type: 'visa',
      last4: newCard.number.slice(-4),
      expiry: newCard.expiry,
      isDefault: cards.length === 0,
      name: newCard.name,
    };
    setCards([...cards, newCardData]);
    setNewCard({ number: '', name: '', expiry: '', cvv: '' });
    setIsAddingCard(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold">Payment Methods</h2>
            <p className="text-sm text-muted-foreground">Manage your saved payment methods</p>
          </div>

          <Dialog open={isAddingCard} onOpenChange={setIsAddingCard}>
            <DialogTrigger asChild>
              <Button className="btn-tenant-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add New Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Card</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={newCard.number}
                    onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    value={newCard.name}
                    onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={newCard.expiry}
                      onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="password"
                      placeholder="123"
                      maxLength={4}
                      value={newCard.cvv}
                      onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsAddingCard(false)}>Cancel</Button>
                  <Button className="btn-tenant-primary" onClick={handleAddCard}>Add Card</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {cards.length > 0 ? (
          <div className="grid gap-4">
            <AnimatePresence>
              {cards.map((card) => (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-colors',
                    card.isDefault
                      ? 'border-tenant-primary bg-tenant-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                        style={{
                          background:
                            card.type === 'visa'
                              ? 'linear-gradient(135deg, #1A1F71, #2A2F91)'
                              : card.type === 'mastercard'
                              ? 'linear-gradient(135deg, #EB001B, #F79E1B)'
                              : settings.primaryColor,
                        }}
                      >
                        {cardLogos[card.type] || card.type.toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-semibold">**** **** **** {card.last4}</p>
                          {card.isDefault && (
                            <Badge className="bg-tenant-primary text-on-tenant-primary">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {card.name} &bull; Expires {card.expiry}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!card.isDefault && (
                        <Button variant="ghost" size="sm" onClick={() => handleSetDefault(card.id)}>
                          <Star className="h-4 w-4 mr-1" />
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteCard(card.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-12">
            <div
              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: `${settings.primaryColor}15` }}
            >
              <CreditCard className="h-10 w-10 text-tenant-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No payment methods</h3>
            <p className="text-muted-foreground mb-4">Add a payment method to make checkout faster.</p>
            <Button className="btn-tenant-primary" onClick={() => setIsAddingCard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Card
            </Button>
          </div>
        )}
      </div>

      <div className="bg-muted/50 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Your payment information is secure</p>
            <p className="text-sm text-muted-foreground">
              All payment data is encrypted and stored securely. We never store your full card number or CVV.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
