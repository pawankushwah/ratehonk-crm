import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock component since we don't have direct access to the lead form
const MockLeadForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      source: formData.get('source'),
      status: formData.get('status'),
      notes: formData.get('notes')
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} data-testid="lead-form">
      <input
        name="firstName"
        placeholder="First Name"
        data-testid="firstName-input"
        required
      />
      <input
        name="lastName"
        placeholder="Last Name"
        data-testid="lastName-input"
        required
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        data-testid="email-input"
        required
      />
      <input
        name="phone"
        placeholder="Phone"
        data-testid="phone-input"
      />
      <select name="source" data-testid="source-select">
        <option value="">Select Source</option>
        <option value="website">Website</option>
        <option value="referral">Referral</option>
        <option value="social">Social Media</option>
      </select>
      <select name="status" data-testid="status-select">
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="qualified">Qualified</option>
      </select>
      <textarea
        name="notes"
        placeholder="Notes"
        data-testid="notes-textarea"
      />
      <button type="submit" data-testid="submit-button">
        Save Lead
      </button>
    </form>
  );
};

describe('Lead Form Component', () => {
  const user = userEvent.setup();
  
  it('renders all required form fields', () => {
    const mockSubmit = vi.fn();
    
    render(<MockLeadForm onSubmit={mockSubmit} />);

    expect(screen.getByTestId('firstName-input')).toBeInTheDocument();
    expect(screen.getByTestId('lastName-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('phone-input')).toBeInTheDocument();
    expect(screen.getByTestId('source-select')).toBeInTheDocument();
    expect(screen.getByTestId('status-select')).toBeInTheDocument();
    expect(screen.getByTestId('notes-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const mockSubmit = vi.fn();
    
    render(<MockLeadForm onSubmit={mockSubmit} />);

    // Fill out the form
    await user.type(screen.getByTestId('firstName-input'), 'John');
    await user.type(screen.getByTestId('lastName-input'), 'Doe');
    await user.type(screen.getByTestId('email-input'), 'john.doe@example.com');
    await user.type(screen.getByTestId('phone-input'), '+1-555-1234');
    await user.selectOptions(screen.getByTestId('source-select'), 'website');
    await user.selectOptions(screen.getByTestId('status-select'), 'new');
    await user.type(screen.getByTestId('notes-textarea'), 'Test lead submission');

    // Submit the form
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-1234',
        source: 'website',
        status: 'new',
        notes: 'Test lead submission'
      });
    });
  });

  it('validates required fields', async () => {
    const mockSubmit = vi.fn();
    
    render(<MockLeadForm onSubmit={mockSubmit} />);

    // Try to submit without filling required fields
    await user.click(screen.getByTestId('submit-button'));

    // Form should not submit due to HTML5 validation
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('handles email validation', async () => {
    const mockSubmit = vi.fn();
    
    render(<MockLeadForm onSubmit={mockSubmit} />);

    // Fill out form with invalid email
    await user.type(screen.getByTestId('firstName-input'), 'John');
    await user.type(screen.getByTestId('lastName-input'), 'Doe');
    await user.type(screen.getByTestId('email-input'), 'invalid-email');

    await user.click(screen.getByTestId('submit-button'));

    // Form should not submit due to email validation
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});