"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Phone, Mail } from "lucide-react";
import Logo from "../../assets/Logo.png";
export default function Footer() {
  return (
    <footer className="bg-white border-t border-stone-200 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">

        {/* TOP GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* BRAND */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {/* LOGO PLACE */}
              <img
                src={Logo}
                alt="MOBUMES"
                className="h-full w-full object-contain"
              />

            
            </div>

            <p className="text-stone-600 text-sm leading-relaxed">
              Spécialiste en fabrication, installation et maintenance de solutions de sécurité physique :
              coffres-forts, armoires sécurisées et portes blindées.
            </p>
          </div>

          {/* PAGES */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-stone-900">Pages</h3>
            <ul className="space-y-3 text-stone-600">
              <li><Link to="/" className="hover:text-blue-700">Accueil</Link></li>
              <li><Link to="/about" className="hover:text-blue-700">À propos</Link></li>
              <li><Link to="/products" className="hover:text-blue-700">Produits</Link></li>
              <li><Link to="/sell-us-something" className="hover:text-blue-700">Vendre un produit</Link></li>
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-stone-900">Contact</h3>

            <div className="space-y-4 text-stone-600 text-sm">

              <div className="flex items-center gap-3">
                <Mail size={18} />
                <a
                  href="mailto:contact@mobumes.com"
                  className="hover:text-blue-700 transition"
                >
                  contact@mobumes.com
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Phone size={18} />
                <a
                  href="tel:023331338"
                  className="hover:text-blue-700 transition"
                >
                  023 33 13 38
                </a>
              </div>

            </div>
          </div>

          {/* CTA */}
          <div>
  <h3 className="text-lg font-medium mb-4 text-stone-900">
    Devenir revendeur
  </h3>

  <p className="text-stone-600 text-sm leading-relaxed">
    Vous souhaitez rejoindre notre réseau de revendeurs ?
  </p>

  <Link
    to="/sell-us-something"
    className="inline-block mt-5 px-5 py-3 bg-stone-900 hover:bg-blue-700 text-white font-medium rounded-lg transition"
  >
    En savoir plus
  </Link>
</div>
        </div>

        {/* BOTTOM BAR */}
        <div className="mt-16 pt-8 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-stone-500">

          <p>
            © {new Date().getFullYear()} MOBUMES. Tous droits réservés.
          </p>

          <p>
            Site réalisé par <a
              href="https://softwebelevation.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:text-blue-600 transition"
            >
              SoftWebElevation
            </a>
          </p>

        </div>
      </div>
    </footer>
  );
}
