"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

// 🚨 REPLACE THIS WITH YOUR EXACT GOOGLE ACCOUNT EMAIL
const ADMIN_EMAIL = "your.email@gmail.com"; 

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  totalProjects: number;
  premiumProjects: number;
  totalRevenue: number;
  smsSpent: number;
}

export default function HiddenAdminDashboard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    totalProjects: 0,
    premiumProjects: 0,
    totalRevenue: 0,
    smsSpent: 0,
  });

  // 1. SECURITY LOCK: Verify Admin Identity
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === ADMIN_EMAIL) {
        setIsAuthorized(true);
        fetchDashboardData();
      } else {
        // Kick unauthorized users back to the homepage immediately
        router.replace("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 2. DATA ENGINE: Pull live metrics from Firestore
  const fetchDashboardData = async () => {
    try {
      // Fetch Users
      const usersSnapshot = await getDocs(collection(db, "users"));
      let verifiedCount = 0;
      usersSnapshot.forEach(doc => {
        if (doc.data().phoneVerified) verifiedCount++;
      });

      // Fetch Projects
      const projectsSnapshot = await getDocs(collection(db, "projects"));
      let premiumCount = 0;
      let correctionBundlesSold = 0;

      projectsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.isPremium) premiumCount++;
        if (data.purchasedEditBundles) correctionBundlesSold += data.purchasedEditBundles;
      });

      // Calculate Financials
      const premiumRevenue = premiumCount * 54000;
      const bundleRevenue = correctionBundlesSold * 13000;
      const totalRev = premiumRevenue + bundleRevenue;
      
      // Calculate estimated SMS cost (25 UGX per verified user + assuming some failed attempts)
      // We multiply verified users by ~1.2 to account for failed SMS attempts taking up budget
      const estimatedSmsCost = Math.floor(verifiedCount * 1.2 * 25);

      setStats({
        totalUsers: usersSnapshot.size,
        verifiedUsers: verifiedCount,
        totalProjects: projectsSnapshot.size,
        premiumProjects: premiumCount,
        totalRevenue: totalRev,
        smsSpent: estimatedSmsCost,
      });

    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Command</h1>
            <p className="text-sm text-gray-500 font-mono mt-1">/xyz • Live Production Data</p>
          </div>
          <Link href="/" className="text-sm font-bold bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            Exit to App
          </Link>
        </div>

        {/* Top Financial Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-black text-white p-6 rounded-2xl shadow-lg border border-gray-800">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Gross Revenue</h3>
            <div className="text-3xl font-black">{stats.totalRevenue.toLocaleString()} <span className="text-sm font-medium text-gray-400">UGX</span></div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Total Projects</h3>
            <div className="text-3xl font-black text-gray-900">{stats.totalProjects}</div>
            <p className="text-xs text-gray-500 mt-2 font-bold text-green-600">
              {stats.premiumProjects} Premium Workspaces
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">SMS Overhead Cost</h3>
            <div className="text-3xl font-black text-red-600">{stats.smsSpent.toLocaleString()} <span className="text-sm font-medium text-gray-400">UGX</span></div>
            <p className="text-xs text-gray-500 mt-2 font-bold">
              ~{stats.verifiedUsers} Verified Devices
            </p>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-4 tracking-tight">Database Health</h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                <span className="text-gray-500">Registered Accounts</span>
                <span className="font-bold font-mono">{stats.totalUsers}</span>
              </li>
              <li className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                <span className="text-gray-500">Free Workspaces Claimed</span>
                <span className="font-bold font-mono">{stats.totalProjects - stats.premiumProjects}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Verification Rate</span>
                <span className="font-bold font-mono">
                  {stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%
                </span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
