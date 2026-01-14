import { apiClient } from '../api/client';
import type {
  AdCampaign,
  Ad,
  AdCreative,
  AdPlacement,
  AdSubmission,
  AdCampaignStats,
  AdAnalyticsSummary,
  AdAnalyticsResponse,
  AdAnalyticsQuery,
  CreateAdCampaignRequest,
  UpdateAdCampaignRequest,
  CreateAdRequest,
  UpdateAdRequest,
  CreateAdCreativeRequest,
  UpdateAdCreativeRequest,
  SubmitAdForApprovalRequest,
  AdApprovalDecisionRequest,
  ApiResponse,
  ApiListResponse,
} from '../api/types';

const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === '1';

const AD_API_BASE = '/api/ads';

// ========================================
// Mock Data
// ========================================

const mockCampaigns: AdCampaign[] = [
  {
    id: 'camp-001',
    tenantId: 'tenant-001',
    vendorId: 'vendor-001',
    name: 'Summer Sale 2024',
    description: 'Promote summer collection across all storefronts',
    status: 'ACTIVE',
    budgetTotal: 5000,
    budgetDaily: 200,
    spentTotal: 1250,
    bidStrategy: 'CPC',
    bidAmount: 0.5,
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    targetAllStorefronts: true,
    impressions: 125000,
    clicks: 3750,
    conversions: 187,
    revenue: 9350,
    ctr: 3.0,
    cvr: 5.0,
    roas: 7.48,
    createdById: 'user-001',
    createdByName: 'John Doe',
    createdAt: '2024-05-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
  },
  {
    id: 'camp-002',
    tenantId: 'tenant-001',
    vendorId: 'vendor-001',
    name: 'New Product Launch',
    description: 'Launch campaign for new electronics line',
    status: 'PENDING_APPROVAL',
    budgetTotal: 10000,
    budgetDaily: 500,
    spentTotal: 0,
    bidStrategy: 'CPM',
    bidAmount: 5,
    startDate: '2024-07-01',
    endDate: '2024-07-31',
    targetStorefrontIds: ['sf-001', 'sf-002'],
    targetAllStorefronts: false,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    ctr: 0,
    cvr: 0,
    roas: 0,
    createdById: 'user-001',
    createdByName: 'John Doe',
    createdAt: '2024-06-20T10:00:00Z',
    updatedAt: '2024-06-20T10:00:00Z',
  },
  {
    id: 'camp-003',
    tenantId: 'tenant-001',
    vendorId: 'vendor-002',
    name: 'Brand Awareness',
    description: 'Increase brand visibility',
    status: 'PAUSED',
    budgetTotal: 3000,
    budgetDaily: 100,
    spentTotal: 800,
    bidStrategy: 'CPM',
    bidAmount: 3,
    startDate: '2024-05-01',
    endDate: '2024-12-31',
    targetAllStorefronts: true,
    impressions: 80000,
    clicks: 1600,
    conversions: 48,
    revenue: 2400,
    ctr: 2.0,
    cvr: 3.0,
    roas: 3.0,
    createdById: 'user-002',
    createdByName: 'Jane Smith',
    createdAt: '2024-04-15T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
  },
];

const mockCreatives: AdCreative[] = [
  {
    id: 'creative-001',
    tenantId: 'tenant-001',
    vendorId: 'vendor-001',
    name: 'Summer Banner 1',
    type: 'BANNER',
    status: 'ACTIVE',
    primaryImageUrl: 'https://placehold.co/728x90/4F46E5/FFFFFF?text=Summer+Sale',
    primaryImageAltText: 'Summer Sale Banner',
    width: 728,
    height: 90,
    headline: 'Summer Sale - Up to 50% Off',
    description: 'Shop our biggest summer sale ever!',
    brandName: 'TechStore',
    createdAt: '2024-05-01T10:00:00Z',
    updatedAt: '2024-05-01T10:00:00Z',
  },
  {
    id: 'creative-002',
    tenantId: 'tenant-001',
    vendorId: 'vendor-001',
    name: 'Hero Image',
    type: 'IMAGE',
    status: 'ACTIVE',
    primaryImageUrl: 'https://placehold.co/1200x400/7C3AED/FFFFFF?text=New+Arrivals',
    primaryImageAltText: 'New Arrivals Hero',
    width: 1200,
    height: 400,
    headline: 'New Arrivals',
    description: 'Check out our latest products',
    brandName: 'TechStore',
    createdAt: '2024-05-10T10:00:00Z',
    updatedAt: '2024-05-10T10:00:00Z',
  },
];

