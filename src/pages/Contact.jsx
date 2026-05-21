import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useRef } from 'react';
import { CheckCircle, Mail, Phone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const PROJECT_TYPES = [
  { value: 'website', label: 'Website Design' },
  { value: 'logo', label: 'Logo & Brand Identity' },
  { value: 'marketing', label: 'Marketing Materials' },
  { value: 'other', label: 'Something Else' },
];

const BUDGETS = ['Under $500', '$500 – $1,000', '$1,000 – $2,500', '$2,500 – $5,000', '$5,000+'];

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  budget: z.string().optional(),
  project_type: z.string().min(1, 'Please select a project type'),
  message: z.string().min(20, 'Please describe your project in at least 20 characters'),
  _honeypot: z.string().max(0, 'Spam detected'),
});

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const submitTimeRef = useRef(Date.now());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', project_type: '', message: '', budget: '', _honeypot: '' },
    mode: 'onTouched',
  });

  const selectedType = watch('project_type');

  const onSubmit = async (data) => {
    // Spam guard: must take at least 3 seconds to fill out
    if (Date.now() - submitTimeRef.current < 3000) return;

    const { _honeypot, ...payload } = data;
    await base44.entities.ClientRequest.create(payload);
    setSubmittedName(data.name);
    setSubmitted(true);
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border bg-background focus:outline-none transition-colors text-sm ${
      errors[field] ? 'border-red-400 focus:border-red-400' : 'border-border focus:border-accent'
    }`;

  if (submitted) return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-accent" />
          </div>
          <h2 className="font-display font-black text-4xl mb-3">Message Sent!</h2>
          <p className="text-muted-foreground mb-6">Thanks for reaching out, {submittedName}. I'll review your request and get back to you within 24 hours.</p>
          <button onClick={() => setSubmitted(false)} className="text-sm text-muted-foreground hover:text-accent transition-colors underline">Send another message</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Left info */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Let's Connect</div>
              <h1 className="font-display font-black text-6xl md:text-7xl mb-6">Start a Project</h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-10">
                Fill out the form and I'll get back to you within 48 hours with a personalized response and a free quote.
              </p>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-accent" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Email</div>
                    <a href="mailto:derek@ddaltondesigns.com" className="font-medium hover:text-accent transition-colors">derek@ddaltondesigns.com</a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-accent" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Response Time</div>
                    <div className="font-medium">Within 48 hours</div>
                  </div>
                </div>
              </div>
              <div className="mt-16 p-6 border border-border rounded-2xl">
                <div className="text-sm font-semibold mb-3">What happens next?</div>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  {['I review your request and project details', 'I send you a personalized estimate within 48–72 hrs', 'We hop on a quick call to align on scope & timeline', 'We get to work!'].map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Honeypot - hidden from real users */}
              <input type="text" {...register('_honeypot')} className="hidden" tabIndex={-1} autoComplete="off" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Name *</label>
                  <input type="text" {...register('name')} placeholder="Your name" className={inputClass('name')} />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Email *</label>
                  <input type="email" {...register('email')} placeholder="your@email.com" className={inputClass('email')} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Phone</label>
                  <input type="tel" {...register('phone')} placeholder="(optional)" className={inputClass('phone')} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Budget</label>
                  <select {...register('budget')} className={inputClass('budget')}>
                    <option value="">Select range</option>
                    {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Project Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PROJECT_TYPES.map(t => (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => setValue('project_type', t.value, { shouldValidate: true })}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        selectedType === t.value
                          ? 'bg-foreground text-primary-foreground border-foreground'
                          : errors.project_type
                          ? 'border-red-400 hover:border-red-400'
                          : 'border-border hover:border-foreground'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {errors.project_type && <p className="text-red-500 text-xs mt-1">{errors.project_type.message}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Tell Me About Your Project *</label>
                <textarea
                  rows={5}
                  {...register('message')}
                  placeholder="Describe what you're looking for, your timeline, and any specific requirements..."
                  className={`${inputClass('message')} resize-none`}
                />
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-accent text-white font-semibold rounded-xl hover:bg-red-600 transition-all text-sm disabled:opacity-60"
              >
                {isSubmitting ? 'Sending...' : 'Send My Request'}
              </button>
            </form>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}