import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/useScrollProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send, Linkedin, Github } from 'lucide-react';
import { toast } from 'sonner';

gsap.registerPlugin(ScrollTrigger);

export function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const section = sectionRef.current;
    const headline = headlineRef.current;
    const info = infoRef.current;
    const form = formRef.current;

    if (!section || !headline || !info || !form) return;

    const triggers: ScrollTrigger[] = [];

    const ctx = gsap.context(() => {
      // Split headline into words
      const text = headline.textContent || '';
      headline.innerHTML = text
        .split(' ')
        .map((word) => `<span class="inline-block overflow-hidden mr-[0.25em]"><span class="word-inner inline-block">${word}</span></span>`)
        .join('');

      const words = headline.querySelectorAll('.word-inner');

      // Initial states
      gsap.set(words, { y: '100%', opacity: 0 });
      gsap.set(info.children, { x: -50, opacity: 0 });
      gsap.set(form, { scale: 0.95, opacity: 0 });

      // Scroll-triggered animations
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          once: true,
        },
      });

      // Headline words
      tl.to(words, {
        y: '0%',
        opacity: 1,
        duration: 0.7,
        stagger: 0.1,
        ease: 'expo.out',
      });

      // Info items
      tl.to(
        info.children,
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'expo.out',
        },
        '-=0.4'
      );

      // Form
      tl.to(
        form,
        {
          scale: 1,
          opacity: 1,
          duration: 0.7,
          ease: 'expo.out',
        },
        '-=0.5'
      );

      if (tl.scrollTrigger) {
        triggers.push(tl.scrollTrigger);
      }
    }, section);

    return () => {
      triggers.forEach((st) => st.kill());
      ctx.revert();
    };
  }, [prefersReducedMotion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success('Message sent successfully! I\'ll get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
    setIsSubmitting(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative py-16 sm:py-24 lg:py-32 bg-[#1a1a1a] overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-1/2 h-full opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full border border-[#d3e97a]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
          {/* Left Column - Info */}
          <div>
            <h2
              ref={headlineRef}
              className="font-display text-5xl sm:text-6xl lg:text-7xl text-white mb-6"
            >
              Let's Work Together
            </h2>

            <p className="text-lg text-white/60 mb-12 leading-relaxed">
              Have a project in mind or just want to chat? I'm always open to
              discussing new opportunities and interesting ideas.
            </p>

            <div ref={infoRef} className="space-y-6">
              {/* Email */}
              <a
                href="mailto:rajkumar30598@gmail.com"
                className="flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#d3e97a]/10 border border-[#d3e97a]/20 flex items-center justify-center group-hover:bg-[#d3e97a]/20 transition-colors">
                  <Mail size={20} className="text-[#d3e97a]" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Email</p>
                  <p className="text-white group-hover:text-[#d3e97a] transition-colors">
                    rajkumar30598@gmail.com
                  </p>
                </div>
              </a>

              {/* Phone */}
              <a
                href="tel:+919789454245"
                className="flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#d3e97a]/10 border border-[#d3e97a]/20 flex items-center justify-center group-hover:bg-[#d3e97a]/20 transition-colors">
                  <Phone size={20} className="text-[#d3e97a]" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Phone</p>
                  <p className="text-white group-hover:text-[#d3e97a] transition-colors">
                    +91-97894-54245
                  </p>
                </div>
              </a>

              {/* Location */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#d3e97a]/10 border border-[#d3e97a]/20 flex items-center justify-center">
                  <MapPin size={20} className="text-[#d3e97a]" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Location</p>
                  <p className="text-white">Bangalore, India</p>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4 pt-6">
                <a
                  href="https://www.linkedin.com/in/rajkumar-v-b11282225/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-[#d3e97a] hover:text-[#161616] hover:border-[#d3e97a] hover:scale-110 transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
                <a
                  href="https://github.com/rajkumar30598"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-[#d3e97a] hover:text-[#161616] hover:border-[#d3e97a] hover:scale-110 transition-all duration-300"
                  aria-label="GitHub"
                >
                  <Github size={20} />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-[#2a2a2a] border border-white/10 rounded-2xl p-6 sm:p-8">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-white/60 text-sm font-medium"
                >
                  Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30 focus:border-[#d3e97a] focus:ring-[#d3e97a]/20 transition-all"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-white/60 text-sm font-medium"
                >
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30 focus:border-[#d3e97a] focus:ring-[#d3e97a]/20 transition-all"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="text-white/60 text-sm font-medium"
                >
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell me about your project..."
                  required
                  rows={5}
                  className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30 focus:border-[#d3e97a] focus:ring-[#d3e97a]/20 transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#d3e97a] text-[#161616] hover:bg-[#e8f5a8] hover:scale-[1.02] transition-all duration-300 font-medium py-6 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#161616]/30 border-t-[#161616] rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Send Message
                    <Send size={18} />
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