const mockPlacements: AdPlacement[] = [
  {
    id: 'placement-001',
    tenantId: 'tenant-001',
    storefrontId: 'sf-001',
    storefrontName: 'Main Store',
    name: 'Homepage Hero',
    type: 'HOMEPAGE_HERO',
    description: 'Large hero banner below homepage carousel',
    width: 1200,
    height: 400,
    baseCpm: 10,
    baseCpc: 0.5,
    minimumBid: 5,
    isActive: true,
    maxAdsPerPage: 1,
    requiresApproval: true,
    avgImpressions: 50000,
    avgCtr: 2.5,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'placement-002',
    tenantId: 'tenant-001',
    storefrontId: 'sf-001',
    storefrontName: 'Main Store',
    name: 'Category Banner',
    type: 'CATEGORY_BANNER',
    description: 'Banner header on category pages',
    width: 728,
    height: 90,
    baseCpm: 5,
    baseCpc: 0.25,
    minimumBid: 2,
    isActive: true,
    maxAdsPerPage: 2,
    requiresApproval: false,
    avgImpressions: 25000,
    avgCtr: 1.8,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'placement-003',
    tenantId: 'tenant-001',
    storefrontId: 'sf-001',
    storefrontName: 'Main Store',
    name: 'Product Listing In-Feed',
    type: 'PRODUCT_LISTING',
    description: 'Native sponsored product in listings (after row 3/6)',
    width: 300,
    height: 250,
    baseCpm: 8,
    baseCpc: 0.35,
    minimumBid: 3,
    isActive: true,
    maxAdsPerPage: 4,
    requiresApproval: false,
    avgImpressions: 40000,
    avgCtr: 3.2,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'placement-004',
    tenantId: 'tenant-001',
    storefrontId: 'sf-001',
    storefrontName: 'Main Store',
    name: 'PLP Sidebar',
    type: 'SIDEBAR',
    description: 'Right rail sidebar on product listing pages',
    width: 300,
    height: 600,
    baseCpm: 6,
    baseCpc: 0.3,
    minimumBid: 2,
    isActive: true,
    maxAdsPerPage: 3,
    requiresApproval: false,
    avgImpressions: 35000,
    avgCtr: 2.0,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'placement-005',
    tenantId: 'tenant-001',
    storefrontId: 'sf-001',
    storefrontName: 'Main Store',
    name: 'PDP Sidebar',
    type: 'SIDEBAR',
    description: 'Right rail sidebar on product detail pages',
    width: 300,
    height: 400,
    baseCpm: 7,
    baseCpc: 0.4,
    minimumBid: 3,
    isActive: true,
    maxAdsPerPage: 2,
    requiresApproval: false,
    avgImpressions: 30000,
    avgCtr: 2.2,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'placement-006',
    tenantId: 'tenant-001',
    storefrontId: 'sf-001',
    storefrontName: 'Main Store',
    name: 'Product Detail Below Description',
    type: 'PRODUCT_DETAIL',
    description: 'Story card below product description',
    width: 728,
    height: 250,
    baseCpm: 8,
    baseCpc: 0.45,
    minimumBid: 3,
    isActive: true,
    maxAdsPerPage: 1,
    requiresApproval: true,
    avgImpressions: 25000,
    avgCtr: 2.8,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'placement-007',
    tenantId: 'tenant-001',
    storefrontId: 'sf-001',
    storefrontName: 'Main Store',
    name: 'Mega Menu Card',
    type: 'MEGA_MENU',
    description: 'Promotional card within navigation mega menu',
    width: 200,
    height: 200,
    baseCpm: 12,
    baseCpc: 0.6,
    minimumBid: 5,
    isActive: true,
    maxAdsPerPage: 2,
    requiresApproval: true,
    avgImpressions: 60000,
    avgCtr: 1.5,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'placement-008',
    tenantId: 'tenant-001',
    storefrontId: 'sf-001',
    storefrontName: 'Main Store',
    name: 'Search Results',
    type: 'SEARCH_RESULTS',
    description: 'Sponsored results in search listings',
    width: 300,
    height: 250,
    baseCpm: 9,
    baseCpc: 0.5,
    minimumBid: 4,
    isActive: true,
    maxAdsPerPage: 3,
    requiresApproval: false,
    avgImpressions: 20000,
    avgCtr: 3.5,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'placement-009',
    tenantId: 'tenant-001',
    storefrontId: 'sf-001',
    storefrontName: 'Main Store',
    name: 'Promo Ribbon',
    type: 'PROMO_RIBBON',
    description: 'Slim promotional ribbon between content sections',
    width: 1200,
    height: 50,
    baseCpm: 4,
    baseCpc: 0.2,
    minimumBid: 1,
    isActive: true,
    maxAdsPerPage: 2,
    requiresApproval: false,
    avgImpressions: 55000,
    avgCtr: 1.2,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'placement-010',
    tenantId: 'tenant-001',
    storefrontId: 'sf-001',
    storefrontName: 'Main Store',
    name: 'Homepage Interstitial',
    type: 'INTERSTITIAL',
    description: 'Full-width sponsored section between homepage blocks',
    width: 1200,
    height: 400,
    baseCpm: 15,
    baseCpc: 0.8,
    minimumBid: 8,
    isActive: true,
    maxAdsPerPage: 1,
    requiresApproval: true,
    avgImpressions: 45000,
    avgCtr: 2.0,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'placement-011',
    tenantId: 'tenant-001',
    storefrontId: 'sf-001',
    storefrontName: 'Main Store',
    name: 'Cart Sidebar',
    type: 'CART',
    description: 'Promotional sidebar on cart page',
    width: 300,
    height: 400,
    baseCpm: 10,
    baseCpc: 0.5,
    minimumBid: 4,
    isActive: true,
    maxAdsPerPage: 2,
    requiresApproval: false,
    avgImpressions: 15000,
    avgCtr: 3.0,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'placement-012',
    tenantId: 'tenant-001',
    storefrontId: 'sf-002',
    storefrontName: 'Fashion Outlet',
    name: 'Homepage Hero',
    type: 'HOMEPAGE_HERO',
    description: 'Large hero banner on Fashion Outlet homepage',
    width: 1200,
    height: 400,
    baseCpm: 8,
    baseCpc: 0.4,
    minimumBid: 4,
    isActive: true,
    maxAdsPerPage: 1,
    requiresApproval: true,
    avgImpressions: 35000,
    avgCtr: 2.2,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
];

const mockSubmissions: AdSubmission[] = [
  {
    id: 'sub-001',
    tenantId: 'tenant-001',
    vendorId: 'vendor-001',
    vendorName: 'TechStore',
    campaignId: 'camp-002',
    submissionType: 'CAMPAIGN',
    status: 'PENDING',
    submittedById: 'user-001',
    submittedByName: 'John Doe',
    submittedByEmail: 'john@techstore.com',
    submittedAt: '2024-06-20T10:00:00Z',
    message: 'Please approve our new product launch campaign',
  },
  {
    id: 'sub-002',
    tenantId: 'tenant-001',
    vendorId: 'vendor-002',
    vendorName: 'FashionHub',
    campaignId: 'camp-004',
    submissionType: 'CAMPAIGN',
    status: 'PENDING',
    submittedById: 'user-003',
    submittedByName: 'Alice Johnson',
    submittedByEmail: 'alice@fashionhub.com',
    submittedAt: '2024-06-19T15:00:00Z',
    message: 'Summer fashion campaign for approval',
  },
];

// ========================================
// Mock Service Implementation
// ========================================

class MockAdManagerService {
  private campaigns: AdCampaign[] = [...mockCampaigns];
  private creatives: AdCreative[] = [...mockCreatives];
  private placements: AdPlacement[] = [...mockPlacements];
  private submissions: AdSubmission[] = [...mockSubmissions];
  private nextCampaignId = 4;
  private nextCreativeId = 3;
  private nextSubmissionId = 3;

  // === Campaigns ===
  async getCampaigns(params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiListResponse<AdCampaign>> {
    let filtered = [...this.campaigns];

    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((c) => c.status === params.status);
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.description?.toLowerCase().includes(search)
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);

    filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const start = (page - 1) * limit;
    const paginatedData = filtered.slice(start, start + limit);

    return {
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async getCampaign(id: string): Promise<ApiResponse<AdCampaign>> {
    const campaign = this.campaigns.find((c) => c.id === id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    return { success: true, data: campaign };
  }

  async createCampaign(data: CreateAdCampaignRequest): Promise<ApiResponse<AdCampaign>> {
    const campaignId = `camp-${String(this.nextCampaignId++).padStart(3, '0')}`;
    const { targetingRules: inputRules, ...rest } = data;

    // Transform targeting rules to include id and campaignId
    const targetingRules = inputRules?.map((rule, index) => ({
      ...rule,
      id: `rule-${campaignId}-${index}`,
      campaignId,
    }));

    const newCampaign: AdCampaign = {
      id: campaignId,
      tenantId: 'tenant-001',
      vendorId: 'vendor-001',
      ...rest,
      status: 'DRAFT',
      spentTotal: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      ctr: 0,
      cvr: 0,
      roas: 0,
      targetAllStorefronts: data.targetAllStorefronts ?? false,
      targetingRules,
      createdById: 'user-001',
      createdByName: 'Current User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.campaigns.unshift(newCampaign);
    return { success: true, data: newCampaign };
  }

  async updateCampaign(id: string, data: UpdateAdCampaignRequest): Promise<ApiResponse<AdCampaign>> {
    const index = this.campaigns.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Campaign not found');
    }

    const { targetingRules: inputRules, ...rest } = data;

    // Transform targeting rules if provided
    const targetingRules = inputRules?.map((rule, ruleIndex) => ({
      ...rule,
      id: `rule-${id}-${ruleIndex}`,
      campaignId: id,
    }));

    this.campaigns[index] = {
      ...this.campaigns[index],
      ...rest,
      ...(targetingRules ? { targetingRules } : {}),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: this.campaigns[index] };
  }

  async deleteCampaign(id: string): Promise<ApiResponse<void>> {
    const index = this.campaigns.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Campaign not found');
    }
    this.campaigns.splice(index, 1);
    return { success: true, data: undefined };
  }

  async pauseCampaign(id: string): Promise<ApiResponse<AdCampaign>> {
    return this.updateCampaign(id, { status: 'PAUSED' });
  }

  async resumeCampaign(id: string): Promise<ApiResponse<AdCampaign>> {
    return this.updateCampaign(id, { status: 'ACTIVE' });
  }

  // === Creatives ===
  async getCreatives(params?: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiListResponse<AdCreative>> {
    let filtered = [...this.creatives];

    if (params?.type && params.type !== 'ALL') {
      filtered = filtered.filter((c) => c.type === params.type);
    }

    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((c) => c.status === params.status);
    }

    return {
      success: true,
      data: filtered,
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: filtered.length,
        totalPages: 1,
      },
    };
  }

  async getCreative(id: string): Promise<ApiResponse<AdCreative>> {
    const creative = this.creatives.find((c) => c.id === id);
    if (!creative) {
      throw new Error('Creative not found');
    }
    return { success: true, data: creative };
  }

  async createCreative(data: CreateAdCreativeRequest): Promise<ApiResponse<AdCreative>> {
    const newCreative: AdCreative = {
      id: `creative-${String(this.nextCreativeId++).padStart(3, '0')}`,
      tenantId: 'tenant-001',
      vendorId: 'vendor-001',
      ...data,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.creatives.unshift(newCreative);
    return { success: true, data: newCreative };
  }

  async updateCreative(id: string, data: UpdateAdCreativeRequest): Promise<ApiResponse<AdCreative>> {
    const index = this.creatives.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Creative not found');
    }
    this.creatives[index] = {
      ...this.creatives[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: this.creatives[index] };
  }

  async deleteCreative(id: string): Promise<ApiResponse<void>> {
    const index = this.creatives.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Creative not found');
    }
    this.creatives.splice(index, 1);
    return { success: true, data: undefined };
  }

  // === Placements ===
  async getPlacements(storefrontId?: string): Promise<ApiListResponse<AdPlacement>> {
    let filtered = [...this.placements];
    if (storefrontId) {
      filtered = filtered.filter((p) => p.storefrontId === storefrontId);
    }
    return {
      success: true,
      data: filtered,
      pagination: {
        page: 1,
        limit: 50,
        total: filtered.length,
        totalPages: 1,
      },
    };
  }

  async getPlacement(id: string): Promise<ApiResponse<AdPlacement>> {
    const placement = this.placements.find((p) => p.id === id);
    if (!placement) {
      throw new Error('Placement not found');
    }
    return { success: true, data: placement };
  }

  // === Submissions/Approvals ===
  async submitForApproval(data: SubmitAdForApprovalRequest): Promise<ApiResponse<AdSubmission>> {
    const newSubmission: AdSubmission = {
      id: `sub-${String(this.nextSubmissionId++).padStart(3, '0')}`,
      tenantId: 'tenant-001',
      vendorId: 'vendor-001',
      vendorName: 'Current Vendor',
      ...data,
      status: 'PENDING',
      submittedById: 'user-001',
      submittedByName: 'Current User',
      submittedAt: new Date().toISOString(),
    };
    this.submissions.unshift(newSubmission);
    return { success: true, data: newSubmission };
  }

  async getIncomingSubmissions(): Promise<ApiListResponse<AdSubmission>> {
    const incoming = this.submissions.filter((s) => s.status === 'PENDING');
    return {
      success: true,
      data: incoming,
      pagination: {
        page: 1,
        limit: 50,
        total: incoming.length,
        totalPages: 1,
      },
    };
  }

  async getOutgoingSubmissions(): Promise<ApiListResponse<AdSubmission>> {
    return {
      success: true,
      data: this.submissions,
      pagination: {
        page: 1,
        limit: 50,
        total: this.submissions.length,
        totalPages: 1,
      },
    };
  }

  async getSubmission(id: string): Promise<ApiResponse<AdSubmission>> {
    const submission = this.submissions.find((s) => s.id === id);
    if (!submission) {
      throw new Error('Submission not found');
    }
    return { success: true, data: submission };
  }

  async approveSubmission(id: string, data?: { reason?: string; conditions?: string }): Promise<ApiResponse<AdSubmission>> {
    const index = this.submissions.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('Submission not found');
    }
    this.submissions[index] = {
      ...this.submissions[index],
      status: 'APPROVED',
      reviewedById: 'user-001',
      reviewedByName: 'Current User',
      reviewedAt: new Date().toISOString(),
      conditions: data?.conditions,
    };

    // Update campaign status if it's a campaign submission
    if (this.submissions[index].campaignId) {
      const campaignIndex = this.campaigns.findIndex(
        (c) => c.id === this.submissions[index].campaignId
      );
      if (campaignIndex !== -1) {
        this.campaigns[campaignIndex].status = 'APPROVED';
        this.campaigns[campaignIndex].approvedById = 'user-001';
        this.campaigns[campaignIndex].approvedByName = 'Current User';
        this.campaigns[campaignIndex].approvedAt = new Date().toISOString();
      }
    }

    return { success: true, data: this.submissions[index] };
  }

  async rejectSubmission(id: string, data: { reason: string }): Promise<ApiResponse<AdSubmission>> {
    const index = this.submissions.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('Submission not found');
    }
    this.submissions[index] = {
      ...this.submissions[index],
      status: 'REJECTED',
      reviewedById: 'user-001',
      reviewedByName: 'Current User',
      reviewedAt: new Date().toISOString(),
      rejectionReason: data.reason,
    };

    // Update campaign status if it's a campaign submission
    if (this.submissions[index].campaignId) {
      const campaignIndex = this.campaigns.findIndex(
        (c) => c.id === this.submissions[index].campaignId
      );
      if (campaignIndex !== -1) {
        this.campaigns[campaignIndex].status = 'REJECTED';
        this.campaigns[campaignIndex].rejectionReason = data.reason;
      }
    }

    return { success: true, data: this.submissions[index] };
  }

  // === Analytics ===
  async getStats(): Promise<ApiResponse<AdCampaignStats>> {
    const stats: AdCampaignStats = {
      totalCampaigns: this.campaigns.length,
      activeCampaigns: this.campaigns.filter((c) => c.status === 'ACTIVE').length,
      pausedCampaigns: this.campaigns.filter((c) => c.status === 'PAUSED').length,
      pendingApproval: this.campaigns.filter((c) => c.status === 'PENDING_APPROVAL').length,
      totalSpend: this.campaigns.reduce((sum, c) => sum + c.spentTotal, 0),
      totalRevenue: this.campaigns.reduce((sum, c) => sum + c.revenue, 0),
      totalImpressions: this.campaigns.reduce((sum, c) => sum + c.impressions, 0),
      totalClicks: this.campaigns.reduce((sum, c) => sum + c.clicks, 0),
      avgCtr: this.campaigns.length > 0
        ? this.campaigns.reduce((sum, c) => sum + c.ctr, 0) / this.campaigns.length
        : 0,
      avgRoas: this.campaigns.length > 0
        ? this.campaigns.reduce((sum, c) => sum + c.roas, 0) / this.campaigns.length
        : 0,
    };
    return { success: true, data: stats };
  }

  async getAnalytics(query: AdAnalyticsQuery): Promise<ApiResponse<AdAnalyticsResponse>> {
    const summary: AdAnalyticsSummary = {
      impressions: 205000,
      clicks: 5350,
      conversions: 235,
      spend: 2050,
      revenue: 11750,
      ctr: 2.61,
      cvr: 4.39,
      roas: 5.73,
      cpc: 0.38,
      cpm: 10,
    };

    return {
      success: true,
      data: {
        summary,
        timeSeries: [
          { date: '2024-06-01', impressions: 5000, clicks: 150, conversions: 8, spend: 50, revenue: 400 },
          { date: '2024-06-02', impressions: 5500, clicks: 165, conversions: 9, spend: 55, revenue: 450 },
          { date: '2024-06-03', impressions: 6000, clicks: 180, conversions: 10, spend: 60, revenue: 500 },
        ],
      },
    };
  }

  // === Storefronts ===
  async getEligibleStorefronts(): Promise<ApiListResponse<{ id: string; name: string; slug: string }>> {
    return {
      success: true,
      data: [
        { id: 'sf-001', name: 'Main Store', slug: 'main-store' },
        { id: 'sf-002', name: 'Electronics Hub', slug: 'electronics-hub' },
        { id: 'sf-003', name: 'Fashion Outlet', slug: 'fashion-outlet' },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 3,
        totalPages: 1,
      },
    };
  }
}

