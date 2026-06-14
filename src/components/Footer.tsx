import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Reusable Scaled Brand Logo (matches the Header exactly)
  const BrandLogo = () => (
    <Link href="/" className="flex items-center gap-2">
      <img src="/logo.png" alt="Etomu Logo" className="w-8 h-8 object-contain" />
      <span className="text-2xl font-black tracking-tighter leading-none lowercase">
        <span className="text-[#4285F4]">e</span>
        <span className="text-[#EA4335]">t</span>
        <span className="text-[#FBBC05]">o</span>
        <span className="text-[#34A853]">m</span>
        <span className="text-[#9333EA]">u</span>
      </span>
    </Link>
  );

  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Brand & Description */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <BrandLogo />
            </div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs">
              An AI-powered workspace that helps students and writers move from idea to submission-ready documents faster.
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4 tracking-tight">Product</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/dashboard" className="text-sm text-gray-500 hover:text-black transition-colors">My Projects</Link></li>
              <li><Link href="/originality" className="text-sm text-gray-500 hover:text-black transition-colors">Originality Center</Link></li>
              <li><Link href="/dashboard" className="text-sm text-gray-500 hover:text-black transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4 tracking-tight">Resources</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/how-to" className="text-sm text-gray-500 hover:text-black transition-colors">How to use</Link></li>
              <li><Link href="/about" className="text-sm text-gray-500 hover:text-black transition-colors">About Us</Link></li>
              <li><Link href="/pricing" className="text-sm text-gray-500 hover:text-black transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4 tracking-tight">Legal</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/terms" className="text-sm text-gray-500 hover:text-black transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-sm text-gray-500 hover:text-black transition-colors">Data we collect</Link></li>
              <li><Link href="/refunds" className="text-sm text-gray-500 hover:text-black transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Section: Copyright & Socials */}
        <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400 font-medium">
            &copy; {currentYear} Etomu. All rights reserved.
          </p>
          
          <div className="flex gap-4">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#4285F4] transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#4285F4] transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
