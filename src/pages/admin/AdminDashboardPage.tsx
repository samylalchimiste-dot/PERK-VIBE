import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingBag, 
  Layers, 
  Sliders, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  X, 
  AlertCircle, 
  AlertTriangle,
  RefreshCw, 
  Send, 
  ExternalLink,
  ChevronDown,
  Star,
  Flame,
  ArrowUpDown,
  Video,
  Play,
  Loader2
} from 'lucide-react';
import { Product, Category, BrandSettings, ProductStockStatus, ProductPublishStatus } from '../../types';
import { 
  subscribeProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  deleteAllProducts,
  purgeOldProductsOnly,
  purgeAllProductsAndCategories,
  subscribeCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  subscribeBrandSettings,
  updateBrandSettings,
  uploadCatalogImage,
  uploadCatalogVideo,
  compressImageToDataURL,
  resetAndSeedPerkVibesFarmz,
  seedCatalogIfEmpty,
  DEFAULT_BRAND_SETTINGS
} from '../../services/firebase/catalog';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';
import { FirestoreVideoPlayer } from '../../components/common/FirestoreVideoPlayer';

type AdminTab = 'products' | 'categories' | 'brand';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Subscriptions
  useEffect(() => {
    const unsubProds = subscribeProducts((list) => {
      setProducts(list);
      setIsLoading(false);
    });
    const unsubCats = subscribeCategories(setCategories);
    const unsubBrand = subscribeBrandSettings(setBrand);

    return () => {
      unsubProds();
      unsubCats();
      unsubBrand();
    };
  }, []);

  // Notifications / Feedback
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 3500);
  };

  // In-app Confirmation Modal State (replaces all window.confirm)
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'product' | 'category' | 'all_products' | 'purge_old' | 'reseed_farmz';
    product?: Product;
    category?: Category;
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsActionLoading(true);
    try {
      if (itemToDelete.type === 'product' && itemToDelete.product) {
        await deleteProduct(itemToDelete.product.id);
        hapticFeedback('heavy');
        showNotice(`Produit "${itemToDelete.product.name}" supprimé définitivement.`);
      } else if (itemToDelete.type === 'category' && itemToDelete.category) {
        await deleteCategory(itemToDelete.category.id);
        hapticFeedback('heavy');
        showNotice(`Catégorie "${itemToDelete.category.name}" supprimée.`);
      } else if (itemToDelete.type === 'all_products') {
        const count = await deleteAllProducts();
        hapticFeedback('heavy');
        showNotice(`${count} produit(s) effacé(s) de la base de données.`);
      } else if (itemToDelete.type === 'purge_old') {
        const count = await purgeOldProductsOnly();
        hapticFeedback('heavy');
        showNotice(`${count} ancien(s) produit(s) purgé(s).`);
      } else if (itemToDelete.type === 'reseed_farmz') {
        showNotice('Nettoyage et réinitialisation du catalogue PERK VIBES FARMZ...');
        const success = await resetAndSeedPerkVibesFarmz(true);
        hapticFeedback('heavy');
        if (success) {
          showNotice('Catalogue Farmz réinitialisé avec succès (DRY SIFT, FROZEN SIFT, 2x STATIC) !');
        } else {
          showNotice('Erreur lors de la réinitialisation', 'error');
        }
      }
    } catch (err: any) {
      console.error('Action error:', err);
      showNotice(err?.message || 'Erreur lors de l\'action', 'error');
    } finally {
      setIsActionLoading(false);
      setItemToDelete(null);
    }
  };

  // ==========================================
  // PRODUCTS TAB STATE & ACTIONS
  // ==========================================
  const [productSearch, setProductSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStock, setFilterStock] = useState('ALL');

  // Product Modal (Create / Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodFormName, setProdFormName] = useState('');
  const [prodFormDesc, setProdFormDesc] = useState('');
  const [prodFormPrice, setProdFormPrice] = useState<string>('3');
  const [prodFormCurrency, setProdFormCurrency] = useState('€');
  const [prodFormCategory, setProdFormCategory] = useState('');
  const [prodFormStock, setProdFormStock] = useState<ProductStockStatus>('AVAILABLE');
  const [prodFormStatus, setProdFormStatus] = useState<ProductPublishStatus>('published');
  const [prodFormFeatured, setProdFormFeatured] = useState(false);
  const [prodFormIsNew, setProdFormIsNew] = useState(false);
  const [prodFormSku, setProdFormSku] = useState('');
  const [prodFormAvailableUnits, setProdFormAvailableUnits] = useState<number>(25);
  const [prodFormImages, setProdFormImages] = useState<string[]>([]);
  const [storageErrorDetails, setStorageErrorDetails] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [prodFormVideoUrl, setProdFormVideoUrl] = useState('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [manualVideoUrl, setManualVideoUrl] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [prodFormDetails, setProdFormDetails] = useState<Array<{ key: string; value: string }>>([
    { key: 'Filtration', value: '90u / 120u' },
    { key: 'Profil Terpénique', value: 'Gas & Fruits Exotiques' },
    { key: 'Texture', value: 'Cold Cure Bader' },
    { key: 'Origine', value: 'Perk Vibes Farmz' },
  ]);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openNewProductModal = () => {
    hapticFeedback('light');
    setEditingProduct(null);
    setFormError(null);
    setIsSavingProduct(false);
    setProdFormName('');
    setProdFormDesc('');
    setProdFormPrice('3');
    setProdFormCurrency(brand.currency || '€');
    setProdFormCategory(categories[0]?.id || 'cat_dry');
    setProdFormStock('AVAILABLE');
    setProdFormStatus('published');
    setProdFormFeatured(false);
    setProdFormIsNew(true);
    setProdFormSku(`TM-${Math.floor(100 + Math.random() * 900)}`);
    setProdFormAvailableUnits(25);
    setProdFormImages([]);
    setProdFormVideoUrl('');
    setProdFormDetails([
      { key: 'Filtration', value: '90u / 120u' },
      { key: 'Profil Terpénique', value: 'Gas & Fruits Exotiques' },
      { key: 'Texture', value: 'Cold Cure Bader' },
      { key: 'Origine', value: 'TRICHOME MONTANE' },
    ]);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (p: Product) => {
    hapticFeedback('light');
    setEditingProduct(p);
    setFormError(null);
    setIsSavingProduct(false);
    setProdFormName(p.name);
    setProdFormDesc(p.description || '');
    setProdFormPrice(String(p.price));
    setProdFormCurrency(p.currency || '€');
    setProdFormCategory(p.categoryId || categories[0]?.id || 'cat_dry');
    setProdFormStock(p.stock);
    setProdFormStatus(p.status);
    setProdFormFeatured(p.featured);
    setProdFormIsNew(p.isNew);
    setProdFormSku(p.sku || `TM-${Math.floor(100 + Math.random() * 900)}`);
    setProdFormAvailableUnits(p.availableUnits || 25);
    setProdFormImages(p.images && p.images.length > 0 ? p.images : (p.mainImage ? [p.mainImage] : []));
    setProdFormVideoUrl(p.videoUrl || '');
    
    const detailsArr = p.details 
      ? Object.entries(p.details).map(([key, value]) => ({ key, value }))
      : [];
    setProdFormDetails(detailsArr.length > 0 ? detailsArr : [
      { key: 'Filtration', value: '90u / 120u' },
      { key: 'Profil Terpénique', value: 'Heavy Gas' },
      { key: 'Texture', value: 'Cold Cure Bader' }
    ]);
    setIsProductModalOpen(true);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setPendingFiles(fileList);
    setStorageErrorDetails(null);
    setIsUploadingImage(true);
    setUploadProgress(20);

    try {
      const totalFiles = fileList.length;
      for (let i = 0; i < totalFiles; i++) {
        const file = fileList[i];
        const baseOffset = Math.round(((i + 0.2) / totalFiles) * 100);
        setUploadProgress(Math.max(20, baseOffset));

        const url = await uploadCatalogImage(file, 'products/photos', (pct) => {
          const overall = Math.round(((i + pct / 100) / totalFiles) * 100);
          setUploadProgress(Math.max(20, Math.min(100, overall)));
        });

        // Add dynamically so the preview shows immediately!
        setProdFormImages((prev) => [...prev, url]);
      }
      hapticFeedback('medium');
      playClickSound();
      showNotice(`${fileList.length} photo(s) ajoutée(s) et optimisée(s) HD avec succès !`);
      setPendingFiles([]);
      setStorageErrorDetails(null);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      // Emergency local fallback:
      try {
        const localFallbacks: string[] = [];
        for (const file of fileList) {
          const dataUrl = await compressImageToDataURL(file, 1200, 0.82);
          localFallbacks.push(dataUrl);
        }
        setProdFormImages((prev) => [...prev, ...localFallbacks]);
        showNotice(`${localFallbacks.length} photo(s) ajoutée(s) avec succès !`);
      } catch {
        showNotice("Erreur lors de l'envoi des photos", 'error');
      }
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSavePendingFilesAsHD = async () => {
    if (pendingFiles.length === 0) return;
    try {
      showNotice('Traitement HD de votre photo en cours...');
      const localUrls: string[] = [];
      for (const file of pendingFiles) {
        const dataUrl = await compressImageToDataURL(file, 1200, 0.85);
        localUrls.push(dataUrl);
      }
      setProdFormImages((prev) => [...prev, ...localUrls]);
      setStorageErrorDetails(null);
      setPendingFiles([]);
      showNotice(`${localUrls.length} photo(s) personnelle(s) ajoutée(s) avec succès !`);
    } catch (err: any) {
      showNotice('Impossible de traiter la photo', 'error');
    }
  };

  const handleVideoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploadingVideo(true);
    setVideoUploadProgress(10);
    setStorageErrorDetails(null);

    try {
      if (file.size > 25 * 1024 * 1024) {
        throw new Error('Vidéo trop volumineuse (> 25 Mo). Veuillez utiliser un fichier de moins de 25 Mo.');
      }

      showNotice('Sauvegarde de la vidéo sur Firestore...');
      const downloadUrl = await uploadCatalogVideo(file, (pct) => {
        setVideoUploadProgress(Math.max(10, pct));
      });
      setProdFormVideoUrl(downloadUrl);
      showNotice('Vidéo enregistrée sur Firestore avec succès !');
    } catch (err: any) {
      console.warn('Video upload to Firestore error:', err);
      const msg = err?.message || 'Erreur lors de l\'enregistrement de la vidéo sur Firestore';
      setStorageErrorDetails(msg);
      showNotice(msg, 'error');
    } finally {
      setIsUploadingVideo(false);
      setVideoUploadProgress(0);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleAddManualUrl = () => {
    if (!manualImageUrl.trim()) return;
    setProdFormImages((prev) => [...prev, manualImageUrl.trim()]);
    setManualImageUrl('');
    showNotice('Image URL ajoutée');
  };

  const handleSetMainImage = (index: number) => {
    if (index === 0) return;
    setProdFormImages((prev) => {
      const copy = [...prev];
      const selected = copy.splice(index, 1)[0];
      return [selected, ...copy];
    });
    hapticFeedback('light');
  };

  const handleRemoveImage = (index: number) => {
    setProdFormImages((prev) => prev.filter((_, i) => i !== index));
    hapticFeedback('light');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = prodFormName.trim();
    if (!trimmedName) {
      const msg = 'Veuillez renseigner le nom du produit (strain / batch)';
      setFormError(msg);
      showNotice(msg, 'error');
      return;
    }

    const priceNum = parseFloat(prodFormPrice) || 0;
    const catObj = categories.find((c) => c.id === prodFormCategory);
    const categoryName = catObj ? catObj.name : (categories[0]?.name || 'DRY SIFT');
    const categoryId = prodFormCategory || categories[0]?.id || 'cat_dry';

    // Ensure we have at least one image - if not provided by user, supply a clean extraction photo so publishing NEVER blocks
    let imagesToSave = prodFormImages;
    if (imagesToSave.length === 0) {
      const defaultCover = 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=75';
      imagesToSave = [defaultCover];
    }

    // Safety: limit images to avoid exceeding Firestore's 1MB document limit
    if (imagesToSave.length > 5) {
      imagesToSave = imagesToSave.slice(0, 5);
    }

    const detailsRecord: Record<string, string> = {};
    for (const d of prodFormDetails) {
      if (d.key.trim() && d.value.trim()) {
        detailsRecord[d.key.trim()] = d.value.trim();
      }
    }

    // Clean video URL
    let cleanVideoUrl = prodFormVideoUrl.trim();

    setIsSavingProduct(true);
    try {
      if (editingProduct) {
        // Update
        await updateProduct(editingProduct.id, {
          name: trimmedName,
          description: prodFormDesc.trim(),
          price: priceNum,
          currency: prodFormCurrency || '€',
          categoryId,
          categoryName,
          stock: prodFormStock,
          status: prodFormStatus,
          featured: prodFormFeatured,
          isNew: prodFormIsNew,
          sku: prodFormSku.trim(),
          availableUnits: Number(prodFormAvailableUnits) || 25,
          images: imagesToSave,
          mainImage: imagesToSave[0],
          videoUrl: cleanVideoUrl || '',
          details: detailsRecord,
        });
        showNotice('Produit mis à jour avec succès !');
      } else {
        // Create
        await createProduct({
          name: trimmedName,
          description: prodFormDesc.trim(),
          price: priceNum,
          currency: prodFormCurrency || '€',
          categoryId,
          categoryName,
          stock: prodFormStock,
          status: prodFormStatus,
          featured: prodFormFeatured,
          isNew: prodFormIsNew,
          sku: prodFormSku.trim() || `TM-${Math.floor(100 + Math.random() * 900)}`,
          availableUnits: Number(prodFormAvailableUnits) || 25,
          images: imagesToSave,
          mainImage: imagesToSave[0],
          videoUrl: cleanVideoUrl || '',
          details: detailsRecord,
          createdAt: Date.now(),
        });
        showNotice('Nouveau produit publié et ajouté au menu !');
      }
      hapticFeedback('medium');
      playClickSound();
      setIsProductModalOpen(false);
    } catch (err: any) {
      console.error('Error saving product:', err);
      const msg = err?.message || 'Erreur lors de la publication du produit';
      setFormError(msg);
      showNotice(msg, 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = (p: Product) => {
    hapticFeedback('medium');
    setItemToDelete({ type: 'product', product: p });
  };

  const handleToggleProductStatus = async (p: Product) => {
    const nextStatus: ProductPublishStatus = p.status === 'published' ? 'hidden' : 'published';
    try {
      await updateProduct(p.id, { status: nextStatus });
      showNotice(nextStatus === 'published' ? 'Produit publié au menu' : 'Produit masqué du menu');
    } catch (err) {
      showNotice('Erreur mise à jour', 'error');
    }
  };

  const handleQuickStockChange = async (p: Product, newStock: ProductStockStatus) => {
    try {
      await updateProduct(p.id, { stock: newStock });
      showNotice(`Stock mis à jour : ${newStock}`);
    } catch (err) {
      showNotice('Erreur mise à jour du stock', 'error');
    }
  };

  // Filtered product list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filterCategory !== 'ALL' && p.categoryId !== filterCategory) return false;
      if (filterStock !== 'ALL' && p.stock !== filterStock) return false;
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, filterCategory, filterStock, productSearch]);

  // ==========================================
  // CATEGORIES TAB STATE & ACTIONS
  // ==========================================
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catFormName, setCatFormName] = useState('');
  const [catFormSlug, setCatFormSlug] = useState('');
  const [catFormDesc, setCatFormDesc] = useState('');
  const [catFormImage, setCatFormImage] = useState('');
  const [catFormOrder, setCatFormOrder] = useState<number>(1);
  const [isUploadingCatImage, setIsUploadingCatImage] = useState(false);

  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCatFormName('');
    setCatFormSlug('');
    setCatFormDesc('');
    setCatFormImage('');
    setCatFormOrder(categories.length + 1);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatFormName(cat.name);
    setCatFormSlug(cat.slug);
    setCatFormDesc(cat.description || '');
    setCatFormImage(cat.image || '');
    setCatFormOrder(cat.order || 1);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormName.trim()) {
      showNotice('Le nom de la catégorie est obligatoire', 'error');
      return;
    }

    const slug = catFormSlug.trim() || catFormName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: catFormName.trim(),
          slug,
          description: catFormDesc.trim(),
          image: catFormImage.trim(),
          order: Number(catFormOrder) || 1,
        });
        showNotice('Catégorie mise à jour');
      } else {
        await createCategory({
          name: catFormName.trim(),
          slug,
          description: catFormDesc.trim(),
          image: catFormImage.trim(),
          order: Number(catFormOrder) || 1,
        });
        showNotice('Catégorie créée');
      }
      setIsCategoryModalOpen(false);
    } catch (err) {
      console.error(err);
      showNotice('Erreur lors de la sauvegarde de la catégorie', 'error');
    }
  };

  const handleDeleteCategory = (cat: Category) => {
    hapticFeedback('medium');
    setItemToDelete({ type: 'category', category: cat });
  };

  // ==========================================
  // BRAND SETTINGS TAB STATE & ACTIONS
  // ==========================================
  const [brandFormName, setBrandFormName] = useState(brand.brandName || 'TRICHOME MONTANE');
  const [brandFormTagline, setBrandFormTagline] = useState(brand.tagline || '');
  const [brandFormDesc, setBrandFormDesc] = useState(brand.description || '');
  const [brandFormCurrency, setBrandFormCurrency] = useState(brand.currency || '€');
  const [brandFormHeroCta, setBrandFormHeroCta] = useState(brand.heroCtaText || 'Explorer le Menu');
  const [brandFormBadge, setBrandFormBadge] = useState(brand.badgeText || 'Collection 2026');

  const [brandFormProfileImg, setBrandFormProfileImg] = useState(brand.profileImage || '');
  const [brandFormCoverImg, setBrandFormCoverImg] = useState(brand.coverImage || '');

  const [brandFormTelegramBot, setBrandFormTelegramBot] = useState(brand.contactLinks?.botUsername || 'F2nOfficiel_Bot');
  const [brandFormTelegramUrl, setBrandFormTelegramUrl] = useState(brand.contactLinks?.botUrl || 'https://t.me/F2nOfficiel_Bot');
  const [brandFormChannel, setBrandFormChannel] = useState(brand.contactLinks?.channel || '');
  const [brandFormWhatsApp, setBrandFormWhatsApp] = useState(brand.contactLinks?.whatsapp || '');
  const [brandFormInstagram, setBrandFormInstagram] = useState(brand.contactLinks?.instagram || '');

  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Sync brand state when loaded
  useEffect(() => {
    setBrandFormName(brand.brandName || 'TRICHOME MONTANE');
    setBrandFormTagline(brand.tagline || '');
    setBrandFormDesc(brand.description || '');
    setBrandFormCurrency(brand.currency || '€');
    setBrandFormHeroCta(brand.heroCtaText || 'Explorer le Menu');
    setBrandFormBadge(brand.badgeText || 'Collection 2026');
    setBrandFormProfileImg(brand.profileImage || '');
    setBrandFormCoverImg(brand.coverImage || '');
    setBrandFormTelegramBot(brand.contactLinks?.botUsername || 'F2nOfficiel_Bot');
    setBrandFormTelegramUrl(brand.contactLinks?.botUrl || 'https://t.me/F2nOfficiel_Bot');
    setBrandFormChannel(brand.contactLinks?.channel || '');
    setBrandFormWhatsApp(brand.contactLinks?.whatsapp || '');
    setBrandFormInstagram(brand.contactLinks?.instagram || '');
  }, [brand]);

  const handleProfileImageUpload = async (file: File) => {
    setIsUploadingProfile(true);
    try {
      const url = await uploadCatalogImage(file, 'brand_logo');
      setBrandFormProfileImg(url);
      showNotice('Logo / Photo de profil téléversée avec succès');
    } catch (err) {
      showNotice('Erreur téléversement logo', 'error');
    } finally {
      setIsUploadingProfile(false);
    }
  };

  const handleCoverImageUpload = async (file: File) => {
    setIsUploadingCover(true);
    try {
      const url = await uploadCatalogImage(file, 'brand_cover');
      setBrandFormCoverImg(url);
      showNotice('Photo de couverture téléversée avec succès');
    } catch (err) {
      showNotice('Erreur téléversement couverture', 'error');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSaveBrandSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBrand(true);
    try {
      await updateBrandSettings({
        brandName: brandFormName.trim(),
        tagline: brandFormTagline.trim(),
        description: brandFormDesc.trim(),
        currency: brandFormCurrency.trim(),
        heroCtaText: brandFormHeroCta.trim(),
        badgeText: brandFormBadge.trim(),
        profileImage: brandFormProfileImg.trim(),
        coverImage: brandFormCoverImg.trim(),
        contactLinks: {
          botUsername: brandFormTelegramBot.trim().replace(/^@/, ''),
          botUrl: brandFormTelegramUrl.trim() || `https://t.me/${brandFormTelegramBot.trim().replace(/^@/, '')}`,
          channel: brandFormChannel.trim(),
          whatsapp: brandFormWhatsApp.trim(),
          instagram: brandFormInstagram.trim(),
        },
      });
      showNotice('Paramètres et visuels de marque enregistrés !');
    } catch (err) {
      console.error(err);
      showNotice('Erreur lors de la sauvegarde des paramètres', 'error');
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleReloadDemoCatalog = () => {
    setItemToDelete({ type: 'reseed_farmz' });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Notice Toast */}
      {notice && (
        <div
          className={`fixed top-16 right-4 z-[99999] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl text-xs font-medium animate-in fade-in slide-in-from-top-4 duration-200 ${
            notice.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/50'
          }`}
        >
          {notice.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Main Admin Navigation Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            Gestion du Menu · TRICHOME MONTANE
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Gérez vos produits (Dry Sift, Frozen Sift, 2x Static), stocks et identité.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Reset / Re-seed Button */}
          <button
            onClick={() => {
              hapticFeedback('medium');
              setItemToDelete({ type: 'reseed_farmz' });
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/40 text-amber-300 hover:text-white text-xs font-semibold transition"
            title="Réinitialiser et recharger le menu officiel TRICHOME MONTANE"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Recharger Menu Officiel</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <button
            onClick={() => {
              setActiveTab('products');
              hapticFeedback('light');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'products'
                ? 'bg-white text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Produits ({products.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('categories');
              hapticFeedback('light');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'categories'
                ? 'bg-white text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Catégories ({categories.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('brand');
              hapticFeedback('light');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'brand'
                ? 'bg-white text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Marque & Visuels</span>
          </button>
        </div>
      </div>
    </div>

      {/* ========================================================================= */}
      {/* 1. PRODUITS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111114] p-3.5 rounded-2xl border border-zinc-800/80">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Rechercher par nom, référence SKU..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
                />
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-zinc-500"
              >
                <option value="ALL">Toutes les catégories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Stock Filter */}
              <select
                value={filterStock}
                onChange={(e) => setFilterStock(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-zinc-500"
              >
                <option value="ALL">Tous les stocks</option>
                <option value="AVAILABLE">En Stock (Available)</option>
                <option value="LOW_STOCK">Stock Faible (Low Stock)</option>
                <option value="SOLD_OUT">Épuisé (Sold Out)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => {
                  hapticFeedback('medium');
                  setItemToDelete({ type: 'purge_old' });
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium text-xs rounded-xl transition active:scale-95"
                title="Supprimer définitivement tous les anciens produits hors menu"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Purger Anciens Produits</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  hapticFeedback('medium');
                  setItemToDelete({ type: 'all_products' });
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium text-xs rounded-xl transition active:scale-95"
                title="Supprimer tous les produits actuels du catalogue"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Vider Catalogue</span>
              </button>

              <button
                type="button"
                onClick={openNewProductModal}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Produit</span>
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="rounded-2xl border border-zinc-800/80 bg-[#111114] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-900/80 text-zinc-400 font-mono uppercase text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Produit / Strain & Visuel</th>
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4">Prix</th>
                    <th className="py-3 px-4">Disponibilité</th>
                    <th className="py-3 px-4">Visibilité</th>
                    <th className="py-3 px-4">Badges</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => {
                      const img = p.mainImage || p.images?.[0];
                      return (
                        <tr key={p.id} className="hover:bg-zinc-900/40 transition">
                          {/* Image & Title */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                                <img src={img} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="font-semibold text-white text-sm">
                                  {p.name}
                                </div>
                                <div className="text-[10px] font-mono text-zinc-500">
                                  Réf: {p.sku || 'PVF-STD'} · {p.images?.length || 1} photo(s)
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 text-zinc-400 font-mono">
                            {p.categoryName || 'Catalogue'}
                          </td>

                          {/* Price */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-white text-sm font-mono">
                              {p.price} {p.currency || '€'}
                            </span>
                          </td>

                          {/* Stock Selector Pill */}
                          <td className="py-3 px-4">
                            <div className="relative inline-block">
                              <select
                                value={p.stock}
                                onChange={(e) => handleQuickStockChange(p, e.target.value as ProductStockStatus)}
                                className={`text-[11px] font-mono font-bold rounded-lg px-2.5 py-1 border transition appearance-none pr-6 cursor-pointer ${
                                  p.stock === 'AVAILABLE'
                                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                                    : p.stock === 'LOW_STOCK'
                                    ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                                }`}
                              >
                                <option value="AVAILABLE">AVAILABLE (En Stock)</option>
                                <option value="LOW_STOCK">LOW STOCK (Limité)</option>
                                <option value="SOLD_OUT">SOLD OUT (Épuisé)</option>
                              </select>
                              <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleProductStatus(p)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition ${
                                p.status === 'published'
                                  ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                                  : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                              }`}
                              title="Cliquer pour changer la visibilité"
                            >
                              {p.status === 'published' ? (
                                <>
                                  <Eye className="w-3 h-3 text-emerald-400" />
                                  <span>Publié</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 text-rose-400" />
                                  <span>Masqué</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Badges */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              {p.featured && (
                                <span className="p-1 rounded bg-zinc-800 text-zinc-200" title="En Vedette (Featured)">
                                  <Star className="w-3 h-3 fill-zinc-300 text-zinc-300" />
                                </span>
                              )}
                              {p.isNew && (
                                <span className="p-1 rounded bg-white text-zinc-950" title="Nouveauté (New)">
                                  <Flame className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action buttons */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditProductModal(p)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                                title="Modifier le produit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                                title="Supprimer définitivement"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-500">
                        Aucun produit ne correspond aux filtres.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CATÉGORIES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#111114] p-3.5 rounded-2xl border border-zinc-800/80">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Catégories & Collections ({categories.length})
              </h2>
              <p className="text-[11px] text-zinc-400">
                Ces univers apparaissent dans le menu de sélection et sur la page d'accueil.
              </p>
            </div>
            <button
              onClick={openNewCategoryModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Catégorie</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#111114] border border-zinc-800/80 hover:border-zinc-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 flex items-center justify-center">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Layers className="w-6 h-6 text-zinc-600" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      Ordre : {cat.order}
                    </span>
                    <h3 className="font-bold text-white text-sm">{cat.name}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-1">{cat.description || 'Collection officielle'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={() => openEditCategoryModal(cat)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                    title="Modifier"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MARQUE & VISUELS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'brand' && (
        <form onSubmit={handleSaveBrandSettings} className="space-y-6">
          <div className="bg-[#111114] p-5 rounded-3xl border border-zinc-800/80 space-y-6">
            <div>
              <h2 className="text-base font-extrabold uppercase tracking-tight text-white">
                Identité Visuelle & Boutique PERK VIBES FARMZ
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configurez la photo de profil, la bannière d'arrière-plan, les textes et les liens officiels.
              </p>
            </div>

            {/* Visuals Section: Logo & Cover */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-zinc-800/80">
              {/* Profile Photo / Logo */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">
                    Photo de Profil / Logo Circulaire
                  </label>
                  {brandFormProfileImg && (
                    <button
                      type="button"
                      onClick={() => setBrandFormProfileImg('')}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-950 border-2 border-zinc-700 shrink-0 shadow-lg flex items-center justify-center">
                    {brandFormProfileImg ? (
                      <img src={brandFormProfileImg} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-black text-lg text-emerald-400">PVF</span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <label className="block">
                      <span className="sr-only">Téléverser photo de profil</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleProfileImageUpload(e.target.files[0]);
                        }}
                        disabled={isUploadingProfile}
                        className="block w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white file:text-zinc-950 hover:file:bg-zinc-200 cursor-pointer"
                      />
                    </label>
                    <input
                      type="url"
                      value={brandFormProfileImg}
                      onChange={(e) => setBrandFormProfileImg(e.target.value)}
                      placeholder="Ou coller une URL d'image..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Background Banner */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">
                    Photo de Couverture / Arrière-Plan
                  </label>
                  {brandFormCoverImg && (
                    <button
                      type="button"
                      onClick={() => setBrandFormCoverImg('')}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="h-20 w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 relative">
                    {brandFormCoverImg ? (
                      <img src={brandFormCoverImg} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 font-mono">
                        Aucune image de couverture
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleCoverImageUpload(e.target.files[0]);
                      }}
                      disabled={isUploadingCover}
                      className="block w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white file:text-zinc-950 hover:file:bg-zinc-200 cursor-pointer"
                    />
                    <input
                      type="url"
                      value={brandFormCoverImg}
                      onChange={(e) => setBrandFormCoverImg(e.target.value)}
                      placeholder="Ou coller une URL d'image de couverture..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Brand General Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Nom de la Marque
                </label>
                <input
                  type="text"
                  value={brandFormName}
                  onChange={(e) => setBrandFormName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Slogan Court / Tagline
                </label>
                <input
                  type="text"
                  value={brandFormTagline}
                  onChange={(e) => setBrandFormTagline(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Description de la Vitrine
                </label>
                <textarea
                  rows={2}
                  value={brandFormDesc}
                  onChange={(e) => setBrandFormDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Texte du Bouton Hero
                </label>
                <input
                  type="text"
                  value={brandFormHeroCta}
                  onChange={(e) => setBrandFormHeroCta(e.target.value)}
                  placeholder="Découvrir la Collection"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Badge en haut à gauche
                </label>
                <input
                  type="text"
                  value={brandFormBadge}
                  onChange={(e) => setBrandFormBadge(e.target.value)}
                  placeholder="Édition Spéciale 2026"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            {/* Telegram & Contact Channels */}
            <div className="pt-4 border-t border-zinc-800/80 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                <span>Canaux & Bot de Commande Telegram</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    Username Bot Telegram (sans @)
                  </label>
                  <input
                    type="text"
                    value={brandFormTelegramBot}
                    onChange={(e) => setBrandFormTelegramBot(e.target.value)}
                    placeholder="PerkVibesFarmz_Bot"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Utilisé pour les boutons "Commander via Telegram"
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    Canal Telegram Annonces (URL)
                  </label>
                  <input
                    type="url"
                    value={brandFormChannel}
                    onChange={(e) => setBrandFormChannel(e.target.value)}
                    placeholder="https://t.me/PerkVibesFarmz"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    Numéro WhatsApp (avec indicatif ex: +336...)
                  </label>
                  <input
                    type="text"
                    value={brandFormWhatsApp}
                    onChange={(e) => setBrandFormWhatsApp(e.target.value)}
                    placeholder="+33612345678"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    Instagram (@compte)
                  </label>
                  <input
                    type="text"
                    value={brandFormInstagram}
                    onChange={(e) => setBrandFormInstagram(e.target.value)}
                    placeholder="@perkvibesfarmz"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReloadDemoCatalog}
                className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recharger les données de démonstration</span>
              </button>

              <button
                type="submit"
                disabled={isSavingBrand}
                className="px-6 py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-xl active:scale-95"
              >
                {isSavingBrand ? 'Enregistrement...' : 'Enregistrer la Marque'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* PRODUCT MODAL (ADD / EDIT) */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#121216] border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                {editingProduct ? 'Modifier le Produit' : 'Ajouter un Produit (DRY, FROZEN, STATIC)'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Form Inline Error Alert */}
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/70 text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              {/* Quick Fill Extraction Presets */}
              <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    ⚡ Remplissage Rapide Spécialités Farmz :
                  </span>
                  <span className="text-[10px] text-zinc-400">Pré-remplit catégorie et caractéristiques</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cat = categories.find((c) => c.name.toUpperCase().includes('STATIC')) || categories[0];
                      if (cat) setProdFormCategory(cat.id);
                      setProdFormDetails([
                        { key: 'Filtration', value: '2x Static 99% Pure Heads' },
                        { key: 'Profil Terpénique', value: 'Heavy Gas & Sweet Candy' },
                        { key: 'Texture', value: 'Glassy Full Melt' },
                        { key: 'Origine', value: 'TRICHOME MONTANE' },
                      ]);
                      if (!prodFormName) setProdFormName('Gelato 33 2x Static');
                      hapticFeedback('medium');
                    }}
                    className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 hover:bg-purple-900/40 text-purple-300 font-bold text-[11px] flex items-center justify-center gap-1 transition"
                  >
                    <span>⚡ 2X STATIC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const cat = categories.find((c) => c.name.toUpperCase().includes('WPFF')) || categories[0];
                      if (cat) setProdFormCategory(cat.id);
                      setProdFormDetails([
                        { key: 'Filtration', value: 'Fresh Frozen Live Rosin 90u-120u' },
                        { key: 'Profil Terpénique', value: 'Fresh Terps & Fruits Exotiques' },
                        { key: 'Texture', value: 'Cold Cure Jam' },
                        { key: 'Origine', value: 'TRICHOME MONTANE' },
                      ]);
                      if (!prodFormName) setProdFormName('Papaya Fresh Frozen WPFF');
                      hapticFeedback('medium');
                    }}
                    className="p-2 rounded-xl bg-pink-950/40 border border-pink-500/30 hover:bg-pink-900/40 text-pink-300 font-bold text-[11px] flex items-center justify-center gap-1 transition"
                  >
                    <span>💧 WPFF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const cat = categories.find((c) => c.name.toUpperCase().includes('DRY')) || categories[0];
                      if (cat) setProdFormCategory(cat.id);
                      setProdFormDetails([
                        { key: 'Filtration', value: '90u - 120u Traditionnel' },
                        { key: 'Profil Terpénique', value: 'Terreux & Épicé / Piquant' },
                        { key: 'Texture', value: 'Sable Doré affiné' },
                        { key: 'Origine', value: 'TRICHOME MONTANE' },
                      ]);
                      if (!prodFormName) setProdFormName('Kosher Kush Dry Sift 120u');
                      hapticFeedback('medium');
                    }}
                    className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/40 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1 transition"
                  >
                    <span>🌾 DRY SIFT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const cat = categories.find((c) => c.name.toUpperCase().includes('FROZEN')) || categories[0];
                      if (cat) setProdFormCategory(cat.id);
                      setProdFormDetails([
                        { key: 'Filtration', value: '73u - 90u Cryogénique' },
                        { key: 'Profil Terpénique', value: 'Fresh Frozen Terps Fruité' },
                        { key: 'Texture', value: 'Cold Cure Bader' },
                        { key: 'Origine', value: 'TRICHOME MONTANE' },
                      ]);
                      if (!prodFormName) setProdFormName('Tangie Papaya Frozen Sift 90u');
                      hapticFeedback('medium');
                    }}
                    className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/40 text-cyan-300 font-bold text-[11px] flex items-center justify-center gap-1 transition"
                  >
                    <span>❄️ FROZEN SIFT</span>
                  </button>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 font-mono uppercase mb-1">
                    Nom du Produit / Strain *
                  </label>
                  <input
                    type="text"
                    value={prodFormName}
                    onChange={(e) => {
                      setProdFormName(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Ex: Wedding Cake x Gelato 33 2x Static ou Tangie Papaya 90u"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-zinc-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono uppercase mb-1">
                    Catégorie (Extraction) *
                  </label>
                  <select
                    value={prodFormCategory}
                    onChange={(e) => setProdFormCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-zinc-500 text-xs"
                  >
                    {categories.length === 0 ? (
                      <>
                        <option value="cat_dry">DRY SIFT</option>
                        <option value="cat_frozen">FROZEN SIFT</option>
                        <option value="cat_static">2X STATIC</option>
                      </>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-zinc-400 font-mono uppercase mb-1">
                      Prix au gramme (€/g) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: 3"
                      value={prodFormPrice}
                      onChange={(e) => setProdFormPrice(e.target.value)}
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-zinc-500 text-xs font-mono"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-zinc-400 font-mono uppercase mb-1">
                      Devise
                    </label>
                    <input
                      type="text"
                      value={prodFormCurrency}
                      onChange={(e) => setProdFormCurrency(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-zinc-500 text-xs font-mono text-center"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono -mt-2">
                  💡 Calcul automatique des paliers : 5g ({Number(prodFormPrice || 0) * 5}€), 10g ({Number(prodFormPrice || 0) * 10}€), 25g ({Number(prodFormPrice || 0) * 25}€), 50g ({Number(prodFormPrice || 0) * 50}€), 100g ({Number(prodFormPrice || 0) * 100}€)
                </p>

                <div>
                  <label className="block text-zinc-400 font-mono uppercase mb-1">
                    Disponibilité (Stock) *
                  </label>
                  <select
                    value={prodFormStock}
                    onChange={(e) => setProdFormStock(e.target.value as ProductStockStatus)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-zinc-500 text-xs font-mono"
                  >
                    <option value="AVAILABLE">AVAILABLE (En Stock - Prêt à expédier)</option>
                    <option value="LOW_STOCK">LOW STOCK (Stock limité - Dernières unités)</option>
                    <option value="SOLD_OUT">SOLD OUT (Épuisé - Bientôt nouveau drop)</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-zinc-400 font-mono uppercase mb-1">
                      Référence SKU
                    </label>
                    <input
                      type="text"
                      value={prodFormSku}
                      onChange={(e) => setProdFormSku(e.target.value)}
                      placeholder="Ex: TM-420"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-zinc-500 text-xs font-mono"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-zinc-400 font-mono uppercase mb-1">
                      Nb Dispo
                    </label>
                    <input
                      type="number"
                      value={prodFormAvailableUnits}
                      onChange={(e) => setProdFormAvailableUnits(parseInt(e.target.value, 10) || 0)}
                      placeholder="25"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-zinc-500 text-xs font-mono text-center"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 font-mono uppercase mb-1">
                    Description Détaillée
                  </label>
                  <textarea
                    rows={3}
                    value={prodFormDesc}
                    onChange={(e) => setProdFormDesc(e.target.value)}
                    placeholder="Profil terpénique, arômes en bouche, conseils de dégustation, affinage..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-zinc-500 text-xs resize-none"
                  />
                </div>
              </div>

              {/* Toggles: Featured & New & Status */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodFormFeatured}
                    onChange={(e) => setProdFormFeatured(e.target.checked)}
                    className="rounded border-zinc-700 text-zinc-900 focus:ring-0"
                  />
                  <span className="font-semibold text-zinc-200">En Vedette (Featured / Édition Spéciale)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodFormIsNew}
                    onChange={(e) => setProdFormIsNew(e.target.checked)}
                    className="rounded border-zinc-700 text-zinc-900 focus:ring-0"
                  />
                  <span className="font-semibold text-zinc-200">Nouveauté (Badge New)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodFormStatus === 'published'}
                    onChange={(e) => setProdFormStatus(e.target.checked ? 'published' : 'hidden')}
                    className="rounded border-zinc-700 text-zinc-900 focus:ring-0"
                  />
                  <span className="font-semibold text-zinc-200">Visible sur le menu</span>
                </label>
              </div>

              {/* Photos Gallery Management */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="font-mono uppercase text-zinc-400">
                    Photos du produit ({prodFormImages.length})
                  </label>
                  <span className="text-[10px] text-zinc-500">
                    La première photo est la photo principale
                  </span>
                </div>

                {/* Upload Action */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    disabled={isUploadingImage}
                    className="hidden"
                    id="product-photo-upload"
                  />
                  <label
                    htmlFor="product-photo-upload"
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl cursor-pointer font-medium text-xs transition active:scale-95 ${
                      isUploadingImage
                        ? 'bg-zinc-800 text-emerald-400 cursor-wait'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? `Traitement (${uploadProgress}%)...` : 'Ajouter des photos'}</span>
                  </label>

                  <div className="flex-1 flex gap-1.5">
                    <input
                      type="url"
                      value={manualImageUrl}
                      onChange={(e) => setManualImageUrl(e.target.value)}
                      placeholder="Ou coller une URL d'image..."
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualUrl}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium text-xs"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Progress bar during photo processing */}
                {isUploadingImage && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 space-y-1.5 animate-pulse">
                    <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                      <span>Optimisation HD & enregistrement des photos...</span>
                      <span className="text-emerald-400 font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${Math.max(15, uploadProgress)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Storage Configuration Notice / Fallback if Storage not activated yet */}
                {storageErrorDetails && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2 text-xs text-amber-200">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Firebase Storage à activer dans votre console</span>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      {storageErrorDetails}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href="https://console.firebase.google.com/project/gen-lang-client-0263232160/storage"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition"
                      >
                        <span>Ouvrir Console Firebase Storage</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {pendingFiles.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSavePendingFilesAsHD}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg text-xs border border-zinc-700"
                        >
                          <span>Enregistrer ma photo locale HD</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Images Preview Grid */}
                {prodFormImages.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                    {prodFormImages.map((url, idx) => (
                      <div
                        key={idx}
                        className={`relative rounded-xl overflow-hidden aspect-square border group ${
                          idx === 0 ? 'border-white ring-1 ring-white/50' : 'border-zinc-800'
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />

                        {idx === 0 ? (
                          <div className="absolute top-1 left-1 bg-white text-zinc-950 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase font-mono shadow">
                            Principale
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetMainImage(idx)}
                            className="absolute bottom-1 left-1 bg-black/80 hover:bg-black text-white text-[9px] px-1.5 py-0.5 rounded font-mono opacity-0 group-hover:opacity-100 transition"
                          >
                            Mettre en 1er
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/80 text-rose-400 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                          title="Supprimer la photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-zinc-500 font-mono border border-dashed border-zinc-800 rounded-2xl">
                    Aucune photo ajoutée. Veuillez ajouter au moins une photo.
                  </div>
                )}
              </div>

              {/* Video du Produit (Batch / Live Rosin / Vidéo d'extraction) */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-emerald-400" />
                    <label className="font-mono uppercase font-bold text-white text-[11px]">
                      Vidéo du Batch / Résine
                    </label>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                    Sauvegarde Firestore Cloud
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400">
                  Ajoutez une vidéo de haute qualité directement depuis votre appareil (caméra ou galerie). La vidéo est découpée et stockée directement sur votre base Firestore.
                </p>

                {/* Upload Action */}
                <div className="flex items-center gap-2">
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/*"
                    onChange={(e) => handleVideoUpload(e.target.files)}
                    disabled={isUploadingVideo}
                    className="hidden"
                    id="product-video-upload"
                  />
                  <label
                    htmlFor="product-video-upload"
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer font-bold text-xs transition active:scale-95 ${
                      isUploadingVideo 
                        ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                        : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {isUploadingVideo 
                        ? `Envoi Firestore (${videoUploadProgress}%)...` 
                        : '🎥 Ajouter une vidéo depuis mon appareil'}
                    </span>
                  </label>

                  <div className="flex-1 flex gap-1.5">
                    <input
                      type="url"
                      value={manualVideoUrl}
                      onChange={(e) => setManualVideoUrl(e.target.value)}
                      placeholder="Ou coller URL vidéo directe..."
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (manualVideoUrl.trim()) {
                          setProdFormVideoUrl(manualVideoUrl.trim());
                          setManualVideoUrl('');
                          showNotice('Lien vidéo ajouté');
                        }
                      }}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Progress Bar during upload */}
                {isUploadingVideo && (
                  <div className="space-y-1 bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>Sauvegarde vers la base Firestore en cours...</span>
                      <span className="text-emerald-400 font-bold">{videoUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-200"
                        style={{ width: `${videoUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Video Preview Player */}
                {prodFormVideoUrl ? (
                  <div className="space-y-2 p-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-300 flex items-center gap-1">
                        <Play className="w-3 h-3 text-emerald-400" />
                        Aperçu de la vidéo configurée :
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setProdFormVideoUrl('');
                          hapticFeedback('medium');
                          showNotice('Vidéo retirée du produit');
                        }}
                        className="flex items-center gap-1 text-[10px] font-mono text-rose-400 hover:text-rose-300 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Supprimer la vidéo</span>
                      </button>
                    </div>

                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-52 border border-zinc-800 flex items-center justify-center">
                      <FirestoreVideoPlayer
                        videoUrl={prodFormVideoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 truncate pt-1">
                      <span className="text-zinc-400 shrink-0">Lien :</span>
                      <span className="truncate text-zinc-300 select-all">{prodFormVideoUrl}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 px-3 text-center text-zinc-500 font-mono text-[11px] border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                    Aucune vidéo associée à ce produit pour le moment.
                  </div>
                )}
              </div>

              {/* Custom Details Key-Values */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="font-mono uppercase text-zinc-400">
                    Spécifications d'Extraction (Filtration, Terpènes, Texture, Origine...)
                  </label>
                  <button
                    type="button"
                    onClick={() => setProdFormDetails((prev) => [...prev, { key: '', value: '' }])}
                    className="text-[10px] font-mono text-zinc-300 hover:text-white"
                  >
                    + Ajouter une ligne
                  </button>
                </div>

                {prodFormDetails.map((detail, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={detail.key}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProdFormDetails((prev) => prev.map((d, i) => i === idx ? { ...d, key: val } : d));
                      }}
                      placeholder="Ex: Filtration"
                      className="w-1/3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={detail.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProdFormDetails((prev) => prev.map((d, i) => i === idx ? { ...d, value: val } : d));
                      }}
                      placeholder="Ex: 90u - 120u Full Melt"
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setProdFormDetails((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 text-zinc-500 hover:text-rose-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                {formError ? (
                  <div className="text-[11px] text-rose-400 font-medium flex items-center gap-1.5 self-start sm:self-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{formError}</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-500 font-mono hidden sm:block">
                    {isUploadingImage ? 'Photos en cours d\'optimisation...' : 'Catalogue officiel TRICHOME MONTANE'}
                  </div>
                )}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    disabled={isSavingProduct}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white font-medium disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProduct || isUploadingImage}
                    className="px-6 py-2.5 rounded-xl bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer"
                  >
                    {isSavingProduct ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                        <span>Publication en cours...</span>
                      </>
                    ) : (
                      <span>{editingProduct ? 'Enregistrer les modifications' : 'Publier le produit'}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY MODAL (ADD / EDIT) */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121216] border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                {editingCategory ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-mono uppercase mb-1">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  value={catFormName}
                  onChange={(e) => setCatFormName(e.target.value)}
                  placeholder="Ex: 2x STATIC, FROZEN SIFT, DRY SIFT..."
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono uppercase mb-1">
                  Description courte
                </label>
                <input
                  type="text"
                  value={catFormDesc}
                  onChange={(e) => setCatFormDesc(e.target.value)}
                  placeholder="Ex: Curings d'exception, filtrations cryogéniques et terpènes purs"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono uppercase mb-1">
                  Image d'illustration (URL ou fichier)
                </label>
                <input
                  type="url"
                  value={catFormImage}
                  onChange={(e) => setCatFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono uppercase mb-1">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  value={catFormOrder}
                  onChange={(e) => setCatFormOrder(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-zinc-950 font-bold uppercase tracking-wider"
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALE DE CONFIRMATION SÉCURISÉE (PAS DE WINDOW.CONFIRM) */}
      {/* ========================================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#111114] border border-zinc-700/80 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                itemToDelete.type === 'reseed_farmz'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {itemToDelete.type === 'reseed_farmz' ? (
                  <RefreshCw className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  {itemToDelete.type === 'product' && 'Supprimer ce produit ?'}
                  {itemToDelete.type === 'category' && 'Supprimer cette catégorie ?'}
                  {itemToDelete.type === 'all_products' && 'Vider TOUT le catalogue ?'}
                  {itemToDelete.type === 'purge_old' && 'Purger les anciens articles ?'}
                  {itemToDelete.type === 'reseed_farmz' && 'Réinitialiser Menu Farmz ?'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {itemToDelete.type === 'product' && itemToDelete.product?.name}
                  {itemToDelete.type === 'category' && itemToDelete.category?.name}
                  {itemToDelete.type === 'all_products' && 'Effacement complet de tous les produits'}
                  {itemToDelete.type === 'purge_old' && 'Suppression des anciens produits hors menu'}
                  {itemToDelete.type === 'reseed_farmz' && 'Installation DRY SIFT, FROZEN SIFT, 2x STATIC'}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
              {itemToDelete.type === 'product' && 'Ce produit sera définitivement retiré du catalogue et de Firestore. Cette action est immédiate.'}
              {itemToDelete.type === 'category' && 'Cette catégorie sera retirée de la navigation. Les produits rattachés ne seront pas supprimés.'}
              {itemToDelete.type === 'all_products' && 'ATTENTION : Tous les produits actuels du catalogue vont être supprimés de la base de données. Vous pourrez ensuite ajouter vos propres produits ou recharger le menu Farmz.'}
              {itemToDelete.type === 'purge_old' && 'Tous les anciens articles hors menu d\'extractions seront définitivement purgés.'}
              {itemToDelete.type === 'reseed_farmz' && 'Les anciens articles seront purgés et remplacés par les 3 catégories officielles (DRY SIFT, FROZEN SIFT, 2x STATIC) et les 9 extractions Perk Vibes Farmz.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleConfirmDelete}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider transition shadow-lg ${
                  itemToDelete.type === 'reseed_farmz'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                }`}
              >
                {isActionLoading ? (
                  <span>Opération en cours...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {itemToDelete.type === 'product' && 'Supprimer le produit'}
                      {itemToDelete.type === 'category' && 'Supprimer la catégorie'}
                      {itemToDelete.type === 'all_products' && 'Oui, tout supprimer'}
                      {itemToDelete.type === 'purge_old' && 'Purger les anciens articles'}
                      {itemToDelete.type === 'reseed_farmz' && 'Réinitialiser Menu Farmz'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