const mockService = new MockAdManagerService();

// ========================================
// Real API Service Implementation
// ========================================

class RealAdManagerService {
  // === Campaigns ===
  async getCampaigns(params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiListResponse<AdCampaign>> {
    const queryParams = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    const query = queryParams.toString();
    return apiClient.get<ApiListResponse<AdCampaign>>(`${AD_API_BASE}/campaigns${query ? `?${query}` : ''}`);
  }

  async getCampaign(id: string): Promise<ApiResponse<AdCampaign>> {
    return apiClient.get<ApiResponse<AdCampaign>>(`${AD_API_BASE}/campaigns/${id}`);
  }

  async createCampaign(data: CreateAdCampaignRequest): Promise<ApiResponse<AdCampaign>> {
    return apiClient.post<ApiResponse<AdCampaign>>(`${AD_API_BASE}/campaigns`, data);
  }

  async updateCampaign(id: string, data: UpdateAdCampaignRequest): Promise<ApiResponse<AdCampaign>> {
    return apiClient.put<ApiResponse<AdCampaign>>(`${AD_API_BASE}/campaigns/${id}`, data);
  }

  async deleteCampaign(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`${AD_API_BASE}/campaigns/${id}`);
  }

  async pauseCampaign(id: string): Promise<ApiResponse<AdCampaign>> {
    return apiClient.post<ApiResponse<AdCampaign>>(`${AD_API_BASE}/campaigns/${id}/pause`, {});
  }

