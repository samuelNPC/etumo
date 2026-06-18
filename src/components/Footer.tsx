import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

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
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        {/* --- BALANCED 5-COLUMN GRID --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-16">

          {/* Col 1: Brand & Contact */}
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-4"><BrandLogo /></div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
              AI-powered research workspace for students.
            </p>
            <div className="text-xs text-gray-500 flex flex-col gap-2">
              <p><span className="font-bold text-gray-900">Email:</span> <a href="mailto:samuel@etomu.com" className="hover:text-[#4285F4]">samuel@etomu.com</a></p>
              <p><span className="font-bold text-gray-900">Phone:</span> <a href="tel:0759997376" className="hover:text-[#34A853]">0759997376</a></p>
            </div>
          </div>

          {/* Col 2: Product */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-widest">Product</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/workspace" className="text-sm text-gray-500 hover:text-black">Workspace</Link></li>
              <li><Link href="/dashboard" className="text-sm text-gray-500 hover:text-black">My Projects</Link></li>
            </ul>
          </div>

          {/* Col 3: Research Tools */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-widest">Tools</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/originality" className="text-sm text-gray-500 hover:text-black">Clean AI & Similarity</Link></li>
              <li><Link href="/data-collector" className="text-sm text-gray-500 hover:text-black">Data Collector</Link></li>
            </ul>
          </div>

          {/* Col 4: Resources */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-widest">Resources</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/how-to" className="text-sm text-gray-500 hover:text-black">How to Use</Link></li>
              <li><Link href="/pricing" className="text-sm text-gray-500 hover:text-black">Pricing</Link></li>
              <li><Link href="/limitations" className="text-sm text-gray-500 hover:text-black">Limitations</Link></li>
            </ul>
          </div>

          {/* Col 5: Legal */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-widest">Legal</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="/terms" className="text-sm text-gray-500 hover:text-black">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-sm text-gray-500 hover:text-black">Privacy Policy</Link></li>
              <li><Link href="/refunds" className="text-sm text-gray-500 hover:text-black">Refund Policy</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            &copy; {currentYear} Etomu. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-black text-xs font-bold uppercase">Twitter</a>
            <a href="#" className="text-gray-400 hover:text-black text-xs font-bold uppercase">LinkedIn</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
