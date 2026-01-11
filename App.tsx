
import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingBag, Star, Sparkles, X, Menu, ArrowRight, CheckCircle, Search, Truck, CreditCard, Wand2, MapPin, Heart, MessageSquare, ChevronDown, ChevronUp, Eye, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { PRODUCTS, CUSTOM_SCENTS, WAX_COLORS } from './constants';
import { Product, CartItem, OrderDetails, CheckoutStep, Review } from './types';
import { getScentRecommendation } from './services/geminiService';

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
  const [expandedReviews, setExpandedReviews] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('shipping');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Advanced Filter State
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [sortBy, setSortBy] = useState<'popularity' | 'price-low' | 'price-high' | 'name'>('popularity');
  
  // Location & Pricing State
  const [locationName, setLocationName] = useState<string>('Standard Zone');
  const [priceMultiplier, setPriceMultiplier] = useState<number>(1.0);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Custom Candle State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [customScent, setCustomScent] = useState(CUSTOM_SCENTS[0]);
  const [customColor, setCustomColor] = useState(WAX_COLORS[0]);
  const [customLabel, setCustomLabel] = useState('');

  // AI State
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);
  const [aiMood, setAiMood] = useState('');
  const [aiPreference, setAiPreference] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Review Form State
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });

  const [orderStatus, setOrderStatus] = useState<'idle' | 'processing'>('idle');
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    fullName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    paymentMethod: 'card'
  });

  useEffect(() => {
    const savedReviews = localStorage.getItem('lumiere_reviews');
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lumiere_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          if (lat > 25) {
            setLocationName('Northern Region Studio');
            setPriceMultiplier(1.05);
          } else if (lat < 15) {
            setLocationName('Southern Coast Studio');
            setPriceMultiplier(0.98);
          } else {
            setLocationName('Central Hub');
            setPriceMultiplier(1.0);
          }
          setIsLoadingLocation(false);
        },
        () => {
          setLocationName('Standard Zone');
          setPriceMultiplier(1.0);
          setIsLoadingLocation(false);
        }
      );
    } else {
      setIsLoadingLocation(false);
    }
  }, []);

  const formatPriceValue = (value: number) => {
    return Math.round(value * priceMultiplier).toLocaleString('en-IN');
  };

  const allUniqueNotes = useMemo(() => {
    const notes = new Set<string>();
    PRODUCTS.forEach(p => p.notes.forEach(n => notes.add(n)));
    return Array.from(notes).sort();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...PRODUCTS];

    // Filter by Category
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory);
    }

    // Filter by Notes
    if (selectedNotes.length > 0) {
      result = result.filter(p => selectedNotes.every(note => p.notes.includes(note)));
    }

    // Filter by Price
    result = result.filter(p => (p.price * priceMultiplier) <= maxPrice);

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'price-low') return (a.price * priceMultiplier) - (b.price * priceMultiplier);
      if (sortBy === 'price-high') return (b.price * priceMultiplier) - (a.price * priceMultiplier);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      
      // Default: Popularity (simulated by number of reviews + average rating)
      const aReviews = reviews[a.id] || [];
      const bReviews = reviews[b.id] || [];
      const aScore = aReviews.length * (aReviews.reduce((sum, r) => sum + r.rating, 0) / (aReviews.length || 1));
      const bScore = bReviews.length * (bReviews.reduce((sum, r) => sum + r.rating, 0) / (bReviews.length || 1));
      return bScore - aScore;
    });

    return result;
  }, [activeCategory, selectedNotes, maxPrice, sortBy, priceMultiplier, reviews]);

  const cartTotalValue = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Math.round(item.price * priceMultiplier) * item.quantity), 0);
  }, [cart, priceMultiplier]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing && !product.isCustom) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
    setQuickViewProduct(null); 
  };

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (id: string) => wishlist.some(p => p.id === id);

  const toggleNote = (note: string) => {
    setSelectedNotes(prev => 
      prev.includes(note) ? prev.filter(n => n !== note) : [...prev, note]
    );
  };

  const addCustomCandle = () => {
    const customProduct: Product = {
      id: `custom-${Date.now()}`,
      name: `Custom Atelier Candle`,
      price: 3499,
      scentProfile: `Custom ${customScent}`,
      description: `A unique creation featuring ${customScent} scent and a ${customColor.name} wax finish.`,
      image: 'https://images.unsplash.com/photo-1595914041113-ef93103233c0?auto=format&fit=crop&q=80&w=800',
      notes: [customScent, 'Custom Label: ' + (customLabel || 'The Original')],
      category: 'Custom',
      isCustom: true,
      customDetails: {
        scent: customScent,
        waxColor: customColor.hex,
        label: customLabel
      }
    };
    addToCart(customProduct);
    setIsBuilderOpen(false);
    setCustomLabel('');
  };

  const handleAddReview = (productId: string) => {
    if (!newReview.name || !newReview.comment) return;
    const review: Review = {
      id: Date.now().toString(),
      productId,
      customerName: newReview.name,
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setReviews(prev => ({
      ...prev,
      [productId]: [review, ...(prev[productId] || [])]
    }));
    setNewReview({ name: '', rating: 5, comment: '' });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleAISearch = async () => {
    if (!aiMood || !aiPreference) return;
    setIsAiLoading(true);
    const rec = await getScentRecommendation(aiMood, aiPreference);
    setAiRecommendation(rec);
    setIsAiLoading(false);
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderStatus('processing');
    setTimeout(() => {
      setCheckoutStep('success');
      setOrderStatus('idle');
    }, 2000);
  };

  const resetAll = () => {
    setCart([]);
    setIsCheckoutOpen(false);
    setCheckoutStep('shipping');
  };

  return (
    <div className="min-h-screen bg-aesthetic-cream overflow-x-hidden selection:bg-sangria/20 selection:text-sangria-dark">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-sangria/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <button className="md:hidden p-2 text-sangria" aria-label="Menu"><Menu size={22} /></button>
            <div className="hidden md:flex space-x-8 text-[10px] font-medium uppercase tracking-[0.4em] text-stone-500">
              <button 
                onClick={() => { setActiveCategory('All'); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }); }}
                className={`transition-colors ${activeCategory === 'All' ? 'text-sangria font-bold underline underline-offset-8' : 'hover:text-sangria'}`}
              >
                Collection
              </button>
              <button onClick={() => setIsBuilderOpen(true)} className="flex items-center gap-2 hover:text-sangria transition-colors">
                <Wand2 size={12} className="text-sangria" /> Atelier
              </button>
              <button onClick={() => setIsAISearchOpen(true)} className="flex items-center gap-2 hover:text-sangria transition-colors">
                <Sparkles size={12} className="text-sangria" /> Scent AI
              </button>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-light tracking-tighter serif cursor-pointer hover:opacity-70 transition-opacity text-sangria" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              LUMIÈRE & CO.
            </h1>
            <div className="flex items-center gap-1 text-[8px] uppercase tracking-[0.3em] text-stone-400 font-semibold">
               <MapPin size={8} className="text-sangria/40" /> {isLoadingLocation ? 'Detecting Studio...' : locationName}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button onClick={() => setIsWishlistOpen(true)} className="relative p-2 text-sangria hover:scale-110 transition-transform active:scale-90" aria-label={`Wishlist (${wishlist.length} items)`}>
              <Heart size={22} className={wishlist.length > 0 ? 'fill-sangria text-sangria' : ''} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-sangria text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-lg">
                  {wishlist.length}
                </span>
              )}
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-sangria hover:scale-110 transition-transform active:scale-90" aria-label={`Shopping Cart (${cart.length} items)`}>
              <ShoppingBag size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-sangria text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-lg border-2 border-white">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1550583724-b26926580ab7?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover opacity-80 scale-105" 
            alt=""
            role="presentation"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-aesthetic-cream via-aesthetic-cream/10 to-transparent"></div>
          <div className="absolute inset-0 bg-sangria/5 mix-blend-multiply"></div>
        </div>
        <div className="relative text-center px-4 max-w-4xl animate-fade-in">
          <span className="uppercase tracking-[0.6em] text-[11px] mb-8 block text-sangria font-bold">Limited Edition Scent Studio</span>
          <h2 className="text-7xl md:text-9xl font-light mb-10 serif leading-tight text-sangria">
            Artisan <br/><span className="italic">Atmospheres.</span>
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-14 py-6 bg-sangria text-white text-[10px] uppercase tracking-[0.4em] hover:bg-sangria-dark transition-all active:scale-95 shadow-2xl font-bold focus:ring-4 focus:ring-sangria/30"
            >
              Enter The Collection
            </button>
            <button 
              onClick={() => setIsBuilderOpen(true)}
              className="px-14 py-6 bg-white/80 backdrop-blur-sm border border-sangria/20 text-sangria text-[10px] uppercase tracking-[0.4em] hover:bg-white transition-all active:scale-95 shadow-sm flex items-center gap-3 font-bold focus:ring-4 focus:ring-sangria/10"
            >
              <Wand2 size={14} /> The Custom Atelier
            </button>
          </div>
        </div>
      </header>

      {/* Main Shop */}
      <main id="shop" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 space-y-10 md:space-y-0">
          <div>
            <h3 className="text-6xl serif font-light mb-6 tracking-tighter text-sangria">The Archive</h3>
            <p className="text-stone-400 font-light max-w-lg leading-relaxed text-sm italic">Each vessel is hand-poured in our studio using sustainable soy wax and rare botanical oils.</p>
          </div>
          
          <div className="flex flex-col items-end gap-6">
             <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide border-b border-sangria/5">
              {['All', 'Floral', 'Fresh', 'Woody', 'Gourmand'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] uppercase tracking-[0.4em] whitespace-nowrap transition-all pb-3 font-bold ${activeCategory === cat ? 'border-b-2 border-sangria text-sangria' : 'text-stone-300 hover:text-sangria'}`}
                  aria-pressed={activeCategory === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
               <button 
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-sangria/10 text-sangria text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-sangria hover:text-white transition-all rounded-full shadow-sm"
              >
                <SlidersHorizontal size={14} /> Filters {selectedNotes.length > 0 && `(${selectedNotes.length})`}
              </button>
              
              <div className="relative group">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-white border border-sangria/10 text-sangria text-[10px] uppercase tracking-[0.3em] font-bold px-8 py-3 rounded-full hover:bg-sangria/5 transition-all outline-none cursor-pointer"
                  aria-label="Sort products"
                >
                  <option value="popularity">Popularity</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Alphabetical</option>
                </select>
                <ArrowUpDown size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-sangria pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Summary Tags */}
        {(selectedNotes.length > 0 || maxPrice < 5000) && (
          <div className="flex flex-wrap gap-3 mb-12 animate-fade-in">
            {selectedNotes.map(note => (
              <button 
                key={note}
                onClick={() => toggleNote(note)}
                className="flex items-center gap-2 px-4 py-2 bg-sangria text-white text-[9px] uppercase tracking-widest rounded-full font-bold hover:bg-sangria-dark transition-colors"
              >
                {note} <X size={10} />
              </button>
            ))}
            {maxPrice < 5000 && (
              <button 
                onClick={() => setMaxPrice(5000)}
                className="flex items-center gap-2 px-4 py-2 bg-sangria text-white text-[9px] uppercase tracking-widest rounded-full font-bold hover:bg-sangria-dark transition-colors"
              >
                Under ₹{maxPrice.toLocaleString('en-IN')} <X size={10} />
              </button>
            )}
            <button 
              onClick={() => { setSelectedNotes([]); setMaxPrice(5000); setActiveCategory('All'); }}
              className="text-[10px] uppercase tracking-widest text-sangria font-bold hover:underline"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-32 min-h-[400px]">
          {filteredAndSortedProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-40 animate-fade-in">
              <p className="text-2xl serif text-sangria/40 italic mb-8">No matching scents found in our archive.</p>
              <button 
                onClick={() => { setSelectedNotes([]); setMaxPrice(5000); setActiveCategory('All'); }}
                className="px-10 py-4 bg-sangria text-white text-[10px] uppercase tracking-[0.4em] font-bold"
              >
                Reset Exploration
              </button>
            </div>
          ) : (
            filteredAndSortedProducts.map(product => {
              const productReviews = reviews[product.id] || [];
              const isExpanded = expandedReviews === product.id;
              const avgRating = productReviews.length 
                ? (productReviews.reduce((a, b) => a + b.rating, 0) / productReviews.length).toFixed(1)
                : null;

              return (
                <article key={product.id} className="group flex flex-col relative" aria-labelledby={`product-title-${product.id}`}>
                  <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 rounded-[2px] mb-10 shadow-premium group-hover:shadow-2xl transition-all duration-700">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 opacity-95 group-hover:opacity-100"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-sangria/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <button 
                      onClick={() => toggleWishlist(product)}
                      className="absolute top-6 right-6 z-10 p-4 bg-white/90 backdrop-blur-md rounded-full text-sangria hover:scale-110 transition-all shadow-lg focus:ring-4 focus:ring-sangria/20"
                      aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart size={18} className={isInWishlist(product.id) ? 'fill-sangria' : ''} />
                    </button>
                    
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col gap-3 w-full px-10 opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-75">
                      <button 
                        onClick={() => setQuickViewProduct(product)}
                        className="w-full bg-white/95 backdrop-blur-sm text-sangria py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-sangria hover:text-white transition-all flex items-center justify-center gap-3 shadow-xl focus:ring-4 focus:ring-sangria/20"
                      >
                        <Eye size={14} /> Inspect Scent
                      </button>
                      <button 
                        onClick={() => addToCart(product)}
                        className="w-full bg-sangria text-white py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-sangria-dark transition-all shadow-xl focus:ring-4 focus:ring-sangria/50"
                      >
                        Acquire — ₹{formatPriceValue(product.price)}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline mb-4">
                    <h4 id={`product-title-${product.id}`} className="text-4xl font-light serif text-sangria group-hover:italic transition-all duration-500">{product.name}</h4>
                    <div className="flex flex-col items-end">
                      <span className="text-sangria-dark font-medium tracking-tight text-xl serif italic">₹{formatPriceValue(product.price)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-stone-400 text-[9px] uppercase tracking-[0.4em] font-bold">{product.scentProfile}</p>
                    {avgRating && (
                      <div className="flex items-center gap-1 text-sangria text-[9px] font-bold" aria-label={`Rating: ${avgRating} out of 5`}>
                        <Star size={10} fill="currentColor" /> {avgRating}
                      </div>
                    )}
                  </div>
                  <p className="text-stone-500 text-sm font-light leading-relaxed mb-8 line-clamp-3 italic opacity-80 group-hover:opacity-100 transition-opacity">{product.description}</p>
                  <div className="flex flex-wrap gap-3 mb-8">
                    {product.notes.map(note => (
                      <span key={note} className="text-[9px] uppercase tracking-widest bg-sangria/5 border border-sangria/10 px-4 py-2 text-sangria font-semibold rounded-full">{note}</span>
                    ))}
                  </div>

                  {/* Reviews Toggle Section */}
                  <div className="mt-auto border-t border-sangria/10 pt-8">
                    <button 
                      onClick={() => setExpandedReviews(isExpanded ? null : product.id)}
                      className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-sangria/60 hover:text-sangria transition-colors font-bold"
                      aria-expanded={isExpanded}
                    >
                      <MessageSquare size={14} />
                      {isExpanded ? 'Fold Journal' : `Customer Journal (${productReviews.length})`}
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-8 space-y-10 animate-fade-in">
                        <div className="space-y-8 max-h-72 overflow-y-auto pr-4 scrollbar-hide">
                          {productReviews.length === 0 ? (
                            <p className="text-[11px] text-stone-400 italic font-light">The journal is empty. Be the first to etch your thoughts.</p>
                          ) : (
                            productReviews.map(rev => (
                              <div key={rev.id} className="border-l-2 border-sangria/10 pl-6 pb-2">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-sangria">{rev.customerName}</span>
                                  <div className="flex items-center gap-1 text-sangria">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={8} fill={i < rev.rating ? "currentColor" : "none"} className={i >= rev.rating ? "opacity-20" : ""} />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-stone-600 font-light italic mb-2 leading-relaxed">"{rev.comment}"</p>
                                <span className="text-[8px] uppercase tracking-widest text-stone-300 font-bold">{rev.date}</span>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="bg-sangria/[0.02] p-6 rounded-sm border border-sangria/5 shadow-sm">
                          <h5 className="text-[10px] uppercase tracking-[0.4em] text-sangria mb-6 font-bold">Write Your Reflection</h5>
                          <div className="space-y-5">
                            <input 
                              placeholder="Your Name"
                              className="w-full bg-transparent border-b border-sangria/10 py-3 text-xs focus:outline-none focus:border-sangria transition-all placeholder:text-stone-300 italic"
                              value={newReview.name}
                              onChange={(e) => setNewReview({...newReview, name: e.target.value})}
                              aria-label="Your Name"
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase tracking-widest text-sangria font-bold">Intensity Scale</span>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button 
                                    key={star} 
                                    onClick={() => setNewReview({...newReview, rating: star})}
                                    className={`transition-all hover:scale-125 ${newReview.rating >= star ? 'text-sangria' : 'text-stone-200'}`}
                                    aria-label={`Rate ${star} stars`}
                                  >
                                    <Star size={16} fill={newReview.rating >= star ? "currentColor" : "none"} />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <textarea 
                              placeholder="Describe the aura created..."
                              className="w-full bg-transparent border border-sangria/10 p-4 text-xs focus:outline-none focus:border-sangria transition-all rounded-sm min-h-[100px] leading-relaxed italic placeholder:text-stone-300"
                              value={newReview.comment}
                              onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                              aria-label="Review comment"
                            />
                            <button 
                              onClick={() => handleAddReview(product.id)}
                              className="w-full py-4 bg-sangria text-white text-[10px] uppercase tracking-[0.4em] hover:bg-sangria-dark transition-all font-bold shadow-lg focus:ring-4 focus:ring-sangria/30"
                            >
                              Submit Entry
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>

      {/* Advanced Filter Panel */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-end">
          <div className="absolute inset-0 bg-sangria/20 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} aria-hidden="true"></div>
          <div className="relative bg-white w-full max-w-md h-full shadow-2xl animate-fade-in flex flex-col p-12 overflow-y-auto border-l border-sangria/5">
            <div className="flex justify-between items-center mb-16">
              <h3 className="text-4xl serif font-light text-sangria italic">Refine Archive</h3>
              <button onClick={() => setIsFilterOpen(false)} className="text-stone-300 hover:text-sangria transition-all" aria-label="Close filters">
                <X size={32} />
              </button>
            </div>

            <div className="space-y-16 flex-grow">
               {/* Categories Section */}
              <section>
                <h4 className="text-[11px] uppercase tracking-[0.5em] text-sangria font-bold mb-8 border-b border-sangria/5 pb-3">Mood Selection</h4>
                <div className="grid grid-cols-2 gap-3">
                  {['All', 'Floral', 'Fresh', 'Woody', 'Gourmand'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-3 text-[10px] uppercase tracking-widest border transition-all font-bold ${activeCategory === cat ? 'bg-sangria text-white border-sangria' : 'bg-transparent text-stone-400 border-stone-100 hover:border-sangria/30'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </section>

              {/* Notes Section */}
              <section>
                <h4 className="text-[11px] uppercase tracking-[0.5em] text-sangria font-bold mb-8 border-b border-sangria/5 pb-3">Olfactory Ingredients</h4>
                <div className="flex flex-wrap gap-3">
                  {allUniqueNotes.map(note => (
                    <button 
                      key={note}
                      onClick={() => toggleNote(note)}
                      className={`px-5 py-3 text-[10px] uppercase tracking-widest border rounded-full transition-all font-bold ${selectedNotes.includes(note) ? 'bg-sangria text-white border-sangria' : 'bg-transparent text-stone-400 border-stone-100 hover:border-sangria/30'}`}
                      aria-pressed={selectedNotes.includes(note)}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </section>

              {/* Price Range Section */}
              <section>
                <h4 className="text-[11px] uppercase tracking-[0.5em] text-sangria font-bold mb-8 border-b border-sangria/5 pb-3">Price Spectrum</h4>
                <div className="space-y-6">
                  <div className="flex justify-between text-xs text-sangria font-bold italic serif">
                    <span>₹0</span>
                    <span>₹{maxPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <input 
                    type="range"
                    min="1000"
                    max="5000"
                    step="100"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full accent-sangria cursor-pointer h-1.5 bg-stone-100 rounded-full appearance-none"
                    aria-label="Maximum price filter"
                  />
                  <div className="flex gap-3">
                    {[1500, 2500, 3500].map(price => (
                      <button 
                        key={price}
                        onClick={() => setMaxPrice(price)}
                        className={`flex-1 py-3 text-[9px] uppercase tracking-widest border transition-all font-bold ${maxPrice === price ? 'bg-sangria text-white border-sangria' : 'text-stone-400 border-stone-100 hover:border-sangria/30'}`}
                      >
                        Under ₹{price.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-16 pt-12 border-t border-sangria/10 flex gap-4">
              <button 
                onClick={() => { setSelectedNotes([]); setMaxPrice(5000); setActiveCategory('All'); }}
                className="flex-1 py-6 border border-sangria/10 text-sangria text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-sangria/5 transition-all"
              >
                Reset All
              </button>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-6 bg-sangria text-white text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-sangria-dark transition-all shadow-xl"
              >
                Apply Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-sangria/40 backdrop-blur-xl" onClick={() => setQuickViewProduct(null)} aria-hidden="true"></div>
          <div className="relative bg-white w-full max-w-5xl rounded-sm shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in max-h-[95vh] border border-white/20" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
            <div className="w-full md:w-1/2 aspect-square md:aspect-auto overflow-hidden bg-stone-100">
              <img 
                src={quickViewProduct.image} 
                alt={quickViewProduct.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-full md:w-1/2 p-10 md:p-16 overflow-y-auto flex flex-col">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.5em] text-sangria font-bold mb-4 block">Archive Selection</span>
                  <h3 id="quick-view-title" className="text-5xl md:text-6xl serif font-light mb-4 text-sangria italic">{quickViewProduct.name}</h3>
                  <p className="text-stone-400 text-[11px] uppercase tracking-[0.5em] font-bold">{quickViewProduct.scentProfile}</p>
                </div>
                <button onClick={() => setQuickViewProduct(null)} className="text-stone-300 hover:text-sangria transition-colors p-2" aria-label="Close quick view">
                  <X size={32} />
                </button>
              </div>

              <div className="mb-12">
                <span className="text-4xl font-light text-sangria tracking-tight serif italic">₹{formatPriceValue(quickViewProduct.price)}</span>
                <p className="text-[8px] uppercase tracking-widest text-stone-300 mt-2 font-bold">Price incl. of all studio taxes</p>
              </div>

              <div className="mb-12">
                <p className="text-stone-600 font-light leading-relaxed italic mb-10 text-base">{quickViewProduct.description}</p>
                <div className="space-y-6">
                  <h4 className="text-[11px] uppercase tracking-[0.4em] text-sangria font-bold border-b border-sangria/5 pb-3">Olfactory Profile</h4>
                  <div className="flex flex-wrap gap-3">
                    {quickViewProduct.notes.map(note => (
                      <span key={note} className="text-[11px] uppercase tracking-[0.2em] bg-sangria/[0.03] border border-sangria/10 px-5 py-3 text-sangria font-semibold rounded-full italic">{note}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto space-y-5">
                <button 
                  onClick={() => addToCart(quickViewProduct)}
                  className="w-full py-7 bg-sangria text-white text-[11px] uppercase tracking-[0.5em] font-bold hover:bg-sangria-dark transition-all shadow-2xl active:scale-[0.98] focus:ring-4 focus:ring-sangria/30"
                >
                  Acquire Vessel — ₹{formatPriceValue(quickViewProduct.price)}
                </button>
                <button 
                  onClick={() => toggleWishlist(quickViewProduct)}
                  className="w-full py-6 border border-sangria/10 text-sangria text-[10px] uppercase tracking-[0.4em] hover:bg-sangria/5 transition-all flex items-center justify-center gap-3 font-bold focus:ring-4 focus:ring-sangria/10"
                >
                  <Heart size={16} className={isInWishlist(quickViewProduct.id) ? 'fill-sangria' : ''} />
                  {isInWishlist(quickViewProduct.id) ? 'In Your Private Archive' : 'Add to Wishlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-[70] transform transition-transform duration-1000 ease-[cubic-bezier(0.16, 1, 0.3, 1)] ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-labelledby="cart-title"
      >
        <div className="h-full flex flex-col p-12">
          <div className="flex justify-between items-center mb-16">
            <h3 id="cart-title" className="text-4xl serif font-light text-sangria italic">Your Selection</h3>
            <button onClick={() => setIsCartOpen(false)} className="text-stone-300 hover:text-sangria transition-all" aria-label="Close cart"><X size={32} /></button>
          </div>

          <div className="flex-grow overflow-y-auto space-y-12 pr-4 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="text-center py-40">
                <ShoppingBag size={48} className="mx-auto text-sangria/5 mb-8" />
                <p className="text-stone-300 italic mb-10 font-light text-base">Your shopping bag is currently silent.</p>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="text-sangria text-[11px] uppercase tracking-[0.5em] border-b-2 border-sangria pb-2 font-bold hover:opacity-70 transition-opacity"
                >
                  Discover Scents
                </button>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-8 group">
                  <div className="w-28 h-36 bg-stone-100 rounded-sm overflow-hidden flex-shrink-0 relative shadow-md">
                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                    {item.isCustom && (
                      <div className="absolute inset-0 opacity-30 mix-blend-multiply" style={{ backgroundColor: item.customDetails?.waxColor }}></div>
                    )}
                  </div>
                  <div className="flex-grow flex flex-col justify-between py-2">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="serif text-2xl leading-tight text-sangria italic">{item.name}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-stone-200 hover:text-sangria transition-colors" aria-label="Remove item">
                          <X size={20} />
                        </button>
                      </div>
                      <p className="text-stone-400 text-[10px] uppercase tracking-[0.4em] mt-3 font-bold">{item.scentProfile}</p>
                    </div>
                    <div className="flex justify-between items-end mt-6">
                      <div className="flex items-center border border-sangria/10 rounded-full px-2 py-1 bg-sangria/[0.01]">
                        <button onClick={() => updateQuantity(item.id, -1)} className="px-4 py-2 hover:text-sangria transition-colors text-stone-300 font-bold" aria-label="Decrease quantity">-</button>
                        <span className="px-3 py-2 text-xs text-sangria font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="px-4 py-2 hover:text-sangria transition-colors text-stone-300 font-bold" aria-label="Increase quantity">+</button>
                      </div>
                      <span className="text-sangria font-bold tracking-tight serif italic text-xl">₹{formatPriceValue(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="mt-12 pt-12 border-t border-sangria/5 space-y-8">
              <div className="flex justify-between text-sm tracking-tight items-baseline">
                <span className="text-stone-400 font-light uppercase tracking-[0.3em] text-[10px] font-bold">Subtotal Investment</span>
                <span className="text-sangria font-bold serif text-2xl italic">₹{cartTotalValue.toLocaleString('en-IN')}</span>
              </div>
              <button 
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-7 bg-sangria text-white text-[11px] uppercase tracking-[0.5em] font-bold hover:bg-sangria-dark transition-all flex items-center justify-center gap-4 active:scale-[0.98] shadow-2xl focus:ring-4 focus:ring-sangria/30"
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal (Steps) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-sangria/40 backdrop-blur-xl p-4">
          <div className="relative bg-white w-full max-w-6xl h-full md:h-[90vh] shadow-2xl rounded-sm overflow-hidden flex flex-col md:flex-row animate-fade-in my-auto border border-white/20" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
            {/* Left Column: Progress & Summary */}
            <div className="w-full md:w-5/12 bg-aesthetic-cream p-12 border-r border-sangria/5 flex flex-col">
              <div className="mb-16">
                <h2 id="checkout-title" className="text-5xl serif mb-10 tracking-tight text-sangria italic">The Transaction</h2>
                <div className="flex items-center gap-3 mb-10 text-[10px] uppercase tracking-[0.4em] text-sangria/40 font-bold italic">
                  <MapPin size={12} className="text-sangria" /> Serving {locationName}
                </div>
                <div className="space-y-8">
                  {[
                    { key: 'shipping', label: '1. Shipping Logistics', icon: <Truck size={16} /> },
                    { key: 'review', label: '2. Review & Security', icon: <CreditCard size={16} /> },
                    { key: 'success', label: '3. Confirmation', icon: <CheckCircle size={16} /> }
                  ].map(step => (
                    <div 
                      key={step.key} 
                      className={`flex items-center gap-5 text-[11px] uppercase tracking-[0.4em] font-bold transition-all ${checkoutStep === step.key ? 'text-sangria' : 'text-stone-300'}`}
                    >
                      <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${checkoutStep === step.key ? 'border-sangria bg-sangria text-white shadow-lg' : 'border-stone-100 bg-white'}`}>
                        {step.icon}
                      </span>
                      {step.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-grow space-y-6">
                <label className="text-[10px] uppercase tracking-[0.5em] text-sangria font-bold">Your Selection</label>
                <div className="max-h-72 overflow-y-auto space-y-5 pr-4 scrollbar-hide">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <span className="text-stone-500 font-light italic truncate max-w-[200px]">{item.name} <span className="text-sangria/30 font-bold">×{item.quantity}</span></span>
                      <span className="text-sangria font-bold serif text-lg italic">₹{formatPriceValue(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 pt-12 border-t border-sangria/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 text-[10px] uppercase tracking-[0.4em] font-bold">Domestic Passage</span>
                  <span className="text-sangria text-[10px] font-bold uppercase tracking-[0.4em] italic">Complimentary</span>
                </div>
                <div className="flex justify-between items-center pt-6">
                  <span className="text-sangria font-bold serif text-2xl italic">Total Due</span>
                  <span className="text-sangria font-bold text-3xl tracking-tight serif italic">₹{cartTotalValue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Step Content */}
            <div className="w-full md:w-7/12 p-12 md:p-20 flex flex-col overflow-y-auto bg-white">
              <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-10 right-12 text-stone-300 hover:text-sangria transition-all" aria-label="Close checkout"><X size={36} /></button>
              
              {checkoutStep === 'shipping' && (
                <div className="animate-fade-in space-y-12">
                  <h3 className="text-4xl md:text-5xl serif font-light leading-snug text-sangria italic">Define Your Destination</h3>
                  <div className="grid grid-cols-1 gap-10">
                    <div className="group">
                      <label htmlFor="full-name" className="block text-[10px] uppercase tracking-[0.5em] text-stone-400 mb-3 group-focus-within:text-sangria transition-colors font-bold">Recipient's Identity</label>
                      <input id="full-name" required type="text" placeholder="Full Legal Name" className="w-full border-b border-sangria/10 py-4 focus:outline-none focus:border-sangria bg-transparent transition-all italic text-sangria placeholder:text-stone-200" value={orderDetails.fullName} onChange={(e) => setOrderDetails({...orderDetails, fullName: e.target.value})} />
                    </div>
                    <div className="group">
                      <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.5em] text-stone-400 mb-3 group-focus-within:text-sangria transition-colors font-bold">Electronic Correspondence</label>
                      <input id="email" required type="email" placeholder="email@example.com" className="w-full border-b border-sangria/10 py-4 focus:outline-none focus:border-sangria bg-transparent transition-all italic text-sangria placeholder:text-stone-200" value={orderDetails.email} onChange={(e) => setOrderDetails({...orderDetails, email: e.target.value})} />
                    </div>
                    <div className="group">
                      <label htmlFor="address" className="block text-[10px] uppercase tracking-[0.5em] text-stone-400 mb-3 group-focus-within:text-sangria transition-colors font-bold">Physical Coordinates</label>
                      <input id="address" required type="text" placeholder="Building, Street, Landmark" className="w-full border-b border-sangria/10 py-4 focus:outline-none focus:border-sangria bg-transparent transition-all italic text-sangria placeholder:text-stone-200" value={orderDetails.address} onChange={(e) => setOrderDetails({...orderDetails, address: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                      <div className="group">
                        <label htmlFor="city" className="block text-[10px] uppercase tracking-[0.5em] text-stone-400 mb-3 group-focus-within:text-sangria transition-colors font-bold">Metropolis</label>
                        <input id="city" required type="text" placeholder="City Name" className="w-full border-b border-sangria/10 py-4 focus:outline-none focus:border-sangria bg-transparent transition-all italic text-sangria placeholder:text-stone-200" value={orderDetails.city} onChange={(e) => setOrderDetails({...orderDetails, city: e.target.value})} />
                      </div>
                      <div className="group">
                        <label htmlFor="zip" className="block text-[10px] uppercase tracking-[0.5em] text-stone-400 mb-3 group-focus-within:text-sangria transition-colors font-bold">Postal Identity</label>
                        <input id="zip" required type="text" placeholder="Pincode" className="w-full border-b border-sangria/10 py-4 focus:outline-none focus:border-sangria bg-transparent transition-all italic text-sangria placeholder:text-stone-200" value={orderDetails.zipCode} onChange={(e) => setOrderDetails({...orderDetails, zipCode: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setCheckoutStep('review')}
                    disabled={!orderDetails.fullName || !orderDetails.address}
                    className="w-full py-7 bg-sangria text-white text-[11px] uppercase tracking-[0.5em] font-bold shadow-2xl hover:bg-sangria-dark transition-all disabled:bg-stone-100 disabled:text-stone-300 mt-8 focus:ring-4 focus:ring-sangria/30"
                  >
                    Continue to Security
                  </button>
                </div>
              )}

              {checkoutStep === 'review' && (
                <div className="animate-fade-in space-y-12">
                  <h3 className="text-4xl md:text-5xl serif font-light text-sangria italic">Refine & Finalize</h3>
                  <div className="bg-sangria/[0.02] p-10 rounded-sm space-y-8 border border-sangria/5 shadow-sm">
                    <div>
                      <h4 className="text-[10px] uppercase tracking-[0.5em] text-stone-400 mb-4 font-bold">Dispatch To</h4>
                      <p className="text-lg text-sangria font-bold serif italic">{orderDetails.fullName}</p>
                      <p className="text-sm text-stone-500 font-light italic leading-relaxed">{orderDetails.address}, {orderDetails.city} {orderDetails.zipCode}</p>
                      <button onClick={() => setCheckoutStep('shipping')} className="text-[10px] uppercase tracking-[0.3em] text-sangria/40 border-b border-sangria/10 mt-4 hover:text-sangria transition-colors font-bold">Modify Details</button>
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase tracking-[0.5em] text-stone-400 mb-6 font-bold">Security Choice</h4>
                      <div className="flex flex-col sm:flex-row gap-6">
                        <button 
                          onClick={() => setOrderDetails({...orderDetails, paymentMethod: 'card'})}
                          className={`flex-1 py-5 px-8 border rounded-sm flex items-center justify-center gap-4 transition-all ${orderDetails.paymentMethod === 'card' ? 'border-sangria bg-white shadow-xl text-sangria font-bold' : 'border-stone-100 opacity-40 grayscale'}`}
                        >
                          <CreditCard size={20} /> <span className="text-[10px] uppercase tracking-[0.3em]">Digital / UPI</span>
                        </button>
                        <button 
                          onClick={() => setOrderDetails({...orderDetails, paymentMethod: 'paypal'})}
                          className={`flex-1 py-5 px-8 border rounded-sm flex items-center justify-center gap-4 transition-all ${orderDetails.paymentMethod === 'paypal' ? 'border-sangria bg-white shadow-xl text-sangria font-bold' : 'border-stone-100 opacity-40 grayscale'}`}
                        >
                          <span className="text-[10px] uppercase tracking-[0.3em]">Bank Ledger</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-5 p-6 border border-sangria/5 rounded-sm bg-sangria/[0.01]">
                    <input type="checkbox" id="terms" required className="accent-sangria w-5 h-5 mt-1 cursor-pointer" />
                    <label htmlFor="terms" className="text-[11px] text-stone-400 leading-relaxed tracking-wide italic cursor-pointer">I acknowledge the artisanal nature of these small-batch creations and agree to the Lumière Studio Terms of Service.</label>
                  </div>

                  <button 
                    onClick={handlePlaceOrder}
                    disabled={orderStatus === 'processing'}
                    className="w-full py-8 bg-sangria text-white text-[11px] uppercase tracking-[0.5em] font-bold shadow-2xl hover:bg-sangria-dark transition-all disabled:bg-stone-100 flex items-center justify-center gap-4 focus:ring-4 focus:ring-sangria/30"
                  >
                    {orderStatus === 'processing' ? 'Processing Transaction...' : `Authorize Entry — ₹${cartTotalValue.toLocaleString('en-IN')}`}
                  </button>
                </div>
              )}

              {checkoutStep === 'success' && (
                <div className="animate-fade-in text-center flex flex-col items-center justify-center py-16">
                  <div className="w-32 h-32 bg-sangria text-white rounded-full flex items-center justify-center mb-12 shadow-[0_0_60px_rgba(110,25,22,0.3)] animate-pulse">
                    <CheckCircle size={56} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-6xl md:text-7xl serif mb-6 tracking-tighter text-sangria leading-tight">Your Essence Is <br/><span className="italic">On Its Way.</span></h3>
                  <p className="text-stone-500 font-light mb-16 max-w-md mx-auto leading-relaxed italic text-base">
                    The Archive has been updated. Our master chandlers in the {locationName} are currently prepping your selection for its safe passage across the regions.
                  </p>
                  <button 
                    onClick={resetAll}
                    className="px-16 py-6 border-2 border-sangria text-sangria text-[11px] uppercase tracking-[0.5em] font-bold hover:bg-sangria hover:text-white transition-all shadow-xl active:scale-95 focus:ring-4 focus:ring-sangria/30"
                  >
                    Return to Archive
                  </button>
                  <p className="mt-12 text-[10px] uppercase tracking-[0.5em] text-sangria/20 font-bold">Portfolio ID: LMR-{Math.floor(Math.random() * 90000) + 10000}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Scent Search Modal */}
      {isAISearchOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-sangria/30 backdrop-blur-2xl" onClick={() => setIsAISearchOpen(false)} aria-hidden="true"></div>
          <div className="relative bg-white w-full max-w-xl rounded-sm shadow-2xl overflow-hidden animate-fade-in border border-white/20" role="dialog" aria-modal="true" aria-labelledby="ai-title">
            <div className="p-12 md:p-16">
              <div className="flex justify-between items-center mb-16">
                <div className="flex items-center gap-4 text-sangria uppercase tracking-[0.5em] text-[11px] font-bold">
                  <Sparkles size={20} className="animate-pulse" />
                  <span id="ai-title">Scent AI Oracle</span>
                </div>
                <button onClick={() => setIsAISearchOpen(false)} className="text-stone-200 hover:text-sangria transition-all" aria-label="Close AI matcher"><X size={28} /></button>
              </div>
              
              <div className="space-y-12">
                <div>
                  <label htmlFor="ai-mood" className="block text-[11px] uppercase tracking-[0.5em] text-sangria mb-4 font-bold">Current Aura</label>
                  <input 
                    id="ai-mood"
                    type="text" 
                    placeholder="e.g. Melancholic, Radiant, Nostalgic..."
                    className="w-full border-b border-sangria/10 py-4 focus:outline-none focus:border-sangria text-sangria bg-transparent transition-all placeholder:text-stone-200 italic font-light"
                    value={aiMood}
                    onChange={(e) => setAiMood(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="ai-pref" className="block text-[11px] uppercase tracking-[0.5em] text-sangria mb-4 font-bold">Sensory Affinities</label>
                  <input 
                    id="ai-pref"
                    type="text" 
                    placeholder="e.g. Rainy days, old books, cedar fire..."
                    className="w-full border-b border-sangria/10 py-4 focus:outline-none focus:border-sangria text-sangria bg-transparent transition-all placeholder:text-stone-200 italic font-light"
                    value={aiPreference}
                    onChange={(e) => setAiPreference(e.target.value)}
                  />
                </div>
                
                {aiRecommendation && (
                  <div className="bg-sangria/[0.03] p-10 rounded-sm border border-sangria/5 animate-fade-in shadow-inner">
                    <p className="text-base font-light italic text-sangria leading-relaxed serif">"{aiRecommendation}"</p>
                  </div>
                )}

                <button 
                  onClick={handleAISearch}
                  disabled={isAiLoading || !aiMood || !aiPreference}
                  className="w-full py-6 bg-sangria text-white text-[11px] uppercase tracking-[0.5em] hover:bg-sangria-dark disabled:bg-stone-100 transition-all flex items-center justify-center gap-4 font-bold shadow-2xl focus:ring-4 focus:ring-sangria/30"
                >
                  {isAiLoading ? "Consulting The Olfactory Archive..." : "Reveal Your Aura"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Builder Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-sangria/20 backdrop-blur-xl" onClick={() => setIsBuilderOpen(false)} aria-hidden="true"></div>
          <div className="relative bg-white w-full max-w-5xl rounded-sm shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in max-h-[95vh]" role="dialog" aria-modal="true" aria-labelledby="builder-title">
            <div className="w-full md:w-1/2 bg-aesthetic-sage flex flex-col items-center justify-center p-16 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
              <div className="absolute top-10 left-10 text-sangria/40 text-[10px] uppercase tracking-[0.6em] font-bold">Atelier Visualization</div>
              <div 
                className="w-60 h-80 shadow-[0_40px_100px_rgba(110,25,22,0.2)] transition-all duration-1000 relative flex items-end justify-center rounded-sm z-10"
                style={{ backgroundColor: customColor.hex }}
              >
                <div className="absolute top-0 w-full h-8 bg-black/5 blur-md"></div>
                <div className="bg-white/95 w-44 h-28 mb-16 shadow-2xl flex flex-col items-center justify-center p-6 text-center border border-sangria/5">
                  <p className="serif text-sm text-sangria leading-tight truncate w-full italic font-bold">{customLabel || "Signature Blend"}</p>
                  <p className="text-[9px] uppercase tracking-[0.4em] text-sangria/40 mt-3 font-bold">{customScent}</p>
                </div>
              </div>
              <p className="mt-16 text-sangria/60 text-[10px] uppercase tracking-[0.5em] font-bold italic z-10">Uniquely Hand-Poured For You</p>
            </div>
            
            <div className="w-full md:w-1/2 p-12 md:p-20 overflow-y-auto bg-white">
              <div className="flex justify-between items-center mb-12">
                <h3 id="builder-title" className="text-5xl serif font-light text-sangria italic">Design Your Essence</h3>
                <button onClick={() => setIsBuilderOpen(false)} className="text-stone-300 hover:text-sangria transition-all" aria-label="Close builder"><X size={32} /></button>
              </div>
              
              <div className="space-y-12">
                <fieldset>
                  <legend className="block text-[11px] uppercase tracking-[0.5em] text-sangria/40 mb-6 font-bold italic">I. Choose Your Base Scent</legend>
                  <div className="grid grid-cols-1 gap-3">
                    {CUSTOM_SCENTS.map(scent => (
                      <button 
                        key={scent}
                        onClick={() => setCustomScent(scent)}
                        className={`text-left px-6 py-4 text-[10px] uppercase tracking-[0.3em] border transition-all font-bold ${customScent === scent ? 'border-sangria bg-sangria text-white shadow-xl scale-[1.02]' : 'border-stone-100 text-stone-400 hover:border-sangria/20'}`}
                      >
                        {scent}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="block text-[11px] uppercase tracking-[0.5em] text-sangria/40 mb-6 font-bold italic">II. Visual Aesthetic</legend>
                  <div className="flex flex-wrap gap-5">
                    {WAX_COLORS.map(color => (
                      <button 
                        key={color.name}
                        onClick={() => setCustomColor(color)}
                        className={`w-12 h-12 rounded-full border-2 transition-all shadow-md ${customColor.name === color.name ? 'border-sangria scale-125 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'} focus:ring-4 focus:ring-sangria/20 outline-none`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                        aria-label={`Select ${color.name} wax color`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-sangria/30 mt-4 italic font-bold uppercase tracking-widest">{customColor.name}</p>
                </fieldset>

                <div>
                  <label htmlFor="custom-label" className="block text-[11px] uppercase tracking-[0.5em] text-sangria/40 mb-3 font-bold italic">III. Personal Etching</label>
                  <input 
                    id="custom-label"
                    maxLength={24}
                    placeholder="Etch your label message..."
                    className="w-full border-b border-sangria/10 py-4 text-sm focus:outline-none focus:border-sangria bg-transparent transition-all placeholder:text-stone-200 italic text-sangria font-light"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                  />
                </div>

                <button 
                  onClick={addCustomCandle}
                  className="w-full py-7 bg-sangria text-white text-[11px] uppercase tracking-[0.5em] font-bold hover:bg-sangria-dark transition-all shadow-2xl mt-10 focus:ring-4 focus:ring-sangria/30"
                >
                  Authorize Design — ₹{formatPriceValue(3499)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aesthetic Footer */}
      <footer className="bg-sangria-dark text-white/50 py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-24">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-5xl serif text-white mb-10 tracking-tighter italic">Lumière & Co.</h2>
            <p className="max-w-md text-white/40 font-light leading-relaxed mb-12 text-base italic">
              "We believe that a scent is more than just a smell; it's a timestamp of a feeling, a bottle for an atmosphere, and a beacon for the soul."
            </p>
            <div className="flex space-x-12">
              {['Journal', 'Archive', 'Atelier', 'Inquiry'].map(link => (
                <a key={link} href="#" className="text-white/30 hover:text-white transition-colors text-[11px] uppercase tracking-[0.5em] font-bold">{link}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white uppercase tracking-[0.4em] text-[11px] mb-10 font-bold">Discovery</h4>
            <ul className="space-y-6 text-[11px] uppercase tracking-[0.3em] font-bold text-white/30">
              <li><a href="#" className="hover:text-white transition-colors">Seasonal Editions</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Curation Kits</a></li>
              <li><a href="#" className="hover:text-white transition-colors">The Subscription</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Studio Locator</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white uppercase tracking-[0.4em] text-[11px] mb-10 font-bold">Reflection</h4>
            <p className="text-xs font-light leading-relaxed mb-10 text-white/30 italic">Etch your email to receive early access to studio drops and curated journals.</p>
            <div className="flex items-center border-b border-white/10 pb-3">
              <input type="email" placeholder="Email Address" className="bg-transparent py-2 w-full text-xs focus:outline-none placeholder:text-white/10 italic text-white" aria-label="Newsletter email" />
              <button className="p-3 text-white hover:scale-125 transition-all" aria-label="Subscribe"><ArrowRight size={18} /></button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between text-[10px] uppercase tracking-[0.5em] text-white/20 font-bold">
          <p>&copy; 2024 Lumière Scent Studio. Registered Artisans. Serving {locationName}.</p>
          <div className="flex space-x-10 mt-8 md:mt-0">
            <a href="#" className="hover:text-white/40 transition-colors">Sustainability Ledger</a>
            <a href="#" className="hover:text-white/40 transition-colors">Privacy Code</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
