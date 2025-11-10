import { simpleStorage } from './simple-storage.js';
import { LeadScoringEngine } from './leadScoring.js';

export interface BookingRecommendation {
  packageId: number;
  packageName: string;
  destination: string;
  price: string;
  duration: number;
  score: number;
  reasons: string[];
  matchType: 'customer_history' | 'preferences' | 'lead_behavior' | 'popular' | 'seasonal';
}

export interface RevenueOptimization {
  currentMonthRevenue: number;
  projectedRevenue: number;
  recommendations: {
    type: 'upsell' | 'cross_sell' | 'pricing' | 'promotion';
    description: string;
    impact: number;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export class BookingRecommendationEngine {
  
  /**
   * Get personalized package recommendations for a customer
   */
  static async getRecommendationsForCustomer(customerId: number, tenantId: number): Promise<BookingRecommendation[]> {
    try {
      const [customer, packages, bookings, leads] = await Promise.all([
        simpleStorage.getCustomersByTenant(tenantId).then(customers => 
          customers.find((c: any) => c.id === customerId)
        ),
        simpleStorage.getPackagesByTenant(tenantId),
        simpleStorage.getBookingsByTenant(tenantId),
        simpleStorage.getLeadsByTenant(tenantId)
      ]);

      if (!customer) {
        throw new Error('Customer not found');
      }

      const recommendations: BookingRecommendation[] = [];
      
      // Get customer's booking history
      const customerBookings = bookings.filter((b: any) => b.customerId === customerId);
      
      // Get customer preferences
      const preferences = customer.preferences || {};
      
      // Find lead data if customer was converted from lead
      const customerLead = leads.find((l: any) => l.email === customer.email);

      for (const pkg of packages) {
        if (!pkg.isActive) continue;

        const score = this.calculatePackageScore(pkg, customer, customerBookings, preferences, customerLead);
        
        if (score > 30) { // Only recommend packages with decent scores
          const reasons = this.generateRecommendationReasons(pkg, customer, customerBookings, preferences, customerLead, score);
          
          recommendations.push({
            packageId: pkg.id,
            packageName: pkg.name,
            destination: pkg.destination,
            price: pkg.price,
            duration: pkg.duration,
            score,
            reasons,
            matchType: this.determineMatchType(pkg, customer, customerBookings, preferences)
          });
        }
      }

      // Sort by score and return top 5
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Calculate how well a package matches a customer
   */
  private static calculatePackageScore(
    pkg: any, 
    customer: any, 
    customerBookings: any[], 
    preferences: any, 
    customerLead: any
  ): number {
    let score = 50; // Base score
    
    // Previous booking patterns
    if (customerBookings.length > 0) {
      const avgPreviousPrice = customerBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0) / customerBookings.length;
      const packagePrice = parseFloat(pkg.price || '0');
      
      // Price range similarity (within 20% gets bonus)
      if (Math.abs(packagePrice - avgPreviousPrice) / avgPreviousPrice <= 0.2) {
        score += 15;
      }
      
      // Duration preference
      const avgDuration = customerBookings.reduce((sum, b) => sum + (b.duration || pkg.duration), 0) / customerBookings.length;
      if (Math.abs(pkg.duration - avgDuration) <= 2) {
        score += 10;
      }
    }

    // Destination preferences
    if (preferences.preferredDestinations) {
      const preferredDestinations = Array.isArray(preferences.preferredDestinations) 
        ? preferences.preferredDestinations 
        : preferences.preferredDestinations.split(',');
      
      if (preferredDestinations.some((dest: string) => 
        pkg.destination.toLowerCase().includes(dest.toLowerCase().trim())
      )) {
        score += 20;
      }
    }

    // Budget range matching
    if (preferences.budgetRange) {
      const packagePrice = parseFloat(pkg.price || '0');
      const budgetMatch = this.checkBudgetMatch(packagePrice, preferences.budgetRange);
      if (budgetMatch) {
        score += 15;
      }
    }

    // Lead behavior (if customer was converted from lead)
    if (customerLead) {
      const leadScore = customerLead.score || 0;
      if (leadScore >= 70) {
        score += 10; // High-intent customers get bonus
      }
      
      // Interested packages matching
      if (customerLead.interestedPackages && 
          customerLead.interestedPackages.includes(pkg.name)) {
        score += 25;
      }
    }

    // Group size considerations
    if (preferences.groupSize && pkg.maxCapacity) {
      const groupSize = parseInt(preferences.groupSize) || 1;
      if (groupSize <= pkg.maxCapacity) {
        score += 5;
      }
    }

    // Travel timeframe urgency
    if (preferences.travelTimeframe) {
      const urgencyBonus = this.getUrgencyBonus(preferences.travelTimeframe);
      score += urgencyBonus;
    }

    // Seasonal relevance
    const seasonalBonus = this.getSeasonalBonus(pkg.destination);
    score += seasonalBonus;

    return Math.min(Math.round(score), 100);
  }

  /**
   * Check if package price matches customer's budget range
   */
  private static checkBudgetMatch(packagePrice: number, budgetRange: string): boolean {
    const ranges: Record<string, [number, number]> = {
      'under_1000': [0, 1000],
      '1000_3000': [1000, 3000],
      '3000_5000': [3000, 5000],
      '5000_10000': [5000, 10000],
      'over_10000': [10000, Infinity]
    };

    const range = ranges[budgetRange];
    return range ? packagePrice >= range[0] && packagePrice <= range[1] : false;
  }

  /**
   * Get urgency bonus based on travel timeframe
   */
  private static getUrgencyBonus(timeframe: string): number {
    const urgencyMap: Record<string, number> = {
      'immediate': 15,
      'within_month': 10,
      'within_3_months': 5,
      'within_6_months': 3,
      'next_year': 0
    };
    
    return urgencyMap[timeframe] || 0;
  }

  /**
   * Get seasonal bonus for destination
   */
  private static getSeasonalBonus(destination: string): number {
    const currentMonth = new Date().getMonth() + 1;
    
    // Simple seasonal logic (can be enhanced)
    const seasonalMap: Record<string, number[]> = {
      'europe': [6, 7, 8, 9], // Summer months
      'asia': [10, 11, 12, 1, 2, 3], // Cooler months
      'tropical': [12, 1, 2, 3, 4], // Dry season
      'ski': [12, 1, 2, 3], // Winter months
    };

    for (const [region, months] of Object.entries(seasonalMap)) {
      if (destination.toLowerCase().includes(region) && months.includes(currentMonth)) {
        return 8;
      }
    }

    return 0;
  }

  /**
   * Generate human-readable reasons for recommendation
   */
  private static generateRecommendationReasons(
    pkg: any, 
    customer: any, 
    customerBookings: any[], 
    preferences: any, 
    customerLead: any,
    score: number
  ): string[] {
    const reasons: string[] = [];

    if (score >= 80) {
      reasons.push("Perfect match for your preferences");
    } else if (score >= 60) {
      reasons.push("Highly recommended based on your profile");
    }

    if (customerBookings.length > 0) {
      const avgPrice = customerBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0) / customerBookings.length;
      const packagePrice = parseFloat(pkg.price || '0');
      
      if (Math.abs(packagePrice - avgPrice) / avgPrice <= 0.2) {
        reasons.push("Similar to your previous bookings");
      }
    }

    if (preferences.preferredDestinations) {
      const preferredDestinations = Array.isArray(preferences.preferredDestinations) 
        ? preferences.preferredDestinations 
        : preferences.preferredDestinations.split(',');
      
      if (preferredDestinations.some((dest: string) => 
        pkg.destination.toLowerCase().includes(dest.toLowerCase().trim())
      )) {
        reasons.push("Matches your preferred destinations");
      }
    }

    if (preferences.budgetRange) {
      const packagePrice = parseFloat(pkg.price || '0');
      if (this.checkBudgetMatch(packagePrice, preferences.budgetRange)) {
        reasons.push("Within your budget range");
      }
    }

    if (customerLead && customerLead.score >= 70) {
      reasons.push("Based on your high engagement level");
    }

    const seasonalBonus = this.getSeasonalBonus(pkg.destination);
    if (seasonalBonus > 5) {
      reasons.push("Perfect timing for this destination");
    }

    if (reasons.length === 0) {
      reasons.push("Popular choice among similar customers");
    }

    return reasons;
  }

  /**
   * Determine the type of match for categorization
   */
  private static determineMatchType(
    pkg: any, 
    customer: any, 
    customerBookings: any[], 
    preferences: any
  ): BookingRecommendation['matchType'] {
    if (customerBookings.length > 0) {
      return 'customer_history';
    }
    
    if (preferences.preferredDestinations || preferences.budgetRange) {
      return 'preferences';
    }
    
    const seasonalBonus = this.getSeasonalBonus(pkg.destination);
    if (seasonalBonus > 5) {
      return 'seasonal';
    }
    
    return 'popular';
  }

  /**
   * Generate revenue optimization recommendations
   */
  static async generateRevenueOptimization(tenantId: number): Promise<RevenueOptimization> {
    try {
      const [bookings, packages, customers] = await Promise.all([
        simpleStorage.getBookingsByTenant(tenantId),
        simpleStorage.getPackagesByTenant(tenantId),
        simpleStorage.getCustomersByTenant(tenantId)
      ]);

      // Calculate current month revenue
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const currentMonthBookings = bookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      });

      const currentMonthRevenue = currentMonthBookings.reduce((sum, b) => 
        sum + parseFloat(b.totalAmount || '0'), 0
      );

      // Calculate average monthly revenue for projection
      const avgMonthlyRevenue = bookings.reduce((sum, b) => 
        sum + parseFloat(b.totalAmount || '0'), 0
      ) / Math.max(1, new Set(bookings.map(b => 
        new Date(b.createdAt).toISOString().slice(0, 7)
      )).size);

      const projectedRevenue = avgMonthlyRevenue * 1.15; // 15% growth target

      // Generate optimization recommendations
      const recommendations = [];

      // Upselling opportunities
      const lowValueBookings = currentMonthBookings.filter(b => 
        parseFloat(b.totalAmount || '0') < avgMonthlyRevenue * 0.3
      );

      if (lowValueBookings.length > 0) {
        recommendations.push({
          type: 'upsell' as const,
          description: `${lowValueBookings.length} bookings could be upsold to premium packages`,
          impact: lowValueBookings.length * 500, // Estimated impact
          priority: 'high' as const
        });
      }

      // Cross-selling based on customer segments
      const repeatCustomers = customers.filter((c: any) => 
        bookings.filter(b => b.customerId === c.id).length > 1
      );

      if (repeatCustomers.length > 0) {
        recommendations.push({
          type: 'cross_sell' as const,
          description: `${repeatCustomers.length} repeat customers could be offered complementary services`,
          impact: repeatCustomers.length * 300,
          priority: 'medium' as const
        });
      }

      // Pricing optimization
      const popularPackages = packages.filter(p => {
        const bookingCount = bookings.filter(b => b.packageId === p.id).length;
        return bookingCount > bookings.length * 0.1; // More than 10% of bookings
      });

      if (popularPackages.length > 0) {
        recommendations.push({
          type: 'pricing' as const,
          description: `${popularPackages.length} popular packages could support 5-10% price increase`,
          impact: popularPackages.length * 200,
          priority: 'medium' as const
        });
      }

      // Promotional opportunities
      const lowPerformingPackages = packages.filter(p => {
        const bookingCount = bookings.filter(b => b.packageId === p.id).length;
        return bookingCount < 2 && p.isActive;
      });

      if (lowPerformingPackages.length > 0) {
        recommendations.push({
          type: 'promotion' as const,
          description: `${lowPerformingPackages.length} packages need promotional campaigns to boost sales`,
          impact: lowPerformingPackages.length * 400,
          priority: 'low' as const
        });
      }

      return {
        currentMonthRevenue: Math.round(currentMonthRevenue),
        projectedRevenue: Math.round(projectedRevenue),
        recommendations: recommendations.sort((a, b) => {
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
      };

    } catch (error) {
      console.error('Error generating revenue optimization:', error);
      return {
        currentMonthRevenue: 0,
        projectedRevenue: 0,
        recommendations: []
      };
    }
  }
}