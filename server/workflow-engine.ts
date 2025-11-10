import { LeadScoringEngine } from './leadScoring.js';
import { emailService } from './email-service.js';
import { simpleStorage } from './simple-storage.js';

export interface WorkflowTrigger {
  id: string;
  name: string;
  type: 'lead_score_change' | 'status_change' | 'time_based' | 'behavior';
  conditions: any;
}

export interface WorkflowAction {
  id: string;
  type: 'send_email' | 'update_status' | 'assign_task' | 'send_sms' | 'schedule_follow_up';
  config: any;
  delay?: number; // in minutes
}

export interface AutomationWorkflow {
  id: string;
  tenantId: number;
  name: string;
  description: string;
  isActive: boolean;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  createdAt: Date;
  updatedAt: Date;
}

export class WorkflowEngine {
  private workflows: Map<number, AutomationWorkflow[]> = new Map();

  constructor() {
    this.initializeDefaultWorkflows();
  }

  /**
   * Initialize default automation workflows for new tenants
   */
  private initializeDefaultWorkflows() {
    // These will be created when a tenant is first set up
  }

  /**
   * Process lead score changes and trigger appropriate workflows
   */
  async processLeadScoreChange(leadId: number, oldScore: number, newScore: number, tenantId: number): Promise<void> {
    const workflows = this.getActiveWorkflows(tenantId);
    
    for (const workflow of workflows) {
      if (workflow.trigger.type === 'lead_score_change') {
        const { minScore, maxScore } = workflow.trigger.conditions;
        
        if (newScore >= minScore && newScore <= maxScore && oldScore < minScore) {
          await this.executeWorkflow(workflow, { leadId, score: newScore });
        }
      }
    }
  }

  /**
   * Process lead status changes
   */
  async processStatusChange(leadId: number, oldStatus: string, newStatus: string, tenantId: number): Promise<void> {
    const workflows = this.getActiveWorkflows(tenantId);
    
    for (const workflow of workflows) {
      if (workflow.trigger.type === 'status_change') {
        const { fromStatus, toStatus } = workflow.trigger.conditions;
        
        if (oldStatus === fromStatus && newStatus === toStatus) {
          await this.executeWorkflow(workflow, { leadId, status: newStatus });
        }
      }
    }
  }

  /**
   * Execute a workflow's actions
   */
  private async executeWorkflow(workflow: AutomationWorkflow, context: any): Promise<void> {
    console.log(`🔄 Executing workflow: ${workflow.name} for tenant ${workflow.tenantId}`);
    
    for (const action of workflow.actions) {
      try {
        if (action.delay && action.delay > 0) {
          // Schedule delayed action (in production, use a job queue)
          setTimeout(() => {
            this.executeAction(action, context, workflow.tenantId);
          }, action.delay * 60 * 1000);
        } else {
          await this.executeAction(action, context, workflow.tenantId);
        }
      } catch (error) {
        console.error(`❌ Failed to execute action ${action.type}:`, error);
      }
    }
  }