  async resumeCampaign(id: string): Promise<ApiResponse<AdCampaign>> {
    return apiClient.post<ApiResponse<AdCampaign>>(`${AD_API_BASE}/campaigns/${id}/resume`, {});
  }

  // === Ads ===
  async getAds(campaignId: string): Promise<ApiListResponse<Ad>> {
    return apiClient.get<ApiListResponse<Ad>>(`${AD_API_BASE}/campaigns/${campaignId}/ads`);
  }

  async createAd(data: CreateAdRequest): Promise<ApiResponse<Ad>> {
    return apiClient.post<ApiResponse<Ad>>(`${AD_API_BASE}/campaigns/${data.campaignId}/ads`, data);
  }

  async updateAd(campaignId: string, adId: string, data: UpdateAdRequest): Promise<ApiResponse<Ad>> {
    return apiClient.put<ApiResponse<Ad>>(`${AD_API_BASE}/campaigns/${campaignId}/ads/${adId}`, data);
  }

  async deleteAd(campaignId: string, adId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`${AD_API_BASE}/campaigns/${campaignId}/ads/${adId}`);
  }

  // === Creatives ===
  async getCreatives(params?: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiListResponse<AdCreative>> {
    const queryParams = new URLSearchParams();
    if (params?.type && params.type !== 'ALL') queryParams.append('type', params.type);
    if (params?.status && params.status !== 'ALL') queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return apiClient.get<ApiListResponse<AdCreative>>(`${AD_API_BASE}/creatives${query ? `?${query}` : ''}`);
  }

  async getCreative(id: string): Promise<ApiResponse<AdCreative>> {
    return apiClient.get<ApiResponse<AdCreative>>(`${AD_API_BASE}/creatives/${id}`);
  }

  async createCreative(data: CreateAdCreativeRequest): Promise<ApiResponse<AdCreative>> {
    return apiClient.post<ApiResponse<AdCreative>>(`${AD_API_BASE}/creatives`, data);
  }

  async updateCreative(id: string, data: UpdateAdCreativeRequest): Promise<ApiResponse<AdCreative>> {
    return apiClient.put<ApiResponse<AdCreative>>(`${AD_API_BASE}/creatives/${id}`, data);
  }

  async deleteCreative(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`${AD_API_BASE}/creatives/${id}`);
  }

  // === Placements ===
  async getPlacements(storefrontId?: string): Promise<ApiListResponse<AdPlacement>> {
    const url = storefrontId
      ? `${AD_API_BASE}/placements?storefrontId=${storefrontId}`
      : `${AD_API_BASE}/placements`;
    return apiClient.get<ApiListResponse<AdPlacement>>(url);
  }

  async getPlacement(id: string): Promise<ApiResponse<AdPlacement>> {
    return apiClient.get<ApiResponse<AdPlacement>>(`${AD_API_BASE}/placements/${id}`);
  }

  // === Submissions/Approvals ===
  async submitForApproval(data: SubmitAdForApprovalRequest): Promise<ApiResponse<AdSubmission>> {
    return apiClient.post<ApiResponse<AdSubmission>>(`${AD_API_BASE}/submissions`, data);
  }

  async getIncomingSubmissions(): Promise<ApiListResponse<AdSubmission>> {
    return apiClient.get<ApiListResponse<AdSubmission>>(`${AD_API_BASE}/submissions/incoming`);
  }

  async getOutgoingSubmissions(): Promise<ApiListResponse<AdSubmission>> {
    return apiClient.get<ApiListResponse<AdSubmission>>(`${AD_API_BASE}/submissions/outgoing`);
  }

  async getSubmission(id: string): Promise<ApiResponse<AdSubmission>> {
    return apiClient.get<ApiResponse<AdSubmission>>(`${AD_API_BASE}/submissions/${id}`);
  }

  async approveSubmission(id: string, data?: { reason?: string; conditions?: string }): Promise<ApiResponse<AdSubmission>> {
    return apiClient.post<ApiResponse<AdSubmission>>(`${AD_API_BASE}/submissions/${id}/approve`, data || {});
  }

  async rejectSubmission(id: string, data: { reason: string }): Promise<ApiResponse<AdSubmission>> {
    return apiClient.post<ApiResponse<AdSubmission>>(`${AD_API_BASE}/submissions/${id}/reject`, data);
  }

  async requestRevision(id: string, data: { notes: string }): Promise<ApiResponse<AdSubmission>> {
    return apiClient.post<ApiResponse<AdSubmission>>(`${AD_API_BASE}/submissions/${id}/request-revision`, data);
  }

  // === Analytics ===
  async getStats(): Promise<ApiResponse<AdCampaignStats>> {
    return apiClient.get<ApiResponse<AdCampaignStats>>(`${AD_API_BASE}/stats`);
  }

  async getAnalytics(query: AdAnalyticsQuery): Promise<ApiResponse<AdAnalyticsResponse>> {
    const queryParams = new URLSearchParams();
    if (query.campaignId) queryParams.append('campaignId', query.campaignId);
    if (query.adId) queryParams.append('adId', query.adId);
    if (query.storefrontId) queryParams.append('storefrontId', query.storefrontId);
    if (query.placementId) queryParams.append('placementId', query.placementId);
    queryParams.append('dateFrom', query.dateFrom);
    queryParams.append('dateTo', query.dateTo);
    if (query.groupBy) queryParams.append('groupBy', query.groupBy);
    return apiClient.get<ApiResponse<AdAnalyticsResponse>>(`${AD_API_BASE}/analytics?${queryParams.toString()}`);
  }

  // === Storefronts ===
  async getEligibleStorefronts(): Promise<ApiListResponse<{ id: string; name: string; slug: string }>> {
    return apiClient.get<ApiListResponse<{ id: string; name: string; slug: string }>>(`${AD_API_BASE}/storefronts`);
  }
}

