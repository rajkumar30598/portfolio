import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Github, Linkedin, Mail, MapPin, Phone, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Magnetic, RevealText, SectionLabel } from '@/components/motion';
import { prefersReducedMotion } from '@/lib/motion';

gsap.registerPlugin(ScrollTrigger);

const EMAIL = 'rajkumar30598@gmail.com';

const contacts = [
  { icon: Mail, label: 'Email', value: EMAIL, href: `mailto:${EMAIL}` },
  { icon: Phone, label: 'Phone', value: '+91-97894-54245', href: 'tel:+919789454245' },
  { icon: MapPin, label: 'Location', value: 'Bangalore, India' },
];

const fieldClass =
  'peer w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 pb-3 pt-7 text-white outline-none transition-all duration-300 placeholder:text-transparent focus:border-[#d3e97a] focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(211,233,122,0.12)]';
const labelClass =
  'pointer-events-none absolute left-5 top-5 text-white/40 transition-all duration-300 peer-focus:top-2.5 peer-focus:text-xs peer-focus:text-[#d3e97a] peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:text-xs';

export function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.contact-item', {
        x: -60,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.contact-items', start: 'top 85%', once: true },
      });
      gsap.from('.contact-form', {
        y: 80,
        rotateX: -12,
        opacity: 0,
        duration: 1.3,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.contact-form', start: 'top 85%', once: true },
      });
      gsap.fromTo(
        '.contact-giant',
        { xPercent: 10 },
        {
          xPercent: -30,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      );
    }, section);
    return () => ctx.revert();
  }, []);

  // Opens the visitor's mail app with the message filled in, so it really reaches the inbox.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Portfolio enquiry from ${form.name}`;
    const body = `${form.message}\n\n— ${form.name} (${form.email})`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success('Opening your email app with the message ready to send.');
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <section id="contact" ref={sectionRef} className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
      <div
        aria-hidden="true"
        className="contact-giant pointer-events-none absolute left-0 top-10 whitespace-nowrap font-display text-[22vw] leading-none text-transparent [-webkit-text-stroke:1px_rgba(211,233,122,0.15)]"
      >
        Let's talk · Let's build · Let's talk ·
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <SectionLabel index="04" label="Contact" />
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <RevealText
              text="Let's work together."
              className="font-display text-6xl leading-[0.9] text-white sm:text-7xl lg:text-8xl"
            />
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/60">
              Have a project in mind or just want to chat? I'm always open to discussing new opportunities and
              interesting ideas.
            </p>

            <div className="contact-items mt-12 space-y-4">
              {contacts.map(({ icon: Icon, label, value, href }) => {
                const inner = (
                  <>
                    <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-[#d3e97a]/20 bg-[#d3e97a]/10 text-[#d3e97a] transition-all duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 group-hover:bg-[#d3e97a] group-hover:text-[#0b0b0d]">
                      <Icon size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-white/45">{label}</span>
                      <span className="block truncate text-lg text-white transition-colors group-hover:text-[#d3e97a]">
                        {value}
                      </span>
                    </span>
                    {href && (
                      <ArrowUpRight
                        size={20}
                        className="text-white/30 transition-all duration-500 group-hover:rotate-45 group-hover:text-[#d3e97a]"
                      />
                    )}
                  </>
                );
                const cls =
                  'contact-item glass group flex items-center gap-5 rounded-3xl p-4 pr-6 transition-colors duration-500 hover:border-[#d3e97a]/40';
                return href ? (
                  <a key={label} href={href} className={cls}>
                    {inner}
                  </a>
                ) : (
                  <div key={label} className={cls}>
                    {inner}
                  </div>
                );
              })}
            </div>

            <div className="contact-item mt-8 flex gap-3">
              {[
                { href: 'https://www.linkedin.com/in/rajkumar-v-b11282225/', label: 'LinkedIn', icon: Linkedin },
                { href: 'https://github.com/rajkumar30598', label: 'GitHub', icon: Github },
              ].map(({ href, label, icon: Icon }) => (
                <Magnetic key={label} strength={0.5}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-white/70 backdrop-blur-md transition-all duration-300 hover:border-[#d3e97a] hover:bg-[#d3e97a] hover:text-[#0b0b0d]"
                  >
                    <Icon size={20} />
                  </a>
                </Magnetic>
              ))}
            </div>
          </div>

          <div style={{ perspective: '1200px' }}>
            <form
              onSubmit={handleSubmit}
              className="contact-form glass relative space-y-5 overflow-hidden rounded-[2rem] p-6 sm:p-10"
            >
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#d3e97a]/20 blur-[90px]" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#7c5cff]/25 blur-[90px]" />
              <h3 className="relative font-display text-4xl text-white">Send a message</h3>
              <div className="relative">
                <input id="name" name="name" placeholder="Name" required value={form.name} onChange={onChange} className={fieldClass} />
                <label htmlFor="name" className={labelClass}>Your name</label>
              </div>
              <div className="relative">
                <input id="email" name="email" type="email" placeholder="Email" required value={form.email} onChange={onChange} className={fieldClass} />
                <label htmlFor="email" className={labelClass}>Your email</label>
              </div>
              <div className="relative">
                <textarea id="message" name="message" rows={5} placeholder="Message" required value={form.message} onChange={onChange} className={`${fieldClass} resize-none`} />
                <label htmlFor="message" className={labelClass}>Tell me about your project…</label>
              </div>
              <button
                type="submit"
                className="group relative w-full overflow-hidden rounded-2xl bg-[#d3e97a] py-5 font-medium text-[#0b0b0d]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Send message
                  <Send size={18} className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:rotate-12" />
                </span>
                <span className="absolute inset-0 -translate-x-full bg-white transition-transform duration-500 ease-out group-hover:translate-x-0" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
