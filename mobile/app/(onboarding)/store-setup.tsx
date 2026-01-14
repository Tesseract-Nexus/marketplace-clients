import { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { useColors } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { debounce } from '@/lib/utils/helpers';

const STORE_CATEGORIES = [
  { id: 'fashion', label: 'Fashion & Apparel', icon: 'shirt' },
  { id: 'electronics', label: 'Electronics', icon: 'phone-portrait' },
  { id: 'food', label: 'Food & Beverages', icon: 'restaurant' },
  { id: 'beauty', label: 'Beauty & Cosmetics', icon: 'sparkles' },
  { id: 'home', label: 'Home & Living', icon: 'home' },
  { id: 'sports', label: 'Sports & Fitness', icon: 'fitness' },
  { id: 'jewelry', label: 'Jewelry & Accessories', icon: 'diamond' },
  { id: 'other', label: 'Other', icon: 'grid' },
] as const;

export default function StoreSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { data, setData } = useOnboardingStore();

  const [storeName, setStoreName] = useState(data.storeName || '');
  const [storeUrl, setStoreUrl] = useState(data.storeUrl || '');
  const [category, setCategory] = useState(data.category || '');
  const [isUrlAvailable, setIsUrlAvailable] = useState<boolean | null>(null);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate URL from store name
  useEffect(() => {
    if (storeName && !data.storeUrl) {
      const slug = storeName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 30);
      setStoreUrl(slug);
    }
  }, [storeName, data.storeUrl]);

  // Check URL availability (debounced)
  const checkUrlAvailability = debounce(async (url: string) => {
    if (!url || url.length < 3) {
      setIsUrlAvailable(null);
      return;
    }

    setIsCheckingUrl(true);
    try {
      // Simulate API call - in real app, this would check against backend
      await new Promise((resolve) => setTimeout(resolve, 500));
      // For demo, assume URL is available unless it's "demo" or "test"
      const isAvailable = !['demo', 'test', 'admin', 'api'].includes(url.toLowerCase());
      setIsUrlAvailable(isAvailable);
    } finally {
      setIsCheckingUrl(false);
    }
  }, 500);

  useEffect(() => {
    checkUrlAvailability(storeUrl);
  }, [storeUrl]);

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!storeName.trim()) {
      newErrors.storeName = 'Store name is required';
    } else if (storeName.length < 3) {
      newErrors.storeName = 'Store name must be at least 3 characters';
    }

    if (!storeUrl.trim()) {
      newErrors.storeUrl = 'Store URL is required';
    } else if (storeUrl.length < 3) {
      newErrors.storeUrl = 'URL must be at least 3 characters';
    } else if (!/^[a-z0-9-]+$/.test(storeUrl)) {
      newErrors.storeUrl = 'URL can only contain lowercase letters, numbers, and hyphens';
    } else if (isUrlAvailable === false) {
      newErrors.storeUrl = 'This URL is not available';
    }

    if (!category) {
      newErrors.category = 'Please select a category';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setData({
      storeName: storeName.trim(),
      storeUrl: storeUrl.trim(),
      category,
    });

    router.push('/business-details');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '25%', backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>Step 1 of 4</Text>
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Set Up Your Store</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Let's start by giving your store a name and unique URL.
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.form}>
          <Input
            label="Store Name"
            placeholder="My Awesome Store"
            value={storeName}
            onChangeText={(text) => {
              setStoreName(text);
              if (errors.storeName) setErrors((prev) => ({ ...prev, storeName: '' }));
            }}
            error={errors.storeName}
            maxLength={50}
            containerStyle={styles.inputContainer}
          />

          <View style={styles.urlInputContainer}>
            <Input
              label="Store URL"
              placeholder="my-store"
              value={storeUrl}
              onChangeText={(text) => {
                setStoreUrl(text.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                if (errors.storeUrl) setErrors((prev) => ({ ...prev, storeUrl: '' }));
              }}
              error={errors.storeUrl}
              maxLength={30}
              autoCapitalize="none"
              containerStyle={styles.inputContainer}
              rightElement={
                isCheckingUrl ? (
                  <Ionicons name="hourglass" size={20} color={colors.textSecondary} />
                ) : isUrlAvailable === true ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                ) : isUrlAvailable === false ? (
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                ) : null
              }
            />
            <Text style={[styles.urlPreview, { color: colors.textSecondary }]}>
              Your store will be available at:{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                {storeUrl || 'your-store'}.tesserix.app
              </Text>
            </Text>
          </View>

          {/* Category Selection */}
          <View style={styles.categorySection}>
            <Text style={[styles.categoryLabel, { color: colors.text }]}>Store Category</Text>
            {errors.category && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.category}</Text>
            )}
            <View style={styles.categoryGrid}>
              {STORE_CATEGORIES.map((cat, index) => (
                <Animated.View key={cat.id} entering={FadeInRight.delay(400 + index * 50)}>
                  <Button
                    title={cat.label}
                    variant={category === cat.id ? 'primary' : 'outline'}
                    size="sm"
                    onPress={() => {
                      setCategory(cat.id);
                      if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                    }}
                    leftIcon={
                      <Ionicons
                        name={cat.icon as any}
                        size={16}
                        color={category === cat.id ? '#FFFFFF' : colors.text}
                      />
                    }
                    style={styles.categoryButton}
                  />
                </Animated.View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.buttonContainer}>
          <Button
            title="Continue"
            size="lg"
            fullWidth
            onPress={handleContinue}
            rightIcon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  urlInputContainer: {
    marginBottom: 24,
  },
  urlPreview: {
    fontSize: 13,
    marginTop: 4,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 24,
  },
});
