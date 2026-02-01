import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/useScrollProgress';
import { Linkedin, Github, Mail, Heart } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const quickLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];

const socialLinks = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/rajkumar-v-b11282225/',
    icon: Linkedin,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/rajkumar30598',
    icon: Github,
  },
  {
    label: 'Email',
    href: 'mailto:rajkumar30598@gmail.com',
    icon: Mail,
  },
];

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const footer = footerRef.current;
    const content = contentRef.current;

    if (!footer || !content) return;

    const triggers: ScrollTrigger[] = [];

    const ctx = gsap.context(() => {
      const elements = content.querySelectorAll('.footer-animate');
      gsap.set(elements, { y: 20, opacity: 0 });

      const trigger = ScrollTrigger.create({
        trigger: footer,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.to(elements, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: 'expo.out',
          });
        },
      });
      triggers.push(trigger);
    }, footer);

    return () => {
      triggers.forEach((st) => st.kill());
      ctx.revert();
    };
  }, [prefersReducedMotion]);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      ref={footerRef}
      className="relative py-10 sm:py-14 lg:py-16 bg-[#161616] border-t border-white/10"
    >
      <div
        ref={contentRef}
        className="max-w-7xl mx-auto px-6 lg:px-10"
      >
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Logo & Tagline */}
          <div className="footer-animate">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('#home');
              }}
              className="font-display text-3xl text-white hover:text-[#d3e97a] transition-colors inline-block mb-4"
            >
              Rajkumar V
            </a>
            <p className="text-white/50 text-sm leading-relaxed">
              Frontend Developer crafting digital experiences with clean code
              and creative design.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-animate">
            <h4 className="text-white font-medium mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(link.href);
                    }}
                    className="text-white/50 hover:text-[#d3e97a] hover:translate-x-1 transition-all inline-flex items-center gap-2 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="footer-animate">
            <h4 className="text-white font-medium mb-4">Connect</h4>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-[#d3e97a] hover:text-[#161616] hover:border-[#d3e97a] hover:scale-110 hover:rotate-6 transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-animate h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

        {/* Copyright */}
        <div className="footer-animate flex flex-col sm:flex-row items-center justify-between gap-4 text-white/40 text-sm">
          <p>© {new Date().getFullYear()} Rajkumar V. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart size={14} className="text-[#d3e97a] fill-[#d3e97a]" /> in Bangalore
          </p>
        </div>
      </div>
    </footer>
  );
}
