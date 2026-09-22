import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { BottomNav } from '../../components/common/BottomNav';
import { Product } from '../../types';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';
import { DEFAULT_BRAND_SETTINGS, getBrandSettings } from '../../services/firebase/catalog';

interface CartItem {
  cartKey?: string;
  product: Product;
  selectedWeight?: string;
  quantity: number;
}

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [telegramUrl, setTelegramUrl] = useState(DEFAULT_BRAND_SETTINGS.contactLinks.telegram);

  useEffect(() => {
    getBrandSettings().then((b) => {
      if (b.contactLinks?.telegram) setTelegramUrl(b.contactLinks.telegram);
    });

    try {
      const saved = localStorage.getItem('pvf_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      setItems([]);
    }
  }, []);

  const removeItem = (itemKey: string, productId: string) => {
    hapticFeedback('medium');
    playClickSound();
    const updated = items.filter((it) => (it.cartKey ? it.cartKey !== itemKey : it.product.id !== productId));
    setItems(updated);
    localStorage.setItem('pvf_cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const clearCart = () => {
    hapticFeedback('heavy');
    setItems([]);
    localStorage.removeItem('pvf_cart');
    window.dispatchEvent(new Event('cart-updated'));
  };

  const total = items.reduce((acc, it) => acc + (it.product.price || 0) * it.quantity, 0);

  const handleOrderTelegram = () => {
    hapticFeedback('medium');
    playClickSound();
    let text = '🛒 *NOUVELLE COMMANDE CARTEL DEL FARMEZ*\n\n';
    items.forEach((it) => {
      const weightInfo = it.selectedWeight ? ` (${it.selectedWeight})` : '';
      text += `• ${it.quantity}x ${it.product.name}${weightInfo} - ${it.product.price * it.quantity}€\n`;
    });
    text += `\n💰 *Total:* ${total}€`;
    const tgLink = `${telegramUrl}?text=${encodeURIComponent(text)}`;
    window.open(tgLink, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col pb-24 selection:bg-cyan-900 selection:text-white">
      <Header title="🛒 Mon Panier" />

      <main className="max-w-md mx-auto px-4 pt-4 flex-1 w-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              Mon Panier
            </h1>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider</span>
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl bg-[#0c1322] border border-slate-800/80 p-8 text-center space-y-3.5 my-8">
            <div className="w-14 h-14 rounded-2xl bg-[#0e192c] border border-cyan-900/60 flex items-center justify-center mx-auto text-cyan-400">
              <ShoppingBag className="w-7 h-7 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-100">Votre panier est vide</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Explorez notre catalogue de filtrations et ajoutez des pépites à votre sélection.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                hapticFeedback('light');
                navigate('/');
              }}
              className="mt-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold uppercase tracking-wider transition"
            >
              Découvrir le menu
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={it.cartKey || `${it.product.id}_${idx}`}
                  className="rounded-2xl bg-[#0c1322] border border-slate-800/80 p-3 flex items-center justify-between gap-3"
                >
                  <img
                    src={it.product.mainImage || it.product.images?.[0]}
                    alt={it.product.name}
                    className="w-14 h-14 rounded-xl object-cover bg-slate-950 border border-slate-800"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-100 truncate">{it.product.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-cyan-400 font-medium">{it.product.categoryName || 'EXTRACTION'}</span>
                      {it.selectedWeight && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                          {it.selectedWeight}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono font-semibold text-slate-200 mt-1">
                      {it.product.price}€ × {it.quantity} = {it.product.price * it.quantity}€
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(it.cartKey || '', it.product.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total & Checkout */}
            <div className="rounded-2xl bg-[#0c1322] border border-slate-800/80 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total estimé :</span>
                <span className="font-extrabold text-lg text-white font-mono">{total}€</span>
              </div>

              <button
                type="button"
                onClick={handleOrderTelegram}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg transition active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Finaliser la commande sur Telegram</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