const realService = new RealAdManagerService();

// ========================================
// Exported Service
// ========================================

export const adManagerService = {
  // Campaigns
  getCampaigns: (params?: Parameters<typeof mockService.getCampaigns>[0]) =>
    USE_MOCK_DATA ? mockService.getCampaigns(params) : realService.getCampaigns(params),
  getCampaign: (id: string) =>
    USE_MOCK_DATA ? mockService.getCampaign(id) : realService.getCampaign(id),
  createCampaign: (data: CreateAdCampaignRequest) =>
    USE_MOCK_DATA ? mockService.createCampaign(data) : realService.createCampaign(data),
  updateCampaign: (id: string, data: UpdateAdCampaignRequest) =>
    USE_MOCK_DATA ? mockService.updateCampaign(id, data) : realService.updateCampaign(id, data),
  deleteCampaign: (id: string) =>
    USE_MOCK_DATA ? mockService.deleteCampaign(id) : realService.deleteCampaign(id),
  pauseCampaign: (id: string) =>
    USE_MOCK_DATA ? mockService.pauseCampaign(id) : realService.pauseCampaign(id),
  resumeCampaign: (id: string) =>
    USE_MOCK_DATA ? mockService.resumeCampaign(id) : realService.resumeCampaign(id),

  // Ads
  getAds: (campaignId: string) =>
    USE_MOCK_DATA
      ? Promise.resolve({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } } as ApiListResponse<Ad>)
      : realService.getAds(campaignId),
  createAd: (data: CreateAdRequest) =>
    USE_MOCK_DATA
      ? Promise.resolve({ success: true, data: {} as Ad })
      : realService.createAd(data),
  updateAd: (campaignId: string, adId: string, data: UpdateAdRequest) =>
    USE_MOCK_DATA
      ? Promise.resolve({ success: true, data: {} as Ad })
      : realService.updateAd(campaignId, adId, data),
  deleteAd: (campaignId: string, adId: string) =>
    USE_MOCK_DATA
      ? Promise.resolve({ success: true, data: undefined })
      : realService.deleteAd(campaignId, adId),

  // Creatives
  getCreatives: (params?: Parameters<typeof mockService.getCreatives>[0]) =>
    USE_MOCK_DATA ? mockService.getCreatives(params) : realService.getCreatives(params),
  getCreative: (id: string) =>
    USE_MOCK_DATA ? mockService.getCreative(id) : realService.getCreative(id),
  createCreative: (data: CreateAdCreativeRequest) =>
    USE_MOCK_DATA ? mockService.createCreative(data) : realService.createCreative(data),
  updateCreative: (id: string, data: UpdateAdCreativeRequest) =>
    USE_MOCK_DATA ? mockService.updateCreative(id, data) : realService.updateCreative(id, data),
  deleteCreative: (id: string) =>
    USE_MOCK_DATA ? mockService.deleteCreative(id) : realService.deleteCreative(id),

  // Placements
  getPlacements: (storefrontId?: string) =>
    USE_MOCK_DATA ? mockService.getPlacements(storefrontId) : realService.getPlacements(storefrontId),
  getPlacement: (id: string) =>
    USE_MOCK_DATA ? mockService.getPlacement(id) : realService.getPlacement(id),

  // Submissions/Approvals
  submitForApproval: (data: SubmitAdForApprovalRequest) =>
    USE_MOCK_DATA ? mockService.submitForApproval(data) : realService.submitForApproval(data),
  getIncomingSubmissions: () =>
    USE_MOCK_DATA ? mockService.getIncomingSubmissions() : realService.getIncomingSubmissions(),
  getOutgoingSubmissions: () =>
    USE_MOCK_DATA ? mockService.getOutgoingSubmissions() : realService.getOutgoingSubmissions(),
  getSubmission: (id: string) =>
    USE_MOCK_DATA ? mockService.getSubmission(id) : realService.getSubmission(id),
  approveSubmission: (id: string, data?: { reason?: string; conditions?: string }) =>
    USE_MOCK_DATA ? mockService.approveSubmission(id, data) : realService.approveSubmission(id, data),
  rejectSubmission: (id: string, data: { reason: string }) =>
    USE_MOCK_DATA ? mockService.rejectSubmission(id, data) : realService.rejectSubmission(id, data),
  requestRevision: (id: string, data: { notes: string }) =>
    USE_MOCK_DATA
      ? Promise.resolve({ success: true, data: {} as AdSubmission })
      : realService.requestRevision(id, data),

  // Analytics
  getStats: () =>
    USE_MOCK_DATA ? mockService.getStats() : realService.getStats(),
  getAnalytics: (query: AdAnalyticsQuery) =>
    USE_MOCK_DATA ? mockService.getAnalytics(query) : realService.getAnalytics(query),

  // Storefronts
  getEligibleStorefronts: () =>
    USE_MOCK_DATA ? mockService.getEligibleStorefronts() : realService.getEligibleStorefronts(),

  // Utility
  isMockMode: () => USE_MOCK_DATA,
};
