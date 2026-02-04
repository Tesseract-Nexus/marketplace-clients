'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { qrCodeService } from '@/lib/services/qrService';
import { storefrontService } from '@/lib/services/storefrontService';
import type { Storefront } from '@/lib/api/types';
import { Select } from '@/components/Select';
import {
  QRCodeType,
  QRCodeQuality,
  GenerateQRRequest,
  QRTypeInfo,
  WiFiData,
  VCardData,
  EmailData,
  SMSData,
  GeoData,
  AppData,
  PaymentData,
} from '@/lib/api/types';
import {
  QrCode,
  Link,
  Type,
  Wifi,
  User,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  Smartphone,
  CreditCard,
  Download,
  Copy,
  CheckCircle,
  RefreshCw,
  Loader2,
  Settings,
  Plus,
  Palette,
  Image as ImageIcon,
  X,
  Sparkles,
  Share2,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// QR Type icon mapping
const typeIcons: Record<QRCodeType, React.ElementType> = {
  url: Link,
  text: Type,
  wifi: Wifi,
  vcard: User,
  email: Mail,
  phone: Phone,
  sms: MessageSquare,
  geo: MapPin,
  app: Smartphone,
  payment: CreditCard,
};

// QR Type configurations
const qrTypeConfigs: QRTypeInfo[] = [
  { type: 'url', name: 'URL', description: 'Link to any website', icon: 'link' },
  { type: 'text', name: 'Text', description: 'Plain text content', icon: 'type' },
  { type: 'wifi', name: 'WiFi', description: 'WiFi network credentials', icon: 'wifi' },
  { type: 'vcard', name: 'Contact', description: 'Contact information (vCard)', icon: 'user' },
  { type: 'email', name: 'Email', description: 'Email with subject and body', icon: 'mail' },
  { type: 'phone', name: 'Phone', description: 'Phone number to call', icon: 'phone' },
  { type: 'sms', name: 'SMS', description: 'SMS message', icon: 'message-square' },
  { type: 'geo', name: 'Location', description: 'Geographic coordinates', icon: 'map-pin' },
  { type: 'app', name: 'App Store', description: 'App store links', icon: 'smartphone' },
  { type: 'payment', name: 'Payment', description: 'Payment QR (UPI, Crypto)', icon: 'credit-card' },
];

// Color presets for quick selection
const colorPresets = [
  { name: 'Classic', fg: '#000000', bg: '#FFFFFF' },
  { name: 'Ocean', fg: '#0EA5E9', bg: '#F0F9FF' },
  { name: 'Forest', fg: '#16A34A', bg: '#F0FDF4' },
  { name: 'Sunset', fg: '#EA580C', bg: '#FFF7ED' },
  { name: 'Royal', fg: '#7C3AED', bg: '#FAF5FF' },
  { name: 'Rose', fg: '#DB2777', bg: '#FDF2F8' },
];

// Social media brand icons
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const XTwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

export default function QRCodesPage() {
  const [selectedType, setSelectedType] = useState<QRCodeType>('url');
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [storageUrl, setStorageUrl] = useState<string | null>(null);
  const [qrId, setQrId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [qrLabel, setQrLabel] = useState('');
  const [qrSize, setQrSize] = useState(256);
  const [qrQuality, setQrQuality] = useState<QRCodeQuality>('medium');

  // Storefront state for URL dropdown
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);
  const [selectedUrlOption, setSelectedUrlOption] = useState<string>('custom');

  // Color customization
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Logo/branding
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(20); // percentage of QR size
  const logoInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form data states
  const [urlData, setUrlData] = useState({ url: '' });
  const [textData, setTextData] = useState({ text: '' });
  const [phoneData, setPhoneData] = useState({ phone: '' });
  const [wifiData, setWifiData] = useState<WiFiData>({ ssid: '', password: '', encryption: 'WPA', hidden: false });
  const [vcardData, setVcardData] = useState<VCardData>({ first_name: '', last_name: '' });
  const [emailData, setEmailData] = useState<EmailData>({ address: '', subject: '', body: '' });
  const [smsData, setSmsData] = useState<SMSData>({ phone: '', message: '' });
  const [geoData, setGeoData] = useState<GeoData>({ latitude: 0, longitude: 0 });
  const [appData, setAppData] = useState<AppData>({ ios_url: '', android_url: '', fallback_url: '' });
  const [paymentData, setPaymentData] = useState<PaymentData>({ type: 'upi', upi_id: '' });

  // Load storefronts on mount
  useEffect(() => {
    const loadStorefronts = async () => {
      try {
        setLoadingStorefronts(true);
        const response = await storefrontService.getStorefronts();
        const storefrontsList = response.data || [];
        setStorefronts(storefrontsList);
        // Pre-select first storefront URL if available
        if (storefrontsList.length > 0 && storefrontsList[0].storefrontUrl) {
          setSelectedUrlOption(storefrontsList[0].storefrontUrl);
          setUrlData({ url: storefrontsList[0].storefrontUrl });
        }
      } catch (err) {
        console.error('Failed to load storefronts:', err);
      } finally {
        setLoadingStorefronts(false);
      }
    };
    loadStorefronts();
  }, []);

  // Handle URL option change
  const handleUrlOptionChange = (value: string) => {
    setSelectedUrlOption(value);
    if (value !== 'custom') {
      setUrlData({ url: value });
    } else {
      setUrlData({ url: '' });
    }
  };

  // Handle logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogo(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply logo overlay to QR code
  const applyLogoOverlay = useCallback((qrBase64: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!logo) {
        resolve(qrBase64);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(qrBase64);
        return;
      }

      const qrImg = new window.Image();
      qrImg.onload = () => {
        canvas.width = qrImg.width;
        canvas.height = qrImg.height;
        ctx.drawImage(qrImg, 0, 0);

        const logoImg = new window.Image();
        logoImg.onload = () => {
          const logoSizePixels = (canvas.width * logoSize) / 100;
          const logoX = (canvas.width - logoSizePixels) / 2;
          const logoY = (canvas.height - logoSizePixels) / 2;

          // Draw white background circle behind logo for better visibility
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, logoSizePixels / 2 + 4, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          // Draw logo
          ctx.save();
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, logoSizePixels / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(logoImg, logoX, logoY, logoSizePixels, logoSizePixels);
          ctx.restore();

          // Convert to base64 without the data:image/png;base64, prefix
          const dataUrl = canvas.toDataURL('image/png');
          const base64 = dataUrl.split(',')[1];
          resolve(base64);
        };
        logoImg.src = logo;
      };
      qrImg.src = `data:image/png;base64,${qrBase64}`;
    });
  }, [logo, logoSize]);

  const buildQRRequest = useCallback((): GenerateQRRequest => {
    const baseRequest: GenerateQRRequest = {
      type: selectedType,
      data: {},
      size: qrSize,
      quality: qrQuality,
      format: 'base64',
      label: qrLabel || undefined,
      save: true, // Save to GCS for persistence
    };

    switch (selectedType) {
      case 'url':
        baseRequest.data = { url: urlData.url };
        break;
      case 'text':
        baseRequest.data = { text: textData.text };
        break;
      case 'phone':
        baseRequest.data = { phone: phoneData.phone };
        break;
      case 'wifi':
        baseRequest.data = { wifi: wifiData };
        break;
      case 'vcard':
        baseRequest.data = { vcard: vcardData };
        break;
      case 'email':
        baseRequest.data = { email: emailData };
        break;
      case 'sms':
        baseRequest.data = { sms: smsData };
        break;
      case 'geo':
        baseRequest.data = { geo: geoData };
        break;
      case 'app':
        baseRequest.data = { app: appData };
        break;
      case 'payment':
        baseRequest.data = { payment: paymentData };
        break;
    }

    return baseRequest;
  }, [selectedType, urlData, textData, phoneData, wifiData, vcardData, emailData, smsData, geoData, appData, paymentData, qrSize, qrQuality, qrLabel]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setStorageUrl(null);
      setQrId(null);
      const request = buildQRRequest();
      const response = await qrCodeService.generateQRCode(request);
      if (response.success && response.data) {
        const qrId = response.data.id;
        setQrId(qrId);

        // Apply logo overlay if logo is set
        const qrWithLogo = await applyLogoOverlay(response.data.qr_code);
        setGeneratedQR(qrWithLogo);

        // If logo was applied, upload the composite image to GCS
        if (logo && qrWithLogo !== response.data.qr_code) {
          try {
            // Extract logo base64 without the data URL prefix
            const logoBase64 = logo.split(',')[1];

            const uploadResponse = await fetch('/api/qr/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                qr_id: qrId,
                image_base64: qrWithLogo,
                logo_base64: logoBase64,
              }),
            });

            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json();
              if (uploadData.success && uploadData.data?.storage_url) {
                setStorageUrl(uploadData.data.storage_url);
              }
            }
          } catch (uploadErr) {
            console.warn('Failed to upload composite QR:', uploadErr);
            // Still show the original storage URL if upload fails
            if (response.data.storage_url) {
              setStorageUrl(response.data.storage_url);
            }
          }
        } else if (response.data.storage_url) {
          setStorageUrl(response.data.storage_url);
        }
      } else {
        setError('Failed to generate QR code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
      console.error('Error generating QR code:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedQR) return;

    try {
      // If we have a logo, download the composite image directly
      // Otherwise, request a fresh download from backend
      if (logo) {
        // Convert base64 to blob and download
        const byteCharacters = atob(generatedQR);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-${selectedType}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const request = buildQRRequest();
        const blob = await qrCodeService.downloadQRCode(request, `qr-${selectedType}-${Date.now()}.png`);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-${selectedType}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading QR code:', err);
    }
  };

  const handleCopyBase64 = async () => {
    if (!generatedQR) return;
    try {
      await navigator.clipboard.writeText(generatedQR);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Social media share handlers
  const getShareUrl = () => {
    // Use the GCS storage URL if available, otherwise create a data URL
    if (storageUrl) {
      return storageUrl;
    }
    return null;
  };

  const getShareText = () => {
    const typeLabel = qrTypeConfigs.find(c => c.type === selectedType)?.name || 'QR Code';
    return `Check out this ${typeLabel} QR Code generated with mark8ly!`;
  };

  const handleShareFacebook = () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) {
      setError('Please generate a QR code first to share');
      return;
    }
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(getShareText())}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    setShareSuccess('facebook');
    setTimeout(() => setShareSuccess(null), 2000);
  };

  const handleShareTwitter = () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) {
      setError('Please generate a QR code first to share');
      return;
    }
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setShareSuccess('twitter');
    setTimeout(() => setShareSuccess(null), 2000);
  };

  const handleShareInstagram = async () => {
    // Instagram doesn't have a direct web share API
    // We'll copy the image to clipboard so user can paste it in Instagram
    if (!generatedQR) {
      setError('Please generate a QR code first to share');
      return;
    }

    try {
      // Convert base64 to blob
      const byteCharacters = atob(generatedQR);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      // Try to copy image to clipboard
      if (navigator.clipboard && 'write' in navigator.clipboard) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        setShareSuccess('instagram');
        setTimeout(() => setShareSuccess(null), 3000);
      } else {
        // Fallback: download the image for manual sharing
        handleDownload();
        setShareSuccess('instagram-download');
        setTimeout(() => setShareSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to copy image for Instagram:', err);
      // Fallback: download the image
      handleDownload();
      setShareSuccess('instagram-download');
      setTimeout(() => setShareSuccess(null), 3000);
    }
  };

  const renderTypeForm = () => {
    switch (selectedType) {
      case 'url':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="urlSelect">Website URL</Label>
              {loadingStorefronts ? (
                <div className="flex items-center gap-2 h-10 px-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading storefronts...
                </div>
              ) : (
                <Select
                  value={selectedUrlOption}
                  onChange={handleUrlOptionChange}
                  options={[
                    ...storefronts
                      .filter(s => s.storefrontUrl)
                      .map(s => ({
                        value: s.storefrontUrl!,
                        label: `${s.name} (${s.storefrontUrl})`,
                      })),
                    { value: 'custom', label: 'Enter custom URL...' },
                  ]}
                  placeholder="Select a storefront URL"
                />
              )}
            </div>
            {selectedUrlOption === 'custom' && (
              <div>
                <Label htmlFor="customUrl">Custom URL</Label>
                <Input
                  id="customUrl"
                  type="url"
                  placeholder="https://example.com"
                  value={urlData.url}
                  onChange={(e) => setUrlData({ url: e.target.value })}
                />
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Text Content</Label>
              <Textarea
                id="text"
                placeholder="Enter your text..."
                value={textData.text}
                onChange={(e) => setTextData({ text: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneData.phone}
                onChange={(e) => setPhoneData({ phone: e.target.value })}
              />
            </div>
          </div>
        );

      case 'wifi':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="ssid">Network Name (SSID)</Label>
              <Input
                id="ssid"
                placeholder="MyNetwork"
                value={wifiData.ssid}
                onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={wifiData.password || ''}
                onChange={(e) => setWifiData({ ...wifiData, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="encryption">Encryption</Label>
              <select
                id="encryption"
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
                value={wifiData.encryption}
                onChange={(e) => setWifiData({ ...wifiData, encryption: e.target.value as 'WPA' | 'WEP' | 'nopass' })}
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">No Password</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="hidden"
                type="checkbox"
                checked={wifiData.hidden || false}
                onChange={(e) => setWifiData({ ...wifiData, hidden: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
              />
              <Label htmlFor="hidden">Hidden Network</Label>
            </div>
          </div>
        );

      case 'vcard':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={vcardData.first_name}
                  onChange={(e) => setVcardData({ ...vcardData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={vcardData.last_name || ''}
                  onChange={(e) => setVcardData({ ...vcardData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vcardEmail">Email</Label>
              <Input
                id="vcardEmail"
                type="email"
                placeholder="john@example.com"
                value={vcardData.email || ''}
                onChange={(e) => setVcardData({ ...vcardData, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vcardPhone">Phone</Label>
                <Input
                  id="vcardPhone"
                  type="tel"
                  placeholder="+1234567890"
                  value={vcardData.phone || ''}
                  onChange={(e) => setVcardData({ ...vcardData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="+1234567890"
                  value={vcardData.mobile || ''}
                  onChange={(e) => setVcardData({ ...vcardData, mobile: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  placeholder="Company Inc"
                  value={vcardData.organization || ''}
                  onChange={(e) => setVcardData({ ...vcardData, organization: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  placeholder="Software Engineer"
                  value={vcardData.title || ''}
                  onChange={(e) => setVcardData({ ...vcardData, title: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                value={vcardData.website || ''}
                onChange={(e) => setVcardData({ ...vcardData, website: e.target.value })}
              />
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="emailAddress">Email Address</Label>
              <Input
                id="emailAddress"
                type="email"
                placeholder="contact@example.com"
                value={emailData.address}
                onChange={(e) => setEmailData({ ...emailData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Hello from QR"
                value={emailData.subject || ''}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="body">Message Body</Label>
              <Textarea
                id="body"
                placeholder="Your message..."
                value={emailData.body || ''}
                onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        );

      case 'sms':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="smsPhone">Phone Number</Label>
              <Input
                id="smsPhone"
                type="tel"
                placeholder="+1234567890"
                value={smsData.phone}
                onChange={(e) => setSmsData({ ...smsData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="smsMessage">Message</Label>
              <Textarea
                id="smsMessage"
                placeholder="Your SMS message..."
                value={smsData.message || ''}
                onChange={(e) => setSmsData({ ...smsData, message: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        );

      case 'geo':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="40.7128"
                  value={geoData.latitude || ''}
                  onChange={(e) => setGeoData({ ...geoData, latitude: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="-74.0060"
                  value={geoData.longitude || ''}
                  onChange={(e) => setGeoData({ ...geoData, longitude: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="altitude">Altitude (optional)</Label>
              <Input
                id="altitude"
                type="number"
                step="0.1"
                placeholder="0"
                value={geoData.altitude || ''}
                onChange={(e) => setGeoData({ ...geoData, altitude: parseFloat(e.target.value) || undefined })}
              />
            </div>
          </div>
        );

      case 'app':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="iosUrl">iOS App Store URL</Label>
              <Input
                id="iosUrl"
                type="url"
                placeholder="https://apps.apple.com/app/id123456"
                value={appData.ios_url || ''}
                onChange={(e) => setAppData({ ...appData, ios_url: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="androidUrl">Android Play Store URL</Label>
              <Input
                id="androidUrl"
                type="url"
                placeholder="https://play.google.com/store/apps/details?id=com.example"
                value={appData.android_url || ''}
                onChange={(e) => setAppData({ ...appData, android_url: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="fallbackUrl">Fallback URL</Label>
              <Input
                id="fallbackUrl"
                type="url"
                placeholder="https://example.com/download"
                value={appData.fallback_url || ''}
                onChange={(e) => setAppData({ ...appData, fallback_url: e.target.value })}
              />
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentType">Payment Type</Label>
              <select
                id="paymentType"
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
                value={paymentData.type}
                onChange={(e) => setPaymentData({ ...paymentData, type: e.target.value as 'upi' | 'bitcoin' | 'ethereum' })}
              >
                <option value="upi">UPI</option>
                <option value="bitcoin">Bitcoin</option>
                <option value="ethereum">Ethereum</option>
              </select>
            </div>
            {paymentData.type === 'upi' && (
              <>
                <div>
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input
                    id="upiId"
                    placeholder="merchant@upi"
                    value={paymentData.upi_id || ''}
                    onChange={(e) => setPaymentData({ ...paymentData, upi_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="payeeName">Payee Name</Label>
                  <Input
                    id="payeeName"
                    placeholder="Store Name"
                    value={paymentData.name || ''}
                    onChange={(e) => setPaymentData({ ...paymentData, name: e.target.value })}
                  />
                </div>
              </>
            )}
            {(paymentData.type === 'bitcoin' || paymentData.type === 'ethereum') && (
              <div>
                <Label htmlFor="walletAddress">Wallet Address</Label>
                <Input
                  id="walletAddress"
                  placeholder={paymentData.type === 'bitcoin' ? '1BvBMSEYst...' : '0x742d35Cc...'}
                  value={paymentData.address || ''}
                  onChange={(e) => setPaymentData({ ...paymentData, address: e.target.value })}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (optional)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentData.amount || ''}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || undefined })}
                />
              </div>
              {paymentData.type === 'upi' && (
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    placeholder="INR"
                    value={paymentData.currency || ''}
                    onChange={(e) => setPaymentData({ ...paymentData, currency: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PermissionGate
      permission={Permission.SETTINGS_VIEW}
      fallback="styled"
      fallbackTitle="QR Codes"
      fallbackDescription="You don't have permission to view QR codes settings."
    >
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'QR Codes' },
          ]}
        />
        <div className="flex justify-between items-start mt-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary">
              QR Code Generator
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate QR codes for URLs, WiFi, contacts, payments, and more
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* QR Type Selection */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-4 w-4 text-primary" />
              QR Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {qrTypeConfigs.map((config) => {
                const Icon = typeIcons[config.type];
                const isSelected = selectedType === config.type;
                return (
                  <button
                    key={config.type}
                    onClick={() => setSelectedType(config.type)}
                    className={cn(
                      'group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm transition-all duration-200',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-transparent bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/20'
                    )}
                  >
                    <div className={cn(
                      'flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-200',
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'bg-background text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={cn(
                      'font-medium transition-colors',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}>{config.name}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4 text-primary" />
              {qrTypeConfigs.find((c) => c.type === selectedType)?.name} Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {renderTypeForm()}

            {/* Common settings */}
            <div className="border-t pt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label" className="text-sm font-medium">Label (optional)</Label>
                <Input
                  id="label"
                  placeholder="My QR Code"
                  value={qrLabel}
                  onChange={(e) => setQrLabel(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size" className="text-sm font-medium">Size (px)</Label>
                  <Input
                    id="size"
                    type="number"
                    min={64}
                    max={1024}
                    value={qrSize}
                    onChange={(e) => setQrSize(parseInt(e.target.value) || 256)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quality" className="text-sm font-medium">Quality</Label>
                  <select
                    id="quality"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={qrQuality}
                    onChange={(e) => setQrQuality(e.target.value as QRCodeQuality)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="highest">Highest</option>
                  </select>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full h-11 bg-primary hover:opacity-90 text-white shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate QR Code
                </>
              )}
            </Button>

            {error && (
              <div className="rounded-lg bg-error-muted border border-error/20 p-3 text-sm text-error">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview & Customization */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Preview & Style
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* QR Code Preview with gradient background */}
            <div className="relative">
              <div
                className="rounded-xl p-5 flex items-center justify-center bg-muted/30 border border-border/50"
              >
                {generatedQR ? (
                  <div
                    className="rounded-lg p-3 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    style={{ backgroundColor: bgColor }}
                  >
                    <img
                      src={`data:image/png;base64,${generatedQR}`}
                      alt="Generated QR Code"
                      className="h-44 w-44 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-44 w-44 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-background/50">
                    <QrCode className="h-12 w-12 mb-2 text-muted-foreground/40" />
                    <span className="text-sm font-medium text-muted-foreground/60">Preview</span>
                    <span className="text-xs text-muted-foreground/40">Generate to see</span>
                  </div>
                )}
              </div>
              {generatedQR && (
                <Badge
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 shadow-sm bg-background"
                  variant="outline"
                >
                  {qrTypeConfigs.find((c) => c.type === selectedType)?.name}
                </Badge>
              )}
            </div>

            {/* Color Customization */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                <Palette className="h-3.5 w-3.5" />
                Color Theme
              </Label>

              {/* Color Presets */}
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((preset) => {
                  const isSelected = fgColor === preset.fg && bgColor === preset.bg;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setFgColor(preset.fg);
                        setBgColor(preset.bg);
                      }}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200',
                        'border',
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-border bg-background hover:border-primary/30 hover:bg-muted/50'
                      )}
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-black/10"
                        style={{ backgroundColor: preset.fg }}
                      />
                      {preset.name}
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="fgColor" className="text-xs text-muted-foreground">Foreground</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        id="fgColor"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="h-8 w-8 rounded-md cursor-pointer border border-input bg-transparent p-0.5"
                      />
                    </div>
                    <Input
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="h-8 text-xs font-mono uppercase"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bgColor" className="text-xs text-muted-foreground">Background</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        id="bgColor"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="h-8 w-8 rounded-md cursor-pointer border border-input bg-transparent p-0.5"
                      />
                    </div>
                    <Input
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-8 text-xs font-mono uppercase"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Logo/Branding Upload */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                <ImageIcon className="h-3.5 w-3.5" />
                Center Logo
              </Label>

              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />

              {logo ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="relative">
                    <img
                      src={logo}
                      alt="Logo preview"
                      className="h-11 w-11 rounded-lg object-cover border border-border"
                    />
                    <button
                      onClick={() => setLogo(null)}
                      className="absolute -top-1.5 -right-1.5 rounded-full bg-error p-1 text-error-foreground hover:bg-error/90 shadow-sm transition-colors"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="logoSize" className="text-xs text-muted-foreground">
                      Size: {logoSize}%
                    </Label>
                    <input
                      type="range"
                      id="logoSize"
                      min={10}
                      max={30}
                      value={logoSize}
                      onChange={(e) => setLogoSize(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full h-9 border-dashed hover:border-primary/50 hover:bg-primary/5"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Upload Logo
                </Button>
              )}
              <p className="text-[11px] text-muted-foreground">
                Add your brand logo to the center (max 2MB)
              </p>
            </div>

            {/* Action Buttons */}
            {generatedQR && (
              <div className="flex flex-col gap-3 pt-2 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleDownload}
                    className="flex-1 h-9 bg-primary hover:bg-primary/90"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyBase64}
                    className={cn(
                      "flex-1 h-9 transition-colors",
                      copied && "bg-success-muted border-success/30 text-success"
                    )}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                {/* Social Media Share */}
                <div className="space-y-3 pt-2 border-t">
                  <Label className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </Label>
                  <div className="flex items-center justify-center gap-3">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={handleShareFacebook}
                            disabled={!storageUrl}
                            className={cn(
                              "rounded-full border border-border transition-all duration-200",
                              shareSuccess === 'facebook'
                                ? "bg-success-muted border-success/30 text-success"
                                : "hover:bg-primary/10 hover:border-primary/30 hover:text-[#1877F2]"
                            )}
                          >
                            {shareSuccess === 'facebook' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <FacebookIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Share on Facebook</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={handleShareTwitter}
                            disabled={!storageUrl}
                            className={cn(
                              "rounded-full border border-border transition-all duration-200",
                              shareSuccess === 'twitter'
                                ? "bg-success-muted border-success/30 text-success"
                                : "hover:bg-muted hover:border-border hover:text-black"
                            )}
                          >
                            {shareSuccess === 'twitter' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <XTwitterIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Share on X (Twitter)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={handleShareInstagram}
                            className={cn(
                              "rounded-full border border-border transition-all duration-200",
                              shareSuccess === 'instagram' || shareSuccess === 'instagram-download'
                                ? "bg-success-muted border-success/30 text-success"
                                : "hover:bg-primary/10 hover:border-primary/30 hover:text-[#E1306C]"
                            )}
                          >
                            {shareSuccess === 'instagram' || shareSuccess === 'instagram-download' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <InstagramIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>{shareSuccess === 'instagram' ? 'Copied to clipboard!' : shareSuccess === 'instagram-download' ? 'Downloaded!' : 'Copy for Instagram'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {!storageUrl && generatedQR && (
                    <p className="text-xs text-muted-foreground text-center">
                      Facebook & X require a stored QR code
                    </p>
                  )}
                </div>

                {/* QR Details */}
                {qrId && (
                  <div className="rounded-lg bg-muted/30 border border-border/50 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">ID</span>
                      <code className="rounded-md bg-background border border-border px-2 py-0.5 font-mono text-[10px] text-foreground">{qrId}</code>
                    </div>
                    {storageUrl && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Storage</span>
                        <a
                          href={storageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          View in GCS →
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </PermissionGate>
  );
}
