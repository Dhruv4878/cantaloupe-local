"use client";

import { useEffect, useState } from "react";

export default function SuperAdminDebug() {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const checkDebugInfo = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      
      // Check cookies in detail
      const cookies = document.cookie;
      const cookieArray = cookies.split(';').map(c => c.trim());
      const hasSuperAdminToken = cookies.includes('super_admin_token');
      
      // Extract the actual token value
      let tokenValue = null;
      const tokenCookie = cookieArray.find(c => c.startsWith('super_admin_token='));
      if (tokenCookie) {
        tokenValue = tokenCookie.split('=')[1];
      }
      
      // Check environment
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Try to make API call
      let apiStatus = 'unknown';
      let apiError = null;
      let apiResponse = null;
      
      try {
        const res = await fetch(`${apiUrl}/super-admin/me`, {
          method: "GET",
          credentials: "include",
        });
        apiStatus = res.status;
        if (!res.ok) {
          const errorData = await res.text();
          apiError = errorData;
        } else {
          apiResponse = await res.json();
        }
      } catch (err) {
        apiStatus = 'error';
        apiError = err.message;
      }

      setDebugInfo({
        apiUrl,
        isProduction,
        hasSuperAdminToken,
        tokenValue: tokenValue ? `${tokenValue.substring(0, 20)}...` : 'No token',
        allCookies: cookieArray,
        apiStatus,
        apiError,
        apiResponse,
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        domain: window.location.hostname,
      });
    };

    checkDebugInfo();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#000', 
      color: '#fff', 
      padding: '10px', 
      fontSize: '11px',
      maxWidth: '500px',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 9999,
      border: '1px solid #333'
    }}>
      <h4>Super Admin Debug Info</h4>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
}