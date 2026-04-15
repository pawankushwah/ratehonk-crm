import { Lead } from "./../shared/schema.js";

export interface LeadScoringFactors {
  source: number;
  engagement: number;
  demographics: number;
  behavior: number;
  timeframe: number;
  budget: number;
}

export class LeadScoringEngine {
  // Scoring weights for different factors
  private static readonly WEIGHTS = {
    SOURCE: 0.20,      // 20% - where the lead came from
    ENGAGEMENT: 0.25,  // 25% - email opens, clicks, website visits
    DEMOGRAPHICS: 0.15, // 15% - group size, destination preferences
    BEHAVIOR: 0.20,    // 20% - brochure downloads, form submissions
    TIMEFRAME: 0.10,   // 10% - urgency of travel plans
    BUDGET: 0.10       // 10% - budget range
  };

  /**
   * Calculate comprehensive lead score (0-100)
   */
  static calculateScore(lead: any): number {
    const factors = this.calculateFactors(lead);
    
    const totalScore = 
      (factors.source * this.WEIGHTS.SOURCE) +
      (factors.engagement * this.WEIGHTS.ENGAGEMENT) +
      (factors.demographics * this.WEIGHTS.DEMOGRAPHICS) +
      (factors.behavior * this.WEIGHTS.BEHAVIOR) +
      (factors.timeframe * this.WEIGHTS.TIMEFRAME) +
      (factors.budget * this.WEIGHTS.BUDGET);

    return Math.min(Math.round(totalScore), 100);
  }

  /**
   * Calculate priority level based on score
   */
  static calculatePriority(score: number): string {
    if (score >= 80) return "hot";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    return "low";
  }

  /**
   * Calculate individual scoring factors
   */
  private static calculateFactors(lead: any): LeadScoringFactors {
    return {
      source: this.scoreSource(lead.source),
      engagement: this.scoreEngagement(lead),
      demographics: this.scoreDemographics(lead),
      behavior: this.scoreBehavior(lead),
      timeframe: this.scoreTimeframe(lead.travelTimeframe),
      budget: this.scoreBudget(lead.budgetRange)
    };
  }

  /**
   * Score based on lead source (0-100)
   */
  private static scoreSource(source: string | null): number {
    const sourceScores: Record<string, number> = {
      'referral': 90,        // Highest quality - personal recommendation
      'website': 70,         // Direct interest, found you organically
      'social_media': 60,    // Engaged with content
      'email_campaign': 55,  // Responded to marketing
      'trade_show': 80,      // Face-to-face interaction
      'google_ads': 50,      // Paid traffic
      'facebook_ads': 45,    // Social media advertising
      'cold_outreach': 30,   // Unsolicited contact
      'partner': 75          // Business partnership
    };

    return sourceScores[source?.toLowerCase() || ''] || 40;
  }

  /**
   * Score based on engagement metrics (0-100)
   */
  private static scoreEngagement(lead: any): number {
    let score = 0;
    
    // Email engagement
    const emailOpens = lead.emailOpens || 0;
    const emailClicks = lead.emailClicks || 0;
    
    if (emailOpens > 0) score += Math.min(emailOpens * 10, 30);
    if (emailClicks > 0) score += Math.min(emailClicks * 15, 40);
    
    // Website engagement
    const websiteVisits = lead.websiteVisits || 0;
    if (websiteVisits > 0) score += Math.min(websiteVisits * 8, 30);

    return Math.min(score, 100);
  }

  /**
   * Score based on demographics (0-100)
   */
  private static scoreDemographics(lead: any): number {
    let score = 50; // Base score
    
    // Group size (larger groups = higher value)
    const groupSize = lead.groupSize || 1;
    if (groupSize >= 6) score += 30;
    else if (groupSize >= 4) score += 20;
    else if (groupSize >= 2) score += 10;
    
    // Preferred destinations (having preferences shows intent)
    const destinations = lead.preferredDestinations || [];
    if (destinations.length > 0) score += 20;
    if (destinations.length >= 3) score += 10; // Multiple interests
    
    return Math.min(score, 100);
  }

