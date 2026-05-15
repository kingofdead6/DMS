// src/components/Footer.jsx
import { motion } from "framer-motion";
import { ExternalLink, Mail, Code2 } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="w-full border-t border-gray-100 bg-white"
      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Left — branding */}
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Code2 size={14} className="shrink-0" />
            <span>
              © {year} Développé par{" "}
              <a
                href="https://softwebelevation.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  inline-flex items-center gap-1 font-semibold text-gray-700
                  hover:text-gray-900 transition-colors underline underline-offset-2
                  decoration-gray-300 hover:decoration-gray-600
                "
              >
                SoftWebElevation
                <ExternalLink size={11} />
              </a>
            </span>
          </div>

          {/* Divider — desktop only */}
          <div className="hidden sm:block w-px h-4 bg-gray-200" />

          {/* Right — contact */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Mail size={13} className="shrink-0 text-gray-400" />
            <span>Une question ?</span>
            <a
              href="mailto:ny_kahlouche@esi.dz"
              className="
                font-medium text-gray-700 hover:text-gray-900 transition-colors
                underline underline-offset-2 decoration-gray-300 hover:decoration-gray-600
                break-all
              "
            >
              ny_kahlouche@esi.dz
            </a>
          </div>

        </div>
      </div>
    </motion.footer>
  );
}