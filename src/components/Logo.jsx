import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const Logo = ({ size = 'small' }) => {
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    const fetchLogo = async () => {
      const docRef = doc(db, 'app_assets', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().logo) {
        setLogoUrl(docSnap.data().logo);
      }
    };
    fetchLogo();
  }, []);

  if (!logoUrl) return null;

  return (
    <img 
      src={logoUrl} 
      alt="NutProM Logo" 
      className={`object-contain ${size === 'small' ? 'h-8 w-8' : 'h-16 w-16'}`}
    />
  );
};

export default Logo;