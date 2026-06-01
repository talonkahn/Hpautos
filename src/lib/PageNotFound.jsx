import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Car } from 'lucide-react';

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Car className="w-12 h-12 text-amber-500" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-xl text-slate-500 mb-8">This page doesn't exist</p>
        <Link to="/">
          <Button className="bg-amber-500 hover:bg-amber-600 text-white h-12 px-8">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