  /**
   * Execute individual workflow action
   */
  private async executeAction(action: WorkflowAction, context: any, tenantId: number): Promise<void> {
    switch (action.type) {
      case 'send_email':
        await this.sendAutomatedEmail(action.config, context, tenantId);
        break;
      case 'update_status':
        await this.updateLeadStatus(action.config, context);
        break;
      case 'assign_task':
        await this.createTask(action.config, context, tenantId);
        break;
      case 'schedule_follow_up':
        await this.scheduleFollowUp(action.config, context, tenantId);
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Send automated email based on workflow
   */
  private async sendAutomatedEmail(config: any, context: any, tenantId: number): Promise<void> {
    try {
      const leads = await simpleStorage.getLeadsByTenant(tenantId);
      const lead = leads.find((l: any) => l.id === context.leadId);
      
      if (!lead || !lead.email) {
        console.warn(`Lead ${context.leadId} not found or has no email`);
        return;
      }

      const emailData = {
        to: lead.email,
        subject: this.personalizeTemplate(config.subject, lead, context),
        html: this.personalizeTemplate(config.htmlContent, lead, context),
        text: this.personalizeTemplate(config.textContent, lead, context),
        tenantId: tenantId
      };

      await emailService.sendEmail(emailData);
      console.log(`📧 Automated email sent to ${lead.email}`);
      
      // Log the communication
      await simpleStorage.createCommunication({
        tenantId,
        leadId: context.leadId,
        type: 'email',
        direction: 'outbound',
        subject: emailData.subject,
        content: emailData.text,
        status: 'sent',
        automatedBy: `workflow-${config.workflowId}`
      });
    } catch (error) {
      console.error('Failed to send automated email:', error);
    }
  }

  /**
   * Update lead status through workflow
   */
  private async updateLeadStatus(config: any, context: any): Promise<void> {
    try {
      await simpleStorage.updateLead(context.leadId, {
        status: config.newStatus,
        notes: config.notes || `Status updated by automation workflow`
      });
      console.log(`🔄 Lead ${context.leadId} status updated to ${config.newStatus}`);
    } catch (error) {
      console.error('Failed to update lead status:', error);
    }
  }

  /**
   * Create automated task
   */
  private async createTask(config: any, context: any, tenantId: number): Promise<void> {
    try {
      const dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + (config.dueDateHours || 24));

      await simpleStorage.createTask({
        tenantId,
        leadId: context.leadId,
        title: this.personalizeTemplate(config.title, null, context),
        description: this.personalizeTemplate(config.description, null, context),
        priority: config.priority || 'medium',
        status: 'pending',
        dueDate: dueDate,
        assignedTo: config.assignedTo || null,
        createdBy: 'automation'
      });
      console.log(`📋 Task created for lead ${context.leadId}`);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  }

  /**
   * Schedule follow-up
   */
  private async scheduleFollowUp(config: any, context: any, tenantId: number): Promise<void> {
    try {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + (config.daysFromNow || 7));

      await simpleStorage.createFollowUp({
        tenantId,
        leadId: context.leadId,
        type: config.followUpType || 'email',
        scheduledDate: followUpDate,
        notes: this.personalizeTemplate(config.notes, null, context),
        status: 'scheduled',
        createdBy: 'automation'
      });
      console.log(`📅 Follow-up scheduled for lead ${context.leadId}`);
    } catch (error) {
      console.error('Failed to schedule follow-up:', error);
    }
  }

  /**
   * Personalize email templates with lead data
   */
  private personalizeTemplate(template: string, lead: any, context: any): string {
    if (!template) return '';
    
    let personalized = template;
    
    if (lead) {
      personalized = personalized
        .replace(/\{firstName\}/g, lead.firstName || 'Valued Customer')
        .replace(/\{lastName\}/g, lead.lastName || '')
        .replace(/\{email\}/g, lead.email || '')
        .replace(/\{phone\}/g, lead.phone || '')
        .replace(/\{source\}/g, lead.source || 'unknown');
    }
    
    if (context) {
      personalized = personalized
        .replace(/\{score\}/g, context.score || '')
        .replace(/\{status\}/g, context.status || '')
        .replace(/\{leadId\}/g, context.leadId || '');
    }
    
    return personalized;
  }

  /**
   * Get active workflows for a tenant
   */
  private getActiveWorkflows(tenantId: number): AutomationWorkflow[] {
    const workflows = this.workflows.get(tenantId) || [];
    return workflows.filter(w => w.isActive);
  }

  /**
   * Add workflow for tenant
   */
  addWorkflow(workflow: AutomationWorkflow): void {
    const tenantWorkflows = this.workflows.get(workflow.tenantId) || [];
    tenantWorkflows.push(workflow);
    this.workflows.set(workflow.tenantId, tenantWorkflows);
  }

  /**
   * Create default workflows for new tenant
   */
  async createDefaultWorkflows(tenantId: number): Promise<void> {
    const defaultWorkflows: Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        tenantId,
        name: 'High Score Welcome Email',
        description: 'Send welcome email when lead score reaches 70+',
        isActive: true,
        trigger: {
          id: 'high-score-trigger',
          name: 'High Score Reached',
          type: 'lead_score_change',
          conditions: { minScore: 70, maxScore: 100 }
        },
        actions: [
          {
            id: 'welcome-email',
            type: 'send_email',
            config: {
              subject: 'Welcome {firstName}! Let\'s Plan Your Dream Trip',
              htmlContent: `
                <h2>Hello {firstName},</h2>
                <p>Thank you for your interest in our travel packages! Based on your preferences, we'd love to help you plan an amazing trip.</p>
                <p>A member of our team will be in touch within 24 hours to discuss your travel plans.</p>
                <p>Best regards,<br>Your Travel Team</p>
              `,
              textContent: 'Hello {firstName}, Thank you for your interest in our travel packages! A member of our team will be in touch within 24 hours.'
            }
          },
          {
            id: 'assign-task',
            type: 'assign_task',
            config: {
              title: 'Contact High-Value Lead: {firstName} {lastName}',
              description: 'High-scoring lead (Score: {score}). Priority contact required.',
              priority: 'high',
              dueDateHours: 2
            }
          }
        ]
      },
      {
        tenantId,
        name: 'Qualified Lead Follow-up',
        description: 'Schedule follow-up when lead is marked as qualified',
        isActive: true,
        trigger: {
          id: 'qualified-trigger',
          name: 'Lead Qualified',
          type: 'status_change',
          conditions: { fromStatus: 'contacted', toStatus: 'qualified' }
        },
        actions: [
          {
            id: 'schedule-followup',
            type: 'schedule_follow_up',
            config: {
              followUpType: 'phone',
              daysFromNow: 3,
              notes: 'Follow up on qualified lead to discuss package options and pricing'
            }
          }
        ]
      }
    ];

    for (const workflowData of defaultWorkflows) {
      const workflow: AutomationWorkflow = {
        ...workflowData,
        id: `${tenantId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.addWorkflow(workflow);
    }

    console.log(`✅ Created ${defaultWorkflows.length} default workflows for tenant ${tenantId}`);
  }

  /**
   * Process behavioral triggers (website visits, email opens, etc.)
   */
  async processBehavioralTrigger(leadId: number, behavior: string, data: any, tenantId: number): Promise<void> {
    const workflows = this.getActiveWorkflows(tenantId);
    
    for (const workflow of workflows) {
      if (workflow.trigger.type === 'behavior') {
        const { behaviorType, minOccurrences } = workflow.trigger.conditions;
        
        if (behavior === behaviorType) {
          // Check if behavior meets threshold
          const occurrences = data.occurrences || 1;
          if (occurrences >= minOccurrences) {
            await this.executeWorkflow(workflow, { leadId, behavior, data });
          }
        }
      }
    }
  }
}

export const workflowEngine = new WorkflowEngine();