  /**
   * Score based on behavior (0-100)
   */
  private static scoreBehavior(lead: any): number {
    let score = 0;
    
    // Brochure downloads show serious interest
    const downloads = lead.brochureDownloads || 0;
    score += Math.min(downloads * 25, 50);
    
    // Recent contact indicates active interest
    const lastContact = lead.lastContactDate;
    if (lastContact) {
      const daysSinceContact = Math.floor(
        (Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceContact <= 3) score += 30;
      else if (daysSinceContact <= 7) score += 20;
      else if (daysSinceContact <= 14) score += 10;
    }
    
    // Having phone number shows higher intent
    if (lead.phone) score += 20;
    
    return Math.min(score, 100);
  }

  /**
   * Score based on travel timeframe (0-100)
   */
  private static scoreTimeframe(timeframe: string | null): number {
    const timeframeScores: Record<string, number> = {
      'immediate': 100,    // Ready to book now
      '3_months': 80,      // Planning soon
      '6_months': 60,      // Moderate timeline
      '1_year': 40,        // Long-term planning
      'flexible': 30       // No urgency
    };

    return timeframeScores[timeframe || ''] || 50;
  }

  /**
   * Score based on budget range (0-100)
   */
  private static scoreBudget(budgetRange: string | null): number {
    const budgetScores: Record<string, number> = {
      'luxury': 100,       // Premium packages
      'high': 80,          // High-value bookings
      'medium': 60,        // Standard packages
      'low': 40            // Budget travelers
    };

    return budgetScores[budgetRange || ''] || 50;
  }

  /**
   * Get scoring explanation for a lead
   */
  static getScoreBreakdown(lead: any): {
    totalScore: number;
    priority: string;
    factors: LeadScoringFactors;
    recommendations: string[];
  } {
    const factors = this.calculateFactors(lead);
    const totalScore = this.calculateScore(lead);
    const priority = this.calculatePriority(totalScore);
    
    const recommendations = this.generateRecommendations(lead, factors, totalScore);
    
    return {
      totalScore,
      priority,
      factors,
      recommendations
    };
  }

  /**
   * Automatically update lead score when lead data changes
   */
  static async updateLeadScore(leadId: number, leadData: any): Promise<{ oldScore: number; newScore: number; priority: string }> {
    try {
      const newScore = this.calculateScore(leadData);
      const priority = this.calculatePriority(newScore);
      
      // Get old score for comparison
      const oldScore = leadData.score || 0;
      
      // Update lead with new score and priority
      await leadData.update?.({ score: newScore, priority });
      
      return { oldScore, newScore, priority };
    } catch (error) {
      console.error('Error updating lead score:', error);
      throw error;
    }
  }

  /**
   * Bulk recalculate scores for all leads
   */
  static async bulkRecalculateScores(leads: any[]): Promise<{ updated: number; errors: number }> {
    let updated = 0;
    let errors = 0;
    
    for (const lead of leads) {
      try {
        const newScore = this.calculateScore(lead);
        const newPriority = this.calculatePriority(newScore);
        
        if (lead.score !== newScore || lead.priority !== newPriority) {
          // Update would be handled by the calling service
          updated++;
        }
      } catch (error) {
        console.error(`Error calculating score for lead ${lead.id}:`, error);
        errors++;
      }
    }
    
    return { updated, errors };
  }

  /**
   * Get scoring trends over time for analytics
   */
  static getScoreTrends(leads: any[]): any[] {
    const trends = [];
    const scoreRanges = {
      'Hot (80-100)': [80, 100],
      'High (60-79)': [60, 79],
      'Medium (40-59)': [40, 59],
      'Low (0-39)': [0, 39]
    };
    
    for (const [label, [min, max]] of Object.entries(scoreRanges)) {
      const count = leads.filter(lead => {
        const score = lead.score || 0;
        return score >= min && score <= max;
      }).length;
      
      trends.push({
        range: label,
        count,
        percentage: leads.length > 0 ? Math.round((count / leads.length) * 100) : 0
      });
    }
    
    return trends;
  }

  /**
   * Generate action recommendations based on score
   */
  private static generateRecommendations(lead: any, factors: LeadScoringFactors, score: number): string[] {
    const recommendations: string[] = [];
    
    if (score >= 80) {
      recommendations.push("🔥 HOT LEAD - Contact immediately!");
      recommendations.push("📞 Schedule a call within 24 hours");
      recommendations.push("💎 Present premium package options");
    } else if (score >= 60) {
      recommendations.push("⚡ High priority - Contact within 2-3 days");
      recommendations.push("📧 Send personalized travel proposal");
      recommendations.push("🎯 Focus on their preferred destinations");
    } else if (score >= 40) {
      recommendations.push("📝 Add to nurture campaign");
      recommendations.push("📚 Send relevant travel guides");
      recommendations.push("⏰ Follow up in 1-2 weeks");
    } else {
      recommendations.push("🌱 Long-term nurturing needed");
      recommendations.push("📬 Include in newsletter campaigns");
      recommendations.push("🔍 Monitor for engagement increases");
    }
    
    // Specific factor-based recommendations
    if (factors.engagement < 30) {
      recommendations.push("📈 Increase engagement with compelling content");
    }
    
    if (factors.behavior < 40) {
      recommendations.push("📖 Send travel brochures to gauge interest");
    }
    
    if (!lead.phone) {
      recommendations.push("📱 Try to collect phone number for direct contact");
    }
    
    return recommendations;
  }
}