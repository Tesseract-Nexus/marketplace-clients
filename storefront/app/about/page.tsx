'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Target, Award, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTenant, useNavPath } from '@/context/TenantContext';

const values = [
  {
    icon: Heart,
    title: 'Customer First',
    description: 'We put our customers at the heart of everything we do, ensuring exceptional experiences.',
  },
  {
    icon: Award,
    title: 'Quality Assurance',
    description: 'Every product meets our rigorous quality standards before reaching your hands.',
  },
  {
    icon: Target,
    title: 'Innovation',
    description: 'We continuously evolve to bring you the latest trends and cutting-edge products.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Building lasting relationships with our customers and supporting local communities.',
  },
];

const stats = [
  { value: '10K+', label: 'Happy Customers' },
  { value: '500+', label: 'Products' },
  { value: '50+', label: 'Brands' },
  { value: '99%', label: 'Satisfaction Rate' },
];

export default function AboutPage() {
  const { tenant, settings } = useTenant();
  const getNavPath = useNavPath();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--tenant-primary)]/10 via-background to-[var(--tenant-secondary)]/10" />
        <div
          className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--tenant-primary)' }}
        />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--tenant-secondary)' }}
        />

        <div className="container-tenant relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tenant-primary/10 text-tenant-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Our Story</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              About{' '}
              <span className="gradient-text">{tenant?.name || 'Our Store'}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              We're passionate about bringing you the best products with exceptional service.
              Our journey started with a simple mission: to make quality accessible to everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y bg-muted/30">
        <div className="container-tenant">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container-tenant">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Our Mission
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                We believe everyone deserves access to high-quality products at fair prices.
                Our team works tirelessly to curate the best selection, ensuring every item
                meets our strict quality standards.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                From sourcing to delivery, we maintain complete transparency and put
                sustainability at the forefront of our operations. We're not just a store;
                we're a community of like-minded individuals who care about quality,
                value, and the environment.
              </p>
              <Button asChild className="btn-tenant-primary">
                <Link href={getNavPath('/products')}>
                  Explore Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--tenant-primary)]/20 to-[var(--tenant-secondary)]/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-tenant-primary/20 flex items-center justify-center">
                    <Target className="h-12 w-12 text-tenant-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Quality First</h3>
                  <p className="text-muted-foreground">
                    Every product is carefully selected and quality-checked
                  </p>
                </div>
              </div>
              <div
                className="absolute -bottom-4 -right-4 w-32 h-32 rounded-2xl opacity-50"
                style={{ background: 'var(--tenant-gradient)' }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container-tenant">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              These core values guide everything we do and shape how we serve our customers
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 border hover-lift"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--tenant-primary)', opacity: 0.1 }}
                >
                  <value.icon className="h-7 w-7 text-tenant-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container-tenant">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden p-12 md:p-16 text-center"
            style={{ background: 'var(--tenant-gradient)' }}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Start Shopping?
              </h2>
              <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of happy customers and discover why they love shopping with us
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <Link href={getNavPath('/products')}>
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Link href={getNavPath('/contact')}>Contact Us</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